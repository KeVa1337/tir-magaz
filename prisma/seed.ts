import { PrismaClient, Prisma, type OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MAKES } from "./seed-data/vehicles";
import { CATEGORIES, PART_BRANDS } from "./seed-data/catalog";
import { generateProducts, mulberry32, type SeedProduct } from "./seed-data/products";
import { SETTINGS, BANNERS, PAGES, FAQ } from "./seed-data/content";
import { normalize, slugify } from "../src/lib/normalize";
import { vinCheckDigit } from "../src/server/vin/local-provider";

const db = new PrismaClient();
const rnd = mulberry32(7);
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));

function buildVin(prefix8: string, yearCode: string, plant: string, serial6: string) {
  const draft = `${prefix8}0${yearCode}${plant}${serial6}`;
  return `${prefix8}${vinCheckDigit(draft)}${yearCode}${plant}${serial6}`;
}

async function clean() {
  // порядок важливий через зовнішні ключі
  await db.auditLog.deleteMany();
  await db.callbackRequest.deleteMany();
  await db.importJob.deleteMany();
  await db.vinRequestItem.deleteMany();
  await db.vinRequestMessage.deleteMany();
  await db.vinRequest.deleteMany();
  await db.orderStatusHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.supplierOffer.deleteMany();
  await db.serviceKitItem.deleteMany();
  await db.serviceKit.deleteMany();
  await db.vehicleOeNumber.deleteMany();
  await db.vehicle.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();
  await db.productImage.deleteMany();
  await db.productAttribute.deleteMany();
  await db.productNumber.deleteMany();
  await db.fitment.deleteMany();
  await db.product.deleteMany();
  await db.category.updateMany({ data: { parentId: null } });
  await db.category.deleteMany();
  await db.partBrand.deleteMany();
  await db.engineCode.deleteMany();
  await db.vehicleSeries.deleteMany();
  await db.vehicleMake.deleteMany();
  await db.setting.deleteMany();
  await db.banner.deleteMany();
  await db.page.deleteMany();
  await db.faq.deleteMany();
  await db.$executeRawUnsafe(`ALTER SEQUENCE "Order_number_seq" RESTART WITH 10001`);
  await db.$executeRawUnsafe(`ALTER SEQUENCE "VinRequest_number_seq" RESTART WITH 501`);
}

async function main() {
  console.log("→ очищення");
  await clean();

  console.log("→ довідники вантажівок");
  const makeIds: Record<string, string> = {};
  const seriesIds: Record<string, string> = {}; // `${make}/${series}`
  const engineIds: Record<string, string> = {}; // `${make}/${series}/${code}`
  for (const [i, m] of MAKES.entries()) {
    const make = await db.vehicleMake.create({
      data: { name: m.name, slug: m.slug, kind: m.kind, wmiCodes: m.wmi, country: m.country, sort: i },
    });
    makeIds[m.slug] = make.id;
    for (const s of m.series) {
      const series = await db.vehicleSeries.create({
        data: { makeId: make.id, name: s.name, slug: s.slug, yearFrom: s.yearFrom, yearTo: s.yearTo },
      });
      seriesIds[`${m.slug}/${s.slug}`] = series.id;
      for (const e of s.engines) {
        const eng = await db.engineCode.create({
          data: { code: e.code, seriesId: series.id, powerHp: e.powerHp, euroClass: e.euroClass },
        });
        engineIds[`${m.slug}/${s.slug}/${e.code}`] = eng.id;
      }
    }
  }

  console.log("→ категорії і бренди");
  const catIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const parent = await db.category.create({ data: { name: c.name, slug: c.slug, icon: c.icon, sort: i } });
    catIds[c.slug] = parent.id;
    for (const [j, ch] of c.children.entries()) {
      const child = await db.category.create({
        data: { name: ch.name, slug: ch.slug, icon: ch.icon ?? c.icon, parentId: parent.id, sort: j },
      });
      catIds[ch.slug] = child.id;
    }
  }
  const brandIds: Record<string, string> = {};
  for (const b of PART_BRANDS) {
    const brand = await db.partBrand.create({
      data: { name: b.name, slug: slugify(b.name), isOriginal: !!b.isOriginal, country: b.country },
    });
    brandIds[b.name] = brand.id;
  }

  console.log("→ товари");
  const products = generateProducts();
  const productIds: Record<string, string> = {};
  const usedSlugs = new Set<string>();
  for (const [i, p] of products.entries()) {
    let slug = slugify(`${p.name}-${p.brand}-${p.article}`);
    while (usedSlugs.has(slug)) slug += "-1";
    usedSlugs.add(slug);
    const created = await db.product.create({
      data: {
        sku: `TP-${String(10001 + i)}`,
        article: p.article,
        articleNorm: normalize(p.article),
        name: p.name,
        slug,
        description: p.description,
        brandId: brandIds[p.brand],
        categoryId: catIds[p.category],
        price: new Prisma.Decimal(p.price),
        oldPrice: p.oldPrice ? new Prisma.Decimal(p.oldPrice) : null,
        purchasePrice: new Prisma.Decimal(Math.round(p.price * 0.72)),
        stockQty: p.stockQty,
        stockStatus: p.stockStatus,
        leadTimeDays: p.leadTimeDays,
        weightKg: p.weightKg ? new Prisma.Decimal(p.weightKg) : null,
        isPopular: p.isPopular,
        isUniversal: p.isUniversal,
        numbers: {
          create: p.numbers.map((n) => ({ number: n.number, numberNorm: normalize(n.number), type: n.type, brandName: n.brandName })),
        },
        attributes: { create: p.attributes.map((a, j) => ({ name: a.name, value: a.value, sort: j })) },
        fitments: {
          create: p.fitments.map((f) => ({
            makeId: f.make ? makeIds[f.make] : null,
            seriesId: f.make && f.series ? seriesIds[`${f.make}/${f.series}`] : null,
            engineCodeId: f.make && f.series && f.engine ? engineIds[`${f.make}/${f.series}/${f.engine}`] : null,
            axleBrand: f.axleBrand,
            yearFrom: f.yearFrom,
            yearTo: f.yearTo,
            chassisFrom: f.chassisFrom,
            chassisTo: f.chassisTo,
            position: f.position,
            note: f.note,
          })),
        },
      },
    });
    productIds[p.key] = created.id;
  }
  console.log(`   створено ${products.length} товарів`);

  console.log("→ пропозиції складів партнерів");
  const WAREHOUSES = [
    { warehouse: "Склад партнера", city: "Львів", lead: [1, 2], k: [0.94, 1.0] },
    { warehouse: "Склад партнера", city: "Одеса", lead: [2, 3], k: [0.92, 0.99] },
    { warehouse: "Склад у ЄС", city: "Польща", lead: [5, 8], k: [0.82, 0.92] },
  ];
  const offerRows: { productId: string; warehouse: string; city: string; qty: number; leadDays: number; price: Prisma.Decimal }[] = [];
  for (const p of products) {
    for (const w of WAREHOUSES) {
      if (rnd() < 0.45) continue;
      const k = w.k[0] + rnd() * (w.k[1] - w.k[0]);
      offerRows.push({
        productId: productIds[p.key], warehouse: w.warehouse, city: w.city, qty: int(1, 30),
        leadDays: int(w.lead[0], w.lead[1]), price: new Prisma.Decimal(Math.round((p.price * k) / 10) * 10),
      });
    }
  }
  await db.supplierOffer.createMany({ data: offerRows });
  console.log(`   ${offerRows.length} пропозицій`);

  const find = (pred: (p: SeedProduct) => boolean) => products.find(pred);
  const fitsSeries = (p: SeedProduct, make: string, series: string) =>
    p.fitments.some((f) => f.make === make && f.series === series);
  const oeOf = (p: SeedProduct) => (p.numbers.find((n) => n.type === "OE")?.number ?? p.article);

  console.log("→ користувачі");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const admin = await db.user.create({ data: { email: "admin@demo.ua", name: "Олександр Адмін", role: "ADMIN", passwordHash, phone: "+380670000001" } });
  const manager = await db.user.create({ data: { email: "manager@demo.ua", name: "Марина Менеджер", role: "MANAGER", passwordHash, phone: "+380670000002" } });
  const client = await db.user.create({
    data: {
      email: "client@demo.ua", name: "Петро Коваленко", role: "CUSTOMER", passwordHash, phone: "+380671234567",
      managerNote: "Власник 2 тягачів, їздить ЄС. Віддає перевагу оригіналу на гальма.",
      addresses: { create: [{ label: "Основна", city: "Житомир", branch: "Відділення №12", isDefault: true }] },
    },
  });
  const others = [];
  for (const [name, phone] of [
    ["Іван Мельник", "+380501112233"], ["ТОВ «Захід-Транс»", "+380632223344"], ["Олег Бондар", "+380973334455"],
    ["ФОП Савчук", "+380664445566"], ["Андрій Ткач", "+380935556677"],
  ]) {
    others.push(await db.user.create({ data: { name, phone, email: `${slugify(name)}@example.ua`, passwordHash } }));
  }

  console.log("→ гараж клієнта");
  const dafVin = buildVin("XLRTEH43", "G", "E", "512345");
  const manVin = buildVin("WMA06XZZ", "E", "W", "287654");
  const trailerVin = buildVin("WSM00000", "F", "0", "045678");
  const daf = await db.vehicle.create({
    data: {
      userId: client.id, kind: "TRACTOR", nickname: "Білий DAF", vin: dafVin, chassisNumber: dafVin.slice(11),
      makeId: makeIds.daf, seriesId: seriesIds["daf/xf-106"], engineCodeId: engineIds["daf/xf-106/MX-13"],
      year: 2016, euroClass: "Euro 6", gearbox: "ZF AS-Tronic 12AS2130", axleConfig: "4x2", cabType: "Super Space Cab",
      plate: "AM 1234 EX", mileageKm: 812_000, lastServiceKm: 690_000,
    },
  });
  const man = await db.vehicle.create({
    data: {
      userId: client.id, kind: "TRACTOR", nickname: "MAN Сірий", vin: manVin, chassisNumber: manVin.slice(11),
      makeId: makeIds.man, seriesId: seriesIds["man/tgx"], engineCodeId: engineIds["man/tgx/D2676 LF"],
      year: 2014, euroClass: "Euro 5", gearbox: "TipMatic 12", axleConfig: "4x2", cabType: "XLX",
      plate: "AM 5678 EX", mileageKm: 1_045_000, lastServiceKm: 960_000,
    },
  });
  const trailer = await db.vehicle.create({
    data: {
      userId: client.id, kind: "TRAILER", nickname: "Рефрижератор Schmitz", vin: trailerVin, chassisNumber: trailerVin.slice(11),
      makeId: makeIds["schmitz-cargobull"], seriesId: seriesIds["schmitz-cargobull/sko-cool"], year: 2015,
      axleBrand: "BPW", axleConfig: "3 осі", plate: "AM 9012 XF",
    },
  });

  console.log("→ замовлення");
  const allProducts = await db.product.findMany({ select: { id: true, name: true, article: true, price: true, brand: { select: { name: true } } } });
  const byId = new Map(allProducts.map((p) => [p.id, p]));

  async function createOrder(opts: {
    userId?: string; vehicleId?: string; status: OrderStatus; daysAgo: number; items: { productId: string; qty: number }[];
    contactName: string; contactPhone: string; city?: string; mileageKm?: number;
  }) {
    const items = opts.items.map((it) => {
      const p = byId.get(it.productId)!;
      return { productId: p.id, name: p.name, article: p.article, brandName: p.brand.name, price: p.price, qty: it.qty };
    });
    const total = items.reduce((s, i) => s.add(i.price.mul(i.qty)), new Prisma.Decimal(0));
    const createdAt = new Date(Date.now() - opts.daysAgo * 86400000 - int(0, 8) * 3600000);
    const flow: OrderStatus[] = ["NEW", "CONFIRMED", "PAID", "PACKED", "SHIPPED", "DELIVERED"];
    const idx = flow.indexOf(opts.status);
    const history = (idx >= 0 ? flow.slice(0, idx + 1) : ["NEW", opts.status]).map((s, i) => ({
      status: s as OrderStatus,
      byUserId: i === 0 ? opts.userId ?? null : manager.id,
      createdAt: new Date(createdAt.getTime() + i * 5 * 3600000),
    }));
    return db.order.create({
      data: {
        userId: opts.userId, vehicleId: opts.vehicleId, mileageKm: opts.mileageKm, status: opts.status,
        contactName: opts.contactName, contactPhone: opts.contactPhone,
        deliveryMethod: opts.city ? "novaposhta" : "pickup", deliveryCity: opts.city, deliveryBranch: opts.city ? `Відділення №${int(1, 60)}` : null,
        paymentMethod: opts.city ? "cash" : "card", total, createdAt,
        items: { create: items },
        history: { create: history },
      },
    });
  }

  const dafProducts = products.filter((p) => fitsSeries(p, "daf", "xf-106")).map((p) => productIds[p.key]);
  const manProducts = products.filter((p) => fitsSeries(p, "man", "tgx")).map((p) => productIds[p.key]);
  const trailerProductsIds = products.filter((p) => p.fitments.some((f) => f.axleBrand === "BPW")).map((p) => productIds[p.key]);
  const oil = productIds[find((p) => p.category === "motorni-olyvy")!.key];

  await createOrder({ userId: client.id, vehicleId: daf.id, status: "DELIVERED", daysAgo: 64, mileageKm: 760_000,
    items: [{ productId: dafProducts[0], qty: 1 }, { productId: dafProducts[2], qty: 1 }, { productId: oil, qty: 2 }],
    contactName: client.name!, contactPhone: client.phone!, city: "Житомир" });
  await createOrder({ userId: client.id, vehicleId: trailer.id, status: "SHIPPED", daysAgo: 6,
    items: [{ productId: trailerProductsIds[0], qty: 2 }, { productId: trailerProductsIds[1], qty: 2 }],
    contactName: client.name!, contactPhone: client.phone!, city: "Житомир" });
  await createOrder({ userId: client.id, vehicleId: man.id, status: "NEW", daysAgo: 0, mileageKm: 1_045_000,
    items: [{ productId: manProducts[3], qty: 1 }, { productId: manProducts[5], qty: 2 }],
    contactName: client.name!, contactPhone: client.phone!, city: "Житомир" });

  const statuses: OrderStatus[] = ["DELIVERED", "DELIVERED", "SHIPPED", "PAID", "CONFIRMED", "NEW", "NEW", "CANCELLED", "PACKED"];
  const pids = allProducts.map((p) => p.id);
  for (let i = 0; i < 22; i++) {
    const u = others[i % others.length];
    const n = int(1, 3);
    await createOrder({
      userId: i % 4 === 0 ? undefined : u.id,
      status: statuses[i % statuses.length],
      daysAgo: int(0, 29),
      items: Array.from({ length: n }, () => ({ productId: pids[int(0, pids.length - 1)], qty: int(1, 2) }))
        .filter((it, idx, arr) => arr.findIndex((x) => x.productId === it.productId) === idx),
      contactName: i % 4 === 0 ? "Гість Сергій" : u.name!,
      contactPhone: i % 4 === 0 ? "+380991234500" : u.phone!,
      city: i % 3 === 0 ? undefined : ["Львів", "Одеса", "Дніпро", "Рівне", "Вінниця"][i % 5],
    });
  }

  console.log("→ VIN-запити");
  const dafPads = find((p) => p.category === "kolodky-halmivni" && fitsSeries(p, "daf", "xf-106"))!;
  const dafFuel = find((p) => p.category === "filtry-palyvni" && fitsSeries(p, "daf", "xf-106"))!;
  const answered = await db.vinRequest.create({
    data: {
      userId: client.id, vehicleId: daf.id, vin: dafVin, status: "ANSWERED", assignedToId: manager.id,
      message: "Потрібні колодки передні і фільтр паливний. Плануємо ТО на наступному тижні.",
      createdAt: new Date(Date.now() - 3 * 86400000), answeredAt: new Date(Date.now() - 3 * 86400000 + 75 * 60000),
      messages: {
        create: [
          { authorId: client.id, text: "Потрібні колодки передні і фільтр паливний. Плануємо ТО на наступному тижні.", createdAt: new Date(Date.now() - 3 * 86400000) },
          { authorId: manager.id, isStaff: true, text: "Добрий день! Підібрала за вашим VIN: колодки на передню вісь і паливний фільтр. Обидві позиції є на складі. OE-номери збережено у картці вашого DAF — далі каталог показуватиме їх автоматично.", createdAt: new Date(Date.now() - 3 * 86400000 + 75 * 60000) },
        ],
      },
      items: {
        create: [
          { productId: productIds[dafPads.key], qty: 1, comment: "Комплект на вісь" },
          { productId: productIds[dafFuel.key], qty: 2, comment: "Рекомендую мати запасний" },
        ],
      },
    },
  });
  await db.vehicleOeNumber.createMany({
    data: [
      { vehicleId: daf.id, oeNumber: normalize(oeOf(dafPads)), label: "Колодки гальмівні передні", addedById: manager.id },
      { vehicleId: daf.id, oeNumber: normalize(oeOf(dafFuel)), label: "Фільтр паливний", addedById: manager.id },
    ],
  });
  await db.vinRequest.create({
    data: {
      userId: client.id, vehicleId: man.id, vin: manVin, status: "NEW",
      message: "Стукає кабіна на ямах — потрібні амортизатори кабіни задні, пара.",
      createdAt: new Date(Date.now() - 40 * 60000),
      messages: { create: [{ authorId: client.id, text: "Стукає кабіна на ямах — потрібні амортизатори кабіни задні, пара.", createdAt: new Date(Date.now() - 40 * 60000) }] },
    },
  });
  await db.vinRequest.create({
    data: {
      vin: buildVin("YV2RT40A", "D", "B", "654321"), guestName: "Віктор", guestPhone: "+380687776655", status: "NEW",
      message: "Volvo FH 2013, потрібен комплект зчеплення і вижимний.",
      createdAt: new Date(Date.now() - 3.5 * 3600000),
      messages: { create: [{ text: "Volvo FH 2013, потрібен комплект зчеплення і вижимний.", createdAt: new Date(Date.now() - 3.5 * 3600000) }] },
    },
  });
  console.log(`   відповідь на запит #${answered.number} з OE-номерами`);

  console.log("→ комплекти ТО");
  const kitDefs = [
    { name: "ТО-1 DAF XF 106 MX-13", make: "daf", series: "xf-106", engine: "MX-13", km: 150000 },
    { name: "ТО-1 MAN TGX D2676 LF", make: "man", series: "tgx", engine: "D2676 LF", km: 120000 },
    { name: "ТО-1 Volvo FH4 D13K", make: "volvo", series: "fh4", engine: "D13K", km: 150000 },
    { name: "ТО-1 Scania R-series DC13", make: "scania", series: "r-series", engine: "DC13", km: 120000 },
    { name: "ТО-1 Mercedes-Benz Actros MP4 OM471", make: "mercedes-benz", series: "actros-mp4", engine: "OM471", km: 150000 },
  ];
  for (const k of kitDefs) {
    const cats = ["filtry-olyvni", "filtry-palyvni", "filtry-povitriani", "remeni-ta-roliky"];
    const items = cats
      .map((c) => find((p) => p.category === c && fitsSeries(p, k.make, k.series) && p.brand !== "DAF"))
      .filter(Boolean) as SeedProduct[];
    await db.serviceKit.create({
      data: {
        name: k.name, slug: slugify(k.name), intervalKm: k.km,
        description: "Фільтри (оливний, паливний, повітряний), поліклиновий ремінь та моторна олива 10W-40 (2×20 л). Склад можна змінити в кошику.",
        makeId: makeIds[k.make], seriesId: seriesIds[`${k.make}/${k.series}`], engineCodeId: engineIds[`${k.make}/${k.series}/${k.engine}`],
        items: { create: [...items.map((p) => ({ productId: productIds[p.key], qty: 1 })), { productId: oil, qty: 2 }] },
      },
    });
  }

  const anyProduct = allProducts[5];
  await db.callbackRequest.createMany({
    data: [
      { name: "Микола", phone: "+380677770011", comment: "Порадьте колодки на Renault Premium", createdAt: new Date(Date.now() - 25 * 60000) },
      { name: "Юрій", phone: "+380503330022", kind: "quick-order", productId: anyProduct.id, comment: "Швидке замовлення: 1 шт.", createdAt: new Date(Date.now() - 2 * 3600000) },
    ],
  });

  console.log("→ контент і налаштування");
  for (const [key, value] of Object.entries(SETTINGS)) await db.setting.create({ data: { key, value } });
  await db.banner.createMany({ data: BANNERS });
  await db.page.createMany({ data: PAGES });
  await db.faq.createMany({ data: FAQ.map((f, i) => ({ ...f, sort: i })) });

  await db.importJob.create({
    data: {
      fileName: "price_knorr_2026-10.xlsx", status: "done", total: 48, created: 6, updated: 41, skipped: 1, byUserId: admin.id,
      mapping: { article: "Артикул", brand: "Бренд", price: "Ціна", stockQty: "Залишок" },
      errors: [{ row: 17, message: "Порожній артикул" }],
      createdAt: new Date(Date.now() - 2 * 86400000),
    },
  });
  await db.auditLog.createMany({
    data: [
      { userId: admin.id, action: "import", entity: "ImportJob", entityId: "price_knorr_2026-10.xlsx", diff: { created: 6, updated: 41 } },
      { userId: manager.id, action: "answer", entity: "VinRequest", entityId: answered.id, diff: { status: "ANSWERED" } },
    ],
  });

  console.log("✔ готово. Логін: admin@demo.ua / manager@demo.ua / client@demo.ua, пароль demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
