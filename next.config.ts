import type { NextConfig } from "next";

const securityHeaders = [
  // Block embedding the site in iframes (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URL on outbound navigation
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 2 years, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disable powerful browser features we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Cross-origin policies
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
