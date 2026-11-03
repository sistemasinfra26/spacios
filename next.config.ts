import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/dashboard/expenses",
        destination: "/dashboard/expensas",
        permanent: true,
      },
      {
        source: "/dashboard/expenses/:id",
        destination: "/dashboard/expensas/:id",
        permanent: true,
      },
      {
        source: "/dashboard/edificios",
        destination: "/dashboard/consorcios",
        permanent: true,
      },
      {
        source: "/dashboard/edificios/:id",
        destination: "/dashboard/consorcios/:id",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
