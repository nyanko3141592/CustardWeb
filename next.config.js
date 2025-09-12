/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const basePath = isGithubActions && repo ? `/${repo}` : ''

const nextConfig = {
  reactStrictMode: true,
  // Enable static export so the site can be deployed to GitHub Pages.
  output: 'export',
  // GitHub Pages serves static assets from a subpath for project pages.
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  // Avoid "index.html" directory listings without slash issues on Pages.
  trailingSlash: true,
  // Disable next/image optimization for static export.
  images: { unoptimized: true },
}

module.exports = nextConfig
