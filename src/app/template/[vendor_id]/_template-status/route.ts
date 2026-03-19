import { headers } from "next/headers";
import { NextResponse } from "next/server";

const normalizeValue = (value?: string | null) => String(value || "").trim();

const normalizeHostname = (value?: string | null) =>
  normalizeValue(value).toLowerCase().replace(/:\d+$/, "").replace(/\.+$/, "");

export async function GET(
  _request: Request,
  context: { params: Promise<{ vendor_id: string }> }
) {
  const params = await context.params;
  const headerStore = await headers();

  const vendorId =
    normalizeValue(headerStore.get("x-template-vendor")) ||
    normalizeValue(params?.vendor_id);
  const websiteId = normalizeValue(headerStore.get("x-template-website"));
  const host = normalizeHostname(
    headerStore.get("x-forwarded-host") ||
      headerStore.get("host") ||
      headerStore.get("x-template-domain-host")
  );
  const domainHost =
    normalizeHostname(headerStore.get("x-template-domain-host")) || host;

  return NextResponse.json(
    {
      success: true,
      route: "template-status",
      vendorId,
      websiteId,
      host,
      domainHost,
      path: normalizeValue(headerStore.get("x-current-path")) || "/_template-status",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
