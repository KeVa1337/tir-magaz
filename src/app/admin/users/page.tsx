import { requireRole } from "@/server/auth/guards";
import { adminListStaff } from "@/server/services/users";
import { UsersManager } from "@/components/admin/users-manager";
import { PageHeader } from "@/components/shared/misc";

export const metadata = { title: "Співробітники" };

export default async function UsersPage() {
  const me = await requireRole("ADMIN", undefined, "/admin?denied=1");
  const staff = await adminListStaff();
  return (
    <div className="max-w-4xl">
      <PageHeader title="Співробітники і ролі" />
      <UsersManager meId={me.id} users={staff.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt.toISOString() }))} />
    </div>
  );
}
