/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production builds are a static export for Cloudflare Pages (output in ./out).
  // Dev keeps the normal server so /room/<any-id> works without the Pages rewrite.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
