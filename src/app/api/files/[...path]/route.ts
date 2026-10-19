import { readUpload } from "@/server/services/uploads";

export async function GET(_req: Request, ctx: RouteContext<"/api/files/[...path]">) {
  const { path } = await ctx.params;
  const file = await readUpload(path);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": file.type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
