import { getSessionUser, hasRole } from "@/server/auth/guards";

const SAMPLE = `Артикул;Бренд;Назва;Ціна;Закупівля;Залишок;Категорія;OE
HU 1381 x;Mann-Filter;Фільтр оливний DAF XF 106 MX-13;890;610;12;Фільтри оливні;1643070
K012345;Knorr-Bremse;Колодки гальмівні дискові (к-т) MAN TGX;;3100;4;Колодки гальмівні;81.50820-6075
NEW-001;Новий Бренд;Тестовий товар з імпорту;1500;;0;;
`;

export async function GET() {
  if (!hasRole(await getSessionUser(), "ADMIN")) return new Response("Forbidden", { status: 403 });
  return new Response("﻿" + SAMPLE.replace(/;/g, ","), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="tir-import-sample.csv"' },
  });
}
