import { useState } from "react";
import { Download } from "lucide-react";
import { ReceiverState } from "../hooks/useReceiver";
import { ReceiverFileState, StatusType } from "../types";
import { formatBytes, fileIcon, escHtml } from "../utils/helpers";

// ── Status dot ─────────────────────────────────────────────────────
function StatusDot({ status, pulse }: { status: StatusType; pulse?: boolean }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full dot-${status}${pulse ? " animate-pulse" : ""}`}
    />
  );
}

// ── Receiver file card ─────────────────────────────────────────────
function ReceiverFileCard({
  fileId,
  fs,
}: {
  fileId: string;
  fs: ReceiverFileState;
}) {
  const pct = fs.size > 0 ? Math.round((fs.loadedBytes / fs.size) * 100) : 0;
  const label = fs.done
    ? "✓ Complete"
    : fs.loadedBytes > 0
      ? `${pct}% — ${formatBytes(fs.loadedBytes)} / ${formatBytes(fs.size)}`
      : "Waiting…";
  const stats =
    !fs.done && fs.speedMbps ? `${fs.speedMbps} MB/s · ETA ${fs.eta}` : "";

  return (
    <div className="file-card" id={`recv-card-${fileId}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">
          {fileIcon(fs.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">
            {escHtml(fs.name)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatBytes(fs.size)}
          </div>
          <div className="mt-3 progress-track">
            <div
              className={`progress-fill${fs.done ? " done" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-xs text-gray-600">{stats}</span>
          </div>

          {/* Download button */}
          {fs.done && fs.blobUrl && (
            <div className="mt-3">
              <a href={fs.blobUrl} download={fs.name} className="btn-download">
                <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
                Download
              </a>
              <span className="ml-2 text-xs text-gray-500">
                {formatBytes(fs.size)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ReceiverScreen ────────────────────────────────────────────
interface ReceiverScreenProps {
  receiverState: ReceiverState;
  onStart: (key: string) => void;
}

export function ReceiverScreen({
  receiverState,
  onStart,
}: ReceiverScreenProps) {
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");
  const { status, statusText, roomDisplay, files, connected } = receiverState;

  const isWaiting = status === "waiting";

  const formatInput = (raw: string) => {
    let val = raw
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 12);
    if (val.length > 4) val = val.slice(0, 4) + "-" + val.slice(4);
    if (val.length > 9) val = val.slice(0, 9) + "-" + val.slice(9);
    return val;
  };

  const handleConnect = () => {
    const cleaned = inputKey.replace(/-/g, "");
    if (cleaned.length !== 12 || !/^[A-Z0-9]+$/.test(cleaned)) {
      setError(
        "Invalid room key. It should be 12 characters (e.g. ABC1-DEF2-GH34).",
      );
      return;
    }
    setError("");
    onStart(inputKey);
  };

  return (
    <section className="screen-enter min-h-screen pt-28 sm:pt-20 pb-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Key Entry Card — hidden once connected */}
        {!connected && (
          <div className="glass-card rounded-2xl p-6">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
              Enter Room Key
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                maxLength={14}
                placeholder="e.g. ABC1-DEF2-GH34"
                value={inputKey}
                onChange={(e) => setInputKey(formatInput(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                className="key-input"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                onClick={handleConnect}
                className="btn-success rounded-xl px-5 font-semibold sm:self-auto self-stretch justify-center"
              >
                Connect
              </button>
            </div>
            {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
          </div>
        )}

        {/* Connection Status — shown once we at least started connecting */}
        {(connected || status !== "waiting" || roomDisplay) && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
                  Connection
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status={status} pulse={isWaiting} />
                  <span className="text-base font-medium text-white">
                    {statusText}
                  </span>
                </div>
              </div>
              {roomDisplay && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Room</div>
                  <div className="font-mono font-bold text-brand-300 text-sm">
                    {roomDisplay}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Incoming Files */}
        {files.size > 0 && (
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
              Incoming Files
            </div>
            <div className="space-y-3">
              {[...files.entries()].map(([id, fs]) => (
                <ReceiverFileCard key={id} fileId={id} fs={fs} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
