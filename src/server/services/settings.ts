import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export interface GeneralSettings {
  name: string; tagline: string; phone: string; phone2?: string; email: string; address: string; schedule: string; telegram?: string;
}
export interface CommerceSettings {
  currency: string; eurRate: number; defaultMarkupPercent: number; freeShippingFrom: number;
  deliveryMethods: string[]; paymentMethods: string[];
}
export interface VinSettings { slaHours: number; notifyEmail: string }
export interface NotificationSettings { orderEmail: string; sendCustomerEmails: boolean }

export interface ShopSettings {
  general: GeneralSettings;
  commerce: CommerceSettings;
  vin: VinSettings;
  notifications: NotificationSettings;
  synonyms: string[][];
}

const DEFAULTS: ShopSettings = {
  general: { name: "TIR Parts", tagline: "Запчастини для тягачів і напівпричепів", phone: "", email: "", address: "", schedule: "" },
  commerce: { currency: "UAH", eurRate: 45, defaultMarkupPercent: 25, freeShippingFrom: 5000, deliveryMethods: ["pickup", "novaposhta", "novaposhta_courier"], paymentMethods: ["cash", "card", "invoice"] },
  vin: { slaHours: 2, notifyEmail: "" },
  notifications: { orderEmail: "", sendCustomerEmails: true },
  synonyms: [],
};

export const SETTING_KEYS = {
  general: "shop.general",
  commerce: "shop.commerce",
  vin: "shop.vin",
  notifications: "shop.notifications",
  synonyms: "search.synonyms",
} as const;

export const getSettings = cache(async (): Promise<ShopSettings> => {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const obj = <T,>(key: string, def: T): T => ({ ...def, ...((map.get(key) as object) ?? {}) }) as T;
  return {
    general: obj(SETTING_KEYS.general, DEFAULTS.general),
    commerce: obj(SETTING_KEYS.commerce, DEFAULTS.commerce),
    vin: obj(SETTING_KEYS.vin, DEFAULTS.vin),
    notifications: obj(SETTING_KEYS.notifications, DEFAULTS.notifications),
    synonyms: (map.get(SETTING_KEYS.synonyms) as string[][]) ?? DEFAULTS.synonyms,
  };
});

export async function getSetting<T>(key: string): Promise<T | null> {
  const row = await db.setting.findUnique({ where: { key } });
  return (row?.value as T) ?? null;
}

export async function setSetting(key: string, value: Prisma.InputJsonValue) {
  return db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}
