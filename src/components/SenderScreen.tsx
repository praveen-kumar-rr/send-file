import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Copy, Link2, Send, Trash2, X } from "lucide-react";
import { SenderState } from "../hooks/useSender";
import { StatusType, FileEntry, FileProgress, PeerEntry } from "../types";
import { formatBytes, fileIcon, escHtml } from "../utils/helpers";

// ── Status dot ─────────────────────────────────────────────────────
function StatusDot({ status, pulse }: { status: StatusType; pulse?: boolean }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full dot-${status}${pulse ? " animate-pulse" : ""}`}
    />
  );
}

// ── Peer row ───────────────────────────────────────────────────────
function PeerRow({ peer }: { peer: PeerEntry }) {
  return (
    <div className="peer-row">
      <StatusDot status={peer.connected ? "online" : "offline"} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono font-semibold text-white">
          {peer.label}
        </div>
        <div className="text-xs text-gray-500">
          {peer.connected ? "Connected" : "Disconnected"}
          {peer.activeTransfers > 0
            ? ` · ${peer.activeTransfers} file(s) in progress`
            : ""}
        </div>
      </div>
      {peer.connected && peer.totalBytes > 0 && peer.pct < 100 && (
        <div className="text-right text-xs text-gray-500 flex-shrink-0">
          <div className="font-semibold text-white">{peer.pct}%</div>
          <div>
            {formatBytes(peer.bytesSent)} / {formatBytes(peer.totalBytes)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── File card ──────────────────────────────────────────────────────
function SenderFileCard({
  file,
  progress,
  onRemove,
}: {
  file: FileEntry;
  progress?: FileProgress;
  onRemove: (id: string) => void;
}) {
  const pct = progress
    ? Math.round((progress.loaded / progress.total) * 100)
    : 0;
  const done = progress?.done ?? false;
  const label = done
    ? "✓ Sent"
    : progress
      ? `${pct}% — ${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}`
      : "Queued";
  const stats =
    !done && progress?.speedMbps
      ? `${progress.speedMbps} MB/s · ETA ${progress.eta}`
      : "";

  return (
    <div className="file-card">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">
          {fileIcon(file.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">
            {escHtml(file.name)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatBytes(file.size)} · {file.totalChunks} chunks
          </div>
          <div className="mt-3 progress-track">
            <div
              className={`progress-fill${done ? " done" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-xs text-gray-600">{stats}</span>
          </div>
        </div>
        <button
          onClick={() => onRemove(file.id)}
          className="btn-danger flex-shrink-0 mt-0.5"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ── Drop Zone ──────────────────────────────────────────────────────
function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useDragState();

  const handle = (list: FileList | null) => {
    if (list && list.length > 0) onFiles([...list]);
  };

  return (
    <div
      className={`drop-zone${dragging ? " drag-over" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-14 h-14 rounded-xl bg-brand-600/20 flex items-center justify-center">
          <Upload className="w-7 h-7 text-brand-400" strokeWidth={1.5} />
        </div>
        <div>
          <div className="font-semibold text-white mb-1">Drop files here</div>
          <div className="text-sm text-gray-500">
            or{" "}
            <span className="text-brand-400 underline underline-offset-2">
              click to browse
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          Any file type · Multiple files supported
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function useDragState() {
  return useState(false);
}

// ── Main SenderScreen ──────────────────────────────────────────────
interface SenderScreenProps {
  senderState: SenderState;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  sendAll: () => void;
  pauseAll: () => void;
  clearFiles: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

export function SenderScreen({
  senderState,
  addFiles,
  removeFile,
  sendAll,
  pauseAll,
  clearFiles,
  onToast,
}: SenderScreenProps) {
  const { roomKey, status, statusText, peers, files, fileProgress, isSending } =
    senderState;

  const [activeTab, setActiveTab] = useState<"queue" | "sent">("queue");

  const pendingFiles = files.filter((f) => !fileProgress.get(f.id)?.done);
  const sentFiles = files.filter((f) => fileProgress.get(f.id)?.done === true);

  // Auto-switch to Sent tab when all pending files complete
  useEffect(() => {
    if (sentFiles.length > 0 && pendingFiles.length === 0 && !isSending) {
      setActiveTab("sent");
    }
  }, [sentFiles.length, pendingFiles.length, isSending]);

  // Auto-switch back to Queue when new files are added
  useEffect(() => {
    if (pendingFiles.length > 0) {
      setActiveTab("queue");
    }
  }, [pendingFiles.length]);

  const isWaiting = status === "waiting" || status === "offline";

  const copyKey = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomKey);
      onToast("Room key copied!", "success");
    } catch {
      onToast("Failed to copy", "error");
    }
  }, [roomKey, onToast]);

  const copyLink = useCallback(async () => {
    const url = location.href;
    if (!url.includes("#")) {
      onToast("Room not ready yet.", "warn");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      onToast("Share link copied! Send it to your receiver.", "success");
    } catch {
      onToast("Failed to copy", "error");
    }
  }, [onToast]);

  return (
    <section className="screen-enter min-h-screen pt-28 sm:pt-20 pb-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Room Key Card */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
                Your Room Key
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="room-key-display text-3xl font-mono font-bold tracking-widest text-brand-300 select-all">
                    {roomKey}
                  </span>
                  <button
                    onClick={copyKey}
                    className="icon-btn flex-shrink-0"
                    title="Copy room key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={copyLink}
                  className="self-start inline-flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg transition"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Share Link
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Share this key with anyone who should receive files
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <StatusDot status={status} pulse={isWaiting} />
              <span className="text-gray-400">{statusText}</span>
            </div>
          </div>

          {/* Connected Peers */}
          <div className="mt-5 border-t border-white/5 pt-5">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
              Connected Receivers
            </div>
            {peers.length === 0 ? (
              <div className="text-sm text-gray-600 italic">
                No receivers connected yet…
              </div>
            ) : (
              <div className="space-y-2">
                {peers.map((p) => (
                  <PeerRow key={p.peerId} peer={p} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar — shown once files are added */}
        {files.length > 0 && (
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2.5 text-sm font-medium transition -mb-px border-b-2 ${
                activeTab === "queue"
                  ? "text-white border-brand-400"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              Queue
              {pendingFiles.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-brand-600/30 text-brand-300">
                  {pendingFiles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2.5 text-sm font-medium transition -mb-px border-b-2 ${
                activeTab === "sent"
                  ? "text-white border-green-400"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              Sent
              {sentFiles.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-green-600/30 text-green-400">
                  {sentFiles.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Queue Tab — always visible before any files, hidden on Sent tab */}
        {(files.length === 0 || activeTab === "queue") && (
          <>
            <DropZone
              onFiles={(newFiles) => {
                addFiles(newFiles);
                onToast(
                  `Added ${newFiles.length} file${
                    newFiles.length > 1 ? "s" : ""
                  }`,
                  "success",
                );
              }}
            />
            {pendingFiles.length > 0 && (
              <>
                <div className="space-y-3">
                  {pendingFiles.map((f) => (
                    <SenderFileCard
                      key={f.id}
                      file={f}
                      progress={fileProgress.get(f.id)}
                      onRemove={removeFile}
                    />
                  ))}
                </div>
                <div className="mt-4 flex gap-3 justify-end">
                  <button onClick={clearFiles} className="btn-ghost">
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                  {isSending ? (
                    <button onClick={pauseAll} className="btn-ghost">
                      <X className="w-4 h-4" />
                      Pause
                    </button>
                  ) : (
                    <button onClick={sendAll} className="btn-primary">
                      <Send className="w-4 h-4" strokeWidth={2.5} />
                      Send to All Receivers
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Sent Tab */}
        {files.length > 0 && activeTab === "sent" && (
          <div className="space-y-3">
            {sentFiles.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                No files sent yet.
              </div>
            ) : (
              sentFiles.map((f) => (
                <SenderFileCard
                  key={f.id}
                  file={f}
                  progress={fileProgress.get(f.id)}
                  onRemove={removeFile}
                />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
