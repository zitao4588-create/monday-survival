import type { ResultShareData } from "./resultShare";

const POSTER_WIDTH = 853;
const POSTER_HEIGHT = 1844;

function getTitleFontSize(title: string) {
  if (title.length >= 8) {
    return 84;
  }

  if (title.length >= 5) {
    return 108;
  }

  return 124;
}

function getFont(weight: number, size: number) {
  return `${weight} ${size}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Result poster background failed to load"));
    image.src = src;
  });
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const chars = [...text];
  const lines: string[] = [];
  let line = "";

  for (const char of chars) {
    const next = `${line}${char}`;

    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = char;

      if (lines.length === maxLines) {
        break;
      }
    } else {
      line = next;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  if (lines.length === maxLines && lines.join("").length < text.length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(0, lines[maxLines - 1].length - 1))}…`;
  }

  return lines;
}

function drawCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const lines = wrapText(context, text, maxWidth, maxLines);

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight, maxWidth);
  });
}

function drawRoundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawPersonaPill(context: CanvasRenderingContext2D, label: string) {
  context.font = getFont(700, 27);
  const width = Math.max(220, Math.min(320, context.measureText(label).width + 56));
  const x = 444;
  const y = 1298;

  context.save();
  context.fillStyle = "#4f5a44";
  context.shadowColor = "rgba(40, 28, 16, 0.3)";
  context.shadowBlur = 6;
  context.shadowOffsetY = 3;
  drawRoundRect(context, x, y, width, 64, 32);
  context.fill();
  context.restore();

  context.fillStyle = "#ece5d1";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = getFont(700, 27);
  context.fillText(label, x + width / 2, y + 32, width - 28);
}

export async function createResultPosterDataUrl(backgroundSrc: string, data: ResultShareData) {
  const background = await loadImage(backgroundSrc);
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.drawImage(background, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.textAlign = "center";
  context.textBaseline = "top";

  context.fillStyle = "#2a2722";
  context.font = getFont(900, getTitleFontSize(data.title));
  drawCenteredText(context, data.title, POSTER_WIDTH / 2, 676, 820, getTitleFontSize(data.title) * 1.12, 2);

  context.fillStyle = "#46402f";
  context.font = getFont(500, 30);
  drawCenteredText(context, data.description, POSTER_WIDTH / 2, 882, 820, 40, 2);

  context.fillStyle = "#3d4730";
  context.font = getFont(800, 90);
  context.fillText(String(data.score), 211, 1130, 220);
  context.fillText(String(data.energy), 434, 1130, 220);
  context.fillText(String(data.mood), 650, 1130, 220);

  drawPersonaPill(context, data.personaLabel);

  context.fillStyle = "#55503f";
  context.font = getFont(500, 29);
  drawCenteredText(context, `“${data.personaQuote}”`, POSTER_WIDTH / 2, 1362, 810, 40, 3);

  return canvas.toDataURL("image/png");
}
