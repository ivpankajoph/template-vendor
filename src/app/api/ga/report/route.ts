import { BetaAnalyticsDataClient } from "@google-analytics/data";
import path from "path";

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: path.join(process.cwd(), "service-account.json"),
});

export async function GET() {
  const propertyId = "513233049"; // e.g., 123456789

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "newUsers" },
      { name: "totalRevenue" },
    ],
    dimensions: [
      { name: "date" },
      { name: "sessionSource" },
    ],
  });

  return Response.json(response.rows);
}
