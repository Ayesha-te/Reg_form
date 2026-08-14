import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, FileDown, LoaderCircle, Minus, Settings2, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import logoUrl from "@/components/logo.png";
import { type RegistrationsListResponse, type RegistrationSubmission } from "@/lib/api";
import {
  findEligiblePlayer,
  matchRosterPlayers,
  normalizePlayerName,
  PLAYER_ROSTER,
  safePlayerFilename,
  type GalleryPlayer,
} from "@/lib/players";

const ROSTER_STORAGE_KEY = "icl-player-roster-v1";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Players | Avengers Community League 1.0" },
      { name: "description", content: "The official Avengers Community League 1.0 player gallery." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const [submissions, setSubmissions] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [roster, setRoster] = useState<string[]>([...PLAYER_ROSTER]);
  const [managing, setManaging] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [managerMessage, setManagerMessage] = useState("");
  const players = useMemo(
    () => (submissions.length > 0 ? matchRosterPlayers(submissions, roster) : []),
    [roster, submissions],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ROSTER_STORAGE_KEY);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every((name) => typeof name === "string")) {
        setRoster(parsed);
      }
    } catch {
      console.warn("[Players] Could not read the saved browser roster.");
    }
  }, []);

  function saveRoster(nextRoster: string[]) {
    setRoster(nextRoster);
    try {
      window.localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(nextRoster));
    } catch {
      setManagerMessage("The roster changed, but this browser could not save it.");
    }
  }

  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = findEligiblePlayer(submissions, playerName);
    if (result.status === "not-found") {
      setManagerMessage("No registration with that exact name and a photo was found.");
      return;
    }
    if (result.status === "ambiguous") {
      setManagerMessage("More than one registration matches that name. Nothing was added.");
      return;
    }
    if (roster.some((name) => normalizePlayerName(name) === normalizePlayerName(result.name))) {
      setManagerMessage(`${result.name} is already on the player wall.`);
      return;
    }
    saveRoster([...roster, result.name]);
    setPlayerName("");
    setManagerMessage(`${result.name} was added.`);
  }

  function removePlayer(name: string) {
    if (!window.confirm(`Remove ${name} from the player wall?`)) return;
    saveRoster(
      roster.filter((rosterName) => normalizePlayerName(rosterName) !== normalizePlayerName(name)),
    );
    setManagerMessage(`${name} was removed.`);
  }

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

  async function exportPdf() {
    setExportingPdf(true);
    setDownloadStatus("Preparing PDF. Player photos are being arranged for print.");
    try {
      const { createPlayerPdf, downloadPlayerPdf } = await import("@/lib/player-pdf");
      const result = await createPlayerPdf(players, logoUrl);
      downloadPlayerPdf(result.blob);
      setDownloadStatus(
        result.warningCount > 0
          ? `PDF downloaded with ${result.warningCount} photo ${result.warningCount === 1 ? "warning" : "warnings"}. Player names are still included.`
          : `PDF downloaded with all ${players.length} players.`,
      );
    } catch (exportError) {
      console.error("[Players] Could not prepare the player PDF.", exportError);
      setDownloadStatus("The player PDF could not be downloaded. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <main className="players-page min-h-screen bg-[#f4f1eb] text-[#171719]">
      <header className="border-b border-black/15 bg-[#f8f6f1]">
        <div className="mx-auto flex max-w-[1500px] items-center px-5 py-4 sm:px-8 lg:px-12">
          <Link
            to="/"
            aria-label="Avengers Community League home"
            className="inline-flex items-center gap-3"
          >
            <img src={logoUrl} alt="" className="h-14 w-20 object-contain sm:h-16 sm:w-24" />
            <span className="hidden text-xs font-extrabold uppercase tracking-[0.22em] sm:block">
              Avengers Community League 1.0
            </span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <p className="sr-only" role="status" aria-live="polite">
          {downloadStatus || managerMessage}
        </p>
        <div className="mb-8 border-b-4 border-[#171719] pb-7 sm:mb-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] font-black leading-[0.94] tracking-[-0.04em]">
              Indoor Community
              <br className="hidden sm:block" /> League 1.0{" "}
              <span className="text-[#c51d2b]">Players</span>
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setManaging((open) => !open)}
                aria-expanded={managing}
                aria-controls="player-manager"
                className="inline-flex h-12 items-center justify-center gap-2 border-2 border-[#171719] px-4 text-xs font-extrabold uppercase tracking-[0.12em] transition hover:bg-white focus-visible:outline-[#c51d2b]"
              >
                {managing ? <X className="size-4" /> : <Settings2 className="size-4" />}{" "}
                {managing ? "Close manager" : "Manage players"}
              </button>
              {!loading && !error && players.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => void downloadAll()}
                    disabled={downloadingAll || exportingPdf}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 border-2 border-[#171719] bg-[#171719] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-[#c51d2b] focus-visible:outline-[#c51d2b] disabled:cursor-wait disabled:opacity-60"
                  >
                    {downloadingAll ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    {downloadingAll ? "Preparing" : "Download all"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportPdf()}
                    disabled={
                      loading || error || players.length === 0 || exportingPdf || downloadingAll
                    }
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 border-2 border-[#171719] bg-[#f8f6f1] px-4 text-xs font-extrabold uppercase tracking-[0.12em] transition hover:bg-white focus-visible:outline-[#c51d2b] disabled:cursor-wait disabled:opacity-60"
                  >
                    {exportingPdf ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <FileDown className="size-4" />
                    )}
                    {exportingPdf ? "Preparing PDF" : "Export PDF"}
                  </button>
                </>
              )}
            </div>
          </div>
          {managing && (
            <aside
              id="player-manager"
              className="mt-7 border-l-4 border-[#c51d2b] bg-[#ebe6dc] p-4 sm:p-5"
            >
              <form onSubmit={addPlayer} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1 text-xs font-extrabold uppercase tracking-[0.13em]">
                  Add by full registration name
                  <input
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    required
                    autoComplete="off"
                    placeholder="Type the exact player name"
                    className="mt-2 h-12 w-full border-2 border-[#171719] bg-[#f8f6f1] px-3 text-base font-medium normal-case tracking-normal outline-none focus:border-[#c51d2b]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || error}
                  className="h-12 border-2 border-[#171719] bg-[#c51d2b] px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-[#171719] focus-visible:outline-[#c51d2b] disabled:opacity-50"
                >
                  Add player
                </button>
              </form>
              <p className="mt-3 text-xs leading-relaxed text-black/65">
                Photos come only from exact registration matches. Changes are saved on this browser.
              </p>
              {managerMessage && (
                <p className="mt-2 text-sm font-bold" role="status">
                  {managerMessage}
                </p>
              )}
            </aside>
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
                {managing && (
                  <button
                    type="button"
                    onClick={() => removePlayer(player.name)}
                    aria-label={`Remove ${player.name} from the player wall`}
                    className="absolute right-2 top-2 z-10 inline-flex min-h-10 items-center gap-1 border border-white/70 bg-[#171719]/90 px-2.5 text-[.68rem] font-extrabold uppercase tracking-wider text-white shadow-lg hover:bg-[#c51d2b] focus-visible:outline-white"
                  >
                    <Minus className="size-3.5" /> Remove
                  </button>
                )}
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
