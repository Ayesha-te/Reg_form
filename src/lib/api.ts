const DEFAULT_API_BASE_URL = "https://form-backend-sepia.vercel.app";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, "");

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
