export const IMPORT_FIELDS = [
  { key: "article", label: "Артикул", required: true },
  { key: "brand", label: "Бренд виробника", required: true },
  { key: "name", label: "Назва" },
  { key: "price", label: "Ціна роздрібна" },
  { key: "purchasePrice", label: "Ціна закупівлі" },
  { key: "oldPrice", label: "Стара ціна" },
  { key: "stockQty", label: "Залишок, шт." },
  { key: "leadTimeDays", label: "Термін постачання, дн." },
  { key: "category", label: "Категорія (назва або slug)" },
  { key: "oe", label: "OE-номери (через кому)" },
  { key: "cross", label: "Крос-номери (через кому)" },
  { key: "description", label: "Опис" },
  { key: "weightKg", label: "Вага, кг" },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];
export type Mapping = Partial<Record<ImportField, string>>;
export interface ImportOptions { createBrands: boolean; createProducts: boolean; defaultCategoryId?: string; applyMarkup: boolean }
export interface MappingTemplate { name: string; mapping: Mapping }
