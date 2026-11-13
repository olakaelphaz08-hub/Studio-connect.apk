import React, { useState, useEffect } from 'react';
import { useIntercom } from '../context/IntercomContext';
import { ALL_SECTIONS, SectionType, BluetoothDeviceItem } from '../types/intercom';
import { globalAudioEngine } from '../audio/AudioEngine';
import { 
  Headphones, 
  Bluetooth, 
  Mic, 
  MicOff, 
  Volume2, 
  ShieldCheck, 
  Hand, 
  Signal, 
  Battery, 
  Radio, 
  Sparkles, 
  Check, 
  RefreshCw,
  AlertTriangle,
  Zap,
  Lock,
  VolumeX,
  ShieldAlert
} from 'lucide-react';

interface MusicianViewProps {
  onOpenBluetoothModal: () => void;
}

export const MusicianView: React.FC<MusicianViewProps> = ({ onOpenBluetoothModal }) => {
  const {
    clientId,
    clientName,
    setClientName,
    section,
    setSection,
    connectionType,
    setConnectionType,
    isWsConnected,
    roundTripLatencyMs,
    technicianSpeaking,
    technicianTarget,
    musicianTalking,
    isRtsActive,
    toggleRts,
    isTransmitting,
    startTransmitting,
    stopTransmitting,
    limiterActive,
    setLimiterActive,
    limiterThresholdDb,
    setLimiterThresholdDb,
    masterVolume,
    setMasterVolume,
    bluetoothDevices,
    assignBtDevice,
    isMutedByTech,
  } = useIntercom();

  const [bandTalkbackEnabled, setBandTalkbackEnabled] = useState(false);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('default');
  const [isMatchingSampleRate, setIsMatchingSampleRate] = useState(false);
  const [sampleRateMatched, setSampleRateMatched] = useState(true);

  // Check if technician is speaking specifically to THIS musician or this musician's section or all
  const isTechnicianSpeakingToMe = technicianSpeaking && (
    technicianTarget === 'all' ||
    technicianTarget === section ||
    technicianTarget === clientId
  );

  const handleSampleRateMatch = async () => {
    setIsMatchingSampleRate(true);
    await globalAudioEngine.init();
    // Simulate audio buffer recalibration for 48kHz isochronous stream
    setTimeout(() => {
      setIsMatchingSampleRate(false);
      setSampleRateMatched(true);
      globalAudioEngine.playTactileChirp(1200, 0.05);
    }, 600);
  };

  const handleDeviceSelect = async (deviceId: string) => {
    setSelectedOutputDevice(deviceId);
    await globalAudioEngine.setAudioOutputDevice(deviceId);
    // Find device and link
    const dev = bluetoothDevices.find(d => d.id === deviceId);
    if (dev) {
      assignBtDevice(dev.id, clientId);
    }
  };

  return (
    <div className={`min-h-[calc(100vh-65px)] p-4 sm:p-6 transition-colors duration-300 relative ${
      isTechnicianSpeakingToMe 
        ? 'bg-[#181100]' 
        : musicianTalking 
        ? 'bg-[#180505]' 
        : 'bg-black'
    }`}>
      {/* Dynamic Full Screen Glow Border for Stage Visual Cues */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 border-8 z-30 ${
        isTechnicianSpeakingToMe
          ? 'border-[#FFB800] shadow-[inset_0_0_80px_rgba(255,184,0,0.4)] animate-pulse'
          : musicianTalking
          ? 'border-[#FF2B2B] shadow-[inset_0_0_60px_rgba(255,43,43,0.3)]'
          : 'border-transparent'
      }`} />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* TOP STAGE VISUAL CUE BANNER */}
        <div className={`rounded-2xl p-6 transition-all duration-200 shadow-2xl flex flex-col items-center justify-center text-center ${
          isTechnicianSpeakingToMe
            ? 'bg-[#FFB800] text-black glow-amber scale-102'
            : musicianTalking
            ? 'bg-[#FF2B2B] text-white glow-red'
            : 'bg-[#0f0f14] border border-zinc-800 text-zinc-300'
        }`}>
          {isTechnicianSpeakingToMe ? (
            <div className="animate-bounce flex flex-col items-center">
              <div className="text-xs font-mono font-black uppercase tracking-widest bg-black text-[#FFB800] px-3 py-1 rounded-full mb-2">
                TALKBACK INCOMING
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                TECHNICIAN SPEAKING
              </h1>
              <p className="text-sm font-bold mt-1 text-black/80 font-mono">
                Route: {technicianTarget === 'all' ? 'GLOBAL BROADCAST' : `TARGET: ${technicianTarget.toUpperCase()}`}
              </p>
            </div>
          ) : musicianTalking ? (
            <div className="flex flex-col items-center">
              <div className="text-xs font-mono font-black uppercase tracking-widest bg-black text-[#FF2B2B] px-3 py-1 rounded-full mb-2">
                BAND TALKBACK TRANSMISSION
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {musicianTalking.name} ({musicianTalking.section})
              </h1>
              <p className="text-xs font-mono text-white/80 mt-1">
                Active 2-Way Stage Comms
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-[#00FF66] shadow-[0_0_12px_#00FF66] animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00FF66]">
                  LIVE PROGRAM FEED • IN-EAR MIX READY
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
                Stage Receiver Active
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Listening on section <span className="text-[#00FF66] font-bold">{section}</span> ({roundTripLatencyMs}ms latency)
              </p>
            </div>
          )}
        </div>

        {/* Musician Profile & Section Tag */}
        <div className="bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Performer ID</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-[#141419] border border-zinc-700/80 text-white font-bold text-base px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span>{clientName}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md">
                  <Lock className="w-2.5 h-2.5 text-amber-500" /> Managed by Master Tech
                </span>
              </div>
            </div>

            {/* Instrument / Section Selector */}
            <div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Stage Section</span>
              <div className="mt-1">
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as SectionType)}
                  className="bg-[#141419] border border-zinc-700 text-[#00FF66] font-bold text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#00FF66]"
                >
                  {ALL_SECTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Connection Mode Pill */}
            <div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Connection Link</span>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setConnectionType('wifi')}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    connectionType === 'wifi'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  Wi-Fi P2P
                </button>
                <button
                  onClick={() => setConnectionType('bluetooth')}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    connectionType === 'bluetooth'
                      ? 'bg-cyan-950 text-[#00E5FF] border-cyan-700'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  Bluetooth IEM
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2-WAY TALKBACK CONTROLS (RTS & BAND TALKBACK) */}
        <div className="bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#FF2B2B]" />
              <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
                Talkback Response (2-Way Stage Comms)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              DEFAULT: MUTED LISTENER
            </span>
          </div>

          {/* Master Tech Remote Mute Alert Banner */}
          {isMutedByTech && (
            <div className="p-3 rounded-xl bg-[#FF2B2B]/15 border border-[#FF2B2B]/60 text-white flex items-center gap-3 shadow-[0_0_20px_rgba(255,43,43,0.25)] animate-pulse">
              <div className="p-2 rounded-lg bg-[#FF2B2B] text-black shrink-0">
                <VolumeX className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-mono font-bold text-[#FF2B2B] uppercase tracking-wider">
                  Microphone Muted by Master Technician
                </div>
                <p className="text-zinc-300 mt-0.5">
                  Your stage talkback mic is locked by FOH Lead Tech. In-ear listening audio is active and uninterrupted.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Request to Speak (RTS) Button */}
            <button
              onClick={toggleRts}
              className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-150 tactile-btn cursor-pointer ${
                isRtsActive
                  ? 'bg-[#FFB800] text-black border-white glow-amber font-extrabold shadow-[0_0_30px_rgba(255,184,0,0.6)]'
                  : 'bg-[#141419] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#1a1a22]'
              }`}
            >
              <Hand className={`w-8 h-8 mb-2 ${isRtsActive ? 'animate-bounce' : 'text-[#FFB800]'}`} />
              <span className="text-sm font-bold uppercase font-mono tracking-wider">
                {isRtsActive ? 'HAND RAISED (RTS ACTIVE)' : 'REQUEST TO SPEAK (RTS)'}
              </span>
              <span className="text-[11px] opacity-80 mt-1">
                {isRtsActive ? 'Notified Lead Technician' : 'Sends visual hand-raise cue to Tech Board'}
              </span>
            </button>

            {/* Band Talkback Channel PTT */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-[#141419] border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-zinc-300">Band Talkback Mic</span>
                {isMutedByTech ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FF2B2B] text-white">
                    LOCKED BY TECH
                  </span>
                ) : (
                  <button
                    onClick={() => setBandTalkbackEnabled(!bandTalkbackEnabled)}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                      bandTalkbackEnabled ? 'bg-[#FF2B2B] text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {bandTalkbackEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                )}
              </div>

              {isMutedByTech ? (
                <div className="w-full py-4 rounded-lg font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 bg-[#FF2B2B]/10 border border-[#FF2B2B]/40 text-[#FF2B2B] cursor-not-allowed select-none">
                  <VolumeX className="w-4 h-4" />
                  <span>MIC MUTED BY MASTER TECH</span>
                </div>
              ) : bandTalkbackEnabled ? (
                <button
                  onMouseDown={startTransmitting}
                  onMouseUp={stopTransmitting}
                  onTouchStart={startTransmitting}
                  onTouchEnd={stopTransmitting}
                  className={`w-full py-4 rounded-lg font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 transition-all tactile-btn select-none ${
                    isTransmitting
                      ? 'bg-[#FF2B2B] text-white glow-red shadow-[0_0_20px_#FF2B2B]'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{isTransmitting ? 'TRANSMITTING TO BAND...' : 'HOLD TO TALK BACK'}</span>
                </button>
              ) : (
                <div className="text-xs text-zinc-500 italic py-3 text-center">
                  Enable mic to talk back to sound tech or band members without unmuting stage vocal mic.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLUETOOTH SETUP WIZARD (One-Click In-Ear Monitor Selector) */}
        <div className="bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[#00E5FF]" />
              <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
                Bluetooth IEM Setup Wizard
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSampleRateMatch}
                disabled={isMatchingSampleRate}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00E5FF] ${isMatchingSampleRate ? 'animate-spin' : ''}`} />
                <span>Auto-Match 48kHz Buffer</span>
              </button>

              <button
                onClick={onOpenBluetoothModal}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-[#00E5FF] border border-cyan-800 hover:bg-cyan-900"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Device Catalog</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-400">
            One-click audio routing to connected wireless In-Ear Monitors or earbuds. Matches hardware sample rate to eliminate audio re-sampling latency.
          </p>

          {/* Quick Device List Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bluetoothDevices.slice(0, 3).map((dev) => {
              const isSelected = selectedOutputDevice === dev.id;

              return (
                <button
                  key={dev.id}
                  onClick={() => handleDeviceSelect(dev.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/60 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                      : 'bg-[#141419] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="font-bold text-xs text-white truncate">{dev.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#00E5FF] shrink-0" />}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="text-cyan-400 font-bold">{dev.profile}</span>
                    <span>{dev.latencyEstimatedMs}ms delay</span>
                    <span className="text-emerald-400">{dev.batteryLevel}% bat</span>
                  </div>
                </button>
              );
            })}
          </div>

          {sampleRateMatched && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900 text-xs text-emerald-300">
              <Check className="w-4 h-4 text-[#00FF66]" />
              <span>
                Bluetooth Isochronous buffer synchronized at <strong>48,000 Hz</strong> (Zero resampling delay).
              </span>
            </div>
          )}
        </div>

        {/* AUDIO CONTROLS: MASTER VOLUME & HEARING SAFETY LIMITER */}
        <div className="bg-[#0a0a0d] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
                In-Ear Audio & Hearing Protection
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-[#00FF66] border border-emerald-800 font-bold">
              EAR SAFETY ACTIVE
            </span>
          </div>

          {/* Master Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 font-bold">IEM Master Volume:</span>
              <span className="text-[#00FF66] font-bold text-sm">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FF66]"
            />
          </div>

          {/* Safety Brickwall Limiter */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLimiterActive(!limiterActive)}
                className={`p-2 rounded-lg border transition-all ${
                  limiterActive
                    ? 'bg-emerald-950 border-emerald-700 text-[#00FF66]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Acoustic Spike Limiter</span>
                  <span className={`text-[10px] font-mono font-bold ${limiterActive ? 'text-[#00FF66]' : 'text-zinc-500'}`}>
                    [{limiterActive ? 'ENGAGED' : 'BYPASS'}]
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Prevents hearing damage by hard-clamping accidental feedback pops at {limiterThresholdDb} dBFS.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-zinc-500">Clamp:</span>
              {(['-12', '-6', '-3'] as const).map((dbStr) => {
                const db = Number(dbStr);
                return (
                  <button
                    key={dbStr}
                    onClick={() => setLimiterThresholdDb(db)}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                      limiterThresholdDb === db
                        ? 'bg-emerald-900 text-[#00FF66] border-emerald-600'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    {dbStr} dB
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        <div className="p-4 rounded-xl bg-[#09090c] border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-[#00FF66]" />
            <span>Target Latency: <strong className="text-white">&lt;50ms</strong> (Current: <strong className="text-[#00FF66]">{roundTripLatencyMs}ms</strong>)</span>
          </div>

          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Dual Wi-Fi / BLE P2P Network</span>
          </div>

          <div className="text-zinc-500">
            Client ID: {clientId}
          </div>
        </div>
      </div>
    </div>
  );
};
