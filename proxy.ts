import { NextResponse, type NextRequest } from "next/server";

/* Next 16 renamed the middleware convention to `proxy`.
 *
 * This is a coarse gate only: it redirects anyone without a session cookie
 * away from /dashboard so they get the login page instead of a flash of the
 * app. It deliberately does not decide authorisation — the cookie is not
 * verified here. Every route handler and server component calls getSession()
 * and scopes its queries by org, so a forged cookie gets an unauthenticated
 * result rather than someone else's data. */
export function proxy(request: NextRequest) {
  const hasCookie = request.cookies.has("bontraco_session");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/dashboard" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
