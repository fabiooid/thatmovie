import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: [
    '@mastra/core',
    '@mastra/libsql',
    '@mastra/memory',
    '@mastra/rag',
    '@mastra/editor',
    '@libsql/client',
    'libsql',
  ],
};

export default nextConfig;
