/// <reference types="vitest" />
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import nodePolyfills from "vite-plugin-node-stdlib-browser";

export default ({ mode }) => {
    const env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    const proxy = getProxy(env);

    // https://vitejs.dev/config/
    return defineConfig({
        base: "", // Relative paths
        plugins: [
            nodePolyfills(),
            react(),
            checker({
                typescript: true,
                eslint: {
                    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
                    dev: { logLevel: ["error", "warning"] },
                },
            }),
            VitePWA({
                registerType: "autoUpdate",
                injectRegister: "auto",
                includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
                devOptions: {
                    enabled: true,
                },
                workbox: {
                    maximumFileSizeToCacheInBytes: 5000000,
                    globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
                    runtimeCaching: [
                        {
                            urlPattern: ({ url }) => url.pathname !== "",
                            handler: "StaleWhileRevalidate",
                            options: {
                                cacheName: "api-cache",
                                expiration: {
                                    maxAgeSeconds: 60 * 60 * 24,
                                },
                                cacheableResponse: {
                                    statuses: [200],
                                },
                            },
                        },
                        {
                            urlPattern: ({ request }) =>
                                request.destination === "script" ||
                                request.destination === "style" ||
                                request.destination === "image",
                            handler: "StaleWhileRevalidate",
                            options: {
                                cacheName: "assets-cache",
                            },
                        },
                    ],
                },
            }),
        ],
        test: {
            environment: "jsdom",
            include: ["**/*.spec.{ts,tsx}"],
            setupFiles: "./src/tests/setup.js",
            exclude: ["node_modules", "src/tests/playwright"],
            globals: true,
        },
        server: {
            port: parseInt(env.VITE_PORT),
            proxy: proxy,
        },
    });
};

function getProxy(env: Record<string, string>) {
    const dhis2UrlVar = "VITE_DHIS2_BASE_URL";
    const dhis2AuthVar = "VITE_DHIS2_AUTH";
    const targetUrl = env[dhis2UrlVar];
    const auth = env[dhis2AuthVar];
    const isBuild = env.NODE_ENV === "production";

    if (isBuild) {
        return {};
    } else if (!targetUrl) {
        console.error(`Set ${dhis2UrlVar}`);
        process.exit(1);
    } else if (!auth) {
        console.error(`Set ${dhis2AuthVar}`);
        process.exit(1);
    } else {
        return {
            "/dhis2": {
                target: targetUrl,
                changeOrigin: true,
                auth: auth,
                rewrite: path => path.replace(/^\/dhis2/, ""),
            },
        };
    }
}
