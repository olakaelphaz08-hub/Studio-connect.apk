import React, { useState, useEffect } from 'react';
import { useIntercom } from '../context/IntercomContext';
import { VuMeter } from './VuMeter';
import { ALL_SECTIONS, SectionType, MusicianMember } from '../types/intercom';
import { 
  Mic, 
  MicOff, 
  Radio, 
  Volume2, 
  Wifi, 
  Bluetooth, 
  Battery, 
  Signal, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Music, 
  Users, 
  Zap,
  Disc,
  Play,
  Square,
  Shield,
  HelpCircle,
  Plus,
  Pencil,
  Check,
  X,
  VolumeX,
  Lock
} from 'lucide-react';

interface TechnicianBoardProps {
  onOpenBluetoothModal: () => void;
}

export const TechnicianBoard: React.FC<TechnicianBoardProps> = ({ onOpenBluetoothModal }) => {
  const {
    isTransmitting,
    talkMode,
    setTalkMode,
    startTransmitting,
    stopTransmitting,
    toggleLatch,
    talkTarget,
    setTalkTarget,
    technicianSpeaking,
    duckingDb,
    setDuckingDb,
    roster,
    inputPeakDb,
    inputRmsDb,
    inputClipping,
    outputPeakDb,
    outputRmsDb,
    outputClipping,
    programFeedPlaying,
    programFeedType,
    setProgramFeedType,
    toggleProgramFeed,
    roundTripLatencyMs,
    includeSimulatedMusicians,
    setIncludeSimulatedMusicians,
    clearRtsForMember,
    assignBtDevice,
    bluetoothDevices,
    techRenameMusician,
    techToggleMuteMusician,
  } = useIntercom();

  const [selectedSoloMember, setSelectedSoloMember] = useState<MusicianMember | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'roster' | 'routing' | 'ducking'>('roster');

  // Inline editing of musician name (Master Technician privilege)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  // Spacebar keyboard shortcut for Push-to-Talk (PTT)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        if (talkMode === 'ptt') {
          startTransmitting();
        } else {
          toggleLatch();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && talkMode === 'ptt') {
        e.preventDefault();
        stopTransmitting();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [talkMode, startTransmitting, stopTransmitting, toggleLatch]);

  // Filter roster
  const filteredRoster = roster.filter(m => {
    if (sectionFilter === 'all') return true;
    return m.section === sectionFilter;
  });

  const rtsActiveMembers = roster.filter(m => m.isRtsActive);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-5">
      {/* RTS Alert Banner if any musician raised hand */}
      {rtsActiveMembers.length > 0 && (
        <div className="bg-amber-950/60 border border-amber-600/80 rounded-xl p-3 px-4 flex items-center justify-between shadow-[0_0_20px_rgba(255,184,0,0.25)] animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFB800] text-black font-extrabold flex items-center justify-center text-sm shadow-[0_0_10px_#FFB800]">
              !
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>STAGE REQUEST TO SPEAK (RTS):</span>
                <span className="text-[#FFB800]">
                  {rtsActiveMembers.map(m => `${m.name} (${m.section})`).join(', ')}
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Musician requested 2-way talkback channel. Engage Solo Direct or Band Talkback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rtsActiveMembers.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setTalkTarget(m.id);
                  clearRtsForMember(m.id);
                }}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[#FFB800] text-black hover:bg-amber-300 transition-all active:scale-95"
              >
                Solo Talk to {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Grid: Master Transmission Console & Ducking Engine & Audio Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Big Master Talkback Button (5 cols) */}
        <div className="lg:col-span-5 bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          {/* Subtle stage grid line pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1f1f28_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF2B2B] shadow-[0_0_8px_#FF2B2B]" />
                <h2 className="text-sm font-mono uppercase font-bold tracking-wider text-zinc-300">
                  Master Talkback Engine
                </h2>
              </div>

              {/* PTT vs Latch Mode Switch */}
              <div className="flex items-center bg-[#141419] border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setTalkMode('ptt')}
                  className={`px-2.5 py-1 text-xs font-mono rounded font-semibold transition-all ${
                    talkMode === 'ptt'
                      ? 'bg-zinc-700 text-white shadow'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Hold-to-Talk (PTT)
                </button>
                <button
                  onClick={() => setTalkMode('latch')}
                  className={`px-2.5 py-1 text-xs font-mono rounded font-semibold transition-all ${
                    talkMode === 'latch'
                      ? 'bg-[#FF2B2B] text-white shadow-[0_0_10px_rgba(255,43,43,0.5)]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Latch Talk
                </button>
              </div>
            </div>

            {/* Current Target indicator badge */}
            <div className="mb-4 p-2.5 rounded-lg bg-[#121217] border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">BROADCAST ROUTE:</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-zinc-800 text-[#00FF66] border border-zinc-700">
                {talkTarget === 'all'
                  ? 'TALK ALL (GLOBAL WI-FI + BLE)'
                  : ALL_SECTIONS.includes(talkTarget as SectionType)
                  ? `SECTION: ${talkTarget.toUpperCase()}`
                  : `SOLO DIRECT: ${roster.find(m => m.id === talkTarget)?.name || talkTarget}`}
              </span>
            </div>
          </div>

          {/* GIANT TACTILE TALKBACK BUTTON */}
          <div className="my-6 flex flex-col items-center justify-center">
            <button
              onMouseDown={talkMode === 'ptt' ? startTransmitting : undefined}
              onMouseUp={talkMode === 'ptt' ? stopTransmitting : undefined}
              onTouchStart={talkMode === 'ptt' ? startTransmitting : undefined}
              onTouchEnd={talkMode === 'ptt' ? stopTransmitting : undefined}
              onClick={talkMode === 'latch' ? toggleLatch : undefined}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-150 select-none cursor-pointer border-4 tactile-btn relative ${
                isTransmitting
                  ? 'bg-[#FF2B2B] border-white text-white glow-red scale-105 shadow-[0_0_50px_rgba(255,43,43,0.8)]'
                  : 'bg-[#18181f] border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-[#20202a]'
              }`}
            >
              {/* Outer pulsing ring when transmitting */}
              {isTransmitting && (
                <span className="absolute inset-0 rounded-full border-4 border-[#FF2B2B] animate-ping opacity-75" />
              )}

              <Mic className={`w-12 h-12 mb-2 transition-transform ${isTransmitting ? 'scale-110' : ''}`} />
              <span className="text-base font-black tracking-wider uppercase font-mono">
                {isTransmitting ? 'LIVE ON AIR' : talkMode === 'ptt' ? 'HOLD TO TALK' : 'LATCH TALK'}
              </span>
              <span className="text-[10px] font-mono opacity-80 mt-1">
                {isTransmitting ? 'Transmitting to IEMs' : 'Press & Hold or [Space]'}
              </span>
            </button>

            {/* Talk status timer or prompt */}
            <div className="mt-4 text-center">
              <span className={`text-xs font-mono font-bold tracking-widest ${isTransmitting ? 'text-[#FF2B2B]' : 'text-zinc-500'}`}>
                {isTransmitting ? '● MIC ACTIVE • DUCKING ENGAGED (-15dB)' : 'MIC MUTED • READY'}
              </span>
            </div>
          </div>

          {/* Quick Target Selector Shortcut */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Quick Switch:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTalkTarget('all')}
                className={`px-3 py-1 text-xs font-mono rounded font-bold transition-all ${
                  talkTarget === 'all'
                    ? 'bg-[#00FF66] text-black shadow-[0_0_10px_#00FF66]'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                TALK ALL
              </button>
              <button
                onClick={() => setTalkTarget('Stage Crew / Tech')}
                className={`px-3 py-1 text-xs font-mono rounded font-bold transition-all ${
                  talkTarget === 'Stage Crew / Tech'
                    ? 'bg-cyan-400 text-black shadow-[0_0_10px_#00E5FF]'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                CREW ONLY
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Audio Ducking Engine & Program Feed Simulator (4 cols) */}
        <div className="lg:col-span-4 bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-mono uppercase font-bold tracking-wider text-zinc-300">
                  Audio Ducking Engine
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-[#FFB800] border border-amber-800/60 font-bold">
                AUTO-ATTENUATION
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Dynamically ducks stage monitor/program feed when the technician speaks, ensuring vocal clarity over loud stage sound.
            </p>

            {/* Ducking Attenuation Slider */}
            <div className="bg-[#121217] border border-zinc-800 p-4 rounded-xl mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300">Ducking Reduction:</span>
                <span className="text-sm font-mono font-bold text-amber-400">{duckingDb} dB</span>
              </div>
              
              <input
                type="range"
                min="-24"
                max="-6"
                step="1"
                value={duckingDb}
                onChange={(e) => setDuckingDb(Number(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
              />

              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>-6 dB (Gentle)</span>
                <span className="text-amber-400 font-bold">-15 dB (Standard)</span>
                <span>-24 dB (Hard)</span>
              </div>

              {/* Dynamic Ducking Indicator */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Current Program Gain:</span>
                <span className={`font-mono font-bold ${isTransmitting ? 'text-amber-400 animate-pulse' : 'text-[#00FF66]'}`}>
                  {isTransmitting ? `${duckingDb} dB (DUCKED)` : '0 dB (FULL MIX)'}
                </span>
              </div>
            </div>

            {/* Stage Program Feed Audition / Simulator */}
            <div className="bg-[#121217] border border-zinc-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-zinc-200">Stage Program Feed Test</span>
                </div>
                <button
                  onClick={toggleProgramFeed}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    programFeedPlaying
                      ? 'bg-[#00FF66] text-black shadow-[0_0_12px_#00FF66]'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  {programFeedPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{programFeedPlaying ? 'Stop Feed' : 'Start Feed'}</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                Audition ducking in real-time. Start the feed, then press Master Talkback to hear program audio drop smoothly.
              </p>

              {/* Feed track selector */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['funk', 'click', 'pink_noise'] as const).map((track) => (
                  <button
                    key={track}
                    onClick={() => {
                      setProgramFeedType(track);
                      if (programFeedPlaying) {
                        toggleProgramFeed();
                        setTimeout(() => toggleProgramFeed(), 50);
                      }
                    }}
                    className={`py-1 text-[10px] font-mono rounded border transition-colors ${
                      programFeedType === track
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {track === 'funk' ? 'Stage Mix' : track === 'click' ? 'Click 118' : 'Noise'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Envelope: 15ms Attack / 250ms Release</span>
            <span className="text-emerald-400 font-bold">DSP Active</span>
          </div>
        </div>

        {/* Right Column: Dual Audio VU Peak Meters (3 cols) */}
        <div className="lg:col-span-3 bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-mono uppercase font-bold tracking-wider text-zinc-300">
                  Audio Peak Meters
                </h2>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                TRUE PEAK
              </span>
            </div>

            <div className="space-y-4">
              <VuMeter
                label="Lead Tech Mic Input"
                peakDb={inputPeakDb}
                rmsDb={inputRmsDb}
                isClipping={inputClipping}
              />

              <VuMeter
                label="Master IEM Output Feed"
                peakDb={outputPeakDb}
                rmsDb={outputRmsDb}
                isClipping={outputClipping}
              />
            </div>
          </div>

          {/* Network and latency metrics */}
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Network Latency:</span>
              <span className="text-[#00FF66] font-bold">{roundTripLatencyMs} ms</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Audio Codec:</span>
              <span className="text-cyan-400 font-bold">OPUS-48k / LC3</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Audio Buffer:</span>
              <span className="text-zinc-300">10.6ms (512 samples)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Routing Bar (Section Select & Solo Direct) */}
      <div className="bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
                Talkback Channel Routing Controls
              </h3>
              <p className="text-xs text-zinc-400">
                Route voice to everyone, specific instrument sections, or solo direct 1-on-1 private talkback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBluetoothModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-[#00E5FF] border border-cyan-800 hover:bg-cyan-900 transition-all active:scale-95"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Bluetooth IEM Manager</span>
            </button>

            <button
              onClick={() => setIncludeSimulatedMusicians(!includeSimulatedMusicians)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                includeSimulatedMusicians
                  ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}
              title="Toggle simulated 12+ concert band roster for testing"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Full Band Roster: {includeSimulatedMusicians ? '12 Active' : 'Real Only'}</span>
            </button>
          </div>
        </div>

        {/* Section Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {/* Talk All Global button */}
          <button
            onClick={() => setTalkTarget('all')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
              talkTarget === 'all'
                ? 'bg-[#00FF66] border-[#00FF66] text-black font-extrabold shadow-[0_0_15px_rgba(0,255,102,0.4)] scale-102'
                : 'bg-[#121217] border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span className="text-xs uppercase font-mono font-bold">TALK ALL</span>
            <span className="text-[10px] opacity-75 mt-0.5">Global Link</span>
          </button>

          {/* Section Buttons */}
          {ALL_SECTIONS.map((sec) => {
            const isSelected = talkTarget === sec;
            const count = roster.filter(m => m.section === sec).length;

            return (
              <button
                key={sec}
                onClick={() => setTalkTarget(sec)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#FF2B2B] border-white text-white font-extrabold shadow-[0_0_15px_rgba(255,43,43,0.4)] scale-102'
                    : 'bg-[#121217] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs uppercase font-mono font-bold truncate max-w-full">
                  {sec.replace('Stage Crew / ', '')}
                </span>
                <span className="text-[10px] opacity-75 mt-0.5">{count} members</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Member Roster Grid (Real-time Status Grid showing connected musicians) */}
      <div className="bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
                <span>Stage Member Roster</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 font-mono">
                  {filteredRoster.length} Connected
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Live telemetry: Connection type, ping latency, battery %, mute status, and RTS alerts.
              </p>
            </div>
          </div>

          {/* Filter by Section dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">Filter Section:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="bg-black text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00FF66]"
            >
              <option value="all">All Sections ({roster.length})</option>
              {ALL_SECTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRoster.map((member) => {
            const isSoloTarget = talkTarget === member.id;

            return (
              <div
                key={member.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  member.isRtsActive
                    ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(255,184,0,0.3)] animate-pulse'
                    : isSoloTarget
                    ? 'bg-rose-950/40 border-[#FF2B2B] shadow-[0_0_15px_rgba(255,43,43,0.3)]'
                    : 'bg-[#121217] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Card Header: Name, Master Tech Edit, and Mute/Solo Action Buttons */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {editingMemberId === member.id ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          autoFocus
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              techRenameMusician(member.id, editingNameValue);
                              setEditingMemberId(null);
                            } else if (e.key === 'Escape') {
                              setEditingMemberId(null);
                            }
                          }}
                          className="flex-1 bg-black text-xs font-bold text-white border border-[#00FF66] rounded px-1.5 py-0.5 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            techRenameMusician(member.id, editingNameValue);
                            setEditingMemberId(null);
                          }}
                          className="p-1 rounded bg-[#00FF66] text-black hover:bg-emerald-400"
                          title="Save name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingMemberId(null)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span className="truncate">{member.name}</span>
                          <button
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditingNameValue(member.name);
                            }}
                            className="p-0.5 rounded text-zinc-400 hover:text-[#00FF66] hover:bg-zinc-800 transition-colors"
                            title="Master Tech: Edit Musician Name"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {member.isRtsActive && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FFB800] text-black shrink-0">
                              RTS
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {member.section}
                        </div>
                      </div>
                    )}

                    {/* Master Tech Actions: Mute & Solo Direct */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Master Tech Mute Button */}
                      <button
                        onClick={() => techToggleMuteMusician(member.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                          member.isMutedByTech
                            ? 'bg-[#FF2B2B] text-white shadow-[0_0_8px_#FF2B2B]'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                        title={member.isMutedByTech ? 'Unmute Musician Mic' : 'Master Tech: Mute Musician Mic'}
                      >
                        {member.isMutedByTech ? (
                          <>
                            <VolumeX className="w-3 h-3 text-white" />
                            <span>MUTED</span>
                          </>
                        ) : (
                          <>
                            <MicOff className="w-3 h-3" />
                            <span>MUTE</span>
                          </>
                        )}
                      </button>

                      {/* Solo Direct Action Button */}
                      <button
                        onClick={() => setTalkTarget(isSoloTarget ? 'all' : member.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                          isSoloTarget
                            ? 'bg-[#FF2B2B] text-white shadow-[0_0_8px_#FF2B2B]'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                        title="1-on-1 private talkback"
                      >
                        {isSoloTarget ? 'SOLO' : 'SOLO'}
                      </button>
                    </div>
                  </div>

                  {/* Muted by Tech Banner */}
                  {member.isMutedByTech && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#FF2B2B]/15 border border-[#FF2B2B]/40 text-[#FF2B2B] text-[10px] font-mono font-bold mb-2">
                      <VolumeX className="w-3 h-3 shrink-0" />
                      <span>MIC MUTED BY MASTER TECH</span>
                    </div>
                  )}

                  {/* Telemetry info */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 mb-3 bg-black/40 p-2 rounded-lg border border-zinc-800/80">
                    {/* Connection Type */}
                    <div className="flex items-center gap-1.5">
                      {member.connectionType === 'bluetooth' ? (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Bluetooth className="w-3.5 h-3.5" /> BT IEM
                        </span>
                      ) : member.connectionType === 'hybrid' ? (
                        <span className="flex items-center gap-1 text-purple-400">
                          <Radio className="w-3.5 h-3.5" /> Hybrid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Wifi className="w-3.5 h-3.5" /> Wi-Fi
                        </span>
                      )}
                    </div>

                    {/* Latency */}
                    <div className="flex items-center justify-end gap-1 text-emerald-400 font-bold">
                      <Signal className="w-3 h-3" />
                      <span>{member.latencyMs}ms</span>
                    </div>

                    {/* Battery */}
                    <div className="flex items-center gap-1 text-zinc-300">
                      <Battery className={`w-3.5 h-3.5 ${member.batteryLevel < 30 ? 'text-[#FF2B2B]' : 'text-emerald-400'}`} />
                      <span>{member.batteryLevel}%</span>
                    </div>

                    {/* Codec */}
                    <div className="text-right text-zinc-500 text-[10px]">
                      {member.codec}
                    </div>
                  </div>

                  {/* Bluetooth Device Tag if paired */}
                  {member.btDeviceName && (
                    <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-cyan-950/40 border border-cyan-900/50 text-cyan-300 mb-2">
                      <span className="truncate">{member.btDeviceName}</span>
                      <span className="font-bold text-[#00E5FF] ml-1">{member.btProfile || 'BLE'}</span>
                    </div>
                  )}
                </div>

                {/* RTS Clear button if active */}
                {member.isRtsActive && (
                  <button
                    onClick={() => clearRtsForMember(member.id)}
                    className="w-full mt-1 py-1 text-[10px] font-mono font-bold rounded bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                  >
                    Acknowledge Hand Raise
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
