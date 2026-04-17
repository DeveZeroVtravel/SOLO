export interface Task {
  id?: string;
  title: string;
  content?: string;
  subtasks?: string[];
  isDone: boolean;
  date?: string;
  userId: string;
  createdAt: number;
}

export interface Event {
  id?: string;
  title: string;
  content?: string;
  date: string; // ISO string format
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly" | number;
  reminderDays?: number;
  userId: string;
  createdAt: number;
}
