/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, Trophy, Code, BookOpen, Smartphone, Settings, Shield, Play, 
  ExternalLink, ChevronRight, CheckCircle2, Sparkles, Activity, FileText, Cpu
} from 'lucide-react';
import AndroidFrame from './components/AndroidFrame';
import PoseCameraView from './components/PoseCameraView';
import LeaderboardView from './components/LeaderboardView';
import KotlinCodeView from './components/KotlinCodeView';
import { AppTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('coach');
  const [workspaceTab, setWorkspaceTab] = useState<'guide' | 'kotlin_files'>('guide');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'coach':
        return <PoseCameraView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'code':
        return <KotlinCodeView />;
      default:
        return <PoseCameraView />;
    }
  };

  return (
    <div id="developer-workspace-root" className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Dynamic Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6 select-none shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] tracking-widest uppercase border border-emerald-500/20 px-2 py-0.5 rounded-full">
                AI Sports Prototype
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-zinc-500 font-mono">Offline-First Capable</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-100 mt-1 flex items-center gap-2">
              KhelMitra Development Portal <span className="text-zinc-600 font-normal">/</span> <span className="text-emerald-400 text-lg font-bold">खेलमित्र</span>
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-zinc-400">MediaPipe Pose: <strong className="text-zinc-200">33-Point Active</strong></span>
            <div className="h-4 w-px bg-zinc-800"></div>
            <span className="text-xs text-zinc-400">Target Framework: <strong className="text-zinc-200">Jetpack Compose</strong></span>
          </div>
        </div>
      </header>

      {/* Main Dual View Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: The Interactive Smartphone Mockup */}
        <section className="lg:col-span-5 flex flex-col items-center">
          <div className="text-center mb-4">
            <h2 className="text-sm font-bold text-zinc-300 tracking-tight flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" /> Interactive Mobile Prototype
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Simulates live webcam capture, skeleton overlay & real-time coaching
            </p>
          </div>

          <AndroidFrame>
            {/* Screen Content Wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
              
              {/* Active Screen Transition */}
              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {renderActiveScreen()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Material 3 Bottom Navigation Bar */}
              <nav className="h-14 bg-zinc-950 border-t border-zinc-900/80 flex items-center justify-around px-4 select-none shrink-0">
                <button
                  onClick={() => setActiveTab('coach')}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-all ${
                    activeTab === 'coach' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Dumbbell className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-tight">AI Coach</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-all ${
                    activeTab === 'leaderboard' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-tight">Leaderboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-all ${
                    activeTab === 'code' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Code className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-tight">Compose Code</span>
                </button>
              </nav>

            </div>
          </AndroidFrame>
        </section>

        {/* RIGHT COLUMN: The Developer Workspace / Project Explorer */}
        <section className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl self-stretch flex flex-col min-h-[600px] lg:h-[820px]">
          
          {/* Workspace Tabs */}
          <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0 select-none">
            <div className="flex gap-4">
              <button
                onClick={() => setWorkspaceTab('guide')}
                className={`text-xs font-bold tracking-tight uppercase pb-1 border-b-2 transition ${
                  workspaceTab === 'guide'
                    ? 'text-emerald-400 border-emerald-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                Integration Guide
              </button>
              <button
                onClick={() => setWorkspaceTab('kotlin_files')}
                className={`text-xs font-bold tracking-tight uppercase pb-1 border-b-2 transition ${
                  workspaceTab === 'kotlin_files'
                    ? 'text-emerald-400 border-emerald-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                Project Codebase
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
              <Settings className="w-3.5 h-3.5 animate-spin-slow" /> Dev Mode Active
            </div>
          </div>

          {/* Workspace Content Display */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {workspaceTab === 'guide' ? (
                <motion.div
                  key="guide"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="p-6 md:p-8 space-y-6 select-text"
                >
                  {/* Executive Overview Card */}
                  <div className="bg-gradient-to-r from-emerald-950/20 to-zinc-900 border border-emerald-500/20 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> KhelMitra: AI Sports Posture Coach
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed mt-2">
                      KhelMitra is an offline-first computer vision sports coaching app built for local performance evaluation. Leveraging Google's <strong>MediaPipe Vision Tasks</strong>, the app maps 33 skeletal body landmarks in real-time under a 10-15ms inference budget. It measures limb alignments, computes joint angles on-device, and triggers rate-limited spoken Hindi corrections.
                    </p>
                  </div>

                  {/* Core Features Specification list */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-3">
                      Architectural Specs & Implementation
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className="w-4 h-4 text-emerald-400" />
                          <h5 className="text-xs font-bold text-zinc-200">Real-Time Landmarkers</h5>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Integrates Google MediaPipe Pose Landmarker (float16 quantization) to extract 33 skeletal points. It draws connecting limbs on a canvas coordinate space.
                        </p>
                      </div>

                      <div className="p-3.5 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <h5 className="text-xs font-bold text-zinc-200">Angle Calculations</h5>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Calculates 2D joint angles (shoulder-elbow-wrist & hip-knee-ankle) via dot products and <code>acos</code> trigonometric mappings on-device.
                        </p>
                      </div>

                      <div className="p-3.5 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <h5 className="text-xs font-bold text-zinc-200">Hindi Audio Feedback</h5>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Binds to native Android <code>TextToSpeech</code> using the <code>Locale("hi", "IN")</code> engine. Intelligent rate-limiting throttles output to 3.5s cycles.
                        </p>
                      </div>

                      <div className="p-3.5 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <h5 className="text-xs font-bold text-zinc-200">Offline Security</h5>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Stores exercise scores with local timestamps in SharedPreferences/localStorage. Completely offline-capable with zero internet traffic or remote dependencies.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Android Integration Steps */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-3">
                      Android Studio Deployment Checklist
                    </h4>
                    <div className="space-y-3 font-sans text-xs">
                      
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center border border-emerald-900 shrink-0 text-[10px]">1</div>
                        <div>
                          <p className="font-semibold text-zinc-200">Copy Gradle Dependencies</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            Open <code className="text-zinc-400">app/build.gradle.kts</code> and paste the required dependencies (CameraX and MediaPipe tasks-vision version 0.10.8). Make sure compilation uses Java 17 compatibility.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center border border-emerald-900 shrink-0 text-[10px]">2</div>
                        <div>
                          <p className="font-semibold text-zinc-200">Add Camera Permission Requests</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            Declare the camera permission and hardware features inside your <code className="text-zinc-400">AndroidManifest.xml</code>. KhelMitra utilizes runtime permissions on first boot.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center border border-emerald-900 shrink-0 text-[10px]">3</div>
                        <div>
                          <p className="font-semibold text-zinc-200">Add the Pose Landmarker Task Asset</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            Download the MediaPipe pose landmarker file (<code className="text-zinc-400">pose_landmarker_full.task</code>) from Google Edge-AI, and place it in the project's <code className="text-zinc-400">app/src/main/assets/</code> folder.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Quick-links banner */}
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>Ready to inspect code files? Jump to the Codebase tab.</span>
                    <button
                      onClick={() => setWorkspaceTab('kotlin_files')}
                      className="text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-0.5 transition"
                    >
                      Browse Files <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="kotlin_files"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="h-full flex flex-col"
                >
                  <KotlinCodeView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </section>

      </main>

    </div>
  );
}
