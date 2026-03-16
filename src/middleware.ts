import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const KNOWN_TEMPLATE_SEGMENTS = new Set([
  "",
  "about",
  "all-products",
  "cart",
  "category",
  "checkout",
  "contact",
  "login",
  "orders",
  "page",
  "preview",
  "product",
  "profile",
  "register",
  "subcategory",
]);

const normalizeSlug = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeWebsiteId = (value?: string) => String(value || "").trim();

const getWebsiteIdFromUrl = (url: URL) =>
  normalizeWebsiteId(url.searchParams.get("website") || url.searchParams.get("website_id") || "");

const getPreviewContext = (segments: string[]) => {
  if (!(segments[0] === "template" && segments[1] && segments[2] === "preview" && segments[3])) {
    return null;
  }

  const templateKey = segments[3];
  const candidateCity = normalizeSlug(segments[4]);
  const hasCity = Boolean(candidateCity && !KNOWN_TEMPLATE_SEGMENTS.has(candidateCity));
  const citySlug = hasCity ? candidateCity : "all";
  const restIndex = hasCity ? 5 : 4;
  const restSegments = segments.slice(restIndex);

  return { templateKey, citySlug, restSegments, hasCity };
};

const getCityFromStandardTemplatePath = (segments: string[]) => {
  if (!(segments[0] === "template" && segments[1] && segments[2] && segments[2] !== "preview")) {
    return null;
  }

  const city = normalizeSlug(segments[2]);
  if (!city || KNOWN_TEMPLATE_SEGMENTS.has(city)) return null;
  return city;
};

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname || "/");
  const requestWebsiteId = getWebsiteIdFromUrl(request.nextUrl);
  if (requestWebsiteId) {
    requestHeaders.set("x-template-website", requestWebsiteId);
  }

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
    const previewContext = getPreviewContext(segments);
    const citySlug = previewContext?.citySlug || "all";
    const rest = previewContext?.restSegments?.join("/") || "";
    const vendorId = segments[1];
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/template/${vendorId}${rest ? `/${rest}` : ""}`;
    requestHeaders.set("x-template-city", citySlug);
    requestHeaders.set("x-template-preview", segments[3]);

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // City-aware template route: /template/:vendor_id/:city/:path*
  // Rewrite to existing route tree and pass city through headers.
  if (segments[0] === "template" && segments[1] && segments[2] && segments[2] !== "preview") {
    const citySlug = getCityFromStandardTemplatePath(segments);
    if (citySlug) {
      const vendorId = segments[1];
      const rest = segments.slice(3).join("/");
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/template/${vendorId}${rest ? `/${rest}` : ""}`;
      requestHeaders.set("x-template-city", citySlug);

      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // While browsing in preview mode, keep slug context if links point to non-preview paths.
  if (segments[0] === "template" && segments[1] && segments[2] !== "preview") {
    const vendorId = segments[1];
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererSegments = refererUrl.pathname.split("/").filter(Boolean);
        const refererWebsiteId = getWebsiteIdFromUrl(refererUrl);
        const previewContext =
          refererSegments[0] === "template" && refererSegments[1] === vendorId
            ? getPreviewContext(refererSegments)
            : null;

        if (previewContext?.templateKey) {
          const rest = segments.slice(2).join("/");
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/template/${vendorId}/preview/${previewContext.templateKey}/${previewContext.citySlug}${
            rest ? `/${rest}` : ""
          }`;
          if (!requestWebsiteId && refererWebsiteId) {
            redirectUrl.searchParams.set("website", refererWebsiteId);
          }
          return NextResponse.redirect(redirectUrl);
        }

        // Non-preview city context preservation.
        const refererCity =
          refererSegments[0] === "template" && refererSegments[1] === vendorId
            ? getCityFromStandardTemplatePath(refererSegments)
            : null;
        const requestCity = getCityFromStandardTemplatePath(segments);
        if (refererCity && !requestCity) {
          const rest = segments.slice(2).join("/");
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/template/${vendorId}/${refererCity}${rest ? `/${rest}` : ""}`;
          if (!requestWebsiteId && refererWebsiteId) {
            redirectUrl.searchParams.set("website", refererWebsiteId);
          }
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

