import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Download,
  Eye,
  FileImage,
  Loader2,
  RefreshCcw,
  Search,
  TableProperties,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  API_BASE_URL,
  REGISTRATION_PHOTOS_PUBLIC_BASE_URL,
  type RegistrationsListResponse,
  type RegistrationSubmission,
} from "@/lib/api";
import logoUrl from "@/components/logo.png";

export const Route = createFileRoute("/submissions")({
  head: () => ({
    meta: [
      { title: "Registration submissions" },
      { name: "description", content: "View submitted registration entries." },
    ],
  }),
  component: SubmissionsPage,
});

const columns = [
  "First Name",
  "Last Name",
  "Email",
  "Mobile Number",
  "Whatsapp Number",
  "Jersey Name",
  "Jersey Size",
  "Jersey Number",
  "Preferred Sleeves",
  "Current Club/Team",
  "Availability",
  "Not Available On",
  "Fee Agreement",
  "Created At",
  "File",
];

const excelColumns = [...columns, "File URL"];

function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<RegistrationSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  async function loadSubmissions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/registrations`);
      const payload = (await response.json()) as RegistrationsListResponse;

      if (!response.ok) {
        throw new Error("Could not load registration submissions.");
      }

      const rows = Array.isArray(payload) ? payload : (payload.registrations ?? payload.data ?? []);
      setSubmissions(rows);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error ? loadError.message : "Could not load registration submissions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
  }, []);

  const totalFiles = useMemo(
    () => submissions.filter((submission) => getFileUrl(submission)).length,
    [submissions],
  );
  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);
    if (!normalizedQuery) return submissions;

    return submissions.filter((submission) =>
      getSubmissionSearchText(submission).includes(normalizedQuery),
    );
  }, [searchQuery, submissions]);
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 px-4 py-3 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Event logo" className="h-16 w-24 shrink-0 object-contain" />
            <span className="text-2xl font-black tracking-tight text-foreground">
              Indoor Cricket Rising League 3.0
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
              Form
            </Link>
            <Link to="/submissions" className="text-foreground">
              Submissions
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-foreground">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                <CalendarDays className="h-5 w-5" />
              </span>
              {formatDate(new Date().toISOString())}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Registration submissions
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              All submitted registration data in table format.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Stat label="Submissions" value={submissions.length.toString()} />
            <Stat label="Files" value={totalFiles.toString()} />
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => void loadSubmissions()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl"
              onClick={() => exportSubmissionsToExcel(filteredSubmissions)}
              disabled={loading || filteredSubmissions.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <TableProperties className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Submitted entries</p>
              {hasSearchQuery && (
                <span className="text-sm text-muted-foreground">
                  {filteredSubmissions.length} match{filteredSubmissions.length === 1 ? "" : "es"}
                </span>
              )}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search submissions"
                className="h-11 rounded-xl bg-background pl-10 pr-10"
              />
              {hasSearchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-700"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-16 text-center">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading submissions
                      </span>
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-16 text-center text-muted-foreground"
                    >
                      No submissions found.
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-16 text-center text-muted-foreground"
                    >
                      No submissions match your search.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => {
                    const firstName = submission.firstName ?? submission.first_name ?? "";
                    const lastName = submission.lastName ?? submission.last_name ?? "";
                    const fallbackName = submission.fullName ?? submission.full_name ?? "Unknown";
                    const displayName =
                      [firstName, lastName].filter(Boolean).join(" ") || fallbackName;
                    const fileUrl = getFileUrl(submission);

                    return (
                      <tr key={submission.id} className="border-b border-border last:border-b-0">
                        <td className="whitespace-nowrap px-4 py-4 align-middle font-bold text-foreground">
                          {firstName || fallbackName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle font-bold text-foreground">
                          {lastName || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.email}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.mobile}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.whatsappNumber ?? submission.whatsapp_number ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.jerseyName ?? submission.jersey_name ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.jerseySize ?? submission.jersey_size ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.jerseyNumber ?? submission.jersey_number ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.preferredSleeves ?? submission.preferred_sleeves ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.currentClub ?? submission.current_club ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {submission.availability ?? "-"}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex max-w-72 flex-wrap gap-1.5">
                            {(submission.notAvailableOn ?? submission.not_available_on ?? [])
                              .length > 0 ? (
                              (submission.notAvailableOn ?? submission.not_available_on ?? []).map(
                                (matchName) => (
                                  <Badge
                                    key={matchName}
                                    variant="secondary"
                                    className="rounded-full"
                                  >
                                    {matchName}
                                  </Badge>
                                ),
                              )
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {(submission.feeAgreement ?? submission.fee_agreement) ? "Accepted" : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
                          {formatDateTime(submission.createdAt ?? submission.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          {fileUrl ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-9 rounded-xl px-3 text-sm font-semibold"
                              onClick={() => setSelectedFile({ name: displayName, url: fileUrl })}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">No file</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(selectedFile)} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-4xl rounded-2xl border-white/20 bg-card p-0">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-primary" />
              Uploaded file
            </DialogTitle>
            <DialogDescription>{selectedFile?.name}</DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <div className="max-h-[75vh] overflow-auto p-4">
              <img
                src={selectedFile.url}
                alt={`${selectedFile.name} uploaded file`}
                className="mx-auto max-h-[68vh] w-auto rounded-xl object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2.5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-lg font-black text-foreground">{value}</p>
    </div>
  );
}

function getSubmissionSearchText(submission: RegistrationSubmission) {
  const values = [
    submission.firstName,
    submission.first_name,
    submission.lastName,
    submission.last_name,
    submission.fullName,
    submission.full_name,
    submission.email,
    submission.mobile,
    submission.whatsappNumber,
    submission.whatsapp_number,
    submission.jerseyName,
    submission.jersey_name,
    submission.jerseySize,
    submission.jersey_size,
    submission.jerseyNumber,
    submission.jersey_number,
    submission.preferredSleeves,
    submission.preferred_sleeves,
    submission.currentClub,
    submission.current_club,
    submission.availability,
    ...(submission.notAvailableOn ?? submission.not_available_on ?? []),
    (submission.feeAgreement ?? submission.fee_agreement) ? "Accepted" : "",
    formatDateTime(submission.createdAt ?? submission.created_at),
  ];

  return normalizeSearchValue(values.filter(Boolean).join(" "));
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function exportSubmissionsToExcel(submissions: RegistrationSubmission[]) {
  const rows = submissions.map((submission) => {
    const fileUrl = getFileUrl(submission) ?? "";

    return [
      submission.firstName ?? submission.first_name ?? submission.fullName ?? submission.full_name ?? "",
      submission.lastName ?? submission.last_name ?? "",
      submission.email,
      submission.mobile,
      submission.whatsappNumber ?? submission.whatsapp_number ?? "",
      submission.jerseyName ?? submission.jersey_name ?? "",
      submission.jerseySize ?? submission.jersey_size ?? "",
      submission.jerseyNumber ?? submission.jersey_number ?? "",
      submission.preferredSleeves ?? submission.preferred_sleeves ?? "",
      submission.currentClub ?? submission.current_club ?? "",
      submission.availability ?? "",
      (submission.notAvailableOn ?? submission.not_available_on ?? []).join(", "),
      (submission.feeAgreement ?? submission.fee_agreement) ? "Accepted" : "",
      formatDateTime(submission.createdAt ?? submission.created_at),
      fileUrl ? "View" : "",
      fileUrl,
    ];
  });

  const csv = [excelColumns, ...rows].map((row) => row.map(formatCsvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `registration-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatCsvCell(value: string | number | boolean | null | undefined) {
  const cell = String(value ?? "");
  const excelSafeCell = /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
  return `"${excelSafeCell.replace(/"/g, '""')}"`;
}

function getFileUrl(submission: RegistrationSubmission) {
  const directUrl = submission.photoUrl ?? submission.photo_url;
  if (directUrl) return directUrl;

  const photoPath = submission.photoPath ?? submission.photo_path;
  if (!photoPath) return null;
  if (/^https?:\/\//i.test(photoPath)) return photoPath;

  const cleanPath = photoPath.replace(/^\/+/, "");
  if (REGISTRATION_PHOTOS_PUBLIC_BASE_URL) {
    return `${REGISTRATION_PHOTOS_PUBLIC_BASE_URL}/${encodeStoragePath(cleanPath)}`;
  }

  return `${API_BASE_URL}/${cleanPath}`;
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
