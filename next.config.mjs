/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
        // Prevents Next.js Webpack 5 from crashing when client-side imports use Node APIs
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            dgram: false,
            crypto: false,
            path: false,
            os: false,
            stream: false,
            zlib: false,
            http: false,
            https: false
        };
    }
    return config;
  },
};

export default nextConfig;
