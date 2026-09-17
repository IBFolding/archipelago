/**
 * Static export for GitHub Pages.
 *
 * The site is entirely client-side (no server routes, no image optimisation),
 * so it exports cleanly to static files. BASE_PATH is the repo name when this
 * is served from a project page; leave it empty to serve from a domain root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['three'],
  images: { unoptimized: true },
};

export default nextConfig;
