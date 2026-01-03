export enum GoalCategory {
  LEARNING = 'Learning',
  BOOK = 'Book',
  MONEY = 'Money',
  GENERAL = 'General'
}

export interface GoalEntry {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  description: string;
  value: number; // The numeric value added/completed
  timestamp: number; // For sorting
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  description?: string;
  targetValue: number; // 0 if not applicable (General with no target)
  currentValue: number; // Aggregated from entries
  unit?: string; // "chapters", "lessons", "INR", etc.
  link?: string; // External link
  entries: GoalEntry[];
}

export interface AppData {
  goals: Goal[];
}