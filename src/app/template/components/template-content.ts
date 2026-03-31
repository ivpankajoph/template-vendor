"use client";

export const hasConfiguredValue = (value: unknown) =>
  value !== undefined && value !== null;

export const hasMeaningfulText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const configuredText = (value: unknown, fallback = ""): string => {
  if (!hasConfiguredValue(value)) return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

export const configuredArray = <T,>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;
