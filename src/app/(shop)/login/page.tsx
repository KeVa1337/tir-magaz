import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/guards";
import { LoginForm } from "@/components/auth/forms";
import { first, type SP } from "@/lib/search-params";

export const metadata: Metadata = { title: "Вхід", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = (await searchParams) as SP;
  const callbackUrl = first(sp.callbackUrl);
  const user = await getSessionUser();
  if (user) redirect(callbackUrl?.startsWith("/") ? callbackUrl : user.role === "CUSTOMER" ? "/account" : "/admin");
  return (
    <div className="bg-grid mx-auto grid max-w-7xl place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-extrabold">Вхід у кабінет</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Гараж ваших авто, історія замовлень і VIN-запити</p>
        <LoginForm callbackUrl={callbackUrl} demo={process.env.DEMO_MODE === "true"} />
      </div>
    </div>
  );
}
