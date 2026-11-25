/**
 * Mascota navideña de RCA IMPORT: el pingüino con su regalo.
 * Aparece en el banner de la cuenta regresiva, en la caja "¿Buscas un regalo?",
 * en el carrito vacío y en la página 404. Solo se ve en Navidad (.nv-only).
 *
 * (El archivo conserva el nombre GiftElf para no cambiar los lugares donde se usa.)
 * La imagen está en public/navidad/mascota.webp; el movimiento de flotar
 * (.nv-elf) y los destellos (.tw) están en temas/navidad.css.
 */
export default function GiftElf({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`nv-only nv-elf relative ${className}`}>
      <img
        src="/navidad/mascota.webp"
        alt=""
        width={483}
        height={640}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-auto w-full select-none"
      />

      {/* Destellos alrededor */}
      <svg viewBox="0 0 10 10" className="tw a absolute -left-[6%] top-[14%] w-[16%]">
        <path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill="#fde68a" />
      </svg>
      <svg viewBox="0 0 10 10" className="tw b absolute -right-[4%] top-[52%] w-[11%]">
        <path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill="#ffffff" />
      </svg>
    </span>
  );
}
