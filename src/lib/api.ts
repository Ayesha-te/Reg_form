const DEFAULT_API_BASE_URL = "https://form-backend-sepia.vercel.app";
const SUPABASE_STORAGE_BUCKET = "registration-photos";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
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
    fullName: string;
    photoPath: string;
    createdAt: string;
  };
};

export type RegistrationSubmission = {
  id: string | number;
  fullName?: string;
  full_name?: string;
  email: string;
  mobile: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender: string;
  interests?: string[];
  country: string;
  city: string;
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
