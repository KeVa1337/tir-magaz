import { notFound } from "next/navigation";
import { getPage } from "@/server/services/catalog";
import { getSettings } from "@/server/services/settings";
import { Breadcrumbs, RichText } from "@/components/shared/misc";

export async function StaticPage({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: page.title }]} />
      <h1 className="mb-6 text-3xl font-extrabold">{page.title}</h1>
      <RichText content={page.content} />
      {children}
    </div>
  );
}

export async function staticMeta(slug: string) {
  const page = await getPage(slug);
  return page ? { title: page.title, description: page.content.replace(/[#*>-]/g, "").slice(0, 160) } : {};
}

export async function ContactsBlock() {
  const { general } = await getSettings();
  return (
    <dl className="mt-8 grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2">
      <div><dt className="text-xs text-muted-foreground uppercase">Телефон</dt><dd className="font-num text-lg font-bold"><a href={`tel:${general.phone.replace(/\s/g, "")}`}>{general.phone}</a></dd></div>
      {general.phone2 && <div><dt className="text-xs text-muted-foreground uppercase">Додатковий</dt><dd className="font-num text-lg font-bold"><a href={`tel:${general.phone2.replace(/\s/g, "")}`}>{general.phone2}</a></dd></div>}
      <div><dt className="text-xs text-muted-foreground uppercase">Email</dt><dd className="font-semibold"><a href={`mailto:${general.email}`}>{general.email}</a></dd></div>
      {general.telegram && <div><dt className="text-xs text-muted-foreground uppercase">Telegram</dt><dd className="font-semibold">{general.telegram}</dd></div>}
      <div><dt className="text-xs text-muted-foreground uppercase">Графік</dt><dd className="font-semibold">{general.schedule}</dd></div>
      <div><dt className="text-xs text-muted-foreground uppercase">Адреса складу</dt><dd className="font-semibold">{general.address}</dd></div>
    </dl>
  );
}
