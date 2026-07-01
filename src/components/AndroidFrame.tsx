/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Zap } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export default function AndroidFrame({ children }: AndroidFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="android-phone-frame" className="relative mx-auto w-full max-w-[410px] h-[820px] rounded-[50px] border-[10px] border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden ring-1 ring-zinc-700/50 flex flex-col select-none transition-all duration-300">
      {/* Speaker and Front Camera Notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-36 bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-between px-6">
        {/* Speaker line */}
        <div className="h-1 w-12 bg-zinc-700 rounded-full"></div>
        {/* Camera lens */}
        <div className="h-2 w-2 rounded-full bg-zinc-900 border border-zinc-700 ring-1 ring-emerald-500/20"></div>
      </div>

      {/* Side Volume Buttons on the Left */}
      <div className="absolute left-[-13px] top-32 w-[3px] h-12 bg-zinc-800 rounded-l-md"></div>
      <div className="absolute left-[-13px] top-48 w-[3px] h-16 bg-zinc-800 rounded-l-md"></div>
      
      {/* Power Button on the Right */}
      <div className="absolute right-[-13px] top-36 w-[3px] h-14 bg-zinc-800 rounded-r-md"></div>

      {/* Status Bar */}
      <div className="pt-7 px-6 pb-2 bg-zinc-950 text-zinc-300 text-xs font-sans font-medium flex items-center justify-between z-40 select-none">
        <span className="text-zinc-200 tracking-wide font-mono">{time}</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded-sm border border-emerald-900/30">KhelMitra AI</span>
          <Signal className="w-3.5 h-3.5 text-zinc-300" />
          <Wifi className="w-3.5 h-3.5 text-zinc-300" />
          <div className="flex items-center gap-0.5">
            <Battery className="w-4 h-4 text-zinc-300 rotate-90 scale-90" />
            <span className="text-[9px] font-mono text-zinc-400">89%</span>
          </div>
        </div>
      </div>

      {/* Main Screen Content Area */}
      <div className="flex-1 flex flex-col bg-zinc-900 relative overflow-hidden">
        {children}
      </div>

      {/* Android Bottom Navigation Bar (Software Pill) */}
      <div className="h-4 bg-zinc-950 flex items-center justify-center pb-1.5 z-40">
        <div className="w-32 h-1 bg-zinc-600 rounded-full"></div>
      </div>
    </div>
  );
}
