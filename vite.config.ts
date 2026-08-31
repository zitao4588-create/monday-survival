import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isXhsBuild = mode === "xhs";

  return {
    base: "./",
    build: {
      copyPublicDir: !isXhsBuild,
      modulePreload: isXhsBuild ? { polyfill: false } : undefined,
      outDir: isXhsBuild ? "dist-xhs" : "dist",
      rollupOptions: isXhsBuild
        ? {
            output: {
              format: "iife",
              inlineDynamicImports: true
            }
          }
        : undefined
    },
    plugins: [
      react(),
      isXhsBuild
        ? {
            name: "monday-survival:xhs-html",
            transformIndexHtml: {
              order: "post",
              handler(html: string) {
                return html
                  .replace(/\s*<footer class="ms-filing-footer"[\s\S]*?<\/footer>/, "")
                  .replace(
                    'content="width=device-width, initial-scale=1.0"',
                    'content="width=device-width, initial-scale=1.0, viewport-fit=cover"'
                  )
                  .replace(/<script type="module"/g, '<script defer')
                  .replace(
                    "</head>",
                    '    <meta name="monday-survival-build" content="xhs" />\n  </head>'
                  );
              }
            }
          }
        : null
    ],
    server: {
      host: "0.0.0.0",
      port: 5180
    }
  };
});
