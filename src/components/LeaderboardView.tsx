/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock, Trash2, Dumbbell, Award, ChevronRight, Activity } from 'lucide-react';
import { SavedScore } from '../types';

export default function LeaderboardView() {
  const [scores, setScores] = useState<SavedScore[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = () => {
    try {
      const stored = localStorage.getItem('khelmitra_scores');
      if (stored) {
        const parsed: SavedScore[] = JSON.parse(stored);
        // Sort descending by score, then by timestamp
        parsed.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
        setScores(parsed);
      } else {
        setScores([]);
      }
    } catch (e) {
      console.error("Failed to load scores:", e);
    }
  };

  const deleteScore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('khelmitra_scores');
      if (stored) {
        const parsed: SavedScore[] = JSON.parse(stored);
        const updated = parsed.filter(item => item.id !== id);
        localStorage.setItem('khelmitra_scores', JSON.stringify(updated));
        loadScores();
      }
    } catch (e) {
      console.error("Failed to delete score:", e);
    }
  };

  const clearAllScores = () => {
    if (confirm("Are you sure you want to clear all saved scores?")) {
      try {
        localStorage.removeItem('khelmitra_scores');
        setScores([]);
      } catch (e) {
        console.error("Failed to clear scores:", e);
      }
    }
  };

  const filteredScores = filter === 'all' 
    ? scores 
    : scores.filter(s => s.exercise === filter);

  const getExerciseLabel = (key: string) => {
    switch (key) {
      case 'bicep_curl': return 'Bicep Curls';
      case 'squats': return 'Squats';
      default: return 'Posture Check';
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-amber-500/20 text-amber-300 border border-amber-500/40'; // Gold
    if (index === 1) return 'bg-zinc-300/20 text-zinc-300 border border-zinc-400/40'; // Silver
    if (index === 2) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'; // Bronze
    return 'bg-zinc-800 text-zinc-400 border border-zinc-700/50';
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Title Header */}
      <div className="p-4 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">लीडरबोर्ड (Leaderboard)</h1>
        </div>
        {scores.length > 0 && (
          <button
            onClick={clearAllScores}
            className="text-xs text-red-400 hover:text-red-300 bg-red-950/30 px-2.5 py-1.5 rounded-lg border border-red-900/40 flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto bg-zinc-900/40 border-b border-zinc-800/60 shrink-0">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            filter === 'all'
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800'
          }`}
        >
          All Activities
        </button>
        <button
          onClick={() => setFilter('bicep_curl')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${
            filter === 'bicep_curl'
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800'
          }`}
        >
          <Dumbbell className="w-3 h-3" /> Bicep Curls
        </button>
        <button
          onClick={() => setFilter('squats')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${
            filter === 'squats'
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800'
          }`}
        >
          <Activity className="w-3 h-3" /> Squats
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-zinc-900 to-zinc-950">
        {filteredScores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800/80 border border-zinc-700/40 flex items-center justify-center mb-4 text-zinc-500 ring-4 ring-zinc-900">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">No records found</h3>
            <p className="text-xs text-zinc-500 max-w-[220px] mt-2 leading-relaxed">
              Start an exercise coaching session on the Coach screen, maintain great form, and click "Save Score" to make your mark here!
            </p>
          </div>
        ) : (
          filteredScores.map((score, index) => {
            const overallRank = scores.findIndex(s => s.id === score.id);
            return (
              <div
                key={score.id}
                className="group relative flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl hover:border-zinc-700/80 transition-all duration-200 shadow-md overflow-hidden"
              >
                {/* Ranking Emblem */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${getRankStyle(overallRank)}`}>
                  {overallRank + 1}
                </div>

                {/* Score Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1">
                      {score.exercise === 'bicep_curl' ? (
                        <Dumbbell className="w-3.5 h-3.5 text-emerald-400 inline" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-emerald-400 inline" />
                      )}
                      {getExerciseLabel(score.exercise)}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(score.timestamp)}</span>
                    </div>
                  </div>

                  {/* Angles metrics */}
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-zinc-500" /> {score.durationSeconds}s
                    </span>
                    {score.exercise === 'bicep_curl' ? (
                      <>
                        {score.maxRightElbow > 0 && (
                          <span>R-Elb: <b className="text-zinc-200">{score.maxRightElbow}°</b></span>
                        )}
                        {score.maxLeftElbow > 0 && (
                          <span>L-Elb: <b className="text-zinc-200">{score.maxLeftElbow}°</b></span>
                        )}
                      </>
                    ) : (
                      <span>R-Knee: <b className="text-zinc-200">{score.maxRightKnee}°</b></span>
                    )}
                  </div>
                </div>

                {/* Dynamic circular display score */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-extrabold text-emerald-400 font-mono tracking-tight">
                      {score.score}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Form</span>
                  </div>
                  
                  <button
                    onClick={(e) => deleteScore(score.id, e)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition duration-150"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decorative summary statistics at bottom */}
      {scores.length > 0 && (
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800/80 shrink-0 text-[11px] text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>High Score: <strong className="text-zinc-200">{Math.max(...scores.map(s => s.score))}</strong></span>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div>
            <span>Total Workouts: <strong className="text-zinc-200">{scores.length}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
