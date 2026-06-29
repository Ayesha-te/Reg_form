const SUPABASE_STORAGE_BUCKET = "registration-photos";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (
  configuredApiBaseUrl ||
  (import.meta.env.DEV ? "http://localhost:4000" : "")
).replace(/\/$/, "");

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");

export const REGISTRATION_PHOTOS_PUBLIC_BASE_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}`
  : "";

export type ApiErrorResponse = {
  ok: false;
  message?: string;
  errors?: Record<string, string>;
};

export type RegistrationResponse = {
  ok: true;
  message: string;
  registration: {
    id: number;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    photoPath: string;
    createdAt: string;
  };
};

export type RegistrationSubmission = {
  id: string | number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  mobile: string;
  whatsappNumber?: string;
  whatsapp_number?: string;
  jerseyName?: string;
  jersey_name?: string;
  jerseyNumber?: string;
  jersey_number?: string;
  jerseySize?: string;
  jersey_size?: string;
  preferredSleeves?: string;
  preferred_sleeves?: string;
  currentClub?: string;
  current_club?: string;
  availability?: string;
  notAvailableOn?: string[];
  not_available_on?: string[];
  feeAgreement?: boolean;
  fee_agreement?: boolean;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: string;
  interests?: string[];
  country?: string;
  city?: string;
  photoPath?: string | null;
  photo_path?: string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
  createdAt?: string;
  created_at?: string;
};

export type RegistrationsListResponse =
  | RegistrationSubmission[]
  | {
      ok?: boolean;
      registrations?: RegistrationSubmission[];
      data?: RegistrationSubmission[];
      message?: string;
    };
