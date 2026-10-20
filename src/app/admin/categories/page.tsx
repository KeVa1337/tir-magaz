import { adminCategoryTree } from "@/server/services/admin/catalog";
import { CategoryTree } from "@/components/admin/category-tree";
import { PageHeader } from "@/components/shared/misc";

export const metadata = { title: "Категорії" };

export default async function CategoriesPage() {
  const tree = await adminCategoryTree();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Категорії" description="Перетягуйте за ручку, щоб змінити порядок. Порядок зберігається одразу." />
      <CategoryTree tree={tree} />
    </div>
  );
}
