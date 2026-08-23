import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isXhsBuild = mode === "xhs";

  return {
    base: "./",
    build: {
      copyPublicDir: !isXhsBuild,
      modulePreload: isXhsBuild ? { polyfill: false } : undefined,
      outDir: isXhsBuild ? "dist-xhs" : "dist"
    },
    define: {
      __XHS_BUILD__: JSON.stringify(isXhsBuild)
    },
    plugins: [
      react(),
      isXhsBuild
        ? {
            name: "monday-survival:xhs-html",
            transformIndexHtml(html: string) {
              return html
                .replace(/\s*<footer class="ms-filing-footer"[\s\S]*?<\/footer>/, "")
                .replace(
                  "</head>",
                  '    <meta name="monday-survival-build" content="xhs" />\n  </head>'
                );
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
