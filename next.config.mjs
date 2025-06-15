import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Configure API routes
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: '/api/:path*',
            },
        ]
    },
    // Add proper API route handling
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                ],
            },
        ]
    },
}

const pwaConfig = {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false,
    publicExcludes: ['!noprecache/**/*'],
    buildExcludes: [/middleware-manifest\.json$/],
    runtimeCaching: [
        {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'offlineCache',
                expiration: {
                    maxEntries: 200,
                },
            },
        },
    ],
    // Exclude API routes from PWA caching
    exclude: [
        /^\/api\/.*$/,
    ],
}

export default withPWA(pwaConfig)(nextConfig)
