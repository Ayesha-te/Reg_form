import "./lib/error-capture";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

import { MongoClient } from "mongodb";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type RegistrationRow =
  | {
      _id?: { toString(): string };
      first_name?: string;
      last_name?: string;
      full_name?: string;
      email?: string;
      mobile?: string;
      whatsapp_number?: string;
      jersey_name?: string;
      jersey_number?: string;
      jersey_size?: string;
      preferred_sleeves?: string;
      current_club?: string;
      availability?: string;
      not_available_on?: string[];
      fee_agreement?: boolean;
      photo_path?: string;
      original_photo_name?: string;
      created_at?: string;
    }
  | null
  | undefined;

let serverEntryPromise: Promise<ServerEntry> | undefined;
let mongoClient: MongoClient | undefined;

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const uploadDir = join(process.env.TMPDIR ?? process.env.TEMP ?? "/tmp", "uploads");
const MONGODB_URI =
  process.env.MONGODB_URI ??
  (process.env.NODE_ENV === "production" ? undefined : "mongodb://localhost:27017");
const MONGODB_DB = process.env.MONGODB_DB ?? "registrations_db";

const JERSEY_SIZES = new Set(["Small", "Medium", "Large", "XL", "XXL", "3XL", "4XL"]);
const PREFERRED_SLEEVES = new Set(["Full Sleeves", "Half Sleeves"]);
const AVAILABILITY_OPTIONS = new Set(["Available all matches", "Missing few matches"]);
const REGISTRATION_OPEN = false;
const REGISTRATION_CLOSED_MESSAGE =
  "Registration for ICRL 3.0 is closed and no longer accepting new submissions.";

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function getRegistrationsCollection() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in production.");
  }

  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
  }

  return mongoClient.db(MONGODB_DB).collection("registrations");
}

async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json(200, { ok: true, service: "registration-api", storage: "mongodb" });
  }

  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === "GET" && url.pathname === "/api/registrations") {
    const collection = await getRegistrationsCollection();
    const docs = await collection.find().sort({ _id: -1 }).limit(50).toArray();
    return json(200, { ok: true, registrations: docs.map(formatRegistration) });
  }

  if (request.method === "POST" && url.pathname === "/api/registrations") {
    return handleRegistration(request);
  }

  if (request.method === "GET" && url.pathname.startsWith("/uploads/")) {
    return serveUploadedFile(url.pathname);
  }

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) {
    return json(404, { ok: false, message: "Route not found." });
  }

  return null;
}

async function handleRegistration(request: Request) {
  if (!REGISTRATION_OPEN) {
    return json(403, {
      ok: false,
      message: REGISTRATION_CLOSED_MESSAGE,
    });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return json(415, {
      ok: false,
      message: "Use multipart/form-data to submit the registration.",
    });
  }

  const formData = await request.formData();
  const registration = normalizeRegistration(formData);
  const photo = formData.get("photo");
  const errors = await validateRegistration(registration, photo);

  if (Object.keys(errors).length > 0) {
    return json(400, {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors,
    });
  }

  const file = photo as File;
  const photoBuffer = Buffer.from(await file.arrayBuffer());
  const imageExtension = detectImageExtension(photoBuffer);
  const storedFileName = `${randomUUID()}${imageExtension}`;
  const photoPath = `/uploads/${storedFileName}`;
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, storedFileName), photoBuffer, { flag: "wx" });

  const collection = await getRegistrationsCollection();
  const insertDoc = {
    first_name: registration.firstName,
    last_name: registration.lastName,
    full_name: `${registration.firstName} ${registration.lastName}`.trim(),
    email: registration.email,
    mobile: registration.mobile,
    whatsapp_number: registration.whatsappNumber,
    jersey_name: registration.jerseyName,
    jersey_number: registration.jerseyNumber,
    jersey_size: registration.jerseySize,
    preferred_sleeves: registration.preferredSleeves,
    current_club: registration.currentClub,
    availability: registration.availability,
    not_available_on: registration.notAvailableOn,
    fee_agreement: registration.feeAgreement,
    photo_path: photoPath,
    original_photo_name: file.name,
    created_at: new Date().toISOString(),
  };

  const result = await collection.insertOne(insertDoc);
  const saved = await collection.findOne({ _id: result.insertedId });

  return json(201, {
    ok: true,
    message: "Registration submitted successfully.",
    registration: formatRegistration(saved),
  });
}

async function serveUploadedFile(pathname: string) {
  const fileName = decodeURIComponent(pathname.replace(/^\/uploads\//, ""));
  const filePath = resolve(uploadDir, fileName);
  const safeRelativePath = relative(uploadDir, filePath);

  if (!fileName || safeRelativePath.startsWith("..")) {
    return json(400, { ok: false, message: "Invalid upload path." });
  }

  try {
    await stat(filePath);
  } catch {
    return json(404, { ok: false, message: "Uploaded file not found." });
  }

  const body = await readFile(filePath);
  return new Response(body, {
    status: 200,
    headers: {
      ...corsHeaders(),
      "content-type": imageContentType(extname(fileName)),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

function normalizeRegistration(formData: FormData) {
  return {
    firstName: getString(formData, "firstName").trim(),
    lastName: getString(formData, "lastName").trim(),
    email: getString(formData, "email").trim().toLowerCase(),
    mobile: getString(formData, "mobile").trim(),
    whatsappNumber: getString(formData, "whatsappNumber").trim(),
    jerseyName: getString(formData, "jerseyName").trim(),
    jerseyNumber: getString(formData, "jerseyNumber").trim(),
    jerseySize: getString(formData, "jerseySize").trim(),
    preferredSleeves: getString(formData, "preferredSleeves").trim(),
    currentClub: getString(formData, "currentClub").trim(),
    availability: getString(formData, "availability").trim(),
    notAvailableOn: formData
      .getAll("notAvailableOn")
      .map((value) => String(value).trim())
      .filter(Boolean),
    feeAgreement: getString(formData, "feeAgreement").trim() === "true",
  };
}

async function validateRegistration(
  registration: ReturnType<typeof normalizeRegistration>,
  photo: FormDataEntryValue | null,
) {
  const errors: Record<string, string> = {};
  const phoneRegex = /^(\+9715\d{8}|\d{10})$/;

  if (!registration.firstName) errors.firstName = "First name is required.";
  if (!registration.lastName) errors.lastName = "Last name is required.";
  if (!phoneRegex.test(registration.mobile))
    errors.mobile = "Use 10 digits or UAE format +9715XXXXXXXX.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email))
    errors.email = "Enter a valid email address.";
  if (!phoneRegex.test(registration.whatsappNumber))
    errors.whatsappNumber = "Use 10 digits or UAE format +9715XXXXXXXX.";
  if (!registration.jerseyName) errors.jerseyName = "Name of jersey is required.";
  if (!/^\d{1,3}$/.test(registration.jerseyNumber))
    errors.jerseyNumber = "Jersey number must be whole numbers only.";
  if (!JERSEY_SIZES.has(registration.jerseySize)) errors.jerseySize = "Select a jersey size.";
  if (!PREFERRED_SLEEVES.has(registration.preferredSleeves))
    errors.preferredSleeves = "Select preferred sleeves.";
  if (!AVAILABILITY_OPTIONS.has(registration.availability))
    errors.availability = "Select availability.";
  if (
    registration.availability === "Missing few matches" &&
    registration.notAvailableOn.length === 0
  ) {
    errors.notAvailableOn = "Select at least one match.";
  }
  if (!registration.feeAgreement)
    errors.feeAgreement = "You must agree to the registration and match fees.";

  if (!(photo instanceof File) || photo.size === 0) {
    errors.photo = "Upload a JPG or PNG photo under 2 MB.";
  } else if (!["image/jpeg", "image/jpg", "image/png"].includes(photo.type.toLowerCase())) {
    errors.photo = "Only JPG, JPEG, or PNG files are allowed.";
  } else if (photo.size > MAX_FILE_SIZE) {
    errors.photo = "Photo must be 2 MB or smaller.";
  } else {
    const buffer = Buffer.from(await photo.arrayBuffer());
    if (!detectImageExtension(buffer)) errors.photo = "Upload a valid JPG or PNG image.";
  }

  return errors;
}

function formatRegistration(row: RegistrationRow) {
  return {
    id: row?._id ? String(row._id) : "",
    firstName: row?.first_name,
    lastName: row?.last_name,
    fullName: row?.full_name,
    email: row?.email,
    mobile: row?.mobile,
    whatsappNumber: row?.whatsapp_number,
    jerseyName: row?.jersey_name,
    jerseyNumber: row?.jersey_number,
    jerseySize: row?.jersey_size,
    preferredSleeves: row?.preferred_sleeves,
    currentClub: row?.current_club,
    availability: row?.availability,
    notAvailableOn: Array.isArray(row?.not_available_on) ? row.not_available_on : [],
    feeAgreement: Boolean(row?.fee_agreement),
    photoPath: row?.photo_path,
    originalPhotoName: row?.original_photo_name,
    createdAt: row?.created_at,
  };
}

function detectImageExtension(buffer: Buffer) {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return ".jpg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return ".png";
  }
  return "";
}

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function imageContentType(extension: string) {
  return extension.toLowerCase() === ".png" ? "image/png" : "image/jpeg";
}

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type, Accept",
  };
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const apiResponse = await handleApiRequest(request);
      if (apiResponse) return apiResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
