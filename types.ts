
export enum EnergyType {
  CHORE = 'CHORE', // Red-Brown [-]
  FUN = 'FUN', // Yellow [+]
  CREATE = 'CREATE', // Blue [-]
  HEAL = 'HEAL', // Green [+]
}

export interface SubStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: EnergyType;
  completed: boolean;
  date?: string; // ISO Date string YYYY-MM-DD
  startTime?: number; // 0-23
  duration: number; // in hours
  energyPoints: number; // +/- value
  substeps: SubStep[];
  description?: string;
}

export interface StickerItem {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ExpenseSummary {
  category: EnergyType;
  total: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number;
}
