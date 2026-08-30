import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Single shared utility for the whole Admin app.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
