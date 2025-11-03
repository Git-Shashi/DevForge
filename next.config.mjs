/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore node-specific modules when bundling for the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        async_hooks: false,
        child_process: false,
        dns: false,
      };
    }

    // Externalize ssh2 and cpu-features to avoid bundling issues
    config.externals = [...(config.externals || []), { 'cpu-features': 'commonjs cpu-features' }];

    // Ignore .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },
  // Mark packages that should only run on the server
  experimental: {
    serverComponentsExternalPackages: ['dockerode', 'ssh2', 'mongodb', 'cpu-features'],
  },
};

export default nextConfig;
