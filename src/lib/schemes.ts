/** Схеми вузлів: номер на малюнку → категорія каталогу. Координати — у % від полотна 800×500. */
export interface SchemePart { n: number; label: string; category: string; x: number; y: number }
export interface Scheme { slug: string; title: string; description: string; parts: SchemePart[] }

export const SCHEMES: Scheme[] = [
  {
    slug: "halma-perednoi-osi",
    title: "Гальмівний механізм передньої осі",
    description: "Дискові гальма тягача: диск, супорт, колодки, датчик ABS і головний кран.",
    parts: [
      { n: 1, label: "Диск гальмівний", category: "dysky-halmivni", x: 30, y: 36 },
      { n: 2, label: "Супорт", category: "suporty", x: 70, y: 26 },
      { n: 3, label: "Колодки гальмівні", category: "kolodky-halmivni", x: 61, y: 13 },
      { n: 4, label: "Датчик ABS", category: "datchyky", x: 40, y: 76 },
      { n: 5, label: "Кран гальмівний головний", category: "halmivni-krany", x: 87, y: 74 },
    ],
  },
  {
    slug: "pnevmopidviska",
    title: "Пневмопідвіска задньої осі",
    description: "Пневмоподушки, амортизатори, кран рівня підлоги, стабілізатор і осушувач.",
    parts: [
      { n: 1, label: "Пневмоподушка", category: "pnevmopodushky", x: 31, y: 47 },
      { n: 2, label: "Амортизатор", category: "amortyzatory", x: 64, y: 50 },
      { n: 3, label: "Кран рівня підлоги", category: "pnevmokrany", x: 84, y: 30 },
      { n: 4, label: "Тяга стабілізатора", category: "stabilizatory", x: 49, y: 72 },
      { n: 5, label: "Картридж осушувача", category: "osushuvachi", x: 11, y: 22 },
    ],
  },
  {
    slug: "to-dvyguna",
    title: "ТО двигуна",
    description: "Що міняють на плановому обслуговуванні: фільтри, ремінь, помпа, генератор.",
    parts: [
      { n: 1, label: "Фільтр оливний", category: "filtry-olyvni", x: 26, y: 68 },
      { n: 2, label: "Фільтр паливний", category: "filtry-palyvni", x: 40, y: 68 },
      { n: 3, label: "Фільтр повітряний", category: "filtry-povitriani", x: 84, y: 30 },
      { n: 4, label: "Ремінь поліклиновий", category: "remeni-ta-roliky", x: 12, y: 40 },
      { n: 5, label: "Помпа водяна", category: "pompy-vodiani", x: 15, y: 70 },
      { n: 6, label: "Генератор", category: "heneratory-startery", x: 12, y: 16 },
    ],
  },
];
