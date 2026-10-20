import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/guards";
import { getVehicleContext } from "@/server/services/fitment";
import { productsByIds } from "@/server/services/catalog";

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter((x) => /^[a-z0-9]{10,40}$/i.test(x)).slice(0, 100);
  if (!ids.length) return NextResponse.json([]);
  const user = await getSessionUser();
  return NextResponse.json(await productsByIds(ids, await getVehicleContext(user?.id)));
}
