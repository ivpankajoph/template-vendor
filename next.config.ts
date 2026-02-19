import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },

       {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/**",
      },

      {
        protocol: "https",
        hostname: "phpstack-1522038-5968955.cloudwaysapps.com",
        pathname: "/**", // ✅ allow all paths under this host
      },
      {
        protocol: "https",
        hostname: "ophmate-backend.onrender.com",
        pathname: "/**", // ✅ allow all images served from your backend
      },
        {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // ✅ allow all images served from your backend
      },
      {
        protocol: "https",
        hostname: "ophmate-backend-579008086831.us-central1.run.app",
        pathname: "/**", // ✅ ADD THIS LINE
      },
    ],
  },
};

export default nextConfig;
