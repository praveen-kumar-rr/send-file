import Peer, { DataConnection } from "peerjs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUFFER_LOW,
  CHUNK_SIZE,
  FileEntry,
  FileProgress,
  ICE_CONFIG,
  MAX_BUFFER,
  PEER_PREFIX,
  PeerEntry,
  StatusType,
} from "../types";
import { deriveKey, encryptChunk, rawKey } from "../utils/crypto";
import { generateRoomKey, shortPeerId, SpeedTracker } from "../utils/helpers";

interface ConnState {
  conn: DataConnection;
  label: string;
  transferring: boolean;
  transfers: Map<
    string,
    { nextChunk: number; done: boolean; bytesSent: number }
  >;
}

export interface SenderState {
  roomKey: string;
  status: StatusType;
  statusText: string;
  peers: PeerEntry[];
  files: FileEntry[];
  fileProgress: Map<string, FileProgress>;
  isSending: boolean;
}

export function useSender(
  onToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void,
) {
  const [state, setState] = useState<SenderState>({
    roomKey: "",
    status: "waiting",
    statusText: "Initializing…",
    peers: [],
    files: [],
    fileProgress: new Map(),
    isSending: false,
  });

  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<Map<string, ConnState>>(new Map());
  const filesRef = useRef<FileEntry[]>([]);
  const cryptoRef = useRef<CryptoKey | null>(null);
  const destroyedRef = useRef(false);
  const pausedRef = useRef(false);

  // ── helpers to update state without losing React batching ──────
  const setStatus = useCallback((status: StatusType, text: string) => {
    setState((s) => ({ ...s, status, statusText: text }));
  }, []);

  const refreshPeers = useCallback(() => {
    const peers: PeerEntry[] = [];
    connsRef.current.forEach((entry, pid) => {
      const totalBytes = filesRef.current.reduce((a, f) => a + f.size, 0);
      const totalSent = [...entry.transfers.values()].reduce(
        (a, t) => a + (t.bytesSent || 0),
        0,
      );
      const pct =
        totalBytes > 0 ? Math.round((totalSent / totalBytes) * 100) : 0;
      const active = [...entry.transfers.values()].filter(
        (t) => !t.done,
      ).length;
      peers.push({
        peerId: pid,
        label: entry.label,
        connected: entry.conn.open,
        pct,
        bytesSent: totalSent,
        totalBytes,
        activeTransfers: active,
      });
    });
    const isSending = [...connsRef.current.values()].some(
      (e) => e.transferring,
    );
    setState((s) => ({ ...s, peers, isSending }));
  }, []);

  const updateProgress = useCallback(
    (
      fileId: string,
      loaded: number,
      total: number,
      speedMbps: string,
      eta: string,
      done: boolean,
      blobUrl?: string,
    ) => {
      setState((s) => {
        const next = new Map(s.fileProgress);
        next.set(fileId, { loaded, total, speedMbps, eta, done, blobUrl });
        return { ...s, fileProgress: next };
      });
    },
    [],
  );

  // ── send control JSON via PeerJS ───────────────────────────────
  const sendControl = useCallback((pid: string, msg: object) => {
    const entry = connsRef.current.get(pid);
    if (!entry) return;
    try {
      entry.conn.send(JSON.stringify(msg));
    } catch (_) {}
  }, []);

  // ── buffer flow control ────────────────────────────────────────
  const waitForBuffer = useCallback((dc: RTCDataChannel): Promise<void> => {
    return new Promise((resolve) => {
      dc.bufferedAmountLowThreshold = BUFFER_LOW;
      const h = () => {
        dc.removeEventListener("bufferedamountlow", h);
        resolve();
      };
      dc.addEventListener("bufferedamountlow", h);
      setTimeout(resolve, 5000);
    });
  }, []);

  // ── send a single file to a peer ──────────────────────────────
  const sendFile = useCallback(
    async (pid: string, fileEntry: FileEntry, fromChunk = 0) => {
      const entry = connsRef.current.get(pid);
      if (!entry || !cryptoRef.current) return;
      const { id: fileId, file, totalChunks } = fileEntry;

      if (!entry.transfers.has(fileId)) {
        entry.transfers.set(fileId, {
          nextChunk: fromChunk,
          done: false,
          bytesSent: fromChunk * CHUNK_SIZE,
        });
      }
      const fState = entry.transfers.get(fileId)!;
      fState.nextChunk = fromChunk;

      const tracker = new SpeedTracker();

      for (let i = fromChunk; i < totalChunks; i++) {
        if (pausedRef.current) return;
        const live = connsRef.current.get(pid);
        if (!live || !live.conn.open) return;

        // Flow control
        const dc =
          (
            entry.conn as unknown as {
              dataChannel?: RTCDataChannel;
              _dc?: RTCDataChannel;
            }
          ).dataChannel ??
          (
            entry.conn as unknown as {
              dataChannel?: RTCDataChannel;
              _dc?: RTCDataChannel;
            }
          )._dc;
        if (dc && dc.bufferedAmount > MAX_BUFFER) await waitForBuffer(dc);

        const start = i * CHUNK_SIZE;
        const chunk = file.slice(start, start + CHUNK_SIZE);
        const rawBuffer = await chunk.arrayBuffer();
        const encrypted = await encryptChunk(cryptoRef.current, rawBuffer);

        sendControl(pid, {
          type: "chunk-header",
          fileId,
          chunkIndex: i,
          chunkSize: (encrypted as ArrayBuffer).byteLength,
        });
        entry.conn.send(encrypted as ArrayBuffer);

        fState.nextChunk = i + 1;
        fState.bytesSent = Math.min((i + 1) * CHUNK_SIZE, file.size);
        tracker.update(fState.bytesSent);
        const stats = tracker.getStats(fState.bytesSent, file.size);

        updateProgress(
          fileId,
          fState.bytesSent,
          file.size,
          stats.speedMbps,
          stats.eta,
          false,
        );
        refreshPeers();
      }

      sendControl(pid, { type: "file-complete", fileId });
      fState.done = true;
      updateProgress(fileId, file.size, file.size, "", "", true);
      refreshPeers();
    },
    [sendControl, waitForBuffer, updateProgress, refreshPeers],
  );

  // ── start transfer loop for a peer ────────────────────────────
  const startTransferToPeer = useCallback(
    async (pid: string) => {
      const entry = connsRef.current.get(pid);
      if (!entry || entry.transferring) return;
      entry.transferring = true;
      refreshPeers();

      const offerList = filesRef.current.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        totalChunks: f.totalChunks,
      }));
      sendControl(pid, { type: "file-offer", files: offerList });

      let lastCount = -1;
      while (lastCount !== filesRef.current.length) {
        lastCount = filesRef.current.length;
        for (const f of filesRef.current) {
          const st = entry.transfers.get(f.id);
          if (st?.done) continue;
          const from = st?.nextChunk || 0;
          await sendFile(pid, f, from);
          const live = connsRef.current.get(pid);
          if (!live || !live.conn.open) {
            entry.transferring = false;
            return;
          }
        }
      }
      entry.transferring = false;
    },
    [sendControl, sendFile],
  );

  // ── handle incoming data from receiver ──────────────────────────
  const onData = useCallback(
    (pid: string, data: unknown) => {
      if (typeof data !== "string") return;
      try {
        const msg = JSON.parse(data) as {
          type: string;
          files?: { fileId: string; fromChunk: number }[];
        };
        if (msg.type === "resume-request" && msg.files) {
          const entry = connsRef.current.get(pid);
          if (!entry) return;
          onToast(`Receiver ${shortPeerId(pid)} resuming…`, "info");
          msg.files.forEach(({ fileId, fromChunk }) => {
            const fe = filesRef.current.find((f) => f.id === fileId);
            if (!fe) return;
            if (!entry.transfers.has(fileId))
              entry.transfers.set(fileId, {
                nextChunk: 0,
                done: false,
                bytesSent: 0,
              });
            const st = entry.transfers.get(fileId)!;
            st.nextChunk = fromChunk;
            st.done = false;
          });
          entry.transferring = false;
          startTransferToPeer(pid);
        }
      } catch (_) {}
    },
    [onToast, startTransferToPeer],
  );

  // ── handle new incoming connection ────────────────────────────
  const handleIncomingConn = useCallback(
    (conn: DataConnection) => {
      const pid = conn.peer;
      conn.on("open", () => {
        connsRef.current.set(pid, {
          conn,
          label: shortPeerId(pid),
          transferring: false,
          transfers: new Map(),
        });
        refreshPeers();
        onToast(`Receiver connected: ${shortPeerId(pid)}`, "success");
      });
      conn.on("data", (d) => onData(pid, d));
      conn.on("error", () => {
        refreshPeers();
      });
      conn.on("close", () => {
        onToast(`Receiver disconnected: ${shortPeerId(pid)}`, "warn");
        refreshPeers();
      });
    },
    [onToast, refreshPeers, startTransferToPeer, onData],
  );

  // ── Initialize PeerJS ──────────────────────────────────────────
  const init = useCallback(async () => {
    destroyedRef.current = false;
    connsRef.current = new Map();
    filesRef.current = [];

    const roomKey = generateRoomKey();
    const peerId = PEER_PREFIX + rawKey(roomKey).toLowerCase();

    try {
      cryptoRef.current = await deriveKey(roomKey);
    } catch (e) {
      onToast("Crypto init failed: " + (e as Error).message, "error");
      return;
    }

    const peer = new Peer(peerId, { config: ICE_CONFIG, debug: 0 });
    peerRef.current = peer;

    setState({
      roomKey,
      status: "waiting",
      statusText: "Initializing…",
      peers: [],
      files: [],
      fileProgress: new Map(),
      isSending: false,
    });

    peer.on("open", () => {
      setStatus("online", "Ready — waiting for receivers");
      onToast("Room is open. Share the key!", "success");
      const url = location.href.split("#")[0] + "#" + rawKey(roomKey);
      history.replaceState(null, "", url);
    });

    peer.on("connection", handleIncomingConn);

    peer.on("error", (err) => {
      console.error("[Sender] PeerJS error:", err);
      const e = err as unknown as { type?: string; message?: string };
      if (e.type === "peer-unavailable") return;
      if (e.type === "unavailable-id") {
        onToast("Room key already in use. Try refreshing.", "error");
        setStatus("error", "ID conflict — try a new key");
      } else {
        onToast(`Connection error: ${e.message ?? ""}`, "error");
        setStatus("error", e.message ?? "Unknown error");
      }
    });

    peer.on("disconnected", () => {
      if (!destroyedRef.current) {
        setStatus("waiting", "Reconnecting…");
        peer.reconnect();
      }
    });

    peer.on("close", () => setStatus("offline", "Disconnected"));
  }, [onToast, setStatus, handleIncomingConn]);

  // ── Public API ─────────────────────────────────────────────────
  const addFiles = useCallback((fileList: File[]) => {
    const added: FileEntry[] = fileList.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      totalChunks: Math.ceil(f.size / CHUNK_SIZE),
    }));
    filesRef.current = [...filesRef.current, ...added];
    setState((s) => ({ ...s, files: [...filesRef.current] }));
    return added;
  }, []);

  const removeFile = useCallback((fileId: string) => {
    filesRef.current = filesRef.current.filter((f) => f.id !== fileId);
    setState((s) => {
      const fp = new Map(s.fileProgress);
      fp.delete(fileId);
      return { ...s, files: [...filesRef.current], fileProgress: fp };
    });
  }, []);

  const pauseAll = useCallback(() => {
    pausedRef.current = true;
    connsRef.current.forEach((entry) => {
      entry.transferring = false;
    });
    setState((s) => ({ ...s, isSending: false }));
    onToast("Transfer paused.", "warn");
  }, [onToast]);

  const sendAll = useCallback(() => {
    if (filesRef.current.length === 0) {
      onToast("No files queued.", "warn");
      return;
    }
    if (connsRef.current.size === 0) {
      onToast("No receivers connected yet.", "warn");
      return;
    }
    pausedRef.current = false;
    connsRef.current.forEach((entry, pid) => {
      if (!entry.transferring) startTransferToPeer(pid);
    });
  }, [onToast, startTransferToPeer]);

  const clearFiles = useCallback(() => {
    filesRef.current = [];
    setState((s) => ({ ...s, files: [], fileProgress: new Map() }));
  }, []);

  const destroy = useCallback(() => {
    destroyedRef.current = true;
    peerRef.current?.destroy();
    history.replaceState(null, "", location.pathname);
  }, []);

  useEffect(() => {
    return () => {
      destroyedRef.current = true;
      peerRef.current?.destroy();
    };
  }, []);

  return {
    state,
    init,
    addFiles,
    removeFile,
    sendAll,
    pauseAll,
    clearFiles,
    destroy,
  };
}
