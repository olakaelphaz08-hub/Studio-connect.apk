import React from 'react';

interface VuMeterProps {
  label: string;
  peakDb: number;
  rmsDb: number;
  isClipping: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const VuMeter: React.FC<VuMeterProps> = ({
  label,
  peakDb,
  rmsDb,
  isClipping,
  orientation = 'horizontal',
  className = '',
}) => {
  // Normalize dB (-60dB to 0dB) to 0 - 100%
  const clampDb = (db: number) => Math.max(-60, Math.min(0, db));
  const peakPercent = Math.max(0, Math.min(100, ((clampDb(peakDb) + 60) / 60) * 100));
  const rmsPercent = Math.max(0, Math.min(100, ((clampDb(rmsDb) + 60) / 60) * 100));

  // Segments calculation: 24 discrete LED bars
  const totalSegments = 20;
  const activeSegments = Math.round((peakPercent / 100) * totalSegments);

  const getSegmentColor = (index: number) => {
    // 0 - 13: Green (-60 to -12 dB)
    // 14 - 17: Yellow (-12 to -3 dB)
    // 18 - 19: Red (-3 to 0 dB)
    if (index >= 18) return '#FF2B2B'; // Crimson Red
    if (index >= 14) return '#FFB800'; // Amber Yellow
    return '#00FF66'; // Neon Green
  };

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col items-center bg-[#09090b] border border-zinc-800 p-2.5 rounded-lg select-none ${className}`}>
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">{label}</span>
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-75 ${isClipping ? 'bg-[#FF2B2B] shadow-[0_0_8px_#FF2B2B]' : 'bg-zinc-800'}`} />
        </div>
        
        <div className="flex items-end gap-1.5 h-36 py-1">
          {/* LED Bar */}
          <div className="flex flex-col-reverse justify-between w-4 h-full bg-black/60 rounded p-0.5 border border-zinc-800/80">
            {Array.from({ length: totalSegments }).map((_, i) => {
              const isActive = i < activeSegments;
              const color = getSegmentColor(i);
              return (
                <div
                  key={i}
                  className="w-full h-1 rounded-[1px] transition-all duration-75"
                  style={{
                    backgroundColor: isActive ? color : '#18181b',
                    boxShadow: isActive ? `0 0 4px ${color}88` : 'none',
                  }}
                />
              );
            })}
          </div>

          {/* dB Scale */}
          <div className="flex flex-col justify-between h-full text-[9px] font-mono text-zinc-500 pb-0.5">
            <span className="text-[#FF2B2B] font-bold">0dB</span>
            <span>-6</span>
            <span>-12</span>
            <span>-24</span>
            <span>-36</span>
            <span>-48</span>
            <span>-∞</span>
          </div>
        </div>

        <div className="mt-1 text-center font-mono text-xs font-bold text-zinc-300">
          {peakDb <= -60 ? '-∞' : `${peakDb} dB`}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#0a0a0c] border border-zinc-800/80 p-3 rounded-lg select-none ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">{label}</span>
          <span className="text-[10px] font-mono text-zinc-500">
            {peakDb <= -60 ? '-∞ dB' : `${peakDb} dBFS`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-zinc-500">CLIP</span>
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-75 ${isClipping ? 'bg-[#FF2B2B] shadow-[0_0_10px_#FF2B2B]' : 'bg-zinc-800'}`} />
        </div>
      </div>

      {/* Horizontal LED Bar */}
      <div className="flex items-center gap-1 h-3.5 bg-black/80 rounded p-1 border border-zinc-800/70">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          const color = getSegmentColor(i);
          return (
            <div
              key={i}
              className="flex-1 h-full rounded-[1px] transition-all duration-75"
              style={{
                backgroundColor: isActive ? color : '#18181b',
                boxShadow: isActive ? `0 0 5px ${color}66` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Scale markers */}
      <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-1 px-0.5">
        <span>-∞</span>
        <span>-36</span>
        <span>-24</span>
        <span className="text-amber-500/80">-12</span>
        <span className="text-amber-400">-6</span>
        <span className="text-[#FF2B2B] font-bold">0</span>
      </div>
    </div>
  );
};
