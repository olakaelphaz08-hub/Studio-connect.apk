import React, { useState } from 'react';
import { useIntercom } from '../context/IntercomContext';
import { BluetoothProfile, BluetoothDeviceItem } from '../types/intercom';
import { 
  Bluetooth, 
  Battery, 
  Signal, 
  Headphones, 
  Check, 
  X, 
  RefreshCw, 
  Radio, 
  Sparkles,
  Zap
} from 'lucide-react';

interface BluetoothManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothManagerModal: React.FC<BluetoothManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    bluetoothDevices, 
    scanBluetooth, 
    assignBtDevice, 
    unassignBtDevice, 
    setBtProfile,
    roster 
  } = useIntercom();

  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDeviceItem | null>(null);

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsScanning(true);
    await scanBluetooth();
    setTimeout(() => setIsScanning(false), 800);
  };

  const getProfileBadge = (profile: BluetoothProfile) => {
    switch (profile) {
      case 'BLE-LC3':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-[#00E5FF] border border-cyan-800">
            <Zap className="w-3 h-3" /> BLE LC3 (18ms)
          </span>
        );
      case 'HFP':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-[#FFB800] border border-amber-800">
            HFP Duplex (24ms)
          </span>
        );
      case 'A2DP':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
            A2DP Hi-Fi (28ms)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0e0e12] border border-zinc-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#121216]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-[#00E5FF]">
              <Bluetooth className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Bluetooth IEM & Beltpack Routing
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-[#00E5FF] border border-cyan-700/60">
                  DUAL-LINK
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Direct audio streaming via BLE LC3, A2DP & Hands-Free Profile (HFP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00E5FF] ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning BLE...' : 'Scan / Pair Device'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-900/50 text-cyan-200 text-xs">
            <Radio className="w-4 h-4 text-[#00E5FF] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-white">Hybrid Wi-Fi & Bluetooth Audio Pipeline</p>
              <p className="text-zinc-300 mt-0.5">
                In concert venues with no Wi-Fi infrastructure, StageTalk uses direct BLE/Classic P2P audio streaming. 
                Assign individual IEMs to band members below so audio streams directly to their in-ear mix.
              </p>
            </div>
          </div>

          {/* Device Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
              Discovered IEMs & Wireless Receivers ({bluetoothDevices.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bluetoothDevices.map((dev) => {
                const assignedMember = roster.find(m => m.id === dev.assignedMusicianId);

                return (
                  <div
                    key={dev.id}
                    className="p-4 rounded-lg bg-[#141418] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-[#00E5FF]" />
                          <span className="font-semibold text-sm text-white">{dev.name}</span>
                        </div>
                        {getProfileBadge(dev.profile)}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 mb-3">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Battery className="w-3.5 h-3.5" />
                          <span>{dev.batteryLevel}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Signal className="w-3.5 h-3.5" />
                          <span>{dev.rssi} dBm</span>
                        </div>
                        <div className="text-zinc-400">
                          Est: <span className="text-white font-bold">{dev.latencyEstimatedMs}ms</span>
                        </div>
                      </div>

                      {/* Profile switch options */}
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-[10px] text-zinc-500 font-mono">Profile:</span>
                        {(['BLE-LC3', 'A2DP', 'HFP'] as BluetoothProfile[]).map((prof) => (
                          <button
                            key={prof}
                            onClick={() => setBtProfile(dev.id, prof)}
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                              dev.profile === prof
                                ? 'bg-cyan-900 text-[#00E5FF] font-bold border border-cyan-700'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {prof}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Musician Assignment */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-zinc-500 mr-1.5">Route to:</span>
                        {assignedMember ? (
                          <span className="font-semibold text-emerald-400">
                            {assignedMember.name} ({assignedMember.section})
                          </span>
                        ) : (
                          <span className="text-zinc-500 italic">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          className="bg-black text-xs text-zinc-200 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-[#00E5FF]"
                          value={dev.assignedMusicianId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              assignBtDevice(dev.id, val);
                            } else {
                              unassignBtDevice(dev.id);
                            }
                          }}
                        >
                          <option value="">-- Assign Member --</option>
                          {roster.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} [{m.section}]
                            </option>
                          ))}
                        </select>

                        {dev.assignedMusicianId && (
                          <button
                            onClick={() => unassignBtDevice(dev.id)}
                            title="Unassign"
                            className="p-1 text-zinc-400 hover:text-[#FF2B2B] rounded hover:bg-zinc-800"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-[#121216] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
            <span>48,000 Hz Isochronous Buffer Ready</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-[#00E5FF] text-black hover:bg-cyan-300 transition-colors active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
