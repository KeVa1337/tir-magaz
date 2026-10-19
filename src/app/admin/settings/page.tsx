import { requireRole } from "@/server/auth/guards";
import { getSettings } from "@/server/services/settings";
import { SettingsForms } from "@/components/admin/settings-forms";
import { PageHeader } from "@/components/shared/misc";

export const metadata = { title: "Налаштування" };

export default async function SettingsPage() {
  await requireRole("ADMIN", undefined, "/admin?denied=1");
  const s = await getSettings();
  return (
    <div>
      <PageHeader title="Налаштування магазину" />
      <SettingsForms s={s} />
    </div>
  );
}
