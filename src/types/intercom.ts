export type ClientRole = 'technician' | 'musician';

export type SectionType = 
  | 'Drums' 
  | 'Guitars' 
  | 'Bass' 
  | 'Keyboards' 
  | 'Lead Vocals' 
  | 'Brass' 
  | 'Backing Vocals' 
  | 'Stage Crew / Tech';

export const ALL_SECTIONS: SectionType[] = [
  'Drums',
  'Guitars',
  'Bass',
  'Keyboards',
  'Lead Vocals',
  'Brass',
  'Backing Vocals',
  'Stage Crew / Tech'
];

export type ConnectionType = 'wifi' | 'bluetooth' | 'hybrid';

export type BluetoothProfile = 'A2DP' | 'HFP' | 'BLE-LC3';

export interface BluetoothDeviceItem {
  id: string;
  name: string;
  paired: boolean;
  profile: BluetoothProfile;
  batteryLevel: number;
  assignedMusicianId?: string;
  assignedMusicianName?: string;
  rssi: number; // dBm
  latencyEstimatedMs: number;
}

export interface MusicianMember {
  id: string;
  role: ClientRole;
  name: string;
  section: string;
  connectionType: ConnectionType;
  codec: string;
  sampleRate: number;
  batteryLevel: number;
  isMuted: boolean;
  isMutedByTech?: boolean;
  isRtsActive: boolean;
  btDeviceName?: string;
  btProfile?: BluetoothProfile;
  latencyMs: number;
  isSimulated?: boolean;
}

export interface IntercomState {
  role: ClientRole;
  clientId: string;
  clientName: string;
  section: SectionType;
  connectionType: ConnectionType;
  
  // Audio state
  isTransmitting: boolean;
  talkMode: 'ptt' | 'latch';
  talkTarget: string; // 'all' | SectionType | member.id
  
  // Active talk indicators
  technicianSpeaking: boolean;
  technicianTarget: string;
  musicianTalking: { active: boolean; id: string; name: string; section: string } | null;
  
  // Ducking & Hearing Safety
  duckingDb: number; // e.g. -15dB
  isDuckingActive: boolean;
  limiterActive: boolean;
  limiterThresholdDb: number;
  masterVolume: number; // 0 - 100
  
  // RTS
  isRtsActive: boolean;
  
  // Bluetooth
  connectedBtDevice: BluetoothDeviceItem | null;
  btProfile: BluetoothProfile;
  
  // Network stats
  latencyMs: number;
  packetJitterMs: number;
  frameSizeMs: number;
  codec: string;
  networkMode: 'Local Wi-Fi P2P' | 'Bluetooth Classic' | 'BLE Mesh';
  
  // Program Feed for stage testing
  programFeedPlaying: boolean;
  programFeedTrack: string;
  programFeedVolume: number;
}
