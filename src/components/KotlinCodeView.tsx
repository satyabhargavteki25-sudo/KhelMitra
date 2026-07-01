/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileCode, Copy, Check, FileJson, FileText, Smartphone, Code, Terminal } from 'lucide-react';
import { kotlinProjectFiles } from '../data/androidKotlinCode';

export default function KotlinCodeView() {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(2); // Default to MainActivity.kt
  const [copied, setCopied] = useState(false);

  const currentFile = kotlinProjectFiles[selectedFileIndex];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.kts')) return <FileCode className="w-4 h-4 text-orange-400" />;
    if (fileName.endsWith('.xml')) return <FileJson className="w-4 h-4 text-amber-500" />;
    return <Terminal className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Title Header */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-bold text-zinc-100 tracking-tight">
            Native Android Source Code
          </h1>
        </div>
        <div className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-400 flex items-center gap-1 font-mono">
          <Smartphone className="w-3 h-3 text-zinc-400" /> Target SDK 34
        </div>
      </div>

      {/* Explanatory banner */}
      <div className="p-3 bg-zinc-900/60 border-b border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed select-text">
        These are the exact production-ready Kotlin and Jetpack Compose source files requested for <strong className="text-emerald-400">KhelMitra</strong>. Integrate these into Android Studio with Google MediaPipe tasks-vision.
      </div>

      {/* File Selector Tabs */}
      <div className="px-3 py-2 bg-zinc-950 flex gap-1.5 overflow-x-auto border-b border-zinc-900 shrink-0 select-none">
        {kotlinProjectFiles.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => {
              setSelectedFileIndex(idx);
              setCopied(false);
            }}
            className={`px-3 py-2 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition border ${
              selectedFileIndex === idx
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-inner'
                : 'bg-zinc-900/40 text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-300'
            }`}
          >
            {getFileIcon(file.name)}
            <span>{file.name}</span>
          </button>
        ))}
      </div>

      {/* Code Display Area */}
      {currentFile && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* File path banner & Copy Button */}
          <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-900/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono shrink-0 select-text">
            <span>{currentFile.path}</span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 flex items-center gap-1.5 transition active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px]">Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Highlighted-like Pre Code block */}
          <div className="flex-1 overflow-auto p-4 bg-zinc-950 text-zinc-300 text-xs font-mono select-text leading-relaxed">
            <pre className="whitespace-pre">{currentFile.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
