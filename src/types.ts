// ── WebRTC / Transfer constants ────────────────────────────────────
export const CHUNK_SIZE = 64 * 1024; // 64 KB
export const MAX_BUFFER = 2 * 1024 * 1024; // 2 MB
export const BUFFER_LOW = 256 * 1024; // 256 KB
export const ACK_EVERY = 20;
export const PEER_PREFIX = "sf26-";
export const RECONNECT_DELAY = 3000;
export const MAX_RECONNECTS = 8;
export const SALT = "sendfile-v1-2026";

export const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

// ── Domain types ───────────────────────────────────────────────────
export type Screen = "landing" | "sender" | "receiver";
export type StatusType = "online" | "offline" | "waiting" | "error";
export type ToastType = "success" | "error" | "info" | "warn";

export interface ToastItem {
  id: string;
  msg: string;
  type: ToastType;
  removing: boolean;
}

export interface FileEntry {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
}

export interface FileProgress {
  loaded: number;
  total: number;
  speedMbps: string;
  eta: string;
  done: boolean;
  blobUrl?: string;
}

export interface PeerEntry {
  peerId: string;
  label: string;
  connected: boolean;
  pct: number;
  bytesSent: number;
  totalBytes: number;
  activeTransfers: number;
}

export interface ReceiverFileState {
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  chunks: (ArrayBuffer | null)[];
  received: number;
  done: boolean;
  blobUrl?: string;
  loadedBytes: number;
  speedMbps: string;
  eta: string;
}
