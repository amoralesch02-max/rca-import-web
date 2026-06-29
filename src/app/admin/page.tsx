"use client";

import AdminShell from "@/components/AdminShell";
import {
  getSupabaseAdminBanners,
  type PublicBanner,
} from "@/lib/supabase-banners";
import {
  getSupabaseAdminProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  getSupabaseAdminReservations,
  type PublicReservation,
} from "@/lib/supabase-reservations";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Clock,
  Eye,
  ImageIcon,
  Layers,
  Package,
  PackageCheck,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function getFinalPrice(product: PublicProduct) {
  return product.salePrice ?? product.price;
}

function formatDate(date: string) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPending(status: string) {
  return status === "Pendiente de confirmación";
}

function isPaymentConfirmed(status: string) {
  return (
    status === "Pago confirmado" ||
    status === "Reservado" ||
    status === "Preparando pedido" ||
    status === "Enviado" ||
    status === "Entregado"
  );
}

function isDelivered(status: string) {
  return status === "Entregado";
}

function isRejected(status: string) {
  return status === "Pago rechazado" || status === "Cancelado";
}

function getStatusStyle(status: string) {
  if (isDelivered(status)) {
    return "bg-blue-50 text-[#0057A8]";
  }

  if (isPaymentConfirmed(status)) {
    return "bg-green-50 text-green-700";
  }

  if (isRejected(status)) {
    return "bg-red-50 text-[#E31B23]";
  }

  return "bg-amber-50 text-amber-700";
}

function getStatusIcon(status: string) {
  if (isDelivered(status)) return PackageCheck;
  if (status === "Enviado" || status === "Preparando pedido") return Truck;
  if (isPaymentConfirmed(status)) return BadgeCheck;
  if (isRejected(status)) return XCircle;

  return Clock;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [banners, setBanners] = useState<PublicBanner[]>([]);

  useEffect(() => {
    async function checkSessionAndLoad() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        localStorage.removeItem("rca_import_admin_session");
        router.push("/admin/login");
        return;
      }

      setReady(true);
      await loadDashboard();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadDashboard() {
    setLoading(true);

    const [supabaseProducts, supabaseReservations, supabaseBanners] =
      await Promise.all([
        getSupabaseAdminProducts(),
        getSupabaseAdminReservations(),
        getSupabaseAdminBanners(),
      ]);

    setProducts(supabaseProducts);
    setReservations(supabaseReservations);
    setBanners(supabaseBanners);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const visibleProducts = products.filter(
      (product) => product.visible !== false
    ).length;

    const hiddenProducts = products.filter(
      (product) => product.visible === false
    ).length;

    const availableProducts = products.filter(
      (product) => product.available !== false
    ).length;

    const featuredProducts = products.filter((product) => product.featured)
      .length;

    const wholesaleProducts = products.filter((product) => product.wholesale)
      .length;

    const lowStockProducts = products.filter(
      (product) =>
        product.visible !== false &&
        product.available !== false &&
        getAvailableStock(product) <= 3
    ).length;

    const pendingReservations = reservations.filter((reservation) =>
      isPending(reservation.status)
    ).length;

    const confirmedReservations = reservations.filter((reservation) =>
      isPaymentConfirmed(reservation.status)
    ).length;

    const deliveredReservations = reservations.filter((reservation) =>
      isDelivered(reservation.status)
    ).length;

    const rejectedReservations = reservations.filter((reservation) =>
      isRejected(reservation.status)
    ).length;

    const totalDeclared = reservations.reduce(
      (sum, reservation) => sum + reservation.amountPaid,
      0
    );

    const confirmedAmount = reservations
      .filter((reservation) => isPaymentConfirmed(reservation.status))
      .reduce((sum, reservation) => sum + reservation.amountPaid, 0);

    const activeBanners = banners.filter((banner) => banner.isActive).length;

    return {
      totalProducts: products.length,
      visibleProducts,
      hiddenProducts,
      availableProducts,
      featuredProducts,
      wholesaleProducts,
      lowStockProducts,
      totalReservations: reservations.length,
      pendingReservations,
      confirmedReservations,
      deliveredReservations,
      rejectedReservations,
      totalDeclared,
      confirmedAmount,
      totalBanners: banners.length,
      activeBanners,
    };
  }, [products, reservations, banners]);

  const latestReservations = useMemo(() => {
    return [...reservations]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [reservations]);

  const lowStockList = useMemo(() => {
    return [...products]
      .filter(
        (product) =>
          product.visible !== false &&
          product.available !== false &&
          getAvailableStock(product) <= 3
      )
      .sort((a, b) => getAvailableStock(a) - getAvailableStock(b))
      .slice(0, 6);
  }, [products]);

  const topProducts = useMemo(() => {
    return [...products]
      .filter((product) => product.visible !== false)
      .sort((a, b) => getFinalPrice(b) - getFinalPrice(a))
      .slice(0, 5);
  }, [products]);

  const recentBanners = useMemo(() => {
    return [...banners].sort((a, b) => a.position - b.position).slice(0, 4);
  }, [banners]);

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Dashboard"
      description="Resumen general de productos, reservas, pagos y banners conectados a Supabase."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MainStatCard
          title="Productos"
          value={stats.totalProducts}
          detail={`${stats.visibleProducts} visibles`}
          icon={Package}
          color="text-[#0057A8]"
          bg="bg-blue-50"
          href="/admin/productos"
        />

        <MainStatCard
          title="Reservas"
          value={stats.totalReservations}
          detail={`${stats.pendingReservations} pendientes`}
          icon={ShoppingBag}
          color="text-amber-700"
          bg="bg-amber-50"
          href="/admin/reservas"
        />

        <MainStatCard
          title="Pagos"
          value={`S/ ${stats.confirmedAmount}`}
          detail={`Declarado: S/ ${stats.totalDeclared}`}
          icon={Wallet}
          color="text-green-700"
          bg="bg-green-50"
          href="/admin/pagos"
        />

        <MainStatCard
          title="Stock bajo"
          value={stats.lowStockProducts}
          detail="Productos por revisar"
          icon={AlertTriangle}
          color="text-[#E31B23]"
          bg="bg-red-50"
          href="/admin/productos"
        />

        <MainStatCard
          title="Banners"
          value={stats.activeBanners}
          detail={`${stats.totalBanners} registrados`}
          icon={ImageIcon}
          color="text-purple-700"
          bg="bg-purple-50"
          href="/admin/banners"
        />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniStatCard
          title="Disponibles"
          value={stats.availableProducts}
          icon={BadgeCheck}
          href="/admin/productos"
        />

        <MiniStatCard
          title="Destacados"
          value={stats.featuredProducts}
          icon={Sparkles}
          href="/admin/productos"
        />

        <MiniStatCard
          title="Mayorista"
          value={stats.wholesaleProducts}
          icon={Boxes}
          href="/admin/productos"
        />

        <MiniStatCard
          title="Entregadas"
          value={stats.deliveredReservations}
          icon={PackageCheck}
          href="/admin/reservas"
        />
      </section>

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Panel conectado
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Datos reales desde Supabase
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Productos, reservas, pagos, banners y estados se actualizan desde
              la base de datos.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={loading ? "animate-spin" : ""}
              size={17}
            />
            {loading ? "Actualizando..." : "Recargar"}
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Últimas reservas
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Movimientos recientes
              </h2>
            </div>

            <Link
              href="/admin/reservas"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-xs font-black text-white transition hover:bg-blue-700"
            >
              Ver todo
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <LoadingBlock text="Cargando reservas..." />
          ) : latestReservations.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {latestReservations.map((reservation) => (
                <ReservationRow
                  key={reservation.id}
                  reservation={reservation}
                />
              ))}
            </div>
          ) : (
            <EmptyBlock
              icon={Clock}
              title="Aún no hay reservas."
              text="Cuando un cliente separe un producto, aparecerá aquí."
            />
          )}
        </section>

        <section className="grid gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                  Stock bajo
                </p>

                <h2 className="mt-2 text-3xl font-black">Revisar stock</h2>
              </div>

              <AlertTriangle className="text-[#E31B23]" size={30} />
            </div>

            {loading ? (
              <LoadingBlock text="Cargando stock..." compact />
            ) : lowStockList.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {lowStockList.map((product) => (
                  <ProductStockRow key={product.slug} product={product} />
                ))}
              </div>
            ) : (
              <EmptyBlock
                icon={BadgeCheck}
                title="Stock estable."
                text="No hay productos visibles con stock bajo."
                compact
              />
            )}
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                  Productos fuertes
                </p>

                <h2 className="mt-2 text-3xl font-black">Mayor valor</h2>
              </div>

              <TrendingUp className="text-[#0057A8]" size={30} />
            </div>

            {loading ? (
              <LoadingBlock text="Cargando productos..." compact />
            ) : topProducts.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {topProducts.map((product) => (
                  <ProductValueRow key={product.slug} product={product} />
                ))}
              </div>
            ) : (
              <EmptyBlock
                icon={Package}
                title="No hay productos visibles."
                text="Cuando publiques productos, aparecerán aquí."
                compact
              />
            )}
          </section>
        </section>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.65fr_1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            Accesos rápidos
          </p>

          <h2 className="mt-3 text-3xl font-black">Gestionar tienda</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <QuickLink
              href="/admin/productos/nuevo"
              title="Nuevo producto"
              icon={Package}
            />

            <QuickLink
              href="/admin/banners"
              title="Banners Home"
              icon={ImageIcon}
            />

            <QuickLink
              href="/admin/categorias"
              title="Categorías"
              icon={Layers}
            />

            <QuickLink href="/admin/marcas" title="Marcas" icon={Tag} />

            <QuickLink href="/admin/paises" title="Países" icon={Eye} />

            <QuickLink
              href="/admin/configuracion"
              title="Configuración"
              icon={Settings}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Banners activos
              </p>

              <h2 className="mt-2 text-3xl font-black">Portada actual</h2>
            </div>

            <Link
              href="/admin/banners"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-black text-white transition hover:bg-slate-800"
            >
              Administrar
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <LoadingBlock text="Cargando banners..." compact />
          ) : recentBanners.length > 0 ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {recentBanners.map((banner) => (
                <BannerMiniCard key={banner.id} banner={banner} />
              ))}
            </div>
          ) : (
            <EmptyBlock
              icon={ImageIcon}
              title="No hay banners."
              text="Crea banners para la portada desde el panel."
              compact
            />
          )}
        </section>
      </section>

      
    </AdminShell>
  );
}

function MainStatCard({
  title,
  value,
  detail,
  icon: Icon,
  color,
  bg,
  href,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 truncate text-3xl font-black text-slate-950">
            {value}
          </p>

          <p className="mt-1 truncate text-xs font-bold text-slate-400">
            {detail}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}
        >
          <Icon className={color} size={24} />
        </div>
      </div>
    </Link>
  );
}

function MiniStatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0057A8]"
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {title}
        </p>

        <p className="mt-2 text-2xl font-black">{value}</p>
      </div>

      <Icon className="text-[#0057A8]" size={28} />
    </Link>
  );
}

function ReservationRow({
  reservation,
}: {
  reservation: PublicReservation;
}) {
  const StatusIcon = getStatusIcon(reservation.status);

  return (
    <article className="grid gap-4 p-5 transition hover:bg-[#f6f8fc] md:grid-cols-[1fr_150px_190px]">
      <div>
        <p className="font-black text-slate-950">
          {reservation.customerName}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          {reservation.phone} · DNI {reservation.documentNumber}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-400">
          {formatDate(reservation.createdAt)}
        </p>
      </div>

      <div>
        <p className="text-xl font-black text-[#E31B23]">
          S/ {reservation.amountPaid}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-400">
          Total: S/ {reservation.total}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${getStatusStyle(
            reservation.status
          )}`}
        >
          <StatusIcon size={15} />
          {reservation.status}
        </span>

        <Link
          href={`/estado-pedido?codigo=${reservation.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-xs font-black text-[#0057A8]"
        >
          Ver estado
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function ProductStockRow({ product }: { product: PublicProduct }) {
  return (
    <Link
      href={`/admin/productos/${product.slug}/editar`}
      className="flex items-center justify-between gap-4 p-5 transition hover:bg-[#f6f8fc]"
    >
      <div className="min-w-0">
        <p className="truncate font-black">{product.name}</p>

        <p className="mt-1 truncate text-xs font-bold text-slate-400">
          {product.category} · {product.brand}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-red-50 px-3 py-2 text-xs font-black text-[#E31B23]">
        {getAvailableStock(product)} disp.
      </span>
    </Link>
  );
}

function ProductValueRow({ product }: { product: PublicProduct }) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      target="_blank"
      className="flex items-center justify-between gap-4 p-5 transition hover:bg-[#f6f8fc]"
    >
      <div className="min-w-0">
        <p className="truncate font-black">{product.name}</p>

        <p className="mt-1 truncate text-xs font-bold text-slate-400">
          {product.category} · {product.brand}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
        S/ {getFinalPrice(product)}
      </span>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  icon: Icon,
}: {
  href: string;
  title: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="flex h-16 items-center justify-between rounded-2xl bg-[#f6f8fc] px-5 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-[#0057A8]"
    >
      <span>{title}</span>
      <Icon size={21} />
    </Link>
  );
}

function BannerMiniCard({ banner }: { banner: PublicBanner }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-4">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-2 text-xs font-black ${
            banner.isActive
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-[#E31B23]"
          }`}
        >
          {banner.isActive ? "Activo" : "Inactivo"}
        </span>

        <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500">
          Pos. {banner.position}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-lg font-black text-slate-950">
        {banner.title}
      </h3>

      <Link
        href="/"
        target="_blank"
        className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#0057A8]"
      >
        Ver en Home
        <ArrowRight size={14} />
      </Link>
    </article>
  );
}

function LoadingBlock({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "p-8 text-center" : "p-10 text-center"}>
      <RefreshCw
        className="mx-auto mb-4 animate-spin text-[#0057A8]"
        size={compact ? 34 : 42}
      />

      <p className="font-black">{text}</p>
    </div>
  );
}

function EmptyBlock({
  icon: Icon,
  title,
  text,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "p-8 text-center" : "p-10 text-center"}>
      <Icon className="mx-auto mb-4 text-slate-400" size={compact ? 40 : 44} />

      <p className="text-xl font-black">{title}</p>

      <p className="mt-2 text-sm font-semibold text-slate-500">{text}</p>
    </div>
  );
}