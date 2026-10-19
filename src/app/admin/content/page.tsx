import { adminContent } from "@/server/services/admin/content";
import { ContentManager } from "@/components/admin/content-manager";
import { PageHeader } from "@/components/shared/misc";

export const metadata = { title: "Контент" };

export default async function ContentPage() {
  const data = await adminContent();
  return (
    <div className="max-w-5xl">
      <PageHeader title="Контент" description="Банери головної, інформаційні сторінки, питання та відповіді" />
      <ContentManager {...data} />
    </div>
  );
}
