import "server-only";
import { db } from "@/server/db";
import { LocalVinProvider } from "./local-provider";
import type { DecodedVin, VinProvider, WmiEntry } from "./types";

async function loadWmiTable(): Promise<WmiEntry[]> {
  const makes = await db.vehicleMake.findMany({ select: { id: true, name: true, kind: true, wmiCodes: true } });
  return makes.flatMap((m) => m.wmiCodes.map((code) => ({ code, makeId: m.id, make: m.name, kind: m.kind })));
}

/** Провайдери викликаються по черзі; 🟡 TecDocVinProvider додається сюди після підключення ліцензії. */
const providers: VinProvider[] = [new LocalVinProvider(loadWmiTable)];

export const VinService = {
  async decode(vin: string): Promise<DecodedVin> {
    let best: DecodedVin | null = null;
    for (const p of providers) {
      const res = await p.decode(vin);
      if (!res) continue;
      if (!best || rank(res) > rank(best)) best = res;
      if (res.confidence === "high") break;
    }
    return best!;
  },
};

function rank(d: DecodedVin) {
  return { low: 0, medium: 1, high: 2 }[d.confidence];
}
