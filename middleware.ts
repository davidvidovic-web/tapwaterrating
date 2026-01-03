import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth?: any }) => {
  const { pathname } = req.nextUrl;
  
  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user has admin role
    if (req.auth?.user?.role !== "admin") {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"]
};