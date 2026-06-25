import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ALLOWED_FILE_TYPES,
  COUNTRIES,
  COUNTRY_CITY_MAP,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  MAX_FILE_SIZE,
} from "@/lib/registration-data";
import { API_BASE_URL, type ApiErrorResponse, type RegistrationResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Enter a valid mobile number (7-15 digits)"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Select a gender" }),
  interests: z.array(z.string()).min(1, "Pick at least one interest"),
  country: z.string().min(1, "Select a country"),
  city: z.string().min(1, "Select a city"),
});

type FormState = {
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: string;
  interests: string[];
  country: string;
  city: string;
};

const initial: FormState = {
  fullName: "",
  email: "",
  mobile: "",
  dateOfBirth: "",
  gender: "",
  interests: [],
  country: "",
  city: "",
};

const TOTAL_STEPS = 9;

export function RegistrationForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cities = useMemo(
    () => (values.country ? (COUNTRY_CITY_MAP[values.country] ?? []) : []),
    [values.country],
  );

  const completionCount = useMemo(() => {
    const completedFields = [
      values.fullName,
      values.email,
      values.mobile,
      values.dateOfBirth,
      values.gender,
      values.country,
      values.city,
    ].filter(Boolean).length;

    return completedFields + (values.interests.length > 0 ? 1 : 0) + (file ? 1 : 0);
  }, [file, values]);

  const progressPercent = Math.round((completionCount / TOTAL_STEPS) * 100);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  function validateField<K extends keyof FormState>(key: K, valuesToValidate: FormState) {
    const parsed = schema.safeParse(valuesToValidate);
    if (parsed.success) return null;

    const issue = parsed.error.issues.find((issue) => issue.path[0] === key);
    return issue?.message ?? null;
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    setApiError(null);
    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      const errorMessage = validateField(key, nextValues);

      if (errorMessage) {
        nextErrors[key as string] = errorMessage;
      } else {
        delete nextErrors[key as string];
      }

      return nextErrors;
    });
  }

  function toggleInterest(interestName: string) {
    const nextInterests = values.interests.includes(interestName)
      ? values.interests.filter((interest) => interest !== interestName)
      : [...values.interests, interestName];

    const nextValues = { ...values, interests: nextInterests };
    setValues(nextValues);
    setApiError(null);
    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      const errorMessage = validateField("interests", nextValues);

      if (errorMessage) {
        nextErrors.interests = errorMessage;
      } else {
        delete nextErrors.interests;
      }

      return nextErrors;
    });
  }

  function handleFile(selectedFile: File | null) {
    setApiError(null);
    setFileError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setFileError("Only JPG, JPEG, or PNG files are allowed");
      return;
    }

    if (selectedFile.size >= MAX_FILE_SIZE) {
      setFile(null);
      setFileError("File must be smaller than 1 MB");
      return;
    }

    setFile(selectedFile);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setApiError(null);

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }

    if (!file) {
      const message = "Upload a JPG or PNG photo under 1 MB";
      setFileError(message);
      toast.error(message);
      return;
    }

    if (fileError) {
      toast.error(fileError);
      return;
    }

    const formData = new FormData();
    formData.append("fullName", parsed.data.fullName);
    formData.append("email", parsed.data.email);
    formData.append("mobile", parsed.data.mobile);
    formData.append("dateOfBirth", parsed.data.dateOfBirth);
    formData.append("gender", parsed.data.gender);
    parsed.data.interests.forEach((interest) => formData.append("interests", interest));
    formData.append("country", parsed.data.country);
    formData.append("city", parsed.data.city);
    formData.append("photo", file);

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/registrations`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as RegistrationResponse | ApiErrorResponse;

      if (!response.ok || !payload.ok) {
        if (!payload.ok && payload.errors) {
          setErrors(payload.errors);
          if (payload.errors.photo) setFileError(payload.errors.photo);
        }

        throw new Error(
          !payload.ok && payload.message
            ? payload.message
            : "Something went wrong. Please try again.",
        );
      }

      toast.success(payload.message);
      navigate({ to: "/thank-you" });
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : `Could not reach the API at ${API_BASE_URL}`;
      setApiError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-card/95 p-5 shadow-[var(--shadow-elegant)] ring-1 ring-primary/5 backdrop-blur-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative">
        <div className="mb-6 flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Guided registration
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Tell us about yourself</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Required details
            </p>
          </div>

          <div className="min-w-40 rounded-2xl border border-border/70 bg-background/80 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{completionCount}/{TOTAL_STEPS} complete</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      
        {apiError && (
          <Alert variant="destructive" className="mb-5 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.fullName} required>
            <Input
              value={values.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
              className="h-11 rounded-xl bg-background/80"
            />
          </Field>

          <Field label="Email address" error={errors.email} required>
            <Input
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              className="h-11 rounded-xl bg-background/80"
            />
          </Field>

          <Field label="Mobile number" error={errors.mobile} required>
            <Input
              type="tel"
              value={values.mobile}
              onChange={(event) => update("mobile", event.target.value)}
              placeholder="+971 50 123 4567"
              autoComplete="tel"
              className="h-11 rounded-xl bg-background/80"
            />
          </Field>

          <Field label="Date of birth" error={errors.dateOfBirth} required>
            <Input
              type="date"
              value={values.dateOfBirth}
              onChange={(event) => update("dateOfBirth", event.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="h-11 rounded-xl bg-background/80"
            />
          </Field>

          <Field label="Gender" error={errors.gender} required className="sm:col-span-2">
            <RadioGroup
              value={values.gender}
              onValueChange={(value) => update("gender", value)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {GENDER_OPTIONS.map((genderOption) => {
                const checked = values.gender === genderOption;
                return (
                  <label
                    key={genderOption}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
                      checked
                        ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/10"
                        : "border-input bg-background/80 hover:-translate-y-0.5 hover:bg-accent",
                    )}
                  >
                    <RadioGroupItem value={genderOption} id={`gender-${genderOption}`} />
                    <span className="font-medium">{genderOption}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </Field>

          <Field label="Interests" error={errors.interests} required className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INTEREST_OPTIONS.map((interestOption) => {
                const checked = values.interests.includes(interestOption);
                return (
                  <label
                    key={interestOption}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-all",
                      checked
                        ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/10"
                        : "border-input bg-background/80 hover:-translate-y-0.5 hover:bg-accent",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleInterest(interestOption)}
                    />
                    <span className="font-medium">{interestOption}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          <Field label="Country" error={errors.country} required>
            <Select
              value={values.country}
              onValueChange={(value) => {
                update("country", value);
                update("city", "");
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background/80">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((countryOption) => (
                  <SelectItem key={countryOption} value={countryOption}>
                    {countryOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="City" error={errors.city} required>
            <Select
              value={values.city}
              onValueChange={(value) => update("city", value)}
              disabled={!values.country}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background/80">
                <SelectValue
                  placeholder={values.country ? "Select a city" : "Pick a country first"}
                />
              </SelectTrigger>
              <SelectContent>
                {cities.map((cityOption) => (
                  <SelectItem key={cityOption} value={cityOption}>
                    {cityOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Upload photo"
            hint="Required. JPG, JPEG, or PNG. Max 1 MB."
            error={fileError ?? errors.photo}
            required
            className="sm:col-span-2"
          >
            {file ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center">
                <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background sm:w-24">
                  {filePreviewUrl ? (
                    <img
                      src={filePreviewUrl}
                      alt="Selected upload preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="h-7 w-7 text-primary" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB ready for upload
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valid image selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleFile(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                className="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-input bg-background/80 p-6 text-center text-sm text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-105">
                  <Upload className="h-6 w-6" />
                </span>
                <span>
                  <span className="font-semibold text-foreground">Click to upload</span> or drag
                  your photo here
                </span>
                <span className="text-xs">Image is validated again on the Node server.</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </Field>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="mt-8 h-12 w-full rounded-xl text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Submitting" : "Submit registration"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  required,
  className,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
