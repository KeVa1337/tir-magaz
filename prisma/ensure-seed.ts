/**
 * Для хостингу без терміналу: якщо база порожня — заповнюємо демо-даними.
 * Повторні розгортання дані не чіпають. Примусово: SEED_DEMO=force.
 */
import { PrismaClient } from "@prisma/client";

async function run() {
  const db = new PrismaClient();
  const products = await db.product.count();
  await db.$disconnect();
  if (products > 0 && process.env.SEED_DEMO !== "force") {
    console.log(`✔ база вже має дані (${products} товарів) — seed пропущено`);
    return;
  }
  console.log("→ база порожня — заповнюю демо-даними");
  await import("./seed");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
