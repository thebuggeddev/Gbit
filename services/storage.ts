import { AppData, Goal, GoalEntry } from '../types';

const STORAGE_KEY = '2026_GOAL_PLANNER_DATA';

const INITIAL_DATA: AppData = {
  goals: []
};

export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_DATA;
  } catch (error) {
    console.error("Failed to load data", error);
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data", error);
  }
};

export const calculateProgress = (goal: Goal): number => {
  if (goal.targetValue <= 0) return 0;
  // Limit to 100% for visuals, but value can go higher
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Learning': return 'bg-neo-blue';
    case 'Book': return 'bg-neo-yellow';
    case 'Money': return 'bg-green-400';
    case 'General': return 'bg-neo-accent';
    default: return 'bg-gray-200';
  }
};