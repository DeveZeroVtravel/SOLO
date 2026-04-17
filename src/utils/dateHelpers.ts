import { Event } from "@/types";

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getOccurrencesInRange = (event: Event, startDate: Date, endDate: Date): Date[] => {
  const occurrences: Date[] = [];
  const eventStart = new Date(event.date);
  
  if (eventStart > endDate) return occurrences; // Doesn't start until after range

  let current = new Date(eventStart);
  
  // If no recurrence, just check if the single date is in range
  if (!event.recurrence || event.recurrence === "none") {
    if (current >= startDate && current <= endDate) {
      occurrences.push(current);
    }
    return occurrences;
  }

  // Fast forward to startDate if the event started way in the past, to avoid infinite loops
  if (current < startDate) {
    if (event.recurrence === "daily") {
      const daysDiff = Math.ceil((startDate.getTime() - current.getTime()) / (1000 * 3600 * 24));
      current.setDate(current.getDate() + daysDiff);
    } else if (event.recurrence === "weekly") {
      const weeksDiff = Math.ceil((startDate.getTime() - current.getTime()) / (1000 * 3600 * 24 * 7));
      current.setDate(current.getDate() + (weeksDiff * 7));
    } else if (typeof event.recurrence === "number") {
      const intervals = Math.ceil((startDate.getTime() - current.getTime()) / (1000 * 3600 * 24 * event.recurrence));
      current.setDate(current.getDate() + (intervals * event.recurrence));
    }
    // Monthly and yearly are a bit more complex, we'll just loop for simplicity in this demo
  }

  // Iterate and collect dates
  let loopCount = 0; // safety ceiling
  while (current <= endDate && loopCount < 1000) {
    if (current >= startDate) {
      occurrences.push(new Date(current));
    }

    if (event.recurrence === "daily") {
      current.setDate(current.getDate() + 1);
    } else if (event.recurrence === "weekly") {
      current.setDate(current.getDate() + 7);
    } else if (event.recurrence === "monthly") {
      current.setMonth(current.getMonth() + 1);
    } else if (event.recurrence === "yearly") {
      current.setFullYear(current.getFullYear() + 1);
    } else if (typeof event.recurrence === "number") {
      current.setDate(current.getDate() + event.recurrence);
    } else {
      break; // unknown recurrence
    }
    loopCount++;
  }

  return occurrences;
};
