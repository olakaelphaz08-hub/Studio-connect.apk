import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  ClientRole, 
  SectionType, 
  MusicianMember, 
  BluetoothDeviceItem, 
  BluetoothProfile,
  ConnectionType 
} from '../types/intercom';
import { globalAudioEngine } from '../audio/AudioEngine';
import { globalBluetoothManager } from '../services/BluetoothManager';

// Realistic 12+ musician stage roster for concert rehearsals & live events
const INITIAL_SIMULATED_ROSTER: MusicianMember[] = [
  {
    id: 'm-drums-marcus',
    role: 'musician',
    name: 'Marcus Vance',
    section: 'Drums',
    connectionType: 'bluetooth',
    codec: 'LC3-48k',
    sampleRate: 48000,
    batteryLevel: 88,
    isMuted: true,
    isRtsActive: false,
    btDeviceName: 'Sennheiser IE 100 PRO BT',
    btProfile: 'BLE-LC3',
    latencyMs: 22,
    isSimulated: true,
  },
  {
    id: 'm-bass-elena',
    role: 'musician',
    name: 'Elena Rostova',
    section: 'Bass',
    connectionType: 'wifi',
    codec: 'OPUS-48k',
    sampleRate: 48000,
    batteryLevel: 94,
    isMuted: true,
    isRtsActive: false,
    btDeviceName: 'Shure SE215-BT Wireless IEM',
    btProfile: 'A2DP',
    latencyMs: 18,
    isSimulated: true,
  },
  {
    id: 'm-gtr1-dave',
    role: 'musician',
    name: 'Davey Chen (Lead Gtr)',
    section: 'Guitars',
    connectionType: 'hybrid',
    codec: 'OPUS-48k',
    sampleRate: 48000,
    batteryLevel: 79,
    isMuted: true,
    isRtsActive: true, // Hand raised!
    btDeviceName: 'Lectrosonics DCHT Beltpack',
    btProfile: 'BLE-LC3',
    latencyMs: 16,
    isSimulated: true,
  },
  {
    id: 'm-gtr2-mateo',
    role: 'musician',
    name: 'Mateo Silva (Rhythm)',
    section: 'Guitars',
    connectionType: 'bluetooth',
    codec: 'LC3-48k',
    sampleRate: 48000,
    batteryLevel: 84,
    isMuted: true,
    isRtsActive: false,
    btDeviceName: 'Audio-Technica ATH-E70 BT',
    btProfile: 'A2DP',
    latencyMs: 27,
    isSimulated: true,
  },
  {
    id: 'm-keys-sarah',
    role: 'musician',
    name: 'Sarah Lindqvist (Keys 1)',
    section: 'Keyboards',
    connectionType: 'wifi',
    codec: 'OPUS-48k',
    sampleRate: 48000,
    batteryLevel: 91,
    isMuted: true,
    isRtsActive: false,
    latencyMs: 19,
    isSimulated: true,
  },
  {
    id: 'm-keys2-tariq',
    role: 'musician',
    name: 'Tariq Al-Mansoor (Synths)',
    section: 'Keyboards',
    connectionType: 'wifi',
    codec: 'OPUS-48k',
    sampleRate: 48000,
    batteryLevel: 96,
    isMuted: true,
    isRtsActive: false,
    latencyMs: 20,
    isSimulated: true,
  },
  {
    id: 'm-vox-chloe',
    role: 'musician',
    name: 'Chloe Sinclair (Lead Vox)',
    section: 'Lead Vocals',
    connectionType: 'bluetooth',
    codec: 'LC3-48k',
    sampleRate: 48000,
    batteryLevel: 82,
    isMuted: true,
    isRtsActive: false,
    btDeviceName: 'Sony WF-1000XM5 (Custom IEM)',
    btProfile: 'BLE-LC3',
    latencyMs: 21,
    isSimulated: true,
  },
  {
    id: 'm-vox2-jordan',
    role: 'musician',
    name: 'Jordan K. (Backing Vox)',
    section: 'Backing Vocals',
    connectionType: 'wifi',
    codec: 'OPUS-48k',
    sampleRate: 48000,
    batteryLevel: 87,
    isMuted: true,
    isRtsActive: false,
    latencyMs: 24,
    isSimulated: true,
  },
  {
    id: 'm-brass-tp1',
    role: 'musician',
    name: 'Miles B. (Trumpet 1)',
    section: 'Brass',
    connectionType: 'bluetooth',
    codec: 'LC3-48k',
    sampleRate: 48000,
    batteryLevel: 73,
    isMuted: true,
    isRtsActive: false,
    btDeviceName: 'Shure SE215-BT Wireless IEM',
    btProfile: 'A2DP',
    latencyMs: 29,
    isSimulated: true,
  },
  {
    id: 'm-brass-sax',
    role: 'musician',
    name: 'Zoe Hart (Tenor Sax)',
    section: 'Brass',
    connectionType: 'wifi',
    codec: 'OPUS-48k',
    sampleRate: 48000,
    batteryLevel: 89,
    isMuted: true,
    isRtsActive: false,
    latencyMs: 17,
    isSimulated: true,
  },
  {
    id: 'm-brass-tb',
    role: 'musician',
    name: 'Andre Wells (Trombone)',
    section: 'Brass',
    connectionType: 'wifi',
    codec: 'OPUS-48k',
    sampleRate: 48000,
    batteryLevel: 93,
    isMuted: true,
    isRtsActive: false,
    latencyMs: 21,
    isSimulated: true,
  },
  {
    id: 'm-tech-mon',
    role: 'musician',
    name: 'Alex Rivera (Stage Tech)',
    section: 'Stage Crew / Tech',
    connectionType: 'hybrid',
    codec: 'LC3-48k',
    sampleRate: 48000,
    batteryLevel: 99,
    isMuted: true,
    isRtsActive: false,
    btDeviceName: 'Apple AirPods Pro 2',
    btProfile: 'HFP',
    latencyMs: 15,
    isSimulated: true,
  },
];

interface IntercomContextType {
  role: ClientRole;
  setRole: (role: ClientRole) => void;
  clientId: string;
  clientName: string;
  setClientName: (name: string) => void;
  section: SectionType;
  setSection: (section: SectionType) => void;
  connectionType: ConnectionType;
  setConnectionType: (type: ConnectionType) => void;
  
  // Connection status
  isWsConnected: boolean;
  roundTripLatencyMs: number;
  
  // Talkback controls
  isTransmitting: boolean;
  talkMode: 'ptt' | 'latch';
  setTalkMode: (mode: 'ptt' | 'latch') => void;
  startTransmitting: () => Promise<void>;
  stopTransmitting: () => void;
  toggleLatch: () => Promise<void>;
  
  // Routing
  talkTarget: string; // 'all' | SectionType | member.id
  setTalkTarget: (target: string) => void;
  
  // Visual cues from other talkers
  technicianSpeaking: boolean;
  technicianTarget: string;
  musicianTalking: { active: boolean; id: string; name: string; section: string } | null;
  
  // Musician RTS (Request to Speak)
  isRtsActive: boolean;
  toggleRts: () => void;
  clearRtsForMember: (memberId: string) => void;
  
  // Ducking & Hearing Safety
  duckingDb: number;
  setDuckingDb: (db: number) => void;
  limiterActive: boolean;
  setLimiterActive: (active: boolean) => void;
  limiterThresholdDb: number;
  setLimiterThresholdDb: (db: number) => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  
  // Program Feed
  programFeedPlaying: boolean;
  programFeedType: 'funk' | 'click' | 'pink_noise';
  setProgramFeedType: (type: 'funk' | 'click' | 'pink_noise') => void;
  toggleProgramFeed: () => void;
  
  // VU meter levels
  inputPeakDb: number;
  inputRmsDb: number;
  inputClipping: boolean;
  outputPeakDb: number;
  outputRmsDb: number;
  outputClipping: boolean;
  
  // Roster & Bluetooth
  roster: MusicianMember[];
  bluetoothDevices: BluetoothDeviceItem[];
  scanBluetooth: () => Promise<void>;
  assignBtDevice: (deviceId: string, targetClientId: string) => void;
  unassignBtDevice: (deviceId: string) => void;
  setBtProfile: (deviceId: string, profile: BluetoothProfile) => void;
  
  // Master Tech Controls & Permissions
  isMasterTech: boolean;
  isMutedByTech: boolean;
  devSwitchRole: (role: ClientRole) => void;
  techRenameMusician: (targetId: string, newName: string) => void;
  techToggleMuteMusician: (targetId: string, isMuted?: boolean) => void;

  // Simulated Roster toggle
  includeSimulatedMusicians: boolean;
  setIncludeSimulatedMusicians: (include: boolean) => void;
}

const IntercomContext = createContext<IntercomContextType | null>(null);

export const IntercomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<ClientRole>('technician');
  const [clientId] = useState<string>(() => `st-${Math.random().toString(36).substring(2, 8)}`);
  const [clientName, setClientName] = useState<string>('Master Technician');
  const [section, setSection] = useState<SectionType>('Stage Crew / Tech');
  const [connectionType, setConnectionType] = useState<ConnectionType>('wifi');

  const [isWsConnected, setIsWsConnected] = useState(false);
  const [roundTripLatencyMs, setRoundTripLatencyMs] = useState(18);

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [talkMode, setTalkMode] = useState<'ptt' | 'latch'>('ptt');
  const [talkTarget, setTalkTarget] = useState<string>('all');

  const [technicianSpeaking, setTechnicianSpeaking] = useState(false);
  const [technicianTarget, setTechnicianTarget] = useState('all');
  const [musicianTalking, setMusicianTalking] = useState<{ active: boolean; id: string; name: string; section: string } | null>(null);

  const [isRtsActive, setIsRtsActive] = useState(false);

  // Master Technician controls & mute lock
  const [serverMasterTechId, setServerMasterTechId] = useState<string | null>(null);
  const [isMutedByTech, setIsMutedByTech] = useState(false);
  const isMasterTech = role === 'technician' && (serverMasterTechId === null || serverMasterTechId === clientId);

  // Audio settings
  const [duckingDb, setDuckingDbState] = useState(-15);
  const [limiterActive, setLimiterActiveState] = useState(true);
  const [limiterThresholdDb, setLimiterThresholdDbState] = useState(-6);
  const [masterVolume, setMasterVolumeState] = useState(85);

  // Program feed
  const [programFeedPlaying, setProgramFeedPlaying] = useState(false);
  const [programFeedType, setProgramFeedType] = useState<'funk' | 'click' | 'pink_noise'>('funk');

  // Peak VU meters
  const [inputPeakDb, setInputPeakDb] = useState(-60);
  const [inputRmsDb, setInputRmsDb] = useState(-60);
  const [inputClipping, setInputClipping] = useState(false);
  const [outputPeakDb, setOutputPeakDb] = useState(-60);
  const [outputRmsDb, setOutputRmsDb] = useState(-60);
  const [outputClipping, setOutputClipping] = useState(false);

  // Members & Bluetooth
  const [serverRoster, setServerRoster] = useState<MusicianMember[]>([]);
  const [includeSimulatedMusicians, setIncludeSimulatedMusicians] = useState(true);
  const [simulatedRoster, setSimulatedRoster] = useState<MusicianMember[]>(INITIAL_SIMULATED_ROSTER);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDeviceItem[]>(() => globalBluetoothManager.getDevices());

  const wsRef = useRef<WebSocket | null>(null);
  const pingStartRef = useRef<number>(0);

  // Update role and sensible default names
  const setRole = (newRole: ClientRole) => {
    setRoleState(newRole);
    if (newRole === 'technician') {
      setClientName('Master Technician');
      setSection('Stage Crew / Tech');
    } else {
      setClientName('Davey Chen (Lead Gtr)');
      setSection('Guitars');
    }
  };

  // Hidden Developer Debug Toggle: switches role in IntercomContext state without needing a backend
  const devSwitchRole = (newRole: ClientRole) => {
    setRole(newRole);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'REGISTER',
        id: clientId,
        role: newRole,
        name: newRole === 'technician' ? 'Master Technician' : 'Davey Chen (Lead Gtr)',
        section: newRole === 'technician' ? 'Stage Crew / Tech' : 'Guitars',
        connectionType,
        codec: 'OPUS-48k',
        sampleRate: 48000,
        batteryLevel: 94,
        isMuted: true,
      }));
    }
  };

  // Connect AudioEngine callbacks
  useEffect(() => {
    globalAudioEngine.onInputPeakUpdate = (peak, rms, clip) => {
      setInputPeakDb(Math.round(peak));
      setInputRmsDb(Math.round(rms));
      setInputClipping(clip);
    };

    globalAudioEngine.onOutputPeakUpdate = (peak, rms, clip) => {
      setOutputPeakDb(Math.round(peak));
      setOutputRmsDb(Math.round(rms));
      setOutputClipping(clip);
    };

    // Forward raw audio frames to WebSocket server
    globalAudioEngine.onAudioDataChunk = (chunk) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(chunk);
      }
    };

    return () => {
      globalAudioEngine.cleanup();
    };
  }, []);

  // Ducking update
  const setDuckingDb = (db: number) => {
    setDuckingDbState(db);
    globalAudioEngine.setDuckingActive(technicianSpeaking, db);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SET_DUCKING', duckingDb: db }));
    }
  };

  const setLimiterActive = (active: boolean) => {
    setLimiterActiveState(active);
    globalAudioEngine.setLimiter(active, limiterThresholdDb);
  };

  const setLimiterThresholdDb = (db: number) => {
    setLimiterThresholdDbState(db);
    globalAudioEngine.setLimiter(limiterActive, db);
  };

  const setMasterVolume = (vol: number) => {
    setMasterVolumeState(vol);
    globalAudioEngine.setMasterVolume(vol / 100);
  };

  const toggleProgramFeed = () => {
    const isNowActive = globalAudioEngine.toggleProgramFeed(programFeedType);
    setProgramFeedPlaying(isNowActive);
  };

  // WebSocket Connection
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: number;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
          // Register with server
          ws.send(JSON.stringify({
            type: 'REGISTER',
            id: clientId,
            role,
            name: clientName,
            section,
            connectionType,
            codec: 'OPUS-48k',
            sampleRate: 48000,
            batteryLevel: 94,
            isMuted: !isTransmitting,
          }));

          // Send immediate ping
          pingStartRef.current = Date.now();
          ws.send(JSON.stringify({ type: 'PING', time: pingStartRef.current }));
        };

        ws.onmessage = async (event) => {
          if (event.data instanceof Blob) {
            // Binary audio chunk from another member/technician
            const arrayBuffer = await event.data.arrayBuffer();
            globalAudioEngine.playIncomingAudioChunk(arrayBuffer);
            return;
          }

          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);
              switch (msg.type) {
                case 'REGISTERED': {
                  if (msg.masterTechnicianId !== undefined) {
                    setServerMasterTechId(msg.masterTechnicianId);
                  }
                  if (msg.assignedRole && msg.assignedRole !== role) {
                    setRoleState(msg.assignedRole);
                    if (msg.assignedName) setClientName(msg.assignedName);
                  }
                  break;
                }

                case 'ROSTER_UPDATE': {
                  setServerRoster(msg.roster || []);
                  if (msg.masterTechnicianId !== undefined) {
                    setServerMasterTechId(msg.masterTechnicianId);
                  }
                  if (typeof msg.technicianTalking === 'boolean') {
                    setTechnicianSpeaking(msg.technicianTalking);
                    globalAudioEngine.setDuckingActive(msg.technicianTalking, msg.audioDuckingDb);
                  }
                  if (msg.technicianTarget) {
                    setTechnicianTarget(msg.technicianTarget);
                  }

                  // Sync my own name and mute state if updated on server
                  const me = (msg.roster || []).find((m: MusicianMember) => m.id === clientId);
                  if (me) {
                    if (me.name && me.name !== clientName) {
                      setClientName(me.name);
                    }
                    if (typeof me.isMutedByTech === 'boolean') {
                      setIsMutedByTech(me.isMutedByTech);
                      if (me.isMutedByTech && isTransmitting) {
                        stopTransmitting();
                      }
                    }
                  }
                  break;
                }

                case 'FORCE_MUTE_BY_TECH': {
                  setIsMutedByTech(!!msg.isMuted);
                  if (msg.isMuted && isTransmitting) {
                    stopTransmitting();
                  }
                  break;
                }

                case 'NAME_UPDATED_BY_TECH': {
                  if (msg.newName) {
                    setClientName(msg.newName);
                  }
                  break;
                }

                case 'TECHNICIAN_TALK_STATE': {
                  setTechnicianSpeaking(msg.active);
                  setTechnicianTarget(msg.target || 'all');
                  globalAudioEngine.setDuckingActive(msg.active, msg.duckingDb);
                  break;
                }

                case 'MUSICIAN_TALK_STATE': {
                  if (msg.active) {
                    setMusicianTalking({
                      active: true,
                      id: msg.musicianId,
                      name: msg.musicianName,
                      section: msg.section,
                    });
                  } else {
                    setMusicianTalking(null);
                  }
                  break;
                }

                case 'BT_DEVICE_ASSIGNED': {
                  // Direct notification that technician routed a BT device to this musician
                  globalBluetoothManager.refreshHardwareAudioDevices();
                  setBluetoothDevices(globalBluetoothManager.getDevices());
                  break;
                }

                case 'PONG': {
                  const now = Date.now();
                  const rtt = Math.max(8, now - msg.clientSendTime);
                  setRoundTripLatencyMs(rtt);
                  // Report latency to server
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'PING_REPORT', latencyMs: rtt }));
                  }
                  break;
                }

                case 'HEARTBEAT': {
                  // Keep-alive ping reply
                  pingStartRef.current = Date.now();
                  ws.send(JSON.stringify({ type: 'PING', time: pingStartRef.current }));
                  break;
                }
              }
            } catch (err) {
              console.error('Failed to parse incoming WebSocket message:', err);
            }
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = window.setTimeout(connectWs, 2000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
        };
      } catch (err) {
        console.warn('WebSocket connection error:', err);
        reconnectTimeout = window.setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    // Periodic ping loop for accurate real-time latency readout
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        pingStartRef.current = Date.now();
        wsRef.current.send(JSON.stringify({ type: 'PING', time: pingStartRef.current }));
      }
    }, 4000);

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clientId, role, isTransmitting, clientName]);

  // Sync profile update to server
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'UPDATE_PROFILE',
        name: clientName,
        section,
        connectionType,
      }));
    }
  }, [clientName, section, connectionType]);

  // Master Technician only: Edit musician name
  const techRenameMusician = (targetId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Update locally in simulated roster
    setSimulatedRoster(prev => prev.map(m => m.id === targetId ? { ...m, name: trimmed } : m));

    // If target is current client
    if (targetId === clientId) {
      setClientName(trimmed);
    }

    // Send to WebSocket server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'TECH_RENAME_MUSICIAN',
        targetMusicianId: targetId,
        newName: trimmed,
      }));
    }
  };

  // Master Technician only: Mute/unmute musician
  const techToggleMuteMusician = (targetId: string, forceMute?: boolean) => {
    setSimulatedRoster(prev => prev.map(m => {
      if (m.id === targetId) {
        const nextMute = forceMute !== undefined ? forceMute : !m.isMutedByTech;
        return { ...m, isMutedByTech: nextMute, isMuted: nextMute };
      }
      return m;
    }));

    if (targetId === clientId) {
      setIsMutedByTech(prev => {
        const next = forceMute !== undefined ? forceMute : !prev;
        if (next && isTransmitting) {
          stopTransmitting();
        }
        return next;
      });
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const targetMember = roster.find(m => m.id === targetId);
      const nextMute = forceMute !== undefined ? forceMute : !targetMember?.isMutedByTech;
      wsRef.current.send(JSON.stringify({
        type: 'TECH_TOGGLE_MUTE_MUSICIAN',
        targetMusicianId: targetId,
        isMuted: nextMute,
      }));
    }
  };

  // Push-to-Talk (PTT) transmit actions
  const startTransmitting = useCallback(async () => {
    if (isTransmitting) return;

    // If musician is muted by Master Tech, transmission is blocked!
    if (role === 'musician' && isMutedByTech) {
      globalAudioEngine.playTactileChirp(300, 0.08); // warning buzz
      return;
    }

    // Initialize audio context and mic
    await globalAudioEngine.init();
    await globalAudioEngine.requestMicrophone();

    globalAudioEngine.setMicTransmitting(true);
    setIsTransmitting(true);

    if (role === 'technician') {
      setTechnicianSpeaking(true);
      setTechnicianTarget(talkTarget);
      globalAudioEngine.setDuckingActive(true, duckingDb);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PTT_STATE',
        active: true,
        target: talkTarget,
        duckingDb,
      }));
    }
  }, [isTransmitting, role, isMutedByTech, talkTarget, duckingDb]);

  const stopTransmitting = useCallback(() => {
    if (!isTransmitting) return;

    globalAudioEngine.setMicTransmitting(false);
    setIsTransmitting(false);

    if (role === 'technician') {
      setTechnicianSpeaking(false);
      globalAudioEngine.setDuckingActive(false, duckingDb);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PTT_STATE',
        active: false,
        target: talkTarget,
        duckingDb,
      }));
    }
  }, [isTransmitting, role, talkTarget, duckingDb]);

  const toggleLatch = useCallback(async () => {
    if (isTransmitting) {
      stopTransmitting();
    } else {
      await startTransmitting();
    }
  }, [isTransmitting, startTransmitting, stopTransmitting]);

  // RTS (Request to Speak) toggle for musicians
  const toggleRts = () => {
    const nextState = !isRtsActive;
    setIsRtsActive(nextState);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'RTS_TOGGLE',
        active: nextState,
      }));
    }
  };

  const clearRtsForMember = (memberId: string) => {
    setSimulatedRoster(prev => prev.map(m => m.id === memberId ? { ...m, isRtsActive: false } : m));
  };

  // Bluetooth Manager integrations
  const scanBluetooth = async () => {
    await globalBluetoothManager.scanForWebBluetooth();
    await globalBluetoothManager.refreshHardwareAudioDevices();
    setBluetoothDevices(globalBluetoothManager.getDevices());
  };

  const assignBtDevice = (deviceId: string, targetClientId: string) => {
    const targetMember = roster.find(m => m.id === targetClientId);
    const memberName = targetMember ? targetMember.name : 'Musician';
    globalBluetoothManager.assignDeviceToMusician(deviceId, targetClientId, memberName);
    setBluetoothDevices(globalBluetoothManager.getDevices());

    // If simulated member, update locally
    setSimulatedRoster(prev => prev.map(m => {
      if (m.id === targetClientId) {
        const dev = bluetoothDevices.find(d => d.id === deviceId);
        return {
          ...m,
          connectionType: 'bluetooth',
          btDeviceName: dev?.name || 'Bluetooth IEM',
          btProfile: dev?.profile || 'A2DP',
        };
      }
      return m;
    }));

    // If live server member, notify server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const dev = bluetoothDevices.find(d => d.id === deviceId);
      wsRef.current.send(JSON.stringify({
        type: 'ASSIGN_BT_DEVICE',
        targetClientId,
        btDeviceName: dev?.name || 'Bluetooth IEM',
        btProfile: dev?.profile || 'A2DP',
      }));
    }
  };

  const unassignBtDevice = (deviceId: string) => {
    globalBluetoothManager.unassignDevice(deviceId);
    setBluetoothDevices(globalBluetoothManager.getDevices());
  };

  const setBtProfile = (deviceId: string, profile: BluetoothProfile) => {
    globalBluetoothManager.setDeviceProfile(deviceId, profile);
    setBluetoothDevices(globalBluetoothManager.getDevices());
  };

  // Combine server roster and simulated musicians for rich 10+ member dashboard testing
  const roster: MusicianMember[] = React.useMemo(() => {
    // If not including simulated, return server only
    if (!includeSimulatedMusicians) {
      return serverRoster;
    }

    // Merge server roster (removing simulated with same id if any)
    const serverIds = new Set(serverRoster.map(m => m.id));
    const nonCollidingSimulated = simulatedRoster.filter(m => !serverIds.has(m.id));
    return [...serverRoster, ...nonCollidingSimulated];
  }, [serverRoster, simulatedRoster, includeSimulatedMusicians]);

  return (
    <IntercomContext.Provider
      value={{
        role,
        setRole,
        clientId,
        clientName,
        setClientName,
        section,
        setSection,
        connectionType,
        setConnectionType,
        isWsConnected,
        roundTripLatencyMs,
        isTransmitting,
        talkMode,
        setTalkMode,
        startTransmitting,
        stopTransmitting,
        toggleLatch,
        talkTarget,
        setTalkTarget,
        technicianSpeaking,
        technicianTarget,
        musicianTalking,
        isRtsActive,
        toggleRts,
        clearRtsForMember,
        duckingDb,
        setDuckingDb,
        limiterActive,
        setLimiterActive,
        limiterThresholdDb,
        setLimiterThresholdDb,
        masterVolume,
        setMasterVolume,
        programFeedPlaying,
        programFeedType,
        setProgramFeedType,
        toggleProgramFeed,
        inputPeakDb,
        inputRmsDb,
        inputClipping,
        outputPeakDb,
        outputRmsDb,
        outputClipping,
        roster,
        bluetoothDevices,
        scanBluetooth,
        assignBtDevice,
        unassignBtDevice,
        setBtProfile,
        includeSimulatedMusicians,
        setIncludeSimulatedMusicians,
        isMasterTech,
        isMutedByTech,
        devSwitchRole,
        techRenameMusician,
        techToggleMuteMusician,
      }}
    >
      {children}
    </IntercomContext.Provider>
  );
};

export const useIntercom = () => {
  const ctx = useContext(IntercomContext);
  if (!ctx) {
    throw new Error('useIntercom must be used within an IntercomProvider');
  }
  return ctx;
};
