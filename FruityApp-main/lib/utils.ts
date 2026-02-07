import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export const FRUIT_TYPES = [
  'Apples',
  'Apricots',
  'Avocados',
  'Blackberries',
  'Cherries',
  'Figs',
  'Grapefruits',
  'Grapes',
  'Lemons',
  'Limes',
  'Oranges',
  'Peaches',
  'Pears',
  'Plums',
  'Pomegranates',
  'Persimmons',
  'Other'
]

export const QUANTITY_OPTIONS = [
  'A few pieces',
  '1-2 bags',
  '3-5 bags',
  'Many bags',
  'One tree full',
  'Multiple trees'
]
