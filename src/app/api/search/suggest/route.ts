import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/guards";
import { getVehicleContext } from "@/server/services/fitment";
import { autocomplete } from "@/server/services/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json(null);
  const user = await getSessionUser();
  return NextResponse.json(await autocomplete(q, await getVehicleContext(user?.id)));
}
