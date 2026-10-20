import type { OrderStatus, StockStatus, VehicleKind, VinRequestStatus, Role } from "@prisma/client";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  NEW: { label: "Нове", tone: "amber" },
  CONFIRMED: { label: "Підтверджено", tone: "blue" },
  AWAITING_PAYMENT: { label: "Очікує оплати", tone: "amber" },
  PAID: { label: "Оплачено", tone: "green" },
  PACKED: { label: "Зібрано", tone: "blue" },
  SHIPPED: { label: "Відправлено", tone: "blue" },
  DELIVERED: { label: "Отримано", tone: "green" },
  CANCELLED: { label: "Скасовано", tone: "red" },
  RETURNED: { label: "Повернення", tone: "red" },
};

export const VIN_STATUS: Record<VinRequestStatus, { label: string; tone: Tone }> = {
  NEW: { label: "Новий", tone: "amber" },
  IN_PROGRESS: { label: "В роботі", tone: "blue" },
  ANSWERED: { label: "Є відповідь", tone: "green" },
  CLOSED: { label: "Закрито", tone: "neutral" },
};

export const STOCK_STATUS: Record<StockStatus, { label: string; tone: Tone }> = {
  IN_STOCK: { label: "В наявності", tone: "green" },
  LOW: { label: "Закінчується", tone: "amber" },
  ON_ORDER: { label: "Під замовлення", tone: "blue" },
  OUT_OF_STOCK: { label: "Немає", tone: "red" },
};

export const VEHICLE_KIND: Record<VehicleKind, string> = {
  TRACTOR: "Тягач",
  TRUCK: "Вантажівка",
  TRAILER: "Напівпричіп",
  BUS: "Автобус",
};

export const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Клієнт",
  MANAGER: "Менеджер",
  ADMIN: "Адміністратор",
};

export type Tone = "green" | "amber" | "red" | "blue" | "neutral";

export const DELIVERY_METHODS = [
  { id: "pickup", label: "Самовивіз зі складу" },
  { id: "novaposhta", label: "Нова Пошта (відділення)" },
  { id: "novaposhta_courier", label: "Нова Пошта (кур'єр)" },
] as const;

export const PAYMENT_METHODS = [
  { id: "cash", label: "Готівка / накладений платіж" },
  { id: "card", label: "Карта онлайн (демо)" },
  { id: "invoice", label: "Рахунок для юрособи / ФОП" },
] as const;

export function deliveryLabel(id: string) {
  if (id === "phone") return "Уточнити телефоном (швидке замовлення)";
  return DELIVERY_METHODS.find((m) => m.id === id)?.label ?? id;
}
export function paymentLabel(id: string) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}
