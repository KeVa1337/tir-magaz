import { getSessionUser } from "@/server/auth/guards";
import { DemoPanel } from "./demo-panel";

export async function DemoPanelServer() {
  if (process.env.DEMO_MODE !== "true") return null;
  const user = await getSessionUser();
  const role = !user ? "guest" : user.role === "ADMIN" ? "admin" : user.role === "MANAGER" ? "manager" : "client";
  return <DemoPanel role={role} />;
}
