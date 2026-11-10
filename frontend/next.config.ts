import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

// export default nextConfig;
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   allowedDevOrigins: ["10.130.121.173"],

//   turbopack: {
//     root: process.cwd(),
//   },

//   async rewrites() {
//     return [
//       {
//         source: "/api/v1/:path*",
//         destination: "http://127.0.0.1:8080/api/v1/:path*",
//       },
//     ];
//   },
// };

// export default nextConfig;
