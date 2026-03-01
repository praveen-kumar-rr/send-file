import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import {
  CHUNK_SIZE,
  ACK_EVERY,
  PEER_PREFIX,
  ICE_CONFIG,
  MAX_RECONNECTS,
  RECONNECT_DELAY,
  StatusType,
  ReceiverFileState,
} from "../types";
import { deriveKey, decryptChunk, rawKey } from "../utils/crypto";
import { shortPeerId, SpeedTracker, formatRoomKey } from "../utils/helpers";

interface ControlMsg {
  type: string;
  files?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    totalChunks: number;
  }>;
  fileId?: string;
  chunkIndex?: number;
  chunkSize?: number;
}

export interface ReceiverState {
  status: StatusType;
  statusText: string;
  roomDisplay: string;
  files: Map<string, ReceiverFileState>;
  connected: boolean;
}

export function useReceiver(
  onToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void,
) {
  const [state, setState] = useState<ReceiverState>({
    status: "waiting",
    statusText: "Enter a room key to connect",
    roomDisplay: "",
    files: new Map(),
    connected: false,
  });

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const cryptoRef = useRef<CryptoKey | null>(null);
  const destroyedRef = useRef(false);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextChunkMeta = useRef<{ fileId: string; chunkIndex: number } | null>(
    null,
  );
  const filesRef = useRef<Map<string, ReceiverFileState>>(new Map());
  const trackersRef = useRef<Map<string, SpeedTracker>>(new Map());

  const setStatus = useCallback((status: StatusType, text: string) => {
    setState((s) => ({ ...s, status, statusText: text }));
  }, []);

  const refreshFiles = useCallback(() => {
    setState((s) => ({ ...s, files: new Map(filesRef.current) }));
  }, []);

  const sendControl = useCallback((msg: object) => {
    const c = connRef.current;
    if (c?.open) {
      try {
        c.send(JSON.stringify(msg));
      } catch (_) {}
    }
  }, []);

  const sendResumeIfNeeded = useCallback(() => {
    const incomplete: { fileId: string; fromChunk: number }[] = [];
    filesRef.current.forEach((fs, fileId) => {
      if (!fs.done) {
        const fromChunk = fs.chunks.filter(Boolean).length;
        incomplete.push({ fileId, fromChunk });
      }
    });
    if (incomplete.length > 0)
      sendControl({ type: "resume-request", files: incomplete });
  }, [sendControl]);

  const handleChunk = useCallback(
    async (buffer: ArrayBuffer) => {
      const meta = nextChunkMeta.current;
      if (!meta || !cryptoRef.current) return;
      nextChunkMeta.current = null;

      const { fileId, chunkIndex } = meta;
      const fs = filesRef.current.get(fileId);
      if (!fs || fs.done) return;

      try {
        const decrypted = await decryptChunk(cryptoRef.current, buffer);
        fs.chunks[chunkIndex] = decrypted;
        fs.received++;
      } catch (e) {
        console.error("[Receiver] Decrypt failed for chunk", chunkIndex, e);
        return;
      }

      const loadedBytes = Math.min(fs.received * CHUNK_SIZE, fs.size);
      if (!trackersRef.current.has(fileId))
        trackersRef.current.set(fileId, new SpeedTracker());
      const tracker = trackersRef.current.get(fileId)!;
      tracker.update(loadedBytes);
      const stats = tracker.getStats(loadedBytes, fs.size);
      fs.loadedBytes = loadedBytes;
      fs.speedMbps = stats.speedMbps;
      fs.eta = stats.eta;

      refreshFiles();

      if (fs.received % ACK_EVERY === 0)
        sendControl({ type: "ack", fileId, chunkIndex });
    },
    [refreshFiles, sendControl],
  );

  const handleFileComplete = useCallback(
    (fileId: string) => {
      const fs = filesRef.current.get(fileId);
      if (!fs || fs.done) return;
      fs.done = true;

      const validChunks = fs.chunks.filter((c): c is ArrayBuffer => c !== null);
      const blob = new Blob(
        validChunks.map((b) => new Uint8Array(b)),
        {
          type: fs.type || "application/octet-stream",
        },
      );
      fs.blobUrl = URL.createObjectURL(blob);
      fs.loadedBytes = fs.size;
      fs.speedMbps = "";
      fs.eta = "";

      refreshFiles();
      onToast(`✓ ${fs.name} ready to download`, "success");
    },
    [refreshFiles, onToast],
  );

  const handleControl = useCallback(
    (msg: ControlMsg) => {
      switch (msg.type) {
        case "file-offer":
          (msg.files ?? []).forEach((f) => {
            if (!filesRef.current.has(f.id)) {
              filesRef.current.set(f.id, {
                name: f.name,
                size: f.size,
                type: f.type,
                totalChunks: f.totalChunks,
                chunks: new Array(f.totalChunks).fill(null),
                received: 0,
                done: false,
                loadedBytes: 0,
                speedMbps: "",
                eta: "",
              });
            }
          });
          refreshFiles();
          break;
        case "chunk-header":
          nextChunkMeta.current = {
            fileId: msg.fileId!,
            chunkIndex: msg.chunkIndex!,
          };
          break;
        case "file-complete":
          handleFileComplete(msg.fileId!);
          break;
      }
    },
    [refreshFiles, handleFileComplete],
  );

  const onData = useCallback(
    (data: unknown) => {
      if (data instanceof ArrayBuffer) {
        handleChunk(data);
        return;
      }
      if (data instanceof Blob) {
        data.arrayBuffer().then(handleChunk);
        return;
      }
      if (typeof data === "string") {
        try {
          handleControl(JSON.parse(data) as ControlMsg);
        } catch (_) {}
      }
    },
    [handleChunk, handleControl],
  );

  const scheduleReconnect = useCallback(
    (roomKey: string) => {
      if (destroyedRef.current || reconnectCount.current >= MAX_RECONNECTS) {
        if (reconnectCount.current >= MAX_RECONNECTS)
          setStatus("error", "Could not reconnect. Refresh to try again.");
        return;
      }
      reconnectCount.current++;
      const delay = RECONNECT_DELAY * Math.min(reconnectCount.current, 3);
      setStatus(
        "waiting",
        `Reconnecting in ${delay / 1000}s… (${reconnectCount.current}/${MAX_RECONNECTS})`,
      );
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(() => {
        if (!destroyedRef.current) connect(roomKey);
      }, delay);
    },
    [setStatus],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(
    (roomKey: string) => {
      if (destroyedRef.current || !peerRef.current) return;
      const cleaned = rawKey(roomKey);
      setStatus("waiting", `Connecting to ${cleaned}…`);
      setState((s) => ({ ...s, roomDisplay: cleaned }));

      const senderPeerId = PEER_PREFIX + cleaned.toLowerCase();
      const conn = peerRef.current.connect(senderPeerId, {
        reliable: true,
        serialization: "raw",
      });
      connRef.current = conn;

      conn.on("open", () => {
        reconnectCount.current = 0;
        setStatus("online", `Connected to ${cleaned}`);
        setState((s) => ({ ...s, connected: true }));
        onToast("Connected to sender!", "success");
        sendResumeIfNeeded();
      });

      conn.on("data", onData);

      conn.on("close", () => {
        if (!destroyedRef.current) {
          setState((s) => ({ ...s, connected: false }));
          setStatus("offline", "Disconnected — reconnecting…");
          scheduleReconnect(roomKey);
        }
      });

      conn.on("error", () => {
        setStatus("error", "Connection error — retrying…");
        scheduleReconnect(roomKey);
      });
    },
    [onToast, onData, sendResumeIfNeeded, setStatus, scheduleReconnect],
  );

  const start = useCallback(
    async (rawRoomKey: string) => {
      destroyedRef.current = false;
      filesRef.current = new Map();
      reconnectCount.current = 0;
      setState((s) => ({
        ...s,
        files: new Map(),
        connected: false,
        roomDisplay: rawKey(rawRoomKey),
      }));

      const formattedKey = rawRoomKey.includes("-")
        ? rawRoomKey
        : formatRoomKey(rawRoomKey);

      try {
        cryptoRef.current = await deriveKey(formattedKey);
      } catch (e) {
        onToast("Crypto init failed: " + (e as Error).message, "error");
        return;
      }

      const peer = new Peer({ config: ICE_CONFIG, debug: 0 });
      peerRef.current = peer;

      peer.on("open", () => connect(formattedKey));

      peer.on("error", (err) => {
        const e = err as unknown as { type?: string; message?: string };
        if (e.type === "peer-unavailable") {
          setStatus("error", "Sender not found — check room key");
          onToast("Room not found. Is the sender online?", "error");
        } else {
          setStatus("error", e.message ?? "Unknown error");
        }
      });

      peer.on("disconnected", () => {
        if (!destroyedRef.current) peer.reconnect();
      });
    },
    [onToast, connect, setStatus],
  );

  const destroy = useCallback(() => {
    destroyedRef.current = true;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    connRef.current?.close();
    peerRef.current?.destroy();
    filesRef.current = new Map();
    trackersRef.current = new Map();
    setState({
      status: "waiting",
      statusText: "Enter a room key to connect",
      roomDisplay: "",
      files: new Map(),
      connected: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      destroyedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      connRef.current?.close();
      peerRef.current?.destroy();
    };
  }, []);

  return { state, start, destroy };
}
