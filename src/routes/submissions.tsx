import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Eye,
  FileImage,
  Loader2,
  RefreshCcw,
  TableProperties,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  "Name",
  "Email",
  "Mobile Number",
  "Date of Birth",
  "Gender",
  "Interests",
  "Country",
  "City",
  "Created At",
  "File",
];

function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<RegistrationSubmission[]>([]);
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

      const rows = Array.isArray(payload) ? payload : payload.registrations ?? payload.data ?? [];
      setSubmissions(rows);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load registration submissions.",
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

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 px-4 py-5 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="text-2xl font-black tracking-tight text-foreground">
            Registration
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <TableProperties className="h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Submitted entries</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-5 text-base font-bold text-slate-700"
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
                    <td colSpan={columns.length} className="px-6 py-16 text-center text-muted-foreground">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => {
                    const name = submission.fullName ?? submission.full_name ?? "Unknown";
                    const fileUrl = getFileUrl(submission);

                    return (
                      <tr
                        key={submission.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-6 py-6 align-middle text-lg font-bold text-foreground">
                          {name}
                        </td>
                        <td className="px-6 py-6 align-middle text-lg text-slate-600">
                          {submission.email}
                        </td>
                        <td className="px-6 py-6 align-middle text-lg text-slate-600">
                          {submission.mobile}
                        </td>
                        <td className="px-6 py-6 align-middle text-lg text-slate-600">
                          {formatDate(submission.dateOfBirth ?? submission.date_of_birth)}
                        </td>
                        <td className="px-6 py-6 align-middle text-lg text-slate-600">
                          {submission.gender}
                        </td>
                        <td className="px-6 py-6 align-middle">
                          <div className="flex max-w-56 flex-wrap gap-1.5">
                            {(submission.interests ?? []).map((interest) => (
                              <Badge key={interest} variant="secondary" className="rounded-full">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-6 align-middle text-lg text-slate-600">
                          {submission.country}
                        </td>
                        <td className="px-6 py-6 align-middle text-lg text-slate-600">
                          {submission.city}
                        </td>
                        <td className="px-6 py-6 align-middle text-lg text-slate-600">
                          {formatDateTime(submission.createdAt ?? submission.created_at)}
                        </td>
                        <td className="px-6 py-6 align-middle">
                          {fileUrl ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-10 rounded-xl px-3 text-base font-semibold"
                              onClick={() => setSelectedFile({ name, url: fileUrl })}
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
