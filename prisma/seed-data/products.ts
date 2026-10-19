/**
 * Генератор демо-товарів. Артикули й OE-номери вигадані, але у форматах, схожих на реальні.
 * Детермінований (фіксований seed PRNG), щоб демо-дані були стабільними між перезапусками.
 */
import { MAKES } from "./vehicles";

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261019);
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const fill = (pattern: string) => pattern.replace(/#/g, () => String(int(0, 9)));

export interface SeedFitment {
  make?: string; series?: string; engine?: string; axleBrand?: string;
  yearFrom?: number; yearTo?: number; chassisFrom?: string; chassisTo?: string; position?: string; note?: string;
}
export interface SeedProduct {
  key: string;
  name: string;
  brand: string;
  article: string;
  category: string;
  price: number;
  oldPrice?: number;
  stockQty: number;
  stockStatus: "IN_STOCK" | "LOW" | "ON_ORDER" | "OUT_OF_STOCK";
  leadTimeDays?: number;
  weightKg?: number;
  description: string;
  isPopular: boolean;
  isUniversal: boolean;
  numbers: { number: string; type: "OE" | "CROSS"; brandName: string }[];
  fitments: SeedFitment[];
  attributes: { name: string; value: string }[];
}

const OE_PATTERN: Record<string, string[]> = {
  daf: ["1######", "2######"],
  man: ["81.#####-####", "51.#####-####"],
  volvo: ["2#######", "8#######"],
  scania: ["1######", "2######"],
  "mercedes-benz": ["A ### ### ## ##"],
  "renault-trucks": ["74 ## ### ###", "50 ## ### ###"],
  iveco: ["504######", "41######"],
};
const ORIGINAL_BRAND: Record<string, string> = {
  daf: "DAF", man: "MAN", volvo: "Volvo", scania: "Scania", "mercedes-benz": "Mercedes-Benz",
  "renault-trucks": "Renault Trucks", iveco: "Iveco",
};

interface AftermarketBrand { brand: string; pattern: string }
type Level = "engine" | "series" | "make";

interface PartType {
  key: string;
  name: string;
  category: string;
  level: Level;
  brands: AftermarketBrand[];
  price: [number, number];
  weight: [number, number];
  targets: number; // скільки цільових авто (крім обов'язкових DAF XF 106 і MAN TGX)
  positions?: string[];
  attrs: () => { name: string; value: string }[];
  desc: string;
}

const PART_TYPES: PartType[] = [
  { key: "oil-filter", name: "Фільтр оливний", category: "filtry-olyvni", level: "engine", targets: 3,
    brands: [{ brand: "Mann-Filter", pattern: "HU 1###/# x" }, { brand: "Hengst", pattern: "E###H D###" }, { brand: "Fleetguard", pattern: "LF####" }],
    price: [450, 1150], weight: [0.4, 1.2],
    attrs: () => [{ name: "Тип", value: "Фільтрувальний елемент" }, { name: "Висота, мм", value: String(int(140, 320)) }, { name: "Зовнішній діаметр, мм", value: String(int(90, 140)) }],
    desc: "Оливний фільтр з целюлозно-синтетичним фільтрувальним матеріалом. Рекомендований інтервал заміни — разом з оливою на кожному ТО." },
  { key: "fuel-filter", name: "Фільтр паливний", category: "filtry-palyvni", level: "engine", targets: 3,
    brands: [{ brand: "Mann-Filter", pattern: "WK 1###/# x" }, { brand: "Fleetguard", pattern: "FF####" }, { brand: "Bosch", pattern: "F 026 402 ###" }],
    price: [600, 1550], weight: [0.3, 0.9],
    attrs: () => [{ name: "Тип", value: pick(["Фільтр тонкого очищення", "Фільтр-сепаратор"]) }, { name: "Висота, мм", value: String(int(120, 260)) }],
    desc: "Паливний фільтр для дизельних двигунів Common Rail. Захищає форсунки та ПНВТ від води й механічних домішок." },
  { key: "air-filter", name: "Фільтр повітряний", category: "filtry-povitriani", level: "series", targets: 3,
    brands: [{ brand: "Mann-Filter", pattern: "C 41 ###" }, { brand: "Donaldson", pattern: "P######" }, { brand: "Hengst", pattern: "E### L" }],
    price: [1800, 4900], weight: [2.5, 6],
    attrs: () => [{ name: "Висота, мм", value: String(int(380, 620)) }, { name: "Зовнішній діаметр, мм", value: String(int(260, 340)) }],
    desc: "Повітряний фільтр двигуна. Підвищена пилоємність для роботи в умовах доріг України." },
  { key: "belt", name: "Ремінь поліклиновий", category: "remeni-ta-roliky", level: "engine", targets: 2,
    brands: [{ brand: "Contitech", pattern: "8PK####" }, { brand: "Febi Bilstein", pattern: "#####" }],
    price: [900, 2300], weight: [0.2, 0.5],
    attrs: () => [{ name: "Кількість ребер", value: "8" }, { name: "Довжина, мм", value: String(int(1600, 2600)) }],
    desc: "Поліклиновий ремінь приводу навісного обладнання (генератор, компресор кондиціонера)." },
  { key: "water-pump", name: "Помпа водяна", category: "pompy-vodiani", level: "engine", targets: 2,
    brands: [{ brand: "Febi Bilstein", pattern: "#####" }, { brand: "Diesel Technic", pattern: "2.#####" }],
    price: [7200, 16500], weight: [4, 9],
    attrs: () => [{ name: "Комплектація", value: "З прокладкою" }],
    desc: "Водяний насос системи охолодження двигуна. Постачається з прокладками." },
  { key: "brake-pads", name: "Колодки гальмівні дискові (к-т)", category: "kolodky-halmivni", level: "series", targets: 3,
    brands: [{ brand: "Knorr-Bremse", pattern: "K######" }, { brand: "Febi Bilstein", pattern: "16###" }, { brand: "Diesel Technic", pattern: "5.#####" }],
    price: [2800, 6600], weight: [8, 12], positions: ["передня вісь", "задня вісь"],
    attrs: () => [{ name: "Система", value: pick(["Knorr SB7", "Knorr SN7", "Wabco PAN 22"]) }, { name: "Ширина, мм", value: "210" }, { name: "Товщина, мм", value: String(int(28, 30)) }, { name: "Датчик зносу", value: pick(["Так", "Ні"]) }],
    desc: "Комплект дискових гальмівних колодок на вісь з кріпленням. Сертифіковано за ECE R90." },
  { key: "brake-disc", name: "Диск гальмівний", category: "dysky-halmivni", level: "series", targets: 3,
    brands: [{ brand: "Febi Bilstein", pattern: "4####" }, { brand: "Diesel Technic", pattern: "1.#####" }],
    price: [4600, 9600], weight: [30, 40], positions: ["передня вісь", "задня вісь"],
    attrs: () => [{ name: "Діаметр, мм", value: pick(["377", "430", "434"]) }, { name: "Товщина, мм", value: "45" }],
    desc: "Вентильований гальмівний диск. Встановлювати попарно на вісь разом з новими колодками." },
  { key: "caliper", name: "Супорт гальмівний", category: "suporty", level: "series", targets: 2,
    brands: [{ brand: "Knorr-Bremse", pattern: "K0#####" }, { brand: "Haldex", pattern: "######" }],
    price: [16000, 38500], weight: [28, 38], positions: ["передній лівий", "передній правий"],
    attrs: () => [{ name: "Система", value: pick(["Knorr SB7000", "Knorr SN7000", "Haldex ModulX"]) }, { name: "Стан", value: "Новий" }],
    desc: "Гальмівний супорт у зборі. Увага: модифікація залежить від номера шасі — уточнюйте за VIN." },
  { key: "brake-valve", name: "Кран гальмівний головний", category: "halmivni-krany", level: "make", targets: 2,
    brands: [{ brand: "Wabco", pattern: "461 318 ### 0" }, { brand: "Knorr-Bremse", pattern: "II#####" }],
    price: [6200, 18500], weight: [2, 4],
    attrs: () => [{ name: "Кількість контурів", value: "2" }],
    desc: "Головний гальмівний кран (педаль гальма). Двоконтурний." },
  { key: "air-spring", name: "Пневмоподушка підвіски", category: "pnevmopodushky", level: "series", targets: 3,
    brands: [{ brand: "Contitech", pattern: "#### N P0#" }, { brand: "Firestone", pattern: "W01-358-####" }],
    price: [3600, 8600], weight: [4, 9], positions: ["задня вісь", "передня вісь"],
    attrs: () => [{ name: "Тип", value: "З металевим стаканом" }, { name: "Висота max, мм", value: String(int(380, 520)) }],
    desc: "Пневморесора (пневмобалон) підвіски. Аналог оригіналу, з металевим поршнем у комплекті." },
  { key: "level-valve", name: "Кран рівня підлоги", category: "pnevmokrany", level: "make", targets: 2,
    brands: [{ brand: "Wabco", pattern: "464 006 ### 0" }, { brand: "Diesel Technic", pattern: "5.#####" }],
    price: [2600, 7100], weight: [0.6, 1.2],
    attrs: () => [{ name: "Тип", value: "Механічний" }],
    desc: "Клапан регулювання рівня пневмопідвіски." },
  { key: "dryer-cartridge", name: "Картридж осушувача повітря", category: "osushuvachi", level: "make", targets: 3,
    brands: [{ brand: "Wabco", pattern: "432 410 ### 7" }, { brand: "Knorr-Bremse", pattern: "II#####" }, { brand: "Mann-Filter", pattern: "TB 1###/# x" }],
    price: [950, 2650], weight: [1, 2],
    attrs: () => [{ name: "Різьба", value: pick(["M39x1.5", "M41x1.5"]) }, { name: "З маслоуловлювачем", value: pick(["Так", "Ні"]) }],
    desc: "Фільтр-картридж осушувача пневмосистеми. Заміна — раз на рік або 100 000 км." },
  { key: "shock", name: "Амортизатор підвіски", category: "amortyzatory", level: "series", targets: 3,
    brands: [{ brand: "Sachs", pattern: "311 ###" }, { brand: "Monroe", pattern: "T1###" }],
    price: [2600, 6300], weight: [3, 6], positions: ["передня вісь", "задня вісь"],
    attrs: () => [{ name: "Тип", value: "Масляний" }, { name: "Довжина min/max, мм", value: `${int(380, 460)}/${int(640, 720)}` }],
    desc: "Амортизатор підвіски моста. Рекомендується заміна парами." },
  { key: "leaf-spring", name: "Ресора", category: "resory", level: "series", targets: 2,
    brands: [{ brand: "Diesel Technic", pattern: "3.#####" }],
    price: [9200, 21000], weight: [45, 75], positions: ["передня вісь"],
    attrs: () => [{ name: "Кількість листів", value: String(int(2, 4)) }, { name: "Тип", value: "Параболічна" }],
    desc: "Параболічна ресора передньої підвіски." },
  { key: "stab-link", name: "Тяга стабілізатора", category: "stabilizatory", level: "series", targets: 3,
    brands: [{ brand: "Lemförder", pattern: "##### 01" }, { brand: "Febi Bilstein", pattern: "2####" }],
    price: [1250, 3300], weight: [1.5, 3],
    attrs: () => [{ name: "Довжина, мм", value: String(int(260, 420)) }],
    desc: "Тяга (стійка) стабілізатора з кульовими шарнірами." },
  { key: "cab-shock", name: "Амортизатор кабіни", category: "amortyzatory-kabiny", level: "series", targets: 3,
    brands: [{ brand: "Sachs", pattern: "105 ###" }, { brand: "Monroe", pattern: "CB0###" }],
    price: [2050, 4900], weight: [1.5, 3], positions: ["передній", "задній"],
    attrs: () => [{ name: "Тип", value: pick(["Масляний", "Пневматичний"]) }],
    desc: "Амортизатор підвіски кабіни. Помітно зменшує вібрації та втому водія." },
  { key: "mirror", name: "Дзеркало бокове", category: "dzerkala", level: "series", targets: 2,
    brands: [{ brand: "Diesel Technic", pattern: "5.#####" }],
    price: [2700, 7300], weight: [1.5, 3], positions: ["ліве", "праве"],
    attrs: () => [{ name: "Обігрів", value: "Так" }, { name: "Електрорегулювання", value: "Так" }],
    desc: "Основне бокове дзеркало з електропідігрівом і електрорегулюванням." },
  { key: "headlamp", name: "Фара основна", category: "fary", level: "series", targets: 2,
    brands: [{ brand: "Hella", pattern: "1EJ ### ###-0#1" }],
    price: [8200, 26500], weight: [3, 6], positions: ["ліва", "права"],
    attrs: () => [{ name: "Тип ламп", value: pick(["H7/H1", "LED", "Xenon D1S"]) }, { name: "Коректор", value: "Електричний" }],
    desc: "Основна фара головного світла у зборі." },
  { key: "clutch", name: "Комплект зчеплення", category: "zcheplennia", level: "engine", targets: 2,
    brands: [{ brand: "Sachs", pattern: "3400 7## ###" }],
    price: [26000, 58500], weight: [40, 60],
    attrs: () => [{ name: "Діаметр диска, мм", value: pick(["430", "400"]) }, { name: "Склад", value: "Кошик + диск + вижимний" }],
    desc: "Комплект зчеплення: натискний диск, ведений диск, вижимний підшипник." },
  { key: "alternator", name: "Генератор", category: "heneratory-startery", level: "engine", targets: 2,
    brands: [{ brand: "Bosch", pattern: "0 124 ### ###" }],
    price: [12500, 31500], weight: [8, 12],
    attrs: () => [{ name: "Напруга, В", value: "28" }, { name: "Струм, А", value: pick(["80", "110", "120"]) }],
    desc: "Генератор 28 В. Новий, не відновлений." },
  { key: "starter", name: "Стартер", category: "heneratory-startery", level: "engine", targets: 2,
    brands: [{ brand: "Bosch", pattern: "0 001 ### ###" }],
    price: [15200, 36500], weight: [10, 14],
    attrs: () => [{ name: "Напруга, В", value: "24" }, { name: "Потужність, кВт", value: pick(["5.5", "6.0", "7.0"]) }],
    desc: "Стартер 24 В з редуктором." },
  { key: "abs-sensor", name: "Датчик ABS", category: "datchyky", level: "make", targets: 3,
    brands: [{ brand: "Wabco", pattern: "441 032 ### 0" }, { brand: "Diesel Technic", pattern: "1.#####" }],
    price: [900, 2600], weight: [0.2, 0.4],
    attrs: () => [{ name: "Довжина кабелю, мм", value: String(int(400, 1800)) }, { name: "Тип", value: "Прямий" }],
    desc: "Датчик швидкості обертання колеса (ABS)." },
];

/** Обов'язкові цільові авто + випадкові додаткові. */
interface Target { make: string; series: string; engine?: string; yearFrom?: number; yearTo?: number }
const tractorMakes = MAKES.filter((m) => m.kind === "TRACTOR");
const allSeries = tractorMakes.flatMap((m) => m.series.map((s) => ({ make: m, series: s })));

const MUST: Target[] = [
  { make: "daf", series: "xf-106", engine: "MX-13" },
  { make: "man", series: "tgx", engine: "D2676 LF" },
];
// цілі для комплектів ТО — фільтри мають існувати для цих двигунів
const KIT_TARGETS: Target[] = [
  { make: "volvo", series: "fh4", engine: "D13K" },
  { make: "scania", series: "r-series", engine: "DC13" },
  { make: "mercedes-benz", series: "actros-mp4", engine: "OM471" },
];

function randomTargets(n: number, exclude: Target[]): Target[] {
  const out: Target[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 100) {
    const { make, series } = pick(allSeries);
    const t: Target = { make: make.slug, series: series.slug, engine: series.engines.length ? pick(series.engines).code : undefined };
    if ([...exclude, ...out].some((x) => x.make === t.make && x.series === t.series)) continue;
    out.push(t);
  }
  return out;
}

function seriesOf(t: Target) {
  const m = MAKES.find((x) => x.slug === t.make)!;
  return { make: m, series: m.series.find((s) => s.slug === t.series)! };
}

function stock(): Pick<SeedProduct, "stockQty" | "stockStatus" | "leadTimeDays"> {
  const r = rnd();
  if (r < 0.55) return { stockQty: int(5, 40), stockStatus: "IN_STOCK" };
  if (r < 0.7) return { stockQty: int(1, 3), stockStatus: "LOW" };
  if (r < 0.9) return { stockQty: 0, stockStatus: "ON_ORDER", leadTimeDays: int(3, 14) };
  return { stockQty: 0, stockStatus: "OUT_OF_STOCK" };
}

const round = (n: number) => Math.round(n / 10) * 10;

export function generateProducts(): SeedProduct[] {
  const products: SeedProduct[] = [];
  let seq = 0;

  for (const pt of PART_TYPES) {
    const isEngineFilter = ["oil-filter", "fuel-filter", "air-filter", "belt"].includes(pt.key);
    const base = [...MUST, ...(isEngineFilter ? KIT_TARGETS : [])];
    const targets = [...base, ...randomTargets(pt.targets - (isEngineFilter ? 1 : 0), base)];

    for (const t of targets) {
      const { make, series } = seriesOf(t);
      const position = pt.positions ? pick(pt.positions) : undefined;
      const engine = pt.level === "engine" ? (t.engine ?? series.engines[0]?.code) : undefined;
      const appl =
        pt.level === "make" ? make.name : pt.level === "engine" && engine ? `${make.name} ${series.name} ${engine}` : `${make.name} ${series.name}`;
      const name = `${pt.name} ${appl}${position ? ` (${position})` : ""}`;
      const oe = fill(pick(OE_PATTERN[make.slug]));
      const basePrice = int(pt.price[0], pt.price[1]);
      const weightKg = Math.round((pt.weight[0] + rnd() * (pt.weight[1] - pt.weight[0])) * 100) / 100;
      const attributes = pt.attrs();

      const fitBase: SeedFitment =
        pt.level === "make"
          ? { make: make.slug }
          : { make: make.slug, series: series.slug, engine, yearFrom: series.yearFrom, yearTo: series.yearTo };

      // Демонстрація залежності від номера шасі: два варіанти супорта на DAF XF 106.
      const chassisSplit = pt.key === "caliper" && t.make === "daf" && t.series === "xf-106";
      const variants = chassisSplit
        ? [
            { chassisFrom: "000001", chassisTo: "499999", suffix: " — шасі до 499999", note: "До шасі 499999 включно" },
            { chassisFrom: "500000", chassisTo: "999999", suffix: " — шасі від 500000", note: "Починаючи з шасі 500000" },
          ]
        : [{ suffix: "" } as { chassisFrom?: string; chassisTo?: string; suffix: string; note?: string }];

      for (const v of variants) {
        const variantOe = v.suffix ? fill(pick(OE_PATTERN[make.slug])) : oe;
        const group: SeedProduct[] = [];
        const fit: SeedFitment = { ...fitBase, position, chassisFrom: v.chassisFrom, chassisTo: v.chassisTo, note: v.note };

        // оригінал (OE) — приблизно у половині груп
        const withOriginal = rnd() < 0.5 || chassisSplit;
        if (withOriginal) {
          group.push({
            key: `p${++seq}`,
            name: name + v.suffix,
            brand: ORIGINAL_BRAND[make.slug],
            article: variantOe,
            category: pt.category,
            price: round(basePrice * 1.45),
            ...stock(),
            weightKg,
            description: `${pt.desc} Оригінальна запчастина ${ORIGINAL_BRAND[make.slug]}.`,
            isPopular: false,
            isUniversal: false,
            numbers: [],
            fitments: [fit],
            attributes,
          });
        }
        const afterCount = chassisSplit ? 1 : int(1, Math.min(2, pt.brands.length));
        const brands = [...pt.brands].sort(() => rnd() - 0.5).slice(0, afterCount);
        for (const b of brands) {
          const price = round(basePrice * (0.85 + rnd() * 0.3));
          group.push({
            key: `p${++seq}`,
            name: name + v.suffix,
            brand: b.brand,
            article: fill(b.pattern),
            category: pt.category,
            price,
            oldPrice: rnd() < 0.15 ? round(price * 1.18) : undefined,
            ...stock(),
            weightKg,
            description: `${pt.desc} Виробник: ${b.brand}.`,
            isPopular: false,
            isUniversal: false,
            numbers: [{ number: variantOe, type: "OE", brandName: ORIGINAL_BRAND[make.slug] }],
            fitments: [fit],
            attributes,
          });
        }
        // крос-номери між аналогами
        for (const p of group) {
          for (const other of group) {
            if (other === p || other.brand === ORIGINAL_BRAND[make.slug]) continue;
            p.numbers.push({ number: other.article, type: "CROSS", brandName: other.brand });
          }
        }
        products.push(...group);
      }
    }
  }

  products.push(...trailerProducts(() => `p${++seq}`), ...universalProducts(() => `p${++seq}`));

  // популярні товари для головної
  const popular = new Set<number>();
  while (popular.size < 12) popular.add(int(0, products.length - 1));
  popular.forEach((i) => (products[i].isPopular = true));

  return products;
}

function trailerProducts(nextKey: () => string): SeedProduct[] {
  const items: { name: string; brand: string; article: string; cat: string; axle: string; price: number; attrs: { name: string; value: string }[]; desc: string; cross?: { number: string; brand: string }[] }[] = [
    { name: "Комплект підшипників ступиці BPW ECO Plus", brand: "BPW", article: "09.801.06.63.0", cat: "osi-bpw", axle: "BPW", price: 5200, attrs: [{ name: "Вісь", value: "ECO Plus 2/3" }, { name: "Навантаження, т", value: "9" }], desc: "Комплект конічних підшипників ступиці осі BPW ECO Plus." },
    { name: "Колодки гальмівні барабанні BPW SN 4218", brand: "BPW", article: "09.801.02.20.0", cat: "osi-bpw", axle: "BPW", price: 3900, attrs: [{ name: "Барабан, мм", value: "420x180" }], desc: "Гальмівні колодки барабанних гальм BPW з накладками." },
    { name: "Колодки гальмівні дискові BPW TSB 4309", brand: "Knorr-Bremse", article: "K104987", cat: "osi-bpw", axle: "BPW", price: 3450, attrs: [{ name: "Система", value: "Knorr SB/SN" }], desc: "Дискові колодки для осей BPW TS2 з гальмами Knorr.", cross: [{ number: "09.801.07.02.0", brand: "BPW" }] },
    { name: "Диск гальмівний BPW TS2 430 мм", brand: "BPW", article: "03.110.44.13.0", cat: "osi-bpw", axle: "BPW", price: 6900, attrs: [{ name: "Діаметр, мм", value: "430" }], desc: "Гальмівний диск осі BPW TS2." },
    { name: "Пневмоподушка BPW 30K (причіп)", brand: "Contitech", article: "4157 N P06", cat: "osi-bpw", axle: "BPW", price: 4100, attrs: [{ name: "Тип", value: "З пластиковим стаканом" }], desc: "Пневмоподушка підвіски осі BPW Airlight II.", cross: [{ number: "05.429.40.24.0", brand: "BPW" }] },
    { name: "Ремкомплект шкворня/кулака BPW", brand: "Diesel Technic", article: "10.32050", cat: "osi-bpw", axle: "BPW", price: 1650, attrs: [], desc: "Ремкомплект розтискного кулака BPW.", cross: [{ number: "09.801.03.13.0", brand: "BPW" }] },
    { name: "Диск гальмівний SAF SBS 2220", brand: "SAF", article: "4.079.0024.00", cat: "osi-saf", axle: "SAF", price: 7200, attrs: [{ name: "Діаметр, мм", value: "430" }], desc: "Гальмівний диск осі SAF Intradisc plus." },
    { name: "Колодки гальмівні дискові SAF Intradisc", brand: "Febi Bilstein", article: "16871", cat: "osi-saf", axle: "SAF", price: 3300, attrs: [{ name: "Система", value: "Knorr SN7" }], desc: "Дискові колодки для осей SAF з гальмами Knorr SN7.", cross: [{ number: "3.057.0094.00", brand: "SAF" }] },
    { name: "Підшипник ступиці SAF (комплект)", brand: "SAF", article: "3.307.0003.00", cat: "osi-saf", axle: "SAF", price: 4800, attrs: [], desc: "Комплект підшипників ступиці осі SAF." },
    { name: "Пневмоподушка SAF 2918", brand: "Firestone", article: "W01-358-9781", cat: "osi-saf", axle: "SAF", price: 4300, attrs: [], desc: "Пневмоподушка підвіски SAF.", cross: [{ number: "2.918.0007.00", brand: "SAF" }] },
    { name: "Колодки гальмівні барабанні ROR 420x180", brand: "ROR", article: "21225234", cat: "osi-ror", axle: "ROR", price: 3700, attrs: [{ name: "Барабан, мм", value: "420x180" }], desc: "Гальмівні колодки осі ROR (Meritor)." },
    { name: "Барабан гальмівний ROR 420 мм", brand: "Diesel Technic", article: "10.22230", cat: "osi-ror", axle: "ROR", price: 5900, attrs: [{ name: "Діаметр, мм", value: "420" }], desc: "Гальмівний барабан осі ROR.", cross: [{ number: "21227020", brand: "ROR" }] },
  ];
  return items.map((it) => ({
    key: nextKey(),
    name: it.name,
    brand: it.brand,
    article: it.article,
    category: it.cat,
    price: it.price,
    ...stock(),
    weightKg: 5,
    description: it.desc,
    isPopular: false,
    isUniversal: false,
    numbers: (it.cross ?? []).map((c) => ({ number: c.number, type: "OE" as const, brandName: c.brand })),
    fitments: [{ axleBrand: it.axle }],
    attributes: it.attrs,
  }));
}

function universalProducts(nextKey: () => string): SeedProduct[] {
  const items = [
    { name: "Олива моторна Castrol Vecton Long Drain 10W-40 E6/E9, 20 л", brand: "Castrol", article: "15B33E", cat: "motorni-olyvy", price: 5450, attrs: [{ name: "В'язкість", value: "10W-40" }, { name: "Об'єм, л", value: "20" }, { name: "Допуски", value: "ACEA E6/E9, MB 228.51, MAN M3477, Volvo VDS-4" }] },
    { name: "Олива моторна Shell Rimula R6 LM 10W-40, 20 л", brand: "Shell", article: "550044864", cat: "motorni-olyvy", price: 5150, attrs: [{ name: "В'язкість", value: "10W-40" }, { name: "Об'єм, л", value: "20" }, { name: "Допуски", value: "ACEA E6/E7, MB 228.51, DAF HP-2, Scania LDF-3" }] },
    { name: "Олива моторна Shell Rimula R4 L 15W-40, 20 л", brand: "Shell", article: "550044862", cat: "motorni-olyvy", price: 3980, attrs: [{ name: "В'язкість", value: "15W-40" }, { name: "Об'єм, л", value: "20" }] },
    { name: "Антифриз G12+ концентрат, 20 л", brand: "Febi Bilstein", article: "22272", cat: "okholodzhuiuchi-ridyny", price: 2950, attrs: [{ name: "Тип", value: "G12+ (карбоксилатний)" }, { name: "Об'єм, л", value: "20" }] },
    { name: "Сідельно-зчіпний пристрій Jost JSK 37C, 150 мм", brand: "Jost", article: "SK 3721.10", cat: "sidelni-prystroi", price: 64500, attrs: [{ name: "Висота, мм", value: "150" }, { name: "Навантаження D, кН", value: "152" }] },
    { name: "Ремкомплект сідла Jost JSK 37 (замок)", brand: "Jost", article: "SK 3128-37", cat: "sidelni-prystroi", price: 7800, attrs: [] },
  ];
  return items.map((it) => ({
    key: nextKey(),
    name: it.name,
    brand: it.brand,
    article: it.article,
    category: it.cat,
    price: it.price,
    ...stock(),
    weightKg: 18,
    description: "Універсальна позиція — підходить для більшості тягачів. Перевірте допуски виробника двигуна.",
    isPopular: false,
    isUniversal: true,
    numbers: [],
    fitments: [],
    attributes: it.attrs,
  }));
}
