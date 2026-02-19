/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://vendor-template.vercel.app",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: ["/admin/*", "/vendor/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin", "/vendor"] },
    ],
  },
};
