// ZCode 对抗性审查专用 vitest 配置。
// 仅匹配 review-output/zr-*.checks.ts，命名避开 *.test.ts / *.spec.ts，
// 因此项目自身的 `pnpm test`（默认 include **/*.{test,spec}.*）不会拾取本目录文件。
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["review-output/zr-*.checks.ts"]
  }
});
