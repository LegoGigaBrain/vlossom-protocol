/**
 * Utility functions
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in cents to ZAR display format
 * @param cents - Amount in cents (e.g., 35000 for R350)
 */
export function formatPrice(cents: string | number): string {
  const amount = typeof cents === "string" ? parseInt(cents, 10) : cents;
  return `R${(amount / 100).toFixed(2)}`;
}

/**
 * Format duration in minutes to human-readable format
 * @param minutes - Duration in minutes
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Format date for display
 * @param date - Date object or ISO string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  // "Mon, 15 Jan 2025"
}

/**
 * Format time from "HH:MM" to 12-hour format
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
  // "10:00 AM"
}

/**
 * Format ISO datetime to time display
 */
export function formatTimeFromDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  // "10:00 AM"
}

/**
 * Format full datetime for display
 */
export function formatDateTime(date: Date | string, time?: string): string {
  if (time) {
    return `${formatDate(date)} at ${formatTime(time)}`;
  }
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatDate(d)} at ${formatTimeFromDate(d)}`;
  // "Mon, 15 Jan 2025 at 10:00 AM"
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * Get hours until a given datetime
 */
export function hoursUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return (d.getTime() - now.getTime()) / (1000 * 60 * 60);
}
