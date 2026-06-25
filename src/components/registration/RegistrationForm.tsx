import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Heart,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
  type LucideIcon,
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

type FieldStatus = "neutral" | "valid" | "error";

function fieldStatus(isTouched: boolean, error: string | undefined, hasValue: boolean): FieldStatus {
  if (!isTouched) return "neutral";
  if (error) return "error";
  return hasValue ? "valid" : "neutral";
}

export function RegistrationForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const allowTilt = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  function handleCardPointerMove(event: React.PointerEvent<HTMLFormElement>) {
    if (!allowTilt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 4, y: (px - 0.5) * 4 });
  }

  function handleCardPointerLeave() {
    setTilt({ x: 0, y: 0 });
  }

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

  // Purely presentational — lets each section badge light up once that
  // section is filled in and currently error-free. Does not affect what
  // is required to submit.
  const personalDetailsComplete =
    Boolean(values.fullName && values.email && values.mobile && values.dateOfBirth && values.gender) &&
    !errors.fullName &&
    !errors.email &&
    !errors.mobile &&
    !errors.dateOfBirth &&
    !errors.gender;
  const interestsComplete = values.interests.length > 0 && !errors.interests;
  const locationComplete = Boolean(values.country && values.city) && !errors.country && !errors.city;
  const photoComplete = Boolean(file) && !fileError;

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

  function markTouched(key: keyof FormState) {
    setTouched((previousTouched) =>
      previousTouched[key] ? previousTouched : { ...previousTouched, [key]: true },
    );
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    updateMany({ [key]: value } as Partial<FormState>);
  }

  // Applies one or more field changes from the same snapshot of state, so
  // changes like "set country, then clear city" land together instead of
  // racing each other (the bug behind city silently becoming unselectable).
  function updateMany(patch: Partial<FormState>) {
    const nextValues = { ...values, ...patch };
    setValues(nextValues);
    setApiError(null);
    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      for (const key of Object.keys(patch) as (keyof FormState)[]) {
        const errorMessage = validateField(key, nextValues);
        if (errorMessage) {
          nextErrors[key as string] = errorMessage;
        } else {
          delete nextErrors[key as string];
        }
      }
      return nextErrors;
    });
  }

  function toggleInterest(interestName: string) {
    markTouched("interests");
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
      setTouched((previousTouched) => ({
        ...previousTouched,
        fullName: true,
        email: true,
        mobile: true,
        dateOfBirth: true,
        gender: true,
        interests: true,
        country: true,
        city: true,
      }));
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
          setTouched((previousTouched) => {
            const nextTouched = { ...previousTouched };
            for (const key of Object.keys(payload.errors!)) nextTouched[key] = true;
            return nextTouched;
          });
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
    <div className="relative isolate [perspective:1800px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 overflow-hidden rounded-[3rem] sm:-inset-x-14 sm:-inset-y-16"
      >
        <div
          className="absolute inset-0 animate-aurora-drift opacity-90"
          style={{ background: "var(--gradient-surface)", backgroundSize: "180% 180%" }}
        />
      </div>

      <form
        onSubmit={onSubmit}
        onPointerMove={handleCardPointerMove}
        onPointerLeave={handleCardPointerLeave}
        noValidate
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 250ms ease-out",
        }}
        className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-card/95 p-5 shadow-[var(--shadow-elegant)] ring-1 ring-primary/5 backdrop-blur-xl sm:p-9"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-primary opacity-60" />

        <div className="relative" style={{ transform: "translateZ(40px)" }}>
          <div className="mb-8 flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div aria-hidden className="relative hidden h-14 w-14 shrink-0 [perspective:600px] sm:block">
                <div
                  className="absolute inset-0 animate-orb-float rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 28%, oklch(0.9 0.1 250 / 95%), var(--primary) 55%, oklch(0.32 0.16 264) 100%)",
                    boxShadow:
                      "0 16px 30px -10px color-mix(in oklab, var(--primary) 55%, transparent), inset -5px -5px 10px rgb(0 0 0 / 25%), inset 5px 6px 8px rgb(255 255 255 / 45%)",
                  }}
                />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Smart, guided registration
                </div>
                <h2 className="text-shimmer font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Tell us about yourself
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Four quick sections — we&apos;ll flag anything that needs a second look as you go.
                </p>
              </div>
            </div>

            <div className="min-w-44 rounded-2xl border border-border/70 bg-background/80 p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Profile completeness</span>
              {progressPercent === 100 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <span className="font-display tabular-nums text-foreground">{progressPercent}%</span>
              )}
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {completionCount} of {TOTAL_STEPS} details captured
            </p>
          </div>
        </div>

        {apiError && (
          <Alert
            variant="destructive"
            className="mb-6 animate-in fade-in-0 slide-in-from-top-1 bg-destructive/5"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-0">
          <Section
            index={1}
            total={4}
            icon={UserRound}
            title="Personal details"
            description="Who you are and how we can reach you."
            complete={personalDetailsComplete}
          >
            <Field label="Full name" error={touched.fullName ? errors.fullName : undefined} required>
              <StatusInput
                icon={UserRound}
                status={fieldStatus(Boolean(touched.fullName), errors.fullName, Boolean(values.fullName))}
                value={values.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                onBlur={() => markTouched("fullName")}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </Field>

            <Field label="Email address" error={touched.email ? errors.email : undefined} required>
              <StatusInput
                icon={Mail}
                type="email"
                status={fieldStatus(Boolean(touched.email), errors.email, Boolean(values.email))}
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                onBlur={() => markTouched("email")}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Mobile number" error={touched.mobile ? errors.mobile : undefined} required>
              <StatusInput
                icon={Phone}
                type="tel"
                status={fieldStatus(Boolean(touched.mobile), errors.mobile, Boolean(values.mobile))}
                value={values.mobile}
                onChange={(event) => update("mobile", event.target.value)}
                onBlur={() => markTouched("mobile")}
                placeholder="+971 50 123 4567"
                autoComplete="tel"
              />
            </Field>

            <Field
              label="Date of birth"
              error={touched.dateOfBirth ? errors.dateOfBirth : undefined}
              required
            >
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={values.dateOfBirth}
                  onChange={(event) => update("dateOfBirth", event.target.value)}
                  onBlur={() => markTouched("dateOfBirth")}
                  max={new Date().toISOString().split("T")[0]}
                  className={cn(
                    "h-12 rounded-xl bg-background/80 pl-10",
                    touched.dateOfBirth && errors.dateOfBirth && "border-destructive/60",
                    touched.dateOfBirth && !errors.dateOfBirth && values.dateOfBirth && "border-success/50",
                  )}
                />
              </div>
            </Field>

            <Field label="Gender" error={touched.gender ? errors.gender : undefined} required className="sm:col-span-2">
              <RadioGroup
                value={values.gender}
                onValueChange={(value) => {
                  markTouched("gender");
                  update("gender", value);
                }}
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
                      {checked && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
                    </label>
                  );
                })}
              </RadioGroup>
            </Field>
          </Section>

          <Section
            index={2}
            total={4}
            icon={Heart}
            title="Interests"
            description="Pick anything that sounds like you — at least one."
            complete={interestsComplete}
          >
            <Field
              label="Interests"
              error={touched.interests ? errors.interests : undefined}
              required
              className="sm:col-span-2"
            >
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
          </Section>

          <Section
            index={3}
            total={4}
            icon={MapPin}
            title="Location"
            description="Where you're joining us from."
            complete={locationComplete}
          >
            <Field label="Country" error={touched.country ? errors.country : undefined} required>
              <Select
                value={values.country}
                onValueChange={(value) => {
                  markTouched("country");
                  updateMany({ country: value, city: "" });
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background/80">
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

            <Field label="City" error={touched.city ? errors.city : undefined} required>
              <Select
                value={values.city}
                onValueChange={(value) => {
                  markTouched("city");
                  update("city", value);
                }}
                disabled={!values.country}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background/80">
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
          </Section>

          <Section
            index={4}
            total={4}
            icon={ImagePlus}
            title="Profile photo"
            description="A clear photo helps us verify it's really you."
            complete={photoComplete}
            isLast
          >
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
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs text-success">
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
          </Section>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="animate-pulse-glow mt-2 h-12 w-full rounded-xl text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Submitting" : "Submit registration"}
        </Button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>Your details are encrypted and only used to verify your registration.</span>
        </div>
        </div>
      </form>
    </div>
  );
}

function Section({
  index,
  total,
  title,
  description,
  icon: Icon,
  complete,
  isLast = false,
  children,
}: {
  index: number;
  total: number;
  title: string;
  description: string;
  icon: LucideIcon;
  complete: boolean;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4 sm:gap-5">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-display text-xs font-bold transition-colors duration-500",
            complete
              ? "border-primary bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : index}
        </span>
        {!isLast && (
          <span
            className={cn(
              "mt-1 w-px flex-1 transition-colors duration-500",
              complete ? "bg-primary/50" : "bg-border",
            )}
          />
        )}
      </div>

      <div className={cn("flex-1 pt-0.5", isLast ? "pb-1" : "pb-9")}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-foreground/90">
            {title}
          </h3>
          <span className="text-[11px] font-medium text-muted-foreground">
            {index}/{total}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
      </div>
    </div>
  );
}

function StatusInput({
  icon: Icon,
  status,
  className,
  ...props
}: { icon: LucideIcon; status: FieldStatus } & ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={cn(
          "h-12 rounded-xl bg-background/80 pl-10 pr-10",
          status === "error" && "border-destructive/60",
          status === "valid" && "border-success/50",
          className,
        )}
        {...props}
      />
      {status === "valid" && (
        <CheckCircle2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
      )}
      {status === "error" && (
        <AlertCircle className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
      )}
    </div>
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
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-destructive animate-in fade-in-0 slide-in-from-top-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}