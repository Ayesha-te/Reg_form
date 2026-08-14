import type { GalleryPlayer } from "@/lib/players";

const PDF_FILENAME = "indoor-community-league-players.pdf";
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 14;
const GRID_TOP = 39;
const CARD_GAP_X = 5;
const CARD_GAP_Y = 6;
const CARD_WIDTH = (PAGE_WIDTH - MARGIN_X * 2 - CARD_GAP_X * 2) / 3;
const PHOTO_HEIGHT = 66;
const NAME_HEIGHT = 14;
const ROW_HEIGHT = PHOTO_HEIGHT + NAME_HEIGHT + CARD_GAP_Y;
const PLAYERS_PER_PAGE = 9;

export type PlayerPdfResult = { blob: Blob; warningCount: number };

export async function createPlayerPdf(
  players: GalleryPlayer[],
  logoUrl: string,
): Promise<PlayerPdfResult> {
  const [{ jsPDF }, logoData] = await Promise.all([
    import("jspdf"),
    loadAssetAsDataUrl(logoUrl).catch(() => null),
  ]);
  const document = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  let warningCount = 0;
  const totalPages = Math.ceil(players.length / PLAYERS_PER_PAGE);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    if (pageIndex > 0) document.addPage();
    drawPageFrame(document, pageIndex + 1, totalPages, logoData);
    const pagePlayers = players.slice(
      pageIndex * PLAYERS_PER_PAGE,
      (pageIndex + 1) * PLAYERS_PER_PAGE,
    );

    for (let batchStart = 0; batchStart < pagePlayers.length; batchStart += 3) {
      const images = await Promise.all(
        pagePlayers.slice(batchStart, batchStart + 3).map(async (player) => {
          try {
            const response = await fetch(
              `/api/player-gallery/photo?url=${encodeURIComponent(player.photoUrl)}`,
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await cropPortrait(await response.blob(), player.focalPosition);
          } catch (error) {
            console.warn(`[Players] PDF photo unavailable for ${player.name}.`, error);
            warningCount += 1;
            return null;
          }
        }),
      );

      images.forEach((image, offset) => {
        const itemIndex = batchStart + offset;
        drawPlayerCard(document, pagePlayers[itemIndex], itemIndex, image);
      });
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
  }

  return { blob: document.output("blob"), warningCount };
}

function drawPageFrame(
  document: import("jspdf").jsPDF,
  pageNumber: number,
  totalPages: number,
  logoData: string | null,
) {
  document.setFillColor(248, 246, 241);
  document.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
  if (logoData) document.addImage(logoData, "PNG", MARGIN_X, 9, 17, 12, undefined, "FAST");
  document.setTextColor(23, 23, 25);
  document.setFont("helvetica", "bold");
  document.setFontSize(14);
  document.text("Avengers Community League 1.0 Players", logoData ? 35 : MARGIN_X, 17);
  document.setDrawColor(197, 29, 43);
  document.setLineWidth(1.2);
  document.line(MARGIN_X, 27, PAGE_WIDTH - MARGIN_X, 27);
  document.setFont("helvetica", "normal");
  document.setFontSize(7.5);
  document.setTextColor(80, 80, 82);
  document.text(
    `Avengers Community League 1.0 - Page ${pageNumber} of ${totalPages}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 8,
    { align: "center" },
  );
}

function drawPlayerCard(
  document: import("jspdf").jsPDF,
  player: GalleryPlayer,
  index: number,
  image: string | null,
) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const x = MARGIN_X + column * (CARD_WIDTH + CARD_GAP_X);
  const y = GRID_TOP + row * ROW_HEIGHT;

  document.setFillColor(32, 32, 35);
  document.rect(x, y, CARD_WIDTH, PHOTO_HEIGHT, "F");
  if (image) {
    document.addImage(image, "JPEG", x, y, CARD_WIDTH, PHOTO_HEIGHT, undefined, "MEDIUM");
  } else {
    document.setTextColor(150, 150, 150);
    document.setFont("helvetica", "bold");
    document.setFontSize(20);
    document.text(initials(player.name), x + CARD_WIDTH / 2, y + PHOTO_HEIGHT / 2 + 2, {
      align: "center",
    });
  }

  document.setFillColor(23, 23, 25);
  document.rect(x, y + PHOTO_HEIGHT, CARD_WIDTH, NAME_HEIGHT, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(8.5);
  const lines = document.splitTextToSize(player.name, CARD_WIDTH - 6).slice(0, 2) as string[];
  const firstBaseline = y + PHOTO_HEIGHT + (lines.length === 1 ? 8.5 : 6.3);
  document.text(lines, x + 3, firstBaseline, { lineHeightFactor: 1.15 });
}

async function cropPortrait(blob: Blob, focalPosition: string) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = 540;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");

  const [focalX, focalY] = focalPosition.split(" ").map((part) => Number.parseFloat(part) / 100);
  const targetRatio = canvas.width / canvas.height;
  const sourceRatio = bitmap.width / bitmap.height;
  let sourceWidth = bitmap.width;
  let sourceHeight = bitmap.height;
  if (sourceRatio > targetRatio) sourceWidth = bitmap.height * targetRatio;
  else sourceHeight = bitmap.width / targetRatio;
  const sourceX = clamp(
    bitmap.width * (Number.isFinite(focalX) ? focalX : 0.5) - sourceWidth / 2,
    0,
    bitmap.width - sourceWidth,
  );
  const sourceY = clamp(
    bitmap.height * (Number.isFinite(focalY) ? focalY : 0.2) - sourceHeight / 2,
    0,
    bitmap.height - sourceHeight,
  );
  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

async function loadAssetAsDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Asset failed with HTTP ${response.status}`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function downloadPlayerPdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = PDF_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
