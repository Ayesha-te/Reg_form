export const COUNTRY_CITY_MAP: Record<string, string[]> = {
  UAE: ["Dubai", "Sharjah", "Abu Dhabi", "Ajman", "Ras Al Khaimah"],
  India: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata"],
  USA: ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco"],
  UK: ["London", "Manchester", "Birmingham", "Liverpool", "Edinburgh"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
};

export const COUNTRIES = Object.keys(COUNTRY_CITY_MAP);

export const INTEREST_OPTIONS = [
  "Sports",
  "Music",
  "Travel",
  "Reading",
  "Gaming",
  "Cooking",
  "Movies",
  "Technology",
];

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

export const MAX_FILE_SIZE = 1024 * 1024;
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];