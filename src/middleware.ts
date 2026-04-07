import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Login redirect if already logged in
    if (token && path === "/login") {
      // If they are an admin, maybe send them to /admin. Otherwise to /
      if (token.role === "GLOBAL_ADMIN" || token.isLocalAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Determine path scopes
    const isPublicPath = path === "/" || path === "/login" || path.startsWith("/api");
    const isAdminPath = path.startsWith("/admin");

    // Block non-logged-in users from hitting dynamic organization paths (e.g., /[slug])
    if (!token && !isPublicPath && !isAdminPath) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    
    // Only GLOBAL_ADMIN and LocalAdmins can access actual /admin paths
    if (token && isAdminPath && !(token.role === "GLOBAL_ADMIN" || token.isLocalAdmin)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true // Allow middleware body to manually construct tailored redirects
    }
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads|favicon.ico).*)"],
};
