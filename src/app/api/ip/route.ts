import { headers } from "next/headers";

export async function GET() {
  const h = await headers();

  const ip =
    h.get("x-forwarded-for")?.split(",")[0] || // works on Vercel & proxies
    h.get("x-real-ip") ||
    "Unknown IP";

  return Response.json({ ip });
}
