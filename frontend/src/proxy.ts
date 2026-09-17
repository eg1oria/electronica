import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/admin/constants";

/**
 * Быстрая проверка: без cookie сессии — сразу на вход.
 * Настоящая проверка токена — в requireUser() на сервере.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(TOKEN_COOKIE);

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }
  if (!hasToken) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
