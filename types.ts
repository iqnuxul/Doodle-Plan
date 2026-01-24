export enum TaskType {
  CHORE = 'CHORE',
  WORK = 'WORK',
  MEAL = 'MEAL',
  SHOPPING = 'SHOPPING',
  EVENT = 'EVENT',
  HOBBY = 'HOBBY',
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  completed: boolean;
  date?: string; // ISO Date string YYYY-MM-DD
  startTime?: number; // 0-23
  duration?: number; // in hours
  cost?: number;
  dependencies?: string[]; // IDs of tasks this depends on
  description?: string;
  isSticker?: boolean; // If true, it's a generated image
  imageUrl?: string;
}

export interface ExpenseSummary {
  category: TaskType;
  total: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number;
}
