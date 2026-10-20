import type { Metadata } from "next";
import { SavedLists } from "@/components/shop/saved-lists";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";

export const metadata: Metadata = { title: "Обране", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Обране" }]} />
      <PageHeader title="Обране і переглянуті" description="Зберігається в цьому браузері — без реєстрації" />
      <SavedLists />
    </div>
  );
}
