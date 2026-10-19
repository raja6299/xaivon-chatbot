import type { NextConfig } from "next";

const extraAncestors = process.env.ALLOWED_FRAME_ANCESTORS
  ? ` ${process.env.ALLOWED_FRAME_ANCESTORS}`
  : "";

const frameAncestors = process.env.NODE_ENV === "production"
  ? `frame-ancestors 'self' https://xaivon.com https://www.xaivon.com${extraAncestors}`
  : `frame-ancestors 'self' http://localhost:5173 http://localhost:3000 http://localhost:3001 http://127.0.0.1:5173 http://127.0.0.1:3000${extraAncestors}`;

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      frameAncestors,
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "canvas"],
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
