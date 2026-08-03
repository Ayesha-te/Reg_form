import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import logoUrl from "@/components/logo.png";
import { type RegistrationsListResponse, type RegistrationSubmission } from "@/lib/api";
import { matchRosterPlayers, safePlayerFilename, type GalleryPlayer } from "@/lib/players";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Players | Indoor Community League 1.0" },
      { name: "description", content: "The official Indoor Community League 1.0 player gallery." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const [submissions, setSubmissions] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const players = useMemo(
    () => (submissions.length > 0 ? matchRosterPlayers(submissions) : []),
    [submissions],
  );

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/player-gallery", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as RegistrationsListResponse;
        setSubmissions(
          Array.isArray(payload) ? payload : (payload.registrations ?? payload.data ?? []),
        );
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        console.error("[Players] Could not load the player gallery.", loadError);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function downloadPlayer(player: GalleryPlayer) {
    setDownloadStatus(`Downloading ${player.name}.`);
    try {
      const blob = await fetchPhoto(player.photoUrl);
      downloadBlob(
        blob,
        safePlayerFilename(player.name, imageExtension(blob.type, player.photoUrl)),
      );
      setDownloadStatus(`${player.name}'s photo downloaded.`);
    } catch (downloadError) {
      console.error(`[Players] Could not download ${player.name}.`, downloadError);
      setDownloadStatus(`${player.name}'s photo could not be downloaded. Please try again.`);
    }
  }

  async function downloadAll() {
    setDownloadingAll(true);
    setDownloadStatus("Preparing all player photos for download.");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (let index = 0; index < players.length; index += 5) {
        await Promise.all(
          players.slice(index, index + 5).map(async (player) => {
            const blob = await fetchPhoto(player.photoUrl);
            zip.file(
              safePlayerFilename(player.name, imageExtension(blob.type, player.photoUrl)),
              blob,
            );
          }),
        );
      }
      downloadBlob(
        await zip.generateAsync({ type: "blob" }),
        "indoor-community-league-players.zip",
      );
      setDownloadStatus(`${players.length} player photos downloaded in a ZIP file.`);
    } catch (downloadError) {
      console.error("[Players] Could not prepare the photo ZIP.", downloadError);
      setDownloadStatus("The player photo ZIP could not be downloaded. Please try again.");
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <main className="players-page min-h-screen bg-[#f4f1eb] text-[#171719]">
      <header className="border-b border-black/15 bg-[#f8f6f1]">
        <div className="mx-auto flex max-w-[1500px] items-center px-5 py-4 sm:px-8 lg:px-12">
          <Link
            to="/"
            aria-label="Indoor Community League home"
            className="inline-flex items-center gap-3"
          >
            <img src={logoUrl} alt="" className="h-14 w-20 object-contain sm:h-16 sm:w-24" />
            <span className="hidden text-xs font-extrabold uppercase tracking-[0.22em] sm:block">
              Indoor Community League 1.0
            </span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <p className="sr-only" role="status" aria-live="polite">
          {downloadStatus}
        </p>
        <div className="mb-10 flex flex-col gap-7 border-b-4 border-[#171719] pb-8 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="max-w-4xl font-display text-[clamp(2.5rem,7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.045em]">
            Indoor Community
            <br className="hidden sm:block" /> League 1.0{" "}
            <span className="text-[#c51d2b]">Players</span>
          </h1>
          {!loading && !error && players.length > 0 && (
            <button
              type="button"
              onClick={() => void downloadAll()}
              disabled={downloadingAll}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 border-2 border-[#171719] bg-[#171719] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-[#c51d2b] focus-visible:outline-[#c51d2b] disabled:cursor-wait disabled:opacity-60"
            >
              {downloadingAll ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {downloadingAll ? "Preparing" : "Download all"}
            </button>
          )}
        </div>

        {loading ? (
          <div
            className="flex min-h-64 items-center justify-center border-y border-black/20"
            role="status"
          >
            <span className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.15em]">
              <LoaderCircle className="size-5 animate-spin text-[#c51d2b]" /> Loading players
            </span>
          </div>
        ) : error ? (
          <div className="min-h-64 border-y border-black/20 py-20 text-center">
            <p className="font-display text-2xl font-black">
              The squad wall is unavailable right now.
            </p>
            <p className="mt-2 text-sm text-black/65">Please refresh the page and try again.</p>
          </div>
        ) : players.length === 0 ? (
          <div className="min-h-64 border-y border-black/20 py-20 text-center">
            <p className="font-display text-2xl font-black">Player photos are being prepared.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
            {players.map((player, index) => (
              <article
                key={player.id}
                className="group relative overflow-hidden bg-[#202023] shadow-[0_12px_30px_-20px_rgba(0,0,0,.75)] [animation:player-reveal_.5s_both]"
                style={{ animationDelay: `${Math.min(index * 35, 450)}ms` }}
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#252528]">
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    loading="lazy"
                    style={{ objectPosition: player.focalPosition }}
                    className="h-full w-full object-cover saturate-[.92] transition duration-500 ease-out group-hover:scale-[1.025] group-hover:saturate-100"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-[5.6rem] items-end justify-between gap-2 bg-[linear-gradient(transparent,rgba(11,11,13,.96)_38%)] px-3 pb-3 pt-7 sm:h-24 sm:px-4 sm:pb-4">
                  <h2
                    title={player.name}
                    className="line-clamp-2 min-h-[2.25rem] flex-1 text-balance font-display text-[clamp(.78rem,1.55vw,1.18rem)] font-black leading-[1.12] text-white sm:min-h-[2.65rem]"
                  >
                    {player.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => void downloadPlayer(player)}
                    aria-label={`Download photo of ${player.name}`}
                    title={`Download ${player.name}`}
                    className="grid size-9 shrink-0 place-items-center border border-white/50 bg-black/35 text-white transition hover:border-[#e32a39] hover:bg-[#c51d2b] focus-visible:outline-white"
                  >
                    <Download className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

async function fetchPhoto(url: string) {
  const response = await fetch(`/api/player-gallery/photo?url=${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`Photo download failed with HTTP ${response.status}`);
  return response.blob();
}

function imageExtension(contentType: string, url: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  const match = url.match(/\.(png|webp|jpe?g)(?:$|[?#])/i);
  return match?.[1]?.toLowerCase().replace("jpeg", "jpg") ?? "jpg";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
