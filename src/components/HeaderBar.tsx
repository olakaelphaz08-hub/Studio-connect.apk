import React, { useState } from 'react';
import { useIntercom } from '../context/IntercomContext';
import { 
  Radio, 
  Wifi, 
  Bluetooth, 
  ShieldCheck, 
  Volume2, 
  Sliders, 
  Users, 
  Mic, 
  Headphones,
  Zap,
  Activity
} from 'lucide-react';
import { globalAudioEngine } from '../audio/AudioEngine';

interface HeaderBarProps {
  onOpenBluetoothModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenBluetoothModal }) => {
  const {
    role,
    setRole,
    isWsConnected,
    roundTripLatencyMs,
    roster,
    bluetoothDevices,
    limiterActive,
    setLimiterActive,
    masterVolume,
    setMasterVolume,
    technicianSpeaking,
  } = useIntercom();

  const [audioStarted, setAudioStarted] = useState(false);

  const handleStartAudio = async () => {
    const ok = await globalAudioEngine.init();
    if (ok) setAudioStarted(true);
  };

  const pairedBtCount = bluetoothDevices.filter(d => d.paired).length;

  return (
    <header className="bg-black/95 border-b border-zinc-800/80 sticky top-0 z-40 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF2B2B]/20 border border-[#FF2B2B]/60 flex items-center justify-center text-[#FF2B2B] shadow-[0_0_12px_rgba(255,43,43,0.3)]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-sans">
                  STAGE<span className="text-[#FF2B2B]">TALK</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                  PRO INTERCOM
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1 text-[#00FF66]">
                  <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
                  {isWsConnected ? 'ONLINE' : 'CONNECTING...'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Activity className="w-3 h-3" />
                  {roundTripLatencyMs}ms ping
                </span>
                <span>•</span>
                <span className="text-zinc-500 hidden sm:inline">OPUS/LC3 48kHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Current Role Status Badge (No public switcher - musicians cannot access master board) */}
        <div className="flex items-center">
          {role === 'technician' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#FF2B2B]/15 border border-[#FF2B2B]/60 text-xs font-mono font-bold text-white shadow-[0_0_15px_rgba(255,43,43,0.25)]">
              <span className="w-2 h-2 rounded-full bg-[#FF2B2B] shadow-[0_0_8px_#FF2B2B] animate-pulse" />
              <Mic className="w-3.5 h-3.5 text-[#FF2B2B]" />
              <span className="tracking-wide">MASTER BOARD • SOLE TECHNICIAN</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-xs font-mono font-bold text-emerald-300 shadow-[0_0_15px_rgba(0,255,102,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
              <Headphones className="w-3.5 h-3.5 text-[#00FF66]" />
              <span className="tracking-wide">STAGE RECEIVER • MUSICIAN VIEW</span>
            </div>
          )}
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2.5">
          {/* Audio Engine Unlock prompt if not triggered */}
          {!audioStarted && (
            <button
              onClick={handleStartAudio}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-[#FFB800] border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-pulse"
              title="Click to initialize browser Web Audio context"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Enable Audio</span>
            </button>
          )}

          {/* Bluetooth routing button */}
          <button
            onClick={onOpenBluetoothModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141419] border border-zinc-800 hover:border-cyan-700 text-xs font-mono text-cyan-300 transition-all active:scale-95"
            title="Bluetooth IEM Manager"
          >
            <Bluetooth className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden sm:inline">BT IEMs:</span>
            <span className="font-bold text-white">{pairedBtCount}</span>
          </button>

          {/* Hearing Limiter Badge */}
          <button
            onClick={() => setLimiterActive(!limiterActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              limiterActive 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through'
            }`}
            title="Ear Protection Brickwall Limiter (-6dB clamp)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Limiter:</span>
            <span className="font-bold">{limiterActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Master Volume quick slider */}
          <div className="hidden lg:flex items-center gap-2 bg-[#121216] border border-zinc-800 px-3 py-1.5 rounded-lg">
            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-16 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#00FF66]"
            />
            <span className="text-[10px] font-mono text-zinc-300 w-7">{masterVolume}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
