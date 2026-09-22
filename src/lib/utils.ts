import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Splits a string into words while keeping them individually wrappable. */
export function words(text: string) {
  return text.split(/(\s+)/).filter((chunk) => chunk.length > 0);
}
