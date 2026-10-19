import { requireRole } from "@/server/auth/guards";
import { getProfile } from "@/server/services/users";
import { Addresses, PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { PageHeader } from "@/components/shared/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Профіль" };

export default async function ProfilePage() {
  const user = await requireRole("CUSTOMER");
  const p = await getProfile(user.id);
  return (
    <>
      <PageHeader title="Профіль" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Особисті дані</CardTitle></CardHeader><CardContent><ProfileForm name={p.name ?? ""} phone={p.phone ?? ""} email={p.email ?? ""} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Пароль</CardTitle></CardHeader><CardContent><PasswordForm /></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Адреси доставки</CardTitle></CardHeader><CardContent><Addresses items={p.addresses} /></CardContent></Card>
      </div>
    </>
  );
}
