import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
}

const pwaConfig = {
    dest: 'public',
    register: true,
    skipWaiting: true,
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
}

export default withPWA(pwaConfig)(nextConfig)
