import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok-free.dev",
    "192.168.1.168",
    "localhost",
  ],
  async rewrites() {
    return [
      {
        source: "/api/customer/socket.io",
        destination: "http://localhost:3011/api/customer/socket.io/",
      },
      {
        source: "/api/customer/socket.io/",
        destination: "http://localhost:3011/api/customer/socket.io/",
      },
      {
        source: "/api/customer/socket.io/:path*",
        destination: "http://localhost:3011/api/customer/socket.io/:path*",
      },
      {
        source: "/socket.io",
        destination: "http://localhost:3011/socket.io/",
      },
      {
        source: "/socket.io/",
        destination: "http://localhost:3011/socket.io/",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:3011/socket.io/:path*",
      },
      {
        source: "/api/socket.io",
        destination: "http://localhost:3011/socket.io/",
      },
      {
        source: "/api/socket.io/",
        destination: "http://localhost:3011/socket.io/",
      },
      {
        source: "/api/socket.io/:path*",
        destination: "http://localhost:3011/socket.io/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:3011/api/:path*",
      },
    ];
  },
};

export default nextConfig;
