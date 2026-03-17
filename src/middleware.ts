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
  "website",
]);

const normalizeSlug = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeWebsiteIdentifier = (value?: string) => String(value || "").trim();

const buildTemplatePathWithContext = ({
  vendorId,
  isPreview = false,
  templateKey = "",
  citySlug = "all",
  websiteIdentifier = "",
  rest = "",
}: {
  vendorId: string;
  isPreview?: boolean;
  templateKey?: string;
  citySlug?: string;
  websiteIdentifier?: string;
  rest?: string;
}) => {
  const normalizedCity = normalizeSlug(citySlug) || "all";
  const normalizedWebsite = normalizeWebsiteIdentifier(websiteIdentifier);
  const normalizedRest = String(rest || "").replace(/^\/+/, "");
  const cityPart = `/${normalizedCity}`;
  const websitePart = normalizedWebsite
    ? `/website/${encodeURIComponent(normalizedWebsite)}`
    : "";
  const restPart = normalizedRest ? `/${normalizedRest}` : "";

  if (isPreview && templateKey) {
    return `/template/${vendorId}/preview/${templateKey}${cityPart}${websitePart}${restPart}`;
  }

  return `/template/${vendorId}${cityPart}${websitePart}${restPart}`;
};

const getPreviewContext = (segments: string[]) => {
  if (!(segments[0] === "template" && segments[1] && segments[2] === "preview" && segments[3])) {
    return null;
  }

  let index = 4;
  const candidateCity = normalizeSlug(segments[index]);
  const hasCity = Boolean(candidateCity && !KNOWN_TEMPLATE_SEGMENTS.has(candidateCity));
  const citySlug = hasCity ? candidateCity : "all";
  if (hasCity) index += 1;

  const hasWebsite = segments[index] === "website" && Boolean(segments[index + 1]);
  const websiteIdentifier = hasWebsite
    ? normalizeWebsiteIdentifier(segments[index + 1])
    : "";
  if (hasWebsite) index += 2;

  return {
    templateKey: segments[3],
    citySlug,
    websiteIdentifier,
    restSegments: segments.slice(index),
    hasCity,
    hasWebsite,
  };
};

const getStandardTemplateContext = (segments: string[]) => {
  if (!(segments[0] === "template" && segments[1] && segments[2] && segments[2] !== "preview")) {
    return null;
  }

  let index = 2;
  const candidateCity = normalizeSlug(segments[index]);
  const hasCity = Boolean(candidateCity && !KNOWN_TEMPLATE_SEGMENTS.has(candidateCity));
  const citySlug = hasCity ? candidateCity : "all";
  if (hasCity) index += 1;

  const hasWebsite = segments[index] === "website" && Boolean(segments[index + 1]);
  const websiteIdentifier = hasWebsite
    ? normalizeWebsiteIdentifier(segments[index + 1])
    : "";
  if (hasWebsite) index += 2;

  return {
    citySlug,
    websiteIdentifier,
    restSegments: segments.slice(index),
    hasCity,
    hasWebsite,
  };
};

const getWebsiteIdentifierFromUrl = (url: URL) => {
  const segments = url.pathname.split("/").filter(Boolean);
  const previewContext = getPreviewContext(segments);
  if (previewContext?.websiteIdentifier) {
    return previewContext.websiteIdentifier;
  }

  const standardContext = getStandardTemplateContext(segments);
  if (standardContext?.websiteIdentifier) {
    return standardContext.websiteIdentifier;
  }

  return normalizeWebsiteIdentifier(
    url.searchParams.get("website") || url.searchParams.get("website_id") || ""
  );
};

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname || "/");

  const pathname = request.nextUrl.pathname || "/";
  const segments = pathname.split("/").filter(Boolean);
  const requestPreviewContext = getPreviewContext(segments);
  const requestStandardContext = getStandardTemplateContext(segments);
  const requestWebsiteIdentifier = getWebsiteIdentifierFromUrl(request.nextUrl);

  if (requestWebsiteIdentifier) {
    requestHeaders.set("x-template-website", requestWebsiteIdentifier);
  }

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

  if (!isAllowedBasePath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  if (requestPreviewContext) {
    const vendorId = segments[1];
    const rest = requestPreviewContext.restSegments.join("/");
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/template/${vendorId}${rest ? `/${rest}` : ""}`;
    requestHeaders.set("x-template-city", requestPreviewContext.citySlug || "all");
    requestHeaders.set("x-template-preview", requestPreviewContext.templateKey);
    if (requestPreviewContext.websiteIdentifier) {
      requestHeaders.set("x-template-website", requestPreviewContext.websiteIdentifier);
    }

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (
    requestStandardContext &&
    (requestStandardContext.hasCity || requestStandardContext.hasWebsite)
  ) {
    const vendorId = segments[1];
    const rest = requestStandardContext.restSegments.join("/");
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/template/${vendorId}${rest ? `/${rest}` : ""}`;
    requestHeaders.set("x-template-city", requestStandardContext.citySlug || "all");
    if (requestStandardContext.websiteIdentifier) {
      requestHeaders.set("x-template-website", requestStandardContext.websiteIdentifier);
    }

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (segments[0] === "template" && segments[1] && segments[2] !== "preview") {
    const vendorId = segments[1];
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererSegments = refererUrl.pathname.split("/").filter(Boolean);
        const refererPreviewContext =
          refererSegments[0] === "template" && refererSegments[1] === vendorId
            ? getPreviewContext(refererSegments)
            : null;
        const refererStandardContext =
          refererSegments[0] === "template" && refererSegments[1] === vendorId
            ? getStandardTemplateContext(refererSegments)
            : null;

        if (refererPreviewContext?.templateKey) {
          const currentContext = requestStandardContext;
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = buildTemplatePathWithContext({
            vendorId,
            isPreview: true,
            templateKey: refererPreviewContext.templateKey,
            citySlug: currentContext?.hasCity
              ? currentContext.citySlug
              : refererPreviewContext.citySlug,
            websiteIdentifier: currentContext?.hasWebsite
              ? currentContext.websiteIdentifier
              : refererPreviewContext.websiteIdentifier,
            rest: currentContext?.restSegments.join("/") || segments.slice(2).join("/"),
          });
          return NextResponse.redirect(redirectUrl);
        }

        if (refererStandardContext && (refererStandardContext.hasCity || refererStandardContext.hasWebsite)) {
          const currentContext = requestStandardContext;
          const mergedCitySlug = currentContext?.hasCity
            ? currentContext.citySlug
            : refererStandardContext.citySlug;
          const mergedWebsiteIdentifier = currentContext?.hasWebsite
            ? currentContext.websiteIdentifier
            : refererStandardContext.websiteIdentifier;
          const rest = currentContext?.restSegments.join("/") || segments.slice(2).join("/");
          const nextPath = buildTemplatePathWithContext({
            vendorId,
            citySlug: mergedCitySlug,
            websiteIdentifier: mergedWebsiteIdentifier,
            rest,
          });

          if (nextPath !== pathname) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = nextPath;
            return NextResponse.redirect(redirectUrl);
          }
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
