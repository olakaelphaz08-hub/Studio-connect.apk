import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// Initialize WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

interface ClientInfo {
  id: string;
  role: 'technician' | 'musician';
  name: string;
  section: string;
  connectionType: 'wifi' | 'bluetooth' | 'hybrid';
  codec: string;
  sampleRate: number;
  batteryLevel: number;
  isMuted: boolean;
  isMutedByTech?: boolean;
  isRtsActive: boolean;
  btDeviceName?: string;
  btProfile?: 'A2DP' | 'HFP' | 'BLE-LC3';
  latencyMs: number;
  lastPingTime: number;
  ws: WebSocket;
}

const clients = new Map<string, ClientInfo>();

// Audio routing & Talkback state
let masterTechnicianId: string | null = null;
let technicianTalking = false;
let technicianTarget = 'all'; // 'all' | section name | specific client id
let audioDuckingDb = -15; // 15dB reduction during talkback

function broadcastClientList() {
  const roster = Array.from(clients.values()).map(c => ({
    id: c.id,
    role: c.role,
    name: c.name,
    section: c.section,
    connectionType: c.connectionType,
    codec: c.codec,
    sampleRate: c.sampleRate,
    batteryLevel: c.batteryLevel,
    isMuted: c.isMuted,
    isMutedByTech: c.isMutedByTech || false,
    isRtsActive: c.isRtsActive,
    btDeviceName: c.btDeviceName,
    btProfile: c.btProfile,
    latencyMs: c.latencyMs,
  }));

  const payload = JSON.stringify({
    type: 'ROSTER_UPDATE',
    roster,
    masterTechnicianId,
    technicianTalking,
    technicianTarget,
    audioDuckingDb,
    timestamp: Date.now(),
  });

  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  let clientId = '';

  ws.on('message', (data: Buffer | string, isBinary: boolean) => {
    // Check if binary audio data
    if (isBinary) {
      // Audio chunk from talker. Forward according to talker routing.
      const sender = clients.get(clientId);
      if (!sender) return;

      // If musician is muted by the Master Technician, block their audio!
      if (sender.role === 'musician' && sender.isMutedByTech) {
        return;
      }

      // If binary audio has a 4-byte header or metadata, or simple broadcast
      for (const [id, targetClient] of clients.entries()) {
        if (id === clientId) continue; // don't echo to sender
        if (targetClient.ws.readyState !== WebSocket.OPEN) continue;

        // Check routing rule
        if (sender.role === 'technician') {
          if (technicianTarget === 'all') {
            targetClient.ws.send(data, { binary: true });
          } else if (technicianTarget === targetClient.section) {
            targetClient.ws.send(data, { binary: true });
          } else if (technicianTarget === targetClient.id) {
            targetClient.ws.send(data, { binary: true });
          }
        } else if (sender.role === 'musician') {
          // Musician talking back to technician or band
          if (targetClient.role === 'technician' || targetClient.section === sender.section) {
            targetClient.ws.send(data, { binary: true });
          }
        }
      }
      return;
    }

    // JSON text messages
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'REGISTER': {
          clientId = msg.id || `st-${Math.random().toString(36).substring(2, 9)}`;

          // Single Master Technician enforcement
          let effectiveRole: 'technician' | 'musician' = msg.role || 'musician';
          let effectiveName = msg.name || 'Stage Musician';

          if (effectiveRole === 'technician') {
            if (masterTechnicianId === null || masterTechnicianId === clientId) {
              masterTechnicianId = clientId;
              effectiveRole = 'technician';
              effectiveName = 'Master Technician';
            } else {
              // Only one Master Technician allowed - assign as musician
              effectiveRole = 'musician';
              effectiveName = msg.name || 'Stage Musician';
            }
          } else {
            if (masterTechnicianId === clientId) {
              masterTechnicianId = null;
            }
          }

          const clientInfo: ClientInfo = {
            id: clientId,
            role: effectiveRole,
            name: effectiveName,
            section: msg.section || 'General',
            connectionType: msg.connectionType || 'wifi',
            codec: msg.codec || 'OPUS-48k',
            sampleRate: msg.sampleRate || 48000,
            batteryLevel: msg.batteryLevel ?? 95,
            isMuted: msg.isMuted ?? true,
            isMutedByTech: false,
            isRtsActive: false,
            btDeviceName: msg.btDeviceName,
            btProfile: msg.btProfile || 'A2DP',
            latencyMs: 18,
            lastPingTime: Date.now(),
            ws,
          };
          clients.set(clientId, clientInfo);

          ws.send(JSON.stringify({
            type: 'REGISTERED',
            assignedId: clientId,
            assignedRole: effectiveRole,
            assignedName: effectiveName,
            masterTechnicianId,
            technicianTalking,
            technicianTarget,
            audioDuckingDb,
          }));

          broadcastClientList();
          break;
        }

        case 'UPDATE_PROFILE': {
          const client = clients.get(clientId);
          if (client) {
            // Only update name if Master Tech, or if it's the Master Tech's own profile
            if (msg.name !== undefined && (client.role === 'technician' || client.id === masterTechnicianId)) {
              client.name = msg.name;
            }
            if (msg.section !== undefined) client.section = msg.section;
            if (msg.connectionType !== undefined) client.connectionType = msg.connectionType;
            if (msg.batteryLevel !== undefined) client.batteryLevel = msg.batteryLevel;
            if (msg.btDeviceName !== undefined) client.btDeviceName = msg.btDeviceName;
            if (msg.btProfile !== undefined) client.btProfile = msg.btProfile;
            if (msg.codec !== undefined) client.codec = msg.codec;
            broadcastClientList();
          }
          break;
        }

        case 'PTT_STATE': {
          const client = clients.get(clientId);
          if (!client) break;

          if (client.role === 'technician') {
            technicianTalking = !!msg.active;
            if (msg.target) technicianTarget = msg.target;
            if (msg.duckingDb !== undefined) audioDuckingDb = msg.duckingDb;

            // Notify everyone immediately about talkback state & ducking
            const talkNotice = JSON.stringify({
              type: 'TECHNICIAN_TALK_STATE',
              active: technicianTalking,
              target: technicianTarget,
              duckingDb: audioDuckingDb,
              senderId: clientId,
            });

            for (const c of clients.values()) {
              if (c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(talkNotice);
              }
            }
          } else {
            // Musician band talkback transmission
            // Reject transmission if muted by Master Technician
            if (client.isMutedByTech && msg.active) {
              ws.send(JSON.stringify({
                type: 'FORCE_MUTE_BY_TECH',
                isMuted: true,
              }));
              break;
            }

            const bandTalkNotice = JSON.stringify({
              type: 'MUSICIAN_TALK_STATE',
              active: !!msg.active,
              musicianId: clientId,
              musicianName: client.name,
              section: client.section,
            });

            for (const c of clients.values()) {
              if (c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(bandTalkNotice);
              }
            }
          }
          broadcastClientList();
          break;
        }

        case 'TECH_RENAME_MUSICIAN': {
          const sender = clients.get(clientId);
          if (sender && (sender.role === 'technician' || clientId === masterTechnicianId)) {
            const target = clients.get(msg.targetMusicianId);
            if (target && msg.newName) {
              target.name = msg.newName.trim();
              target.ws.send(JSON.stringify({
                type: 'NAME_UPDATED_BY_TECH',
                newName: target.name,
              }));
              broadcastClientList();
            }
          }
          break;
        }

        case 'TECH_TOGGLE_MUTE_MUSICIAN': {
          const sender = clients.get(clientId);
          if (sender && (sender.role === 'technician' || clientId === masterTechnicianId)) {
            const target = clients.get(msg.targetMusicianId);
            if (target) {
              target.isMutedByTech = !!msg.isMuted;
              target.isMuted = !!msg.isMuted;
              target.ws.send(JSON.stringify({
                type: 'FORCE_MUTE_BY_TECH',
                isMuted: target.isMutedByTech,
              }));
              broadcastClientList();
            }
          }
          break;
        }

        case 'RTS_TOGGLE': {
          // Musician request to speak
          const client = clients.get(clientId);
          if (client) {
            client.isRtsActive = !!msg.active;
            broadcastClientList();
          }
          break;
        }

        case 'ASSIGN_BT_DEVICE': {
          // Technician assigning BT device to a musician
          const target = clients.get(msg.targetClientId);
          if (target) {
            target.btDeviceName = msg.btDeviceName;
            target.btProfile = msg.btProfile || 'A2DP';
            target.connectionType = 'bluetooth';
            target.ws.send(JSON.stringify({
              type: 'BT_DEVICE_ASSIGNED',
              btDeviceName: msg.btDeviceName,
              btProfile: target.btProfile,
            }));
            broadcastClientList();
          }
          break;
        }

        case 'SET_DUCKING': {
          audioDuckingDb = msg.duckingDb;
          broadcastClientList();
          break;
        }

        // WebRTC Signaling routing (Offer, Answer, ICE)
        case 'SIGNAL': {
          const { targetId, signalData } = msg;
          const target = clients.get(targetId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'SIGNAL',
              fromId: clientId,
              signalData,
            }));
          }
          break;
        }

        // Low-latency ping/pong measurement
        case 'PING': {
          ws.send(JSON.stringify({
            type: 'PONG',
            clientSendTime: msg.time,
            serverTime: Date.now(),
          }));
          break;
        }

        case 'PING_REPORT': {
          const client = clients.get(clientId);
          if (client && typeof msg.latencyMs === 'number') {
            client.latencyMs = Math.round(msg.latencyMs);
            broadcastClientList();
          }
          break;
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    if (clientId) {
      if (masterTechnicianId === clientId) {
        masterTechnicianId = null;
      }
      clients.delete(clientId);
      broadcastClientList();
    }
  });
});

// Periodic ping to keep connections alive and track ping
setInterval(() => {
  const now = Date.now();
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type: 'HEARTBEAT', time: now }));
    }
  }
}, 10000);

// API route for health / network status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    appName: 'StageTalk Intercom',
    connectedClients: clients.size,
    technicianTalking,
    technicianTarget,
    audioDuckingDb,
    latencyTargetMs: 50,
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(port, () => {
    console.log(`[StageTalk Server] Listening on http://localhost:${port}`);
  });
}

startServer();
