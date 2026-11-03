import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: { agentUpgrade: 'security' },
  serverExternalPackages: ['@neondatabase/serverless', 'ws'],
  // lib/engine.ts loads the reference engine at runtime, outside the bundle.
  outputFileTracingIncludes: { '/**': ['./src/engine.mjs', './data/cards.json'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
