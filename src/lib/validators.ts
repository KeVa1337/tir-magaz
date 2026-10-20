import { z } from "zod";

const optStr = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();
const optInt = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(String(v).replace(/\s/g, ""))),
  z.number().int().nonnegative().optional(),
);
const phone = z
  .string()
  .trim()
  .min(10, "Вкажіть телефон у форматі +380…")
  .regex(/^[+\d\s()-]{10,20}$/, "Некоректний номер телефону");

export const loginSchema = z.object({
  email: z.email("Некоректний email").trim(),
  password: z.string().min(1, "Введіть пароль"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть ім'я"),
  email: z.email("Некоректний email").trim(),
  phone: phone.optional().or(z.literal("")),
  password: z.string().min(8, "Мінімум 8 символів"),
});

export const vehicleKinds = ["TRACTOR", "TRUCK", "TRAILER", "BUS"] as const;

export const vehicleSchema = z.object({
  kind: z.enum(vehicleKinds),
  nickname: optStr,
  vin: optStr,
  chassisNumber: optStr,
  makeId: optStr,
  seriesId: optStr,
  engineCodeId: optStr,
  year: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1980, "Рік від 1980").max(new Date().getFullYear() + 1, "Рік з майбутнього").optional(),
  ),
  euroClass: optStr,
  gearbox: optStr,
  axleConfig: optStr,
  cabType: optStr,
  axleBrand: optStr,
  plate: optStr,
  mileageKm: optInt,
  lastServiceKm: optInt,
});

export const checkoutSchema = z
  .object({
    contactName: z.string().trim().min(2, "Вкажіть ім'я та прізвище"),
    contactPhone: phone,
    contactEmail: z.email("Некоректний email").optional().or(z.literal("")),
    deliveryMethod: z.enum(["pickup", "novaposhta", "novaposhta_courier"]),
    deliveryCity: optStr,
    deliveryBranch: optStr,
    deliveryAddress: optStr,
    paymentMethod: z.enum(["cash", "card", "invoice"]),
    vehicleId: optStr,
    mileageKm: optInt,
    comment: optStr,
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod !== "pickup" && !v.deliveryCity)
      ctx.addIssue({ code: "custom", path: ["deliveryCity"], message: "Вкажіть місто" });
    if (v.deliveryMethod === "novaposhta" && !v.deliveryBranch)
      ctx.addIssue({ code: "custom", path: ["deliveryBranch"], message: "Вкажіть відділення" });
    if (v.deliveryMethod === "novaposhta_courier" && !v.deliveryAddress)
      ctx.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Вкажіть адресу" });
  });

export const vinRequestSchema = z.object({
  vehicleId: optStr,
  vin: optStr,
  guestName: optStr,
  guestPhone: optStr,
  message: z.string().trim().min(5, "Опишіть, які деталі потрібні"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть ім'я"),
  phone: phone.optional().or(z.literal("")),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Введіть поточний пароль"),
    next: z.string().min(8, "Мінімум 8 символів"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Паролі не збігаються" });

export const addressSchema = z.object({
  label: optStr,
  city: z.string().trim().min(2, "Вкажіть місто"),
  branch: optStr,
  street: optStr,
  isDefault: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

const money = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(String(v).replace(",", ".").replace(/\s/g, ""))),
  z.number().nonnegative("Ціна не може бути від'ємною").optional(),
);

export const productSchema = z.object({
  name: z.string().trim().min(3, "Вкажіть назву"),
  article: z.string().trim().min(1, "Вкажіть артикул"),
  sku: optStr,
  slug: optStr,
  brandId: z.string().min(1, "Оберіть бренд"),
  categoryId: z.string().min(1, "Оберіть категорію"),
  description: optStr,
  price: money.refine((v) => v !== undefined, "Вкажіть ціну"),
  oldPrice: money,
  purchasePrice: money,
  stockQty: optInt,
  stockStatus: z.enum(["IN_STOCK", "LOW", "ON_ORDER", "OUT_OF_STOCK"]),
  leadTimeDays: optInt,
  weightKg: money,
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  isPopular: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  isUniversal: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  seoTitle: optStr,
  seoDescription: optStr,
});

export const fitmentSchema = z
  .object({
    makeId: optStr,
    seriesId: optStr,
    engineCodeId: optStr,
    axleBrand: optStr,
    yearFrom: optInt,
    yearTo: optInt,
    chassisFrom: optStr,
    chassisTo: optStr,
    position: optStr,
    note: optStr,
  })
  .refine((v) => v.makeId || v.axleBrand, { path: ["makeId"], message: "Вкажіть марку або марку осі" });

export type FieldErrors = Record<string, string[] | undefined>;
export type ActionState = { ok?: boolean; error?: string; message?: string; fieldErrors?: FieldErrors; data?: unknown };

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export function fieldErrorsOf(err: z.ZodError): FieldErrors {
  return z.flattenError(err).fieldErrors as FieldErrors;
}
