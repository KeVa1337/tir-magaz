import "server-only";
import { cache } from "react";
import { getSessionUser } from "@/server/auth/guards";
import { getVehicleContext } from "@/server/services/fitment";

/** Користувач + контекст «Моє авто» для поточного запиту (кешується в межах рендеру). */
export const getShopContext = cache(async () => {
  const user = await getSessionUser();
  const ctx = await getVehicleContext(user?.id);
  return { user, ctx };
});
