/**
 * StageTalk Bluetooth Manager
 * Manages Bluetooth Audio Profiles (A2DP, HFP, BLE-LC3), Web Bluetooth API scanning,
 * audio output routing (setSinkId), and IEM device assignments.
 */

import { BluetoothDeviceItem, BluetoothProfile } from '../types/intercom';

// Realistic stage IEM and headset models for professional event setups
const STAGE_IEM_PRESETS: Omit<BluetoothDeviceItem, 'assignedMusicianId' | 'assignedMusicianName'>[] = [
  {
    id: 'bt-shure-215',
    name: 'Shure SE215-BT Wireless IEM',
    paired: true,
    profile: 'A2DP',
    batteryLevel: 92,
    rssi: -58,
    latencyEstimatedMs: 28,
  },
  {
    id: 'bt-senn-ie100',
    name: 'Sennheiser IE 100 PRO BT',
    paired: true,
    profile: 'BLE-LC3',
    batteryLevel: 85,
    rssi: -62,
    latencyEstimatedMs: 22,
  },
  {
    id: 'bt-sony-xm5',
    name: 'Sony WF-1000XM5 (Stage Mix)',
    paired: false,
    profile: 'A2DP',
    batteryLevel: 78,
    rssi: -71,
    latencyEstimatedMs: 34,
  },
  {
    id: 'bt-lectro-dcht',
    name: 'Lectrosonics DCHT Beltpack Transceiver',
    paired: true,
    profile: 'BLE-LC3',
    batteryLevel: 98,
    rssi: -45,
    latencyEstimatedMs: 14,
  },
  {
    id: 'bt-airpods-pro',
    name: 'Apple AirPods Pro 2 (HFP Comm)',
    paired: false,
    profile: 'HFP',
    batteryLevel: 88,
    rssi: -64,
    latencyEstimatedMs: 31,
  },
  {
    id: 'bt-audio-technica',
    name: 'Audio-Technica ATH-E70 BT IEM',
    paired: true,
    profile: 'A2DP',
    batteryLevel: 67,
    rssi: -73,
    latencyEstimatedMs: 30,
  },
];

export class BluetoothManager {
  private devices: BluetoothDeviceItem[] = [];
  private hardwareOutputDevices: MediaDeviceInfo[] = [];

  constructor() {
    this.devices = [...STAGE_IEM_PRESETS];
    this.refreshHardwareAudioDevices();
  }

  public async refreshHardwareAudioDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      this.hardwareOutputDevices = allDevices.filter(d => d.kind === 'audiooutput');

      // Sync hardware devices into list if named
      for (const hw of this.hardwareOutputDevices) {
        if (hw.label && !this.devices.some(d => d.id === hw.deviceId)) {
          const isBt = /bluetooth|headset|earbud|airpods|iem|buds/i.test(hw.label);
          this.devices.push({
            id: hw.deviceId,
            name: hw.label || `Audio Output (${hw.deviceId.slice(0, 5)})`,
            paired: true,
            profile: isBt ? 'A2DP' : 'BLE-LC3',
            batteryLevel: 90,
            rssi: -55,
            latencyEstimatedMs: isBt ? 25 : 12,
          });
        }
      }
      return this.hardwareOutputDevices;
    } catch (err) {
      console.warn('Could not enumerate audio devices:', err);
      return [];
    }
  }

  public getDevices(): BluetoothDeviceItem[] {
    return [...this.devices];
  }

  public async scanForWebBluetooth(): Promise<BluetoothDeviceItem | null> {
    const nav = navigator as unknown as {
      bluetooth?: {
        requestDevice: (options: {
          acceptAllDevices?: boolean;
          optionalServices?: string[];
        }) => Promise<{ id: string; name?: string; gatt?: unknown }>;
      };
    };

    if (nav.bluetooth && typeof nav.bluetooth.requestDevice === 'function') {
      try {
        const device = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access', 'battery_service', 'heart_rate'],
        });

        const newDevice: BluetoothDeviceItem = {
          id: device.id,
          name: device.name || 'Discovered BLE Audio Device',
          paired: true,
          profile: 'BLE-LC3',
          batteryLevel: 95,
          rssi: -50,
          latencyEstimatedMs: 19,
        };

        const existingIdx = this.devices.findIndex(d => d.id === device.id);
        if (existingIdx >= 0) {
          this.devices[existingIdx] = newDevice;
        } else {
          this.devices.unshift(newDevice);
        }

        return newDevice;
      } catch (err) {
        console.warn('Web Bluetooth scan cancelled or not permitted:', err);
      }
    }

    // Fallback: discover an offline stage IEM
    const newOfflineIEM: BluetoothDeviceItem = {
      id: `bt-iem-${Math.random().toString(36).substring(2, 7)}`,
      name: `Shure PSM300 BT Receiver #${Math.floor(Math.random() * 90 + 10)}`,
      paired: true,
      profile: 'BLE-LC3',
      batteryLevel: 96,
      rssi: -49,
      latencyEstimatedMs: 16,
    };
    this.devices.unshift(newOfflineIEM);
    return newOfflineIEM;
  }

  public assignDeviceToMusician(deviceId: string, musicianId: string, musicianName: string) {
    this.devices = this.devices.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          assignedMusicianId: musicianId,
          assignedMusicianName: musicianName,
          paired: true,
        };
      }
      if (d.assignedMusicianId === musicianId) {
        return {
          ...d,
          assignedMusicianId: undefined,
          assignedMusicianName: undefined,
        };
      }
      return d;
    });
  }

  public unassignDevice(deviceId: string) {
    this.devices = this.devices.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          assignedMusicianId: undefined,
          assignedMusicianName: undefined,
        };
      }
      return d;
    });
  }

  public setDeviceProfile(deviceId: string, profile: BluetoothProfile) {
    this.devices = this.devices.map(d => {
      if (d.id === deviceId) {
        const latency = profile === 'BLE-LC3' ? 18 : profile === 'HFP' ? 24 : 32;
        return {
          ...d,
          profile,
          latencyEstimatedMs: latency,
        };
      }
      return d;
    });
  }
}

export const globalBluetoothManager = new BluetoothManager();
