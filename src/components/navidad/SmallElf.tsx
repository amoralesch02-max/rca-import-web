/**
 * Duendecito navideño con un regalo, que flota junto a la caja
 * "¿Buscas un regalo?" del inicio.
 * Solo se ve en Navidad (.nv-only). Dibujo propio, sin imágenes externas.
 * La animación (.nv-elf) está en temas/navidad.css.
 */
export default function SmallElf({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 78"
      className={`nv-only nv-elf ${className}`}
    >
      {/* orejas */}
      <path d="M19 40 Q10 40 6 32 Q15 31 21 36 Z" fill="#ffd2ac"/>
      <path d="M45 40 Q54 40 58 32 Q49 31 43 36 Z" fill="#ffd2ac"/>
      <path d="M17 37 Q12 36 10 33 Q14 34 18 36Z" fill="#f2a98a" opacity=".7"/>
      <path d="M47 37 Q52 36 54 33 Q50 34 46 36Z" fill="#f2a98a" opacity=".7"/>
      {/* cuerpo */}
      <path d="M21 53 Q32 49 43 53 L46 67 Q32 72 18 67 Z" fill="#1f8a57"/>
      <path d="M21 53 Q32 49 43 53 L43.6 57 Q32 53.5 20.4 57 Z" fill="#fff"/>
      <rect x="19.5" y="62" width="25" height="3.6" rx="1.4" fill="#5b3a1e"/>
      <rect x="29.6" y="61.4" width="4.8" height="4.8" rx="1" fill="#f6c244"/>
      {/* botas */}
      <path d="M22 70 Q22 76 27 76 L31 76 Q31 72 29 70 Z" fill="#c8102e"/>
      <path d="M42 70 Q42 76 37 76 L33 76 Q33 72 35 70 Z" fill="#c8102e"/>
      {/* cara */}
      <circle cx="32" cy="39" r="13.5" fill="#ffd9b8"/>
      <ellipse cx="23.6" cy="44" rx="3" ry="2.2" fill="#ff8f8f" opacity=".5"/>
      <ellipse cx="40.4" cy="44" rx="3" ry="2.2" fill="#ff8f8f" opacity=".5"/>
      <circle cx="27.2" cy="39.5" r="1.8" fill="#2a2330"/>
      <circle cx="36.8" cy="39.5" r="1.8" fill="#2a2330"/>
      <circle cx="27.7" cy="38.9" r=".6" fill="#fff"/>
      <circle cx="37.3" cy="38.9" r=".6" fill="#fff"/>
      <path d="M28.2 44.2 Q32 48 35.8 44.2" fill="none" stroke="#b5483a" strokeWidth="1.5" strokeLinecap="round"/>
      {/* gorro */}
      <path d="M18.5 31 C18 17 26 8 37 8 C46 8 52 13 54 21 C52.5 25 49.5 28.5 46 31 Z" fill="#c8102e"/>
      <path d="M26 12 C29 10 33 9.5 36 9.6 C32 11 29 14 28 18 Z" fill="#e5384f" opacity=".75"/>
      <rect x="17" y="28.5" width="30" height="7.5" rx="3.75" fill="#fff"/>
      <circle cx="54" cy="22" r="4.2" fill="#fff"/>
      {/* regalo */}
      <rect x="22" y="55" width="20" height="14" rx="2" fill="#0057a8"/>
      <rect x="30" y="55" width="4" height="14" fill="#fff"/>
      <rect x="22" y="60.6" width="20" height="3" fill="#fff"/>
      <path d="M32 55 C28 49 23 52 27 55 Z" fill="#e5384f"/>
      <path d="M32 55 C36 49 41 52 37 55 Z" fill="#e5384f"/>
      <circle cx="32" cy="55" r="1.7" fill="#c8102e"/>
      {/* manos */}
      <circle cx="21.6" cy="60.5" r="3.1" fill="#ffd9b8"/>
      <circle cx="42.4" cy="60.5" r="3.1" fill="#ffd9b8"/>
      {/* destellos */}
      <path className="tw a" d="M8 16 L9.3 19.2 L12.5 20.5 L9.3 21.8 L8 25 L6.7 21.8 L3.5 20.5 L6.7 19.2 Z" fill="#fde68a"/>
      <path className="tw b" d="M58 46 L58.9 48.3 L61.2 49.2 L58.9 50.1 L58 52.4 L57.1 50.1 L54.8 49.2 L57.1 48.3 Z" fill="#fff"/>
    </svg>
  );
}
