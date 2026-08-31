import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(process.cwd(), "dist-xhs");
const allowedExtensions = new Set([".css", ".html", ".jpeg", ".jpg", ".js", ".png", ".svg", ".webp"]);
const textExtensions = new Set([".css", ".html", ".js", ".svg"]);

const forbiddenPatterns = [
  ["公安备案链接", /beian\.mps\.gov\.cn|陕公网安备/i],
  ["新窗口链接", /target\s*[:=]\s*["']?_blank/i],
  ["结果图下载", /monday-survival-result\.png|下载图片|download\s*[:=]\s*["']/i],
  ["剪贴板", /\bnavigator\s*\.\s*clipboard\b/i],
  ["系统分享", /\bnavigator\s*\.\s*share\b/i],
  ["window.open", /\bwindow\s*\.\s*open\s*\(/i],
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["Worker", /\b(?:Shared)?Worker\b/],
  ["ServiceWorker", /\bServiceWorker\b/],
  [
    "嵌入内容标签",
    /<(?:iframe|object|embed)\b|(?:createElement|jsx|jsxs)\s*\(\s*["'](?:iframe|object|embed)["']|["'](?:iframe|object|embed)["']\s*,\s*\{/i
  ],
  ["eval", /\beval\s*\(/],
  ["new Function", /\bnew\s+Function\b/]
];

const externalResourcePatterns = [
  /<(?:audio|iframe|img|link|script|source|video)\b[^>]*(?:href|src|srcset)\s*=\s*["']\s*(?:https?:)?\/\//i,
  /(?:@import|url)\s*\(\s*["']?\s*(?:https?:)?\/\//i,
  /\bimport\s*\(\s*["']\s*(?:https?:)?\/\//i,
  /\bnew\s+URL\s*\(\s*["']\s*(?:https?:)?\/\//i
];

const esModuleSyntaxPatterns = [
  ["import.meta", /\bimport\s*\.\s*meta\b/],
  ["import", /\bimport(?:\s*\(|\s*["'{*]|\s+[A-Za-z_$])/],
  ["export", /\bexport\s*(?:\{|\*|default\b|(?:async\s+)?(?:function|class|const|let|var)\b)/]
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function findPattern(content, pattern) {
  const match = pattern.exec(content);
  pattern.lastIndex = 0;
  return match;
}

async function run() {
  const files = await collectFiles(outputDirectory);
  const relativeFiles = files.map((file) => path.relative(outputDirectory, file).split(path.sep).join("/"));
  const failures = [];

  if (!relativeFiles.includes("index.html")) {
    failures.push("缺少根目录 index.html");
  }

  const nestedIndexes = relativeFiles.filter((file) => file !== "index.html" && file.endsWith("/index.html"));
  if (nestedIndexes.length > 0) {
    failures.push(`存在非根目录入口：${nestedIndexes.join(", ")}`);
  }

  const disallowedFiles = relativeFiles.filter((file) => !allowedExtensions.has(path.extname(file).toLowerCase()));
  if (disallowedFiles.length > 0) {
    failures.push(`存在不允许的扩展名：${disallowedFiles.join(", ")}`);
  }

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (!textExtensions.has(extension)) {
      continue;
    }

    const content = await readFile(file, "utf8");
    const relativeFile = path.relative(outputDirectory, file).split(path.sep).join("/");

    for (const [name, pattern] of forbiddenPatterns) {
      const match = findPattern(content, pattern);
      if (match) {
        failures.push(`${relativeFile}:${getLineNumber(content, match.index)} 命中禁用能力：${name}`);
      }
    }

    for (const pattern of externalResourcePatterns) {
      const match = findPattern(content, pattern);
      if (match) {
        failures.push(`${relativeFile}:${getLineNumber(content, match.index)} 命中外部资源引用`);
      }
    }

    if (extension === ".js") {
      for (const [name, pattern] of esModuleSyntaxPatterns) {
        const match = findPattern(content, pattern);
        if (match) {
          failures.push(`${relativeFile}:${getLineNumber(content, match.index)} 包含 ES 模块语法：${name}`);
        }
      }
    }
  }

  const indexPath = path.join(outputDirectory, "index.html");
  if (relativeFiles.includes("index.html")) {
    const indexHtml = await readFile(indexPath, "utf8");

    if (!indexHtml.includes('<meta name="monday-survival-build" content="xhs"')) {
      failures.push("index.html 缺少 XHS 构建模式标记");
    }

    const viewportTag = indexHtml.match(/<meta\b[^>]*\bname=["']viewport["'][^>]*>/i)?.[0];
    const viewportContent = viewportTag?.match(/\bcontent=["']([^"']*)["']/i)?.[1];
    const viewportValues = new Set(
      viewportContent?.split(",").map((value) => value.trim().toLowerCase()) ?? []
    );

    for (const requiredValue of ["width=device-width", "initial-scale=1.0", "viewport-fit=cover"]) {
      if (!viewportValues.has(requiredValue)) {
        failures.push(`index.html viewport 缺少 ${requiredValue}`);
      }
    }

    const moduleScripts = [...indexHtml.matchAll(/<script\b[^>]*\btype=["']module["'][^>]*>/gi)];
    if (moduleScripts.length > 0) {
      failures.push("index.html 使用了 type=\"module\"，XHS 入口必须使用经典脚本");
    }

    const classicScriptEntries = [...indexHtml.matchAll(/<script\b[^>]*>/gi)]
      .map((match) => match[0])
      .filter((tag) => /\bsrc=["'][^"']+["']/i.test(tag) && !/\btype=["']module["']/i.test(tag));
    if (classicScriptEntries.length === 0) {
      failures.push("index.html 缺少经典脚本入口");
    }

    const resourceReferences = [...indexHtml.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
    const invalidReferences = resourceReferences.filter(
      (reference) => !reference.startsWith("./") && !reference.startsWith("data:") && !reference.startsWith("#")
    );

    if (invalidReferences.length > 0) {
      failures.push(`index.html 存在非相对资源路径：${invalidReferences.join(", ")}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`XHS 产物检查失败：\n- ${failures.join("\n- ")}`);
  }

  console.log(`XHS 产物检查通过：${relativeFiles.length} 个文件，根入口、经典脚本、viewport、扩展名、模式标记、相对资源与禁用能力均符合要求。`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
