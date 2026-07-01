/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JointPoint } from '../types';

/**
 * Calculates the angle (in degrees) at vertex B formed by points A, B, and C.
 * Formula: BA . BC / (|BA| * |BC|)
 */
export function calculateAngle(a: JointPoint, b: JointPoint, c: JointPoint): number {
  if (!a || !b || !c) return 0;

  // Vectors
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  // Dot product
  const dotProduct = baX * bcX + baY * bcY;

  // Magnitudes
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (magBA === 0 || magBC === 0) return 0;

  // Cosine of angle
  let cosTheta = dotProduct / (magBA * magBC);
  // Clamp to avoid rounding floating point errors
  cosTheta = Math.max(-1, Math.min(1, cosTheta));

  const angleRad = Math.acos(cosTheta);
  return Math.round(angleRad * (180 / Math.PI));
}

/**
 * Computes an overall form score (0-100) based on joint angles.
 */
export function getFormScore(
  leftElbow: number,
  rightElbow: number,
  rightKnee: number,
  exercise: string
): number {
  // If no pose is detected, return 0
  if (leftElbow === 0 && rightElbow === 0 && rightKnee === 0) return 0;

  if (exercise === 'bicep_curl') {
    // Focus on elbows
    const activeElbow = rightElbow > 0 ? rightElbow : leftElbow;
    if (activeElbow === 0) return 0;

    // Ideal range: 120 - 160
    if (activeElbow >= 120 && activeElbow <= 160) {
      return 100;
    } else if (activeElbow > 160) {
      // Straight arm: penalty gets higher as it goes to 180
      const diff = activeElbow - 160;
      return Math.max(40, Math.round(100 - (diff / 20) * 40));
    } else {
      // Bended arm: penalty gets higher as it gets too narrow (< 120)
      const diff = 120 - activeElbow;
      return Math.max(30, Math.round(100 - (diff / 60) * 70));
    }
  } else if (exercise === 'squats') {
    // Focus on right knee
    if (rightKnee === 0) return 0;

    // Ideal squat knee range: 90 to 115 degrees
    if (rightKnee >= 90 && rightKnee <= 115) {
      return 100;
    } else if (rightKnee > 115) {
      // Standing up: penalty increases up to 180
      const diff = rightKnee - 115;
      return Math.max(30, Math.round(100 - (diff / 65) * 70));
    } else {
      // Too deep: knee angle < 90
      const diff = 90 - rightKnee;
      return Math.max(20, Math.round(100 - (diff / 50) * 80));
    }
  } else {
    // General Posture Check
    // Combines elbow and knee alignment
    const elbowScore = rightElbow >= 120 && rightElbow <= 160 ? 100 : 70;
    const kneeScore = rightKnee >= 130 && rightKnee <= 170 ? 100 : 60;
    return Math.round((elbowScore + kneeScore) / 2);
  }
}
