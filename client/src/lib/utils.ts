import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if today
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateObj.toDateString() === today.toDateString()) {
    return "Today";
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // If within the past week
  const diffTime = Math.abs(today.getTime() - dateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return `${diffDays} days ago`;
  }
  
  // If within the past month
  if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Default to formatted date
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getRiskColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'low':
      return '#50cd89'; // success
    case 'medium':
      return '#ffc700'; // warning
    case 'high':
      return '#f1416c'; // danger
    default:
      return '#a1a5b7'; // muted
  }
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'compliant':
    case 'valid':
    case 'approved':
    case 'completed':
      return 'success';
    case 'pending':
    case 'pending review':
    case 'in progress':
      return 'warning';
    case 'non-compliant':
    case 'invalid':
    case 'expired':
    case 'overdue':
      return 'danger';
    default:
      return 'muted';
  }
}

export function classifyTaskStatus(dueDate: Date | null | undefined, completed: boolean): string {
  if (completed) return "completed";
  
  if (!dueDate) return "upcoming";
  
  const now = new Date();
  
  if (dueDate < now) {
    return "overdue";
  }
  
  // If today
  if (dueDate.toDateString() === now.toDateString()) {
    return "today";
  }
  
  return "upcoming";
}

export function formatDateRelative(date: Date | string | undefined): string {
  if (!date) return "No date";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  // If in the past
  if (dateObj < now) {
    return `${formatDate(dateObj)} (overdue)`;
  }
  
  // If today
  if (dateObj.toDateString() === now.toDateString()) {
    return "Today";
  }
  
  // If tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateObj.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  
  // If within a week
  const diffTime = Math.abs(dateObj.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return `In ${diffDays} days`;
  }
  
  // Otherwise format the date
  return `In ${Math.floor(diffDays / 7)} weeks`;
}
