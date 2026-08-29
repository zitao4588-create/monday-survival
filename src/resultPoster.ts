import { formatPerformance } from "./gameViewModels";
import type { ResultPresentation } from "./resultPresentation";

export const RESULT_POSTER_WIDTH = 853;
export const RESULT_POSTER_HEIGHT = 1844;

const POSTER_METRIC_CENTERS = [206, 428, 650] as const;
const POSTER_METRIC_LABEL_Y = 1072;
const POSTER_METRIC_VALUE_Y = 1120;

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

function drawPosterHeader(context: CanvasRenderingContext2D) {
  context.save();
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillStyle = "#262219";
  context.font = getFont(900, 54);
  context.fillText("活过周一", 198, 168, 280);
  context.fillStyle = "#5b5245";
  context.font = getFont(550, 27);
  context.fillText("打工人生存测试", 198, 226, 260);
  context.fillStyle = "#647151";
  context.textAlign = "center";
  context.font = getFont(800, 34);
  context.fillText("今日结果", 596, 197, 190);
  context.restore();
}

function drawKeyChoice(context: CanvasRenderingContext2D, data: ResultPresentation) {
  const x = 86;
  const y = 1324;
  const width = 681;
  const height = 356;

  context.save();
  context.fillStyle = "#eee6d4";
  context.strokeStyle = "rgba(79, 90, 68, 0.34)";
  context.lineWidth = 2;
  drawRoundRect(context, x, y, width, height, 18);
  context.fill();
  context.stroke();
  context.restore();

  context.save();
  context.fillStyle = "#4f5a44";
  drawRoundRect(context, x + 34, y + 30, 178, 58, 29);
  context.fill();
  context.restore();

  context.fillStyle = "#eee6d4";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = getFont(800, 26);
  context.fillText("关键一手", x + 123, y + 59, 148);

  context.fillStyle = "#29261f";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.font = getFont(850, 43);
  context.fillText(data.keyChoice.label, x + 36, y + 116, width - 72);

  context.fillStyle = "#55503f";
  context.font = getFont(550, 30);
  wrapText(context, data.keyChoice.impactSummary, width - 72, 3).forEach((line, index) => {
    context.fillText(line, x + 36, y + 188 + index * 43, width - 72);
  });
}

export async function createResultPosterDataUrl(backgroundSrc: string, data: ResultPresentation) {
  const background = await loadImage(backgroundSrc);
  const canvas = document.createElement("canvas");
  canvas.width = RESULT_POSTER_WIDTH;
  canvas.height = RESULT_POSTER_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.drawImage(background, 0, 0, RESULT_POSTER_WIDTH, RESULT_POSTER_HEIGHT);
  drawPosterHeader(context);
  context.textAlign = "center";
  context.textBaseline = "top";

  context.fillStyle = "#2a2722";
  context.font = getFont(650, 28);
  context.fillText("今日周一人格", RESULT_POSTER_WIDTH / 2, 620, 760);

  const personaFontSize = getTitleFontSize(data.personaLabel);
  context.font = getFont(900, personaFontSize);
  drawCenteredText(
    context,
    data.personaLabel,
    RESULT_POSTER_WIDTH / 2,
    675,
    820,
    personaFontSize * 1.08,
    2
  );

  context.fillStyle = "#4f5a44";
  context.font = getFont(800, 35);
  context.fillText(`今日结局：${data.todayEnding}`, RESULT_POSTER_WIDTH / 2, 798, 790);

  context.fillStyle = "#46402f";
  context.font = getFont(600, 29);
  drawCenteredText(context, `“${data.personaQuote}”`, 340, 882, 500, 39, 2);
  context.font = getFont(500, 27);
  drawCenteredText(context, data.description, 340, 978, 500, 37, 2);

  context.fillStyle = "#3d4730";
  context.font = getFont(800, 32);
  context.fillText("绩效", POSTER_METRIC_CENTERS[0], POSTER_METRIC_LABEL_Y, 196);
  context.fillText("能量", POSTER_METRIC_CENTERS[1], POSTER_METRIC_LABEL_Y, 196);
  context.fillText("心情", POSTER_METRIC_CENTERS[2], POSTER_METRIC_LABEL_Y, 196);

  context.font = getFont(800, 90);
  context.fillText(formatPerformance(data.score), POSTER_METRIC_CENTERS[0], POSTER_METRIC_VALUE_Y, 196);
  context.fillText(String(data.energy), POSTER_METRIC_CENTERS[1], POSTER_METRIC_VALUE_Y, 196);
  context.fillText(String(data.mood), POSTER_METRIC_CENTERS[2], POSTER_METRIC_VALUE_Y, 196);

  drawKeyChoice(context, data);

  return canvas.toDataURL("image/png");
}
