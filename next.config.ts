import type { NextConfig } from 'next';

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: 'export',
      basePath: '/task-daily',
      assetPrefix: '/task-daily/',
      trailingSlash: true,
    }
  : {};

export default nextConfig;
