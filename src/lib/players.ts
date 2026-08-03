import {
  API_BASE_URL,
  REGISTRATION_PHOTOS_PUBLIC_BASE_URL,
  type RegistrationSubmission,
} from "@/lib/api";

export const PLAYER_ROSTER = [
  "Aadil Farooq",
  "Aamir Khan",
  "Abbas Kapadia",
  "Abbas Saify",
  "Abbas Hn",
  "Abbas Saifuddin",
  "Abishek Sudheer",
  "Afzal Khan",
  "Ahmad Waleed",
  "Akhil C Bhaskar",
  "Ali Balsi",
  "Ali Sajjad",
  "Ali Asghar Bhuriwala",
  "Aman Mishra",
  "Amir Parvez",
  "Aswin Jayaprakash",
  "Bhavesh Bharwani",
  "Bilal Noortheen",
  "Burhan Godhrawala",
  "Deepak Chand",
  "Deepu Devnani",
  "Fakhruddin Kanchwala",
  "Hasnen Valikarim",
  "Husain Yusuf Tinwala",
  "Hussain Abid Hussain",
  "Hussain Lakdawala",
  "Huzaifa Ayaz",
  "Huzaifa Mohammed Bastawala",
  "Huzefa Tarwala",
  "Huzefa Gangardiwala",
  "Huzefa Kanchwala",
  "Kevin Raj",
  "Kumail Tinwala",
  "Max Snow",
  "Mohammad Ali",
  "Mufaddal Tinwala",
  "Mufaddal Merchant",
  "Muffy Mama",
  "Muhammad Khan",
  "Muhammad Jodiawala",
  "Murtaza Pagri",
  "Mustafa Abdul Taiyab",
  "Mustafa Sadriwala",
  "Mustafa Tinwala",
  "Nitin Mahajan",
  "Pulkit Chhabra",
  "R Chaitanya",
  "Rasim Bhat",
  "Rohan Nanda",
  "Saifan Mukadam",
  "Saifee Virpurwala",
  "Sandeep Khedekar",
  "Saumyadeep Halder",
  "Schnian Mir",
  "Shabbir Mustansir",
  "Shabbir Alam",
  "Shabbir A Pumpwala",
  "Shane Fernandes",
  "Shankar A",
  "Sikander Khan",
  "Srinath Mehta",
  "Suraj Anand",
  "Taha Ali",
  "Tanweer Mughal",
  "Vivek Dubey",
  "Yasir Nadeem",
  "Zeeshan Ashrafi",
  "Zeeshan Khan",
  "Husain Motorwala",
  "Rahul Chhabra",
  "Mohammad Shahnawaz Khan",
  "Vikash Tripathi",
  "Raj Arakkal",
] as const;

export type GalleryPlayer = {
  id: string | number;
  name: string;
  photoUrl: string;
  focalPosition: string;
};

// Optional portrait art direction. Add an entry only when a source photo needs
// a different crop; names use the same exact normalization as roster matching.
export const PLAYER_PHOTO_FOCAL_POINTS: Record<string, string> = {
  "ali asghar bhuriwala": "50% 18%",
  "huzaifa mohammed bastawala": "50% 16%",
  "mohammad shahnawaz khan": "50% 18%",
};

export function normalizePlayerName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getSubmissionName(submission: RegistrationSubmission) {
  const firstName = submission.firstName ?? submission.first_name ?? "";
  const lastName = submission.lastName ?? submission.last_name ?? "";
  return (
    [firstName, lastName].filter(Boolean).join(" ") ||
    submission.fullName ||
    submission.full_name ||
    ""
  );
}

export function getSubmissionPhotoUrl(submission: RegistrationSubmission) {
  const directUrl = submission.photoUrl ?? submission.photo_url;
  if (directUrl) return directUrl;
  const photoPath = submission.photoPath ?? submission.photo_path;
  if (!photoPath) return null;
  if (/^https?:\/\//i.test(photoPath)) return photoPath;
  const cleanPath = photoPath.replace(/^\/+/, "");
  if (REGISTRATION_PHOTOS_PUBLIC_BASE_URL) {
    const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
    return `${REGISTRATION_PHOTOS_PUBLIC_BASE_URL}/${encodedPath}`;
  }
  return `${API_BASE_URL}/${cleanPath}`;
}

export type PlayerMatchResult =
  | { status: "matched"; name: string }
  | { status: "not-found" }
  | { status: "ambiguous" };

export function findEligiblePlayer(
  submissions: RegistrationSubmission[],
  requestedName: string,
): PlayerMatchResult {
  const key = normalizePlayerName(requestedName);
  if (!key) return { status: "not-found" };
  const matches = submissions.filter(
    (submission) =>
      normalizePlayerName(getSubmissionName(submission)) === key &&
      Boolean(getSubmissionPhotoUrl(submission)),
  );
  if (matches.length === 0) return { status: "not-found" };
  if (matches.length > 1) return { status: "ambiguous" };
  return { status: "matched", name: getSubmissionName(matches[0]).trim() };
}

export function matchRosterPlayers(
  submissions: RegistrationSubmission[],
  roster: readonly string[] = PLAYER_ROSTER,
): GalleryPlayer[] {
  const recordsByName = new Map<string, RegistrationSubmission[]>();
  for (const submission of submissions) {
    const key = normalizePlayerName(getSubmissionName(submission));
    if (!key) continue;
    recordsByName.set(key, [...(recordsByName.get(key) ?? []), submission]);
  }

  return roster.flatMap((rosterName) => {
    const matches = (recordsByName.get(normalizePlayerName(rosterName)) ?? []).filter((record) =>
      Boolean(getSubmissionPhotoUrl(record)),
    );
    if (matches.length !== 1) {
      console.warn(
        `[Players] Omitted ${rosterName}: expected one submission with a photo, found ${matches.length}.`,
      );
      return [];
    }
    return [
      {
        id: matches[0].id,
        name: rosterName,
        photoUrl: getSubmissionPhotoUrl(matches[0])!,
        focalPosition: PLAYER_PHOTO_FOCAL_POINTS[normalizePlayerName(rosterName)] ?? "50% 20%",
      },
    ];
  });
}

export function safePlayerFilename(name: string, extension = "jpg") {
  const base = name
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "player"}.${extension}`;
}
