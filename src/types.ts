/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SavedScore {
  id: string;
  exercise: string;
  score: number;
  timestamp: number;
  maxLeftElbow: number;
  maxRightElbow: number;
  maxRightKnee: number;
  durationSeconds: number;
}

export interface JointPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface AnglesResult {
  leftElbow: number;
  rightElbow: number;
  rightKnee: number;
}

export interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

export type AppTab = 'coach' | 'leaderboard' | 'code';
export type ExerciseType = 'bicep_curl' | 'squats' | 'posture_check';
