/**
 * Code & Circuit App — Functional Specification v1
 * Survey Bin Pilot Platform
 * Cosmic Workshop Standard CW-01
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicWebsite } from './components/website/PublicWebsite';
import { MobileShell } from './components/layout/MobileShell';
import { ArrowLeft, Smartphone } from 'lucide-react';

function MainRouter() {
  const { role, setRole, isAdminAuthenticated } = useApp();
  const [viewMode, setViewMode] = useState<'website' | 'app'>('website');

  if (viewMode === 'app') {
    return (
      <div className="relative">
        <div className="bg-[#050B14] border-b border-[#7FD8E8]/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-[#F2EAD6]">
          <button
            type="button"
            onClick={() => setViewMode('website')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#1F8F82] hover:bg-[#18756a] text-white font-bold cursor-pointer transition-colors shadow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Public Website</span>
          </button>
          <span className="text-[#7FD8E8]">Staff Mobile Operational Terminal (CW-01)</span>
        </div>
        <MobileShell />
      </div>
    );
  }

  return (
    <div className="relative">
      <PublicWebsite />

      {/* Floating shortcut to switch to Staff Hardware App if needed */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          type="button"
          onClick={() => setViewMode('app')}
          className="flex items-center gap-2 bg-[#0E1E3C]/95 hover:bg-[#16336E] border border-[#7FD8E8]/50 px-3.5 py-2 text-[#7FD8E8] hover:text-white font-mono text-xs font-bold shadow-2xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
          title="Switch to Staff Hardware App"
        >
          <Smartphone className="w-4 h-4 text-[#F2B33D]" />
          <span>Staff App View</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}

