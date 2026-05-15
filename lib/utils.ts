import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = (url: string) => fetch(url).then(r => r.json());

// Extracts language names from ISO 639-1 language codes (e.g., 'en' -> 'English')
export function getLanguageName(languageCode: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    return displayNames.of(languageCode) || languageCode.toUpperCase();
  } catch (error) {
    return languageCode.toUpperCase();
  }
}
