/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IntercomProvider, useIntercom } from './context/IntercomContext';
import { HeaderBar } from './components/HeaderBar';
import { TechnicianBoard } from './components/TechnicianBoard';
import { MusicianView } from './components/MusicianView';
import { BluetoothManagerModal } from './components/BluetoothManagerModal';
import { Radio, Zap, Shield, HelpCircle, Terminal } from 'lucide-react';

function StageTalkApp() {
  const { role, devSwitchRole } = useIntercom();
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Hidden keyboard shortcut: Alt + D to toggle role instantly in Context
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.code === 'KeyD') || (e.ctrlKey && e.shiftKey && e.code === 'KeyD')) {
        e.preventDefault();
        devSwitchRole(role === 'technician' ? 'musician' : 'technician');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [role, devSwitchRole]);

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-[#00FF66] selection:text-black">
      {/* Sticky Header */}
      <HeaderBar onOpenBluetoothModal={() => setIsBtModalOpen(true)} />

      {/* Main Role Content */}
      <main className="flex-1 pb-12">
        {role === 'technician' ? (
          <TechnicianBoard onOpenBluetoothModal={() => setIsBtModalOpen(true)} />
        ) : (
          <MusicianView onOpenBluetoothModal={() => setIsBtModalOpen(true)} />
        )}
      </main>

      {/* Persistent Bluetooth IEM Manager Modal */}
      <BluetoothManagerModal
        isOpen={isBtModalOpen}
        onClose={() => setIsBtModalOpen(false)}
      />

      {/* Stage Tech Quick Info & Hidden Developer Debug Footer */}
      <footer className="border-t border-zinc-900 bg-[#050507] py-3.5 px-4 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
            <span>StageTalk Engine v2.4 (OPUS 48kHz / LC3 Core)</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-zinc-500 hidden sm:inline">[Space] PTT</span>
          </div>

          {/* Right: Hidden Developer Debug Toggle & Stats */}
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 hidden md:inline">BLE 5.2 / Wi-Fi UDP</span>
            <span className="text-emerald-400 hidden md:inline">&lt;50ms Latency</span>

            {/* Hidden Developer Role Debug Toggle */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
              <button
                onClick={() => devSwitchRole(role === 'technician' ? 'musician' : 'technician')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-zinc-900/90 border border-zinc-700/80 hover:border-[#00FF66] text-zinc-300 hover:text-white transition-all active:scale-95 shadow-sm"
                title="Hidden Developer Debug: Switch between technician and musician roles directly in Context state without backend restart (Shortcut: Alt + D)"
              >
                <Terminal className="w-3 h-3 text-[#00FF66]" />
                <span className="text-zinc-400">DEV:</span>
                <span className={role === 'technician' ? 'text-[#FF2B2B]' : 'text-[#00FF66]'}>
                  {role === 'technician' ? 'Master Tech' : 'Musician'}
                </span>
                <span className="text-[9px] text-zinc-400 bg-zinc-800 px-1 rounded ml-0.5">
                  ⇄ Switch
                </span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <IntercomProvider>
      <StageTalkApp />
    </IntercomProvider>
  );
}
