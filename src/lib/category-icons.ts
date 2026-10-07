import {
  Boxes,
  Cable,
  Camera,
  Footprints,
  Gamepad2,
  Headphones,
  Keyboard,
  Laptop,
  Mouse,
  Package,
  Plug,
  Shield,
  Smartphone,
  Sparkles,
  Speaker,
  Tablet,
  Tv,
  Usb,
  Watch,
  type LucideIcon,
} from "lucide-react";

/**
 * Elige el icono de una categoría según su nombre.
 * Si se crea una categoría nueva y no coincide con ninguna palabra,
 * se usa un icono genérico. Para agregar más, suma una línea a la lista.
 */
const CATEGORY_ICONS: [string[], LucideIcon][] = [
  [["iphone", "celular", "smartphone", "telefono", "movil"], Smartphone],
  [["case", "funda", "carcasa", "protector", "mica"], Shield],
  [["cable"], Cable],
  [["cubo", "cargador", "adaptador", "charger", "power"], Plug],
  [["audifono", "auricular", "airpod", "headphone", "earbud"], Headphones],
  [["reloj", "watch", "smartwatch"], Watch],
  [["laptop", "macbook", "notebook", "computadora"], Laptop],
  [["tablet", "ipad"], Tablet],
  [["camara", "camera", "gopro"], Camera],
  [["consola", "juego", "gamer", "gaming", "playstation", "xbox", "nintendo"], Gamepad2],
  [["parlante", "bocina", "speaker", "sonido"], Speaker],
  [["mouse", "raton"], Mouse],
  [["teclado", "keyboard"], Keyboard],
  [["tv", "television", "pantalla", "monitor"], Tv],
  [["perfume", "fragancia"], Sparkles],
  [["zapatilla", "calzado", "zapato", "sneaker"], Footprints],
  [["mayorista", "mayor"], Boxes],
  [["accesorio"], Usb],
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getCategoryIcon(name: string, slug = ""): LucideIcon {
  const text = `${normalize(name)} ${normalize(slug)}`;

  for (const [keywords, icon] of CATEGORY_ICONS) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return icon;
    }
  }

  return Package;
}
