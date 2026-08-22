import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(process.cwd(), "dist-xhs");
const allowedExtensions = new Set([
  ".css",
  ".gif",
  ".html",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".png",
  ".svg",
  ".webp",
  ".woff",
  ".woff2"
]);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg"]);

const forbiddenCodePatterns = [
  ["fetch", /(?:^|[^\w$.])fetch\s*\(/m],
  ["XMLHttpRequest", /\bnew\s+XMLHttpRequest\b/],
  ["WebSocket", /\bnew\s+WebSocket\b/],
  ["Worker", /\bnew\s+(?:Shared)?Worker\b/],
  ["Service Worker", /\bnavigator\s*\.\s*serviceWorker\b/],
  ["剪贴板", /\bnavigator\s*\.\s*clipboard\b/],
  ["系统分享", /\bnavigator\s*\.\s*share\s*\(/],
  ["新窗口", /\bwindow\s*\.\s*open\s*\(/],
  ["动态执行 eval", /(?:^|[^\w$.])eval\s*\(/m],
  ["动态执行 new Function", /\bnew\s+Function\b/],
  ["WebAssembly", /\bWebAssembly\b|\.wasm(?:\b|[?#])/i],
  ["动态表单", /\bdocument\s*\.\s*createElement\s*\(\s*["']form["']\s*\)/],
  ["跨工具唤起", /\blocation\s*\.\s*href\s*=(?!=)|\blocation\s*\.\s*assign\s*\(/]
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

function relativePath(file) {
  return path.relative(outputDirectory, file).split(path.sep).join("/");
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function localReference(reference) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  return cleanReference.startsWith("./") || cleanReference.startsWith("../")
    ? cleanReference
    : null;
}

function checkReference(reference, sourceFile, failures) {
  const trimmed = reference.trim();

  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("data:")) {
    return;
  }

  if (/^(?:https?:)?\/\//i.test(trimmed) || /^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    failures.push(`${relativePath(sourceFile)} 存在外部或跨工具资源：${trimmed}`);
    return;
  }

  const local = localReference(trimmed);
  if (!local) {
    failures.push(`${relativePath(sourceFile)} 存在非相对资源路径：${trimmed}`);
  }
}

async function run() {
  const files = await collectFiles(outputDirectory);
  const relativeFiles = files.map(relativePath);
  const failures = [];
  const htmlFiles = relativeFiles.filter((file) => path.extname(file).toLowerCase() === ".html");

  if (!relativeFiles.includes("index.html")) {
    failures.push("缺少根目录 index.html");
  }

  if (htmlFiles.length !== 1 || htmlFiles[0] !== "index.html") {
    failures.push(`HTML 入口必须唯一且位于根目录，当前为：${htmlFiles.join(", ") || "无"}`);
  }

  const entryScripts = relativeFiles.filter((file) => /^assets\/index-[^/]+\.js$/.test(file));
  const entryStyles = relativeFiles.filter((file) => /^assets\/index-[^/]+\.css$/.test(file));

  if (entryScripts.length !== 1 || entryStyles.length !== 1) {
    failures.push(
      `入口哈希资源必须各有且仅有一份，当前 JS=${entryScripts.join(", ") || "无"}，CSS=${entryStyles.join(", ") || "无"}`
    );
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

    for (const [name, pattern] of forbiddenCodePatterns) {
      const match = pattern.exec(content);
      if (match) {
        failures.push(`${relativePath(file)}:${lineNumber(content, match.index)} 命中禁用能力：${name}`);
      }
    }

    if (extension === ".html" || extension === ".svg") {
      const forbiddenTag = /<(?:iframe|object|embed|form)\b/i.exec(content);
      if (forbiddenTag) {
        failures.push(`${relativePath(file)}:${lineNumber(content, forbiddenTag.index)} 存在禁用标签`);
      }

      const inlineEvent = /\son[a-z]+\s*=/i.exec(content);
      if (inlineEvent) {
        failures.push(`${relativePath(file)}:${lineNumber(content, inlineEvent.index)} 存在行内事件`);
      }
    }

    if (extension === ".css") {
      for (const match of content.matchAll(/(?:@import\s+|url\(\s*)["']?([^"')\s;]+)/gi)) {
        checkReference(match[1], file, failures);
      }
    }
  }

  if (relativeFiles.includes("index.html")) {
    const indexPath = path.join(outputDirectory, "index.html");
    const indexHtml = await readFile(indexPath, "utf8");

    if (!indexHtml.includes('<meta name="monday-survival-build" content="xhs"')) {
      failures.push("index.html 缺少稳定的 XHS 构建模式标记");
    }

    if (/ms-filing-footer|beian\.mps\.gov\.cn|陕公网安备/i.test(indexHtml)) {
      failures.push("XHS 入口仍包含备案 footer");
    }

    if (/\bmodulepreload\b/i.test(indexHtml)) {
      failures.push("index.html 仍包含 modulepreload");
    }

    for (const match of indexHtml.matchAll(/\b(?:href|src|srcset)\s*=\s*["']([^"']+)["']/gi)) {
      checkReference(match[1], indexPath, failures);
    }

    for (const match of indexHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (!/\bsrc\s*=/.test(match[1]) || match[2].trim()) {
        failures.push("index.html 存在内联脚本");
      }
    }

    if (/<a\b[^>]*\b(?:download|target\s*=\s*["']_blank["'])/i.test(indexHtml)) {
      failures.push("index.html 存在下载或新窗口入口");
    }
  }

  if (failures.length > 0) {
    throw new Error(`XHS 产物检查失败：\n- ${failures.join("\n- ")}`);
  }

  console.log(
    `XHS 产物检查通过：${relativeFiles.length} 个文件；根入口、扩展名、相对资源、离线能力和禁用能力均符合要求。`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
