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
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Mail,
  Phone,
  Shirt,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AVAILABILITY_OPTIONS,
  JERSEY_SIZE_OPTIONS,
  MAX_FILE_SIZE,
  NOT_AVAILABLE_ON_OPTIONS,
  PREFERRED_SLEEVE_OPTIONS,
} from "@/lib/registration-data";
import { API_BASE_URL, type ApiErrorResponse, type RegistrationResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const phoneRegex = /^(\+9715\d{8}|\d{10})$/;

const schema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    mobile: z.string().trim().regex(phoneRegex, "Use 10 digits or UAE format +9715XXXXXXXX"),
    email: z.string().trim().email("Enter a valid email address").max(255),
    whatsappNumber: z
      .string()
      .trim()
      .regex(phoneRegex, "Use 10 digits or UAE format +9715XXXXXXXX"),
    jerseyName: z.string().trim().min(1, "Name of jersey is required").max(80),
    jerseyNumber: z
      .string()
      .trim()
      .regex(/^\d{1,3}$/, "Jersey number must be whole numbers only"),
    jerseySize: z.enum(["Small", "Medium", "Large", "XL", "XXL", "3XL", "4XL"], {
      message: "Select a jersey size",
    }),
    preferredSleeves: z.enum(["Full Sleeves", "Half Sleeves"], {
      message: "Select preferred sleeves",
    }),
    currentClub: z.string().trim().max(120),
    availability: z.enum(["Available all matches", "Missing few matches"], {
      message: "Select availability",
    }),
    notAvailableOn: z.array(z.string()),
    feeAgreement: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the registration and match fees" }),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.availability === "Missing few matches" && values.notAvailableOn.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notAvailableOn"],
        message: "Select at least one match you are not available on",
      });
    }
  });

type FormState = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  whatsappNumber: string;
  jerseyName: string;
  jerseyNumber: string;
  jerseySize: string;
  preferredSleeves: string;
  currentClub: string;
  availability: string;
  notAvailableOn: string[];
  feeAgreement: boolean;
};

const initial: FormState = {
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  whatsappNumber: "",
  jerseyName: "",
  jerseyNumber: "",
  jerseySize: "",
  preferredSleeves: "",
  currentClub: "",
  availability: "",
  notAvailableOn: [],
  feeAgreement: false,
};

const TOTAL_STEPS = 13;

type FieldStatus = "neutral" | "valid" | "error";

function fieldStatus(
  isTouched: boolean,
  error: string | undefined,
  hasValue: boolean,
): FieldStatus {
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

  const completionCount = useMemo(() => {
    const completedFields = [
      values.firstName,
      values.lastName,
      values.mobile,
      values.email,
      values.whatsappNumber,
      values.jerseyName,
      values.jerseyNumber,
      values.jerseySize,
      values.preferredSleeves,
      values.availability,
    ].filter(Boolean).length;

    const notAvailableComplete =
      values.availability === "Available all matches" || values.notAvailableOn.length > 0 ? 1 : 0;

    return completedFields + notAvailableComplete + (file ? 1 : 0) + (values.feeAgreement ? 1 : 0);
  }, [file, values]);

  const progressPercent = Math.round((completionCount / TOTAL_STEPS) * 100);

  const playerComplete =
    Boolean(
      values.firstName && values.lastName && values.mobile && values.email && values.whatsappNumber,
    ) &&
    !errors.firstName &&
    !errors.lastName &&
    !errors.mobile &&
    !errors.email &&
    !errors.whatsappNumber;
  const jerseyComplete =
    Boolean(
      values.jerseyName && values.jerseyNumber && values.jerseySize && values.preferredSleeves,
    ) &&
    !errors.jerseyName &&
    !errors.jerseyNumber &&
    !errors.jerseySize &&
    !errors.preferredSleeves;
  const availabilityComplete =
    Boolean(values.availability) &&
    (values.availability === "Available all matches" || values.notAvailableOn.length > 0) &&
    !errors.currentClub &&
    !errors.availability &&
    !errors.notAvailableOn;
  const finalComplete = Boolean(file && values.feeAgreement) && !fileError && !errors.feeAgreement;

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

    const issue = parsed.error.issues.find((fieldIssue) => fieldIssue.path[0] === key);
    return issue?.message ?? null;
  }

  function markTouched(key: keyof FormState) {
    setTouched((previousTouched) =>
      previousTouched[key] ? previousTouched : { ...previousTouched, [key]: true },
    );
    setFieldError(key, values);
  }

  function setFieldError<K extends keyof FormState>(key: K, valuesToValidate: FormState) {
    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      const errorMessage = validateField(key, valuesToValidate);

      if (errorMessage) {
        nextErrors[key as string] = errorMessage;
      } else {
        delete nextErrors[key as string];
      }

      return nextErrors;
    });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    const nextValues = { ...values, [key]: value };

    if (key === "availability" && value === "Available all matches") {
      nextValues.notAvailableOn = [];
    }

    setValues(nextValues);
    setApiError(null);

    if (touched[key as string] || errors[key as string]) setFieldError(key, nextValues);
    if (key === "availability" || key === "notAvailableOn")
      setFieldError("notAvailableOn", nextValues);
  }

  function toggleNotAvailableOn(matchName: string) {
    const nextMatches = values.notAvailableOn.includes(matchName)
      ? values.notAvailableOn.filter((item) => item !== matchName)
      : [...values.notAvailableOn, matchName];

    setTouched((previousTouched) => ({ ...previousTouched, notAvailableOn: true }));
    update("notAvailableOn", nextMatches);
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

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setFileError("File must be 2 MB or smaller");
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
      setTouched(
        Object.keys(initial).reduce<Record<string, boolean>>((accumulator, key) => {
          accumulator[key] = true;
          return accumulator;
        }, {}),
      );
      toast.error("Please fix the highlighted fields");
      return;
    }

    if (!file) {
      const message = "Upload a clear headshot photo under 2 MB";
      setFileError(message);
      toast.error(message);
      return;
    }

    if (fileError) {
      toast.error(fileError);
      return;
    }

    const formData = new FormData();
    formData.append("firstName", parsed.data.firstName);
    formData.append("lastName", parsed.data.lastName);
    formData.append("fullName", `${parsed.data.firstName} ${parsed.data.lastName}`);
    formData.append("mobile", parsed.data.mobile);
    formData.append("email", parsed.data.email);
    formData.append("whatsappNumber", parsed.data.whatsappNumber);
    formData.append("jerseyName", parsed.data.jerseyName);
    formData.append("jerseyNumber", parsed.data.jerseyNumber);
    formData.append("jerseySize", parsed.data.jerseySize);
    formData.append("preferredSleeves", parsed.data.preferredSleeves);
    formData.append("currentClub", parsed.data.currentClub);
    formData.append("availability", parsed.data.availability);
    parsed.data.notAvailableOn.forEach((matchName) => formData.append("notAvailableOn", matchName));
    formData.append("feeAgreement", String(parsed.data.feeAgreement));
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
        error instanceof Error ? error.message : `Could not reach the API at ${API_BASE_URL}`;
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
      className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-card/95 p-5 shadow-[var(--shadow-elegant)] ring-1 ring-primary/5 backdrop-blur-xl sm:p-9"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-primary opacity-70" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative">
        <div className="mb-8 flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Player registration
            </div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Indoor Cricket Rising League 3.0
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete all required player, jersey, availability, and payment agreement details.
            </p>
          </div>

          <div className="min-w-48 rounded-2xl border border-border/70 bg-background/80 p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Form completeness</span>
              {progressPercent === 100 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <span className="font-display tabular-nums text-foreground">
                  {progressPercent}%
                </span>
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
          <Alert variant="destructive" className="mb-6 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-0">
          <Section
            index={1}
            total={4}
            icon={UserRound}
            title="Player details"
            description="Player identity and contact information."
            complete={playerComplete}
          >
            <Field
              label="First Name"
              error={touched.firstName ? errors.firstName : undefined}
              required
            >
              <StatusInput
                icon={UserRound}
                status={fieldStatus(
                  Boolean(touched.firstName),
                  errors.firstName,
                  Boolean(values.firstName),
                )}
                value={values.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                onBlur={() => markTouched("firstName")}
                placeholder="First name"
                autoComplete="given-name"
              />
            </Field>

            <Field
              label="Last Name"
              error={touched.lastName ? errors.lastName : undefined}
              required
            >
              <StatusInput
                icon={UserRound}
                status={fieldStatus(
                  Boolean(touched.lastName),
                  errors.lastName,
                  Boolean(values.lastName),
                )}
                value={values.lastName}
                onChange={(event) => update("lastName", event.target.value)}
                onBlur={() => markTouched("lastName")}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </Field>

            <Field
              label="Mobile Number"
              hint="Example: +9715XXXXXXXX or 10 digits"
              error={touched.mobile ? errors.mobile : undefined}
              required
            >
              <StatusInput
                icon={Phone}
                type="tel"
                status={fieldStatus(Boolean(touched.mobile), errors.mobile, Boolean(values.mobile))}
                value={values.mobile}
                onChange={(event) => update("mobile", event.target.value)}
                onBlur={() => markTouched("mobile")}
                placeholder="+9715XXXXXXXX"
                autoComplete="tel"
              />
            </Field>

            <Field label="Email Address" error={touched.email ? errors.email : undefined} required>
              <StatusInput
                icon={Mail}
                type="email"
                status={fieldStatus(Boolean(touched.email), errors.email, Boolean(values.email))}
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                onBlur={() => markTouched("email")}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </Field>

            <Field
              label="Whatsapp Number"
              error={touched.whatsappNumber ? errors.whatsappNumber : undefined}
              required
              className="sm:col-span-2"
            >
              <StatusInput
                icon={Phone}
                type="tel"
                status={fieldStatus(
                  Boolean(touched.whatsappNumber),
                  errors.whatsappNumber,
                  Boolean(values.whatsappNumber),
                )}
                value={values.whatsappNumber}
                onChange={(event) => update("whatsappNumber", event.target.value)}
                onBlur={() => markTouched("whatsappNumber")}
                placeholder="+9715XXXXXXXX"
                autoComplete="tel"
              />
            </Field>
          </Section>

          <Section
            index={2}
            total={4}
            icon={Shirt}
            title="Jersey details"
            description="Name, number, size, and sleeve preference."
            complete={jerseyComplete}
          >
            <Field
              label="Name of Jersey"
              error={touched.jerseyName ? errors.jerseyName : undefined}
              required
            >
              <StatusInput
                icon={Shirt}
                status={fieldStatus(
                  Boolean(touched.jerseyName),
                  errors.jerseyName,
                  Boolean(values.jerseyName),
                )}
                value={values.jerseyName}
                onChange={(event) => update("jerseyName", event.target.value)}
                onBlur={() => markTouched("jerseyName")}
                placeholder="Name on jersey"
              />
            </Field>

            <Field
              label="Number on Jersey"
              error={touched.jerseyNumber ? errors.jerseyNumber : undefined}
              required
            >
              <StatusInput
                icon={FileText}
                inputMode="numeric"
                status={fieldStatus(
                  Boolean(touched.jerseyNumber),
                  errors.jerseyNumber,
                  Boolean(values.jerseyNumber),
                )}
                value={values.jerseyNumber}
                onChange={(event) => update("jerseyNumber", event.target.value)}
                onBlur={() => markTouched("jerseyNumber")}
                placeholder="10"
              />
            </Field>

            <Field
              label="Jersey Size"
              error={touched.jerseySize ? errors.jerseySize : undefined}
              required
            >
              <Select
                value={values.jerseySize}
                onValueChange={(value) => {
                  setTouched((previousTouched) => ({ ...previousTouched, jerseySize: true }));
                  update("jerseySize", value);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background/80">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {JERSEY_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Preferred Sleeves"
              error={touched.preferredSleeves ? errors.preferredSleeves : undefined}
              required
            >
              <Select
                value={values.preferredSleeves}
                onValueChange={(value) => {
                  setTouched((previousTouched) => ({ ...previousTouched, preferredSleeves: true }));
                  update("preferredSleeves", value);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background/80">
                  <SelectValue placeholder="Select sleeves" />
                </SelectTrigger>
                <SelectContent>
                  {PREFERRED_SLEEVE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section
            index={3}
            total={4}
            icon={UsersRound}
            title="Availability"
            description="Current club/team (optional) and match availability."
            complete={availabilityComplete}
          >
            <Field
              label="Current Club/Team"
              hint="Optional"
              error={touched.currentClub ? errors.currentClub : undefined}
            >
              <StatusInput
                icon={UsersRound}
                status={fieldStatus(
                  Boolean(touched.currentClub),
                  errors.currentClub,
                  Boolean(values.currentClub),
                )}
                value={values.currentClub}
                onChange={(event) => update("currentClub", event.target.value)}
                onBlur={() => markTouched("currentClub")}
                placeholder="Club or team name (optional)"
              />
            </Field>

            <Field
              label="Availability"
              error={touched.availability ? errors.availability : undefined}
              required
            >
              <Select
                value={values.availability}
                onValueChange={(value) => {
                  setTouched((previousTouched) => ({ ...previousTouched, availability: true }));
                  update("availability", value);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background/80">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {values.availability === "Missing few matches" && (
              <Field
                label="Not Available On"
                error={touched.notAvailableOn ? errors.notAvailableOn : undefined}
                required
                className="sm:col-span-2"
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {NOT_AVAILABLE_ON_OPTIONS.map((option) => {
                    const checked = values.notAvailableOn.includes(option);
                    return (
                      <label
                        key={option}
                        className={cn(
                          "flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all",
                          checked
                            ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/10"
                            : "border-input bg-background/80 hover:-translate-y-0.5 hover:bg-accent",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleNotAvailableOn(option)}
                        />
                        <span className="font-medium">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </Field>
            )}
          </Section>

          <Section
            index={4}
            total={4}
            icon={ImagePlus}
            title="Photo and fees"
            description="Upload a clear headshot and confirm the fee agreement."
            complete={finalComplete}
            isLast
          >
            <Field
              label="Upload Photo"
              hint="Required clear headshot. JPG, JPEG, or PNG. Max 2 MB."
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
                    your headshot here
                  </span>
                  <span className="text-xs">Max size allowed: 2 MB.</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </Field>

            <Field
              label="Fee agreement"
              error={touched.feeAgreement ? errors.feeAgreement : undefined}
              required
              className="sm:col-span-2"
            >
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border bg-background/80 p-4 text-sm transition-all",
                  values.feeAgreement
                    ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                    : "border-input hover:bg-accent",
                )}
              >
                <Checkbox
                  checked={values.feeAgreement}
                  onCheckedChange={(checked) => {
                    setTouched((previousTouched) => ({ ...previousTouched, feeAgreement: true }));
                    update("feeAgreement", checked === true);
                  }}
                />
                <span className="leading-6">
                  I agree to pay registration fees of AED 60 and match fees of AED 35/- per match.
                </span>
              </label>
            </Field>
          </Section>
        </div>

        <div className="mt-2 flex justify-center">
          <Button
            type="submit"
            disabled={submitting}
            className="animate-pulse-glow h-11 min-w-56 rounded-xl px-8 text-sm font-semibold shadow-[var(--shadow-glow)]"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Submitting" : "Submit registration"}
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>Your details are encrypted and only used to verify your registration.</span>
        </div>

        <div className="mt-6 rounded-2xl border border-border/70 bg-background/70 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-foreground">For more information, contact:</p>
          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <p>
              Hussein Sancha{" "}
              <a className="font-medium text-foreground hover:text-primary" href="tel:0508759122">
                050-8759122
              </a>
            </p>
            <p>
              Qasim Ali{" "}
              <a className="font-medium text-foreground hover:text-primary" href="tel:0507862132">
                050-7862132
              </a>
            </p>
            <p>
              Quaid Joher{" "}
              <a className="font-medium text-foreground hover:text-primary" href="tel:0556086529">
                055-6086529
              </a>
            </p>
          </div>
        </div>
      </div>
    </form>
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
