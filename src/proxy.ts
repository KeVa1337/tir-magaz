import { NextResponse, type NextRequest } from "next/server";

/**
 * Оптимістична перевірка: без cookie сесії — одразу на сторінку входу.
 * Справжня перевірка ролей — у layout'ах через requireRole().
 */
export function proxy(req: NextRequest) {
  const hasSession =
    req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };
