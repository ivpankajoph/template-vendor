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
  webpack(config, { isServer }) {
    // ensure mime-db is not bundled into a dynamic vendor chunk; instead
    // require it from node_modules at runtime. this avoids runtime errors
    // about missing ./vendor-chunks/mime-db.js.
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('mime-db')
    }
    return config
  },
};

export default nextConfig;
