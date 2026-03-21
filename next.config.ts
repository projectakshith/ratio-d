import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  fallbacks: {
    document: "/~offline",
    image: "/icons/icon-192.png",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    additionalManifestEntries: [
      { url: "/", revision: null },
      { url: "/attendance", revision: null },
      { url: "/marks", revision: null },
      { url: "/timetable", revision: null },
      { url: "/calendar", revision: null },
      { url: "/onboarding", revision: null },
      { url: "/login", revision: null },
      { url: "/setup", revision: null },
      { url: "/~offline", revision: null },
    ],
    runtimeCaching: [
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
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
        urlPattern: ({ request }) => {
          return request.headers.get('RSC') === '1';
        },
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-rsc-data",
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
        handler: "NetworkFirst",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
          networkTimeoutSeconds: 5,
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default withPWA(nextConfig);
