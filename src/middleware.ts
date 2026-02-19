import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname || "/");

  const pathname = request.nextUrl.pathname || "/";
  const segments = pathname.split("/").filter(Boolean);

  const isAllowedBasePath =
    pathname === "/" ||
    pathname === "/template" ||
    pathname.startsWith("/template/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/sitemap-0.xml";

  // This app is dedicated to vendor template routes only.
  if (!isAllowedBasePath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  // Slug preview route: /template/:vendor_id/preview/:template_key/:path*
  // Internally serve from existing template routes without query params.
  if (
    segments[0] === "template" &&
    segments[1] &&
    segments[2] === "preview" &&
    segments[3]
  ) {
    const vendorId = segments[1];
    const rest = segments.slice(4).join("/");
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/template/${vendorId}${rest ? `/${rest}` : ""}`;

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // While browsing in preview mode, keep slug context if links point to non-preview paths.
  if (segments[0] === "template" && segments[1] && segments[2] !== "preview") {
    const vendorId = segments[1];
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererSegments = refererUrl.pathname.split("/").filter(Boolean);
        const inPreviewContext =
          refererSegments[0] === "template" &&
          refererSegments[1] === vendorId &&
          refererSegments[2] === "preview" &&
          refererSegments[3];

        if (inPreviewContext) {
          const templateKey = refererSegments[3];
          const rest = segments.slice(2).join("/");
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/template/${vendorId}/preview/${templateKey}${
            rest ? `/${rest}` : ""
          }`;
          return NextResponse.redirect(redirectUrl);
        }
      } catch {
        // ignore invalid referer
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap-0.xml|.*\\..*).*)",
  ],
};

