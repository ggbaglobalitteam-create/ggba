/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",

    eslint: {
        ignoreDuringBuilds: true,
    },

    typescript: {
        ignoreBuildErrors: true,
    },

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ssl.cdn-redfin.com",
            },
        ],
    },
};

export default nextConfig;
