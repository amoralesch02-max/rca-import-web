-- ============================================================
-- RCA IMPORT · Libro de Reclamaciones virtual
-- ============================================================
-- EJECUTAR UNA SOLA VEZ en Supabase:
--   Supabase > SQL Editor > New query > pegar todo > Run
--
-- Crea la tabla donde se guardan las hojas de reclamación y una función
-- segura para registrarlas desde la web. No toca ninguna tabla existente.
--
-- Seguridad:
--  - Los clientes NO pueden leer, editar ni borrar hojas: solo registrar
--    la suya mediante la función registrar_reclamo.
--  - Solo el admin (usuario con sesión iniciada) puede verlas y responderlas.
--  - No se permite borrar hojas: la norma pide conservarlas.
-- ============================================================

create sequence if not exists public.libro_reclamaciones_numero_seq;

create table if not exists public.libro_reclamaciones (
  id uuid primary key default gen_random_uuid(),

  -- Número correlativo de la hoja (000001, 000002, ...)
  numero bigint not null unique
    default nextval('public.libro_reclamaciones_numero_seq'),
  codigo text generated always as
    ('RCA-LR-' || lpad(numero::text, 6, '0')) stored,
  created_at timestamptz not null default now(),

  -- 1. Consumidor reclamante
  nombre text not null,
  tipo_documento text not null,
  numero_documento text not null,
  domicilio text not null,
  telefono text not null,
  email text not null,
  es_menor boolean not null default false,
  apoderado_nombre text,
  apoderado_documento text,

  -- 2. Bien contratado
  tipo_bien text not null check (tipo_bien in ('producto', 'servicio')),
  monto numeric(12, 2),
  descripcion_bien text not null,
  numero_pedido text,

  -- 3. Detalle de la reclamación
  tipo text not null check (tipo in ('reclamo', 'queja')),
  detalle text not null,
  pedido text not null,
  acepta boolean not null default false,

  -- 4. Acciones del proveedor
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'respondido')),
  respuesta text,
  fecha_respuesta date
);

alter sequence public.libro_reclamaciones_numero_seq
  owned by public.libro_reclamaciones.numero;

create index if not exists libro_reclamaciones_created_at_idx
  on public.libro_reclamaciones (created_at desc);

-- ---------- Permisos ----------
alter table public.libro_reclamaciones enable row level security;

drop policy if exists "Admin lee reclamaciones" on public.libro_reclamaciones;
create policy "Admin lee reclamaciones"
  on public.libro_reclamaciones for select
  to authenticated
  using (true);

drop policy if exists "Admin responde reclamaciones" on public.libro_reclamaciones;
create policy "Admin responde reclamaciones"
  on public.libro_reclamaciones for update
  to authenticated
  using (true)
  with check (true);

-- ---------- Registro desde la web ----------
-- Valida los datos, guarda la hoja y devuelve su número.
create or replace function public.registrar_reclamo(datos jsonb)
returns table (hoja_numero bigint, hoja_codigo text, hoja_fecha timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_menor boolean := coalesce((datos->>'es_menor')::boolean, false);
begin
  if coalesce(trim(datos->>'nombre'), '') = ''
     or coalesce(trim(datos->>'tipo_documento'), '') = ''
     or coalesce(trim(datos->>'numero_documento'), '') = ''
     or coalesce(trim(datos->>'domicilio'), '') = ''
     or coalesce(trim(datos->>'telefono'), '') = ''
     or coalesce(trim(datos->>'email'), '') = ''
     or coalesce(trim(datos->>'descripcion_bien'), '') = ''
     or coalesce(trim(datos->>'detalle'), '') = ''
     or coalesce(trim(datos->>'pedido'), '') = '' then
    raise exception 'Faltan datos obligatorios';
  end if;

  if v_menor and (
       coalesce(trim(datos->>'apoderado_nombre'), '') = ''
       or coalesce(trim(datos->>'apoderado_documento'), '') = '') then
    raise exception 'Faltan los datos del padre, madre o apoderado';
  end if;

  if coalesce((datos->>'acepta')::boolean, false) is not true then
    raise exception 'Debe aceptar la declaración';
  end if;

  if char_length(datos->>'detalle') > 4000
     or char_length(datos->>'pedido') > 2000
     or char_length(datos->>'descripcion_bien') > 1000 then
    raise exception 'El texto es demasiado largo';
  end if;

  return query
  insert into public.libro_reclamaciones (
    nombre, tipo_documento, numero_documento, domicilio, telefono, email,
    es_menor, apoderado_nombre, apoderado_documento,
    tipo_bien, monto, descripcion_bien, numero_pedido,
    tipo, detalle, pedido, acepta
  )
  values (
    left(trim(datos->>'nombre'), 200),
    left(trim(datos->>'tipo_documento'), 30),
    left(trim(datos->>'numero_documento'), 30),
    left(trim(datos->>'domicilio'), 300),
    left(trim(datos->>'telefono'), 30),
    left(trim(datos->>'email'), 200),
    v_menor,
    case when v_menor then left(trim(datos->>'apoderado_nombre'), 200) end,
    case when v_menor then left(trim(datos->>'apoderado_documento'), 30) end,
    case when datos->>'tipo_bien' = 'servicio' then 'servicio' else 'producto' end,
    nullif(datos->>'monto', '')::numeric(12, 2),
    trim(datos->>'descripcion_bien'),
    nullif(left(trim(coalesce(datos->>'numero_pedido', '')), 100), ''),
    case when datos->>'tipo' = 'queja' then 'queja' else 'reclamo' end,
    trim(datos->>'detalle'),
    trim(datos->>'pedido'),
    true
  )
  returning
    libro_reclamaciones.numero,
    libro_reclamaciones.codigo,
    libro_reclamaciones.created_at;
end;
$$;

revoke all on function public.registrar_reclamo(jsonb) from public;
grant execute on function public.registrar_reclamo(jsonb) to anon, authenticated;

-- Hace que la API de Supabase reconozca los cambios de inmediato
notify pgrst, 'reload schema';

-- Verificación (opcional): debe devolver 0 filas sin error
-- select * from public.libro_reclamaciones;
