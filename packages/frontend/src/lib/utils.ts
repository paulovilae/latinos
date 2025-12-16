import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatPercentage(
  value: number,
  decimals: number = 2
): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(
  value: number,
  decimals: number = 2,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: "text-green-600 bg-green-50 border-green-200",
    paused: "text-yellow-600 bg-yellow-50 border-yellow-200",
    stopped: "text-red-600 bg-red-50 border-red-200",
    error: "text-red-600 bg-red-50 border-red-200",
    draft: "text-gray-600 bg-gray-50 border-gray-200",
    published: "text-green-600 bg-green-50 border-green-200",
    archived: "text-gray-600 bg-gray-50 border-gray-200",
  }
  
  return statusColors[status] || "text-gray-600 bg-gray-50 border-gray-200"
}

export function getPnLColor(value: number): string {
  if (value > 0) return "text-green-600"
  if (value < 0) return "text-red-600"
  return "text-gray-600"
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}