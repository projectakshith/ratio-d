import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("ratio_session");
  const { pathname } = request.nextUrl;

  const isPublicPage = 
    pathname === "/login" || 
    pathname === "/onboarding" || 
    pathname === "/setup" || 
    pathname === "/~offline";

  if (!hasSession && !isPublicPage) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (hasSession && (pathname === "/login" || pathname === "/setup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/attendance",
    "/marks",
    "/timetable",
    "/calendar",
    "/login",
    "/setup",
    "/onboarding"
  ],
};
