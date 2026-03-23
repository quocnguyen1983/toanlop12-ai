import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const email = req.cookies.get("user_email")?.value

  // Bảo vệ route admin
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (email !== "relaxchanel24.7@gmail.com") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}
export const config = {
  matcher: ["/admin/:path*"],
}