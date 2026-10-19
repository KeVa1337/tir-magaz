export interface SeedCategory { name: string; slug: string; icon: string; children: { name: string; slug: string; icon?: string }[] }

export const CATEGORIES: SeedCategory[] = [
  { name: "Двигун", slug: "dvyhun", icon: "engine", children: [
    { name: "Фільтри оливні", slug: "filtry-olyvni" },
    { name: "Фільтри паливні", slug: "filtry-palyvni" },
    { name: "Фільтри повітряні", slug: "filtry-povitriani" },
    { name: "Ремені та ролики", slug: "remeni-ta-roliky" },
    { name: "Помпи водяні", slug: "pompy-vodiani" },
  ] },
  { name: "Гальма", slug: "halma", icon: "disc", children: [
    { name: "Колодки гальмівні", slug: "kolodky-halmivni" },
    { name: "Диски гальмівні", slug: "dysky-halmivni" },
    { name: "Супорти", slug: "suporty" },
    { name: "Гальмівні крани", slug: "halmivni-krany" },
  ] },
  { name: "Пневматика", slug: "pnevmatyka", icon: "wind", children: [
    { name: "Пневмоподушки", slug: "pnevmopodushky" },
    { name: "Пневмокрани та клапани", slug: "pnevmokrany" },
    { name: "Осушувачі повітря", slug: "osushuvachi" },
  ] },
  { name: "Підвіска", slug: "pidviska", icon: "spring", children: [
    { name: "Амортизатори", slug: "amortyzatory" },
    { name: "Ресори", slug: "resory" },
    { name: "Стабілізатори та тяги", slug: "stabilizatory" },
  ] },
  { name: "Кабіна", slug: "kabina", icon: "cabin", children: [
    { name: "Амортизатори кабіни", slug: "amortyzatory-kabiny" },
    { name: "Дзеркала", slug: "dzerkala" },
    { name: "Фари та ліхтарі", slug: "fary" },
  ] },
  { name: "Трансмісія", slug: "transmisiia", icon: "gear", children: [
    { name: "Зчеплення", slug: "zcheplennia" },
  ] },
  { name: "Електрика", slug: "elektryka", icon: "bolt", children: [
    { name: "Генератори та стартери", slug: "heneratory-startery" },
    { name: "Датчики", slug: "datchyky" },
  ] },
  { name: "Сідло та зчіпка", slug: "sidlo-ta-zchipka", icon: "link", children: [
    { name: "Сідельно-зчіпні пристрої", slug: "sidelni-prystroi" },
  ] },
  { name: "Осі причепа", slug: "osi-prychepa", icon: "axle", children: [
    { name: "Осі BPW", slug: "osi-bpw" },
    { name: "Осі SAF", slug: "osi-saf" },
    { name: "Осі ROR", slug: "osi-ror" },
  ] },
  { name: "Масла та рідини", slug: "masla-ta-ridyny", icon: "droplet", children: [
    { name: "Моторні оливи", slug: "motorni-olyvy" },
    { name: "Охолоджуючі рідини", slug: "okholodzhuiuchi-ridyny" },
  ] },
];

export interface SeedPartBrand { name: string; isOriginal?: boolean; country: string }

export const PART_BRANDS: SeedPartBrand[] = [
  { name: "Knorr-Bremse", country: "Німеччина" },
  { name: "Wabco", country: "Бельгія" },
  { name: "Febi Bilstein", country: "Німеччина" },
  { name: "Sachs", country: "Німеччина" },
  { name: "Mann-Filter", country: "Німеччина" },
  { name: "Hengst", country: "Німеччина" },
  { name: "Fleetguard", country: "США" },
  { name: "Donaldson", country: "США" },
  { name: "Contitech", country: "Німеччина" },
  { name: "Diesel Technic", country: "Німеччина" },
  { name: "Bosch", country: "Німеччина" },
  { name: "Monroe", country: "Бельгія" },
  { name: "Lemförder", country: "Німеччина" },
  { name: "Hella", country: "Німеччина" },
  { name: "Haldex", country: "Швеція" },
  { name: "Firestone", country: "США" },
  { name: "Jost", country: "Німеччина" },
  { name: "Castrol", country: "Велика Британія" },
  { name: "Shell", country: "Нідерланди" },
  { name: "DAF", isOriginal: true, country: "Нідерланди" },
  { name: "MAN", isOriginal: true, country: "Німеччина" },
  { name: "Volvo", isOriginal: true, country: "Швеція" },
  { name: "Scania", isOriginal: true, country: "Швеція" },
  { name: "Mercedes-Benz", isOriginal: true, country: "Німеччина" },
  { name: "Renault Trucks", isOriginal: true, country: "Франція" },
  { name: "Iveco", isOriginal: true, country: "Італія" },
  { name: "BPW", isOriginal: true, country: "Німеччина" },
  { name: "SAF", isOriginal: true, country: "Німеччина" },
  { name: "ROR", isOriginal: true, country: "Велика Британія" },
];
