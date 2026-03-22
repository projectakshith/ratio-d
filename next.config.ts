import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const revision = Date.now().toString();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  fallbacks: {
    image: "/icons/icon-192.png",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    additionalManifestEntries: [
      { url: "/", revision },
      { url: "/attendance", revision },
      { url: "/marks", revision },
      { url: "/timetable", revision },
      { url: "/calendar", revision },
      { url: "/onboarding", revision },
      { url: "/login", revision },
      { url: "/setup", revision },
      { url: "/~offline", revision },
      { url: "/_not-found", revision },
    ],
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: ({ request, url }) => {
          const isSameOrigin = self.origin === url.origin;
          return isSameOrigin && (
            request.headers.get('RSC') === '1' || 
            url.searchParams.has('_rsc') ||
            url.pathname.startsWith('/_next/data/')
          );
        },
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-data",
          expiration: {
            maxEntries: 256,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-js-assets",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\/_next\/static.+\.css$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-style-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\/api\/.*$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "others",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
