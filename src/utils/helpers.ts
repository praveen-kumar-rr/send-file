import { PEER_PREFIX } from "../types";

export function generateRoomKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let key = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) key += "-";
    key += chars[bytes[i] % chars.length];
  }
  return key; // e.g. "AB3K-M7PX-Q2RN"
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(2) + " MB";
  return (bytes / 1024 ** 3).toFixed(2) + " GB";
}

export function formatDuration(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "--";
  if (secs < 60) return secs + "s";
  if (secs < 3600) return Math.floor(secs / 60) + "m " + (secs % 60) + "s";
  return Math.floor(secs / 3600) + "h " + Math.floor((secs % 3600) / 60) + "m";
}

export function fileIcon(type: string): string {
  if (!type) return "📄";
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  if (type === "application/pdf") return "📕";
  if (type.includes("zip") || type.includes("archive")) return "🗜️";
  if (type.startsWith("text/")) return "📝";
  return "📄";
}

export function shortPeerId(id: string): string {
  return id.replace(PEER_PREFIX, "").slice(0, 8).toUpperCase();
}

export function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatRoomKey(cleaned: string): string {
  return (
    cleaned.slice(0, 4) + "-" + cleaned.slice(4, 8) + "-" + cleaned.slice(8)
  );
}

export class SpeedTracker {
  private samples: { time: number; bytes: number }[] = [];

  update(bytes: number) {
    const now = Date.now();
    this.samples.push({ time: now, bytes });
    const cutoff = now - 5000;
    this.samples = this.samples.filter((s) => s.time >= cutoff);
  }

  getStats(
    totalLoaded: number,
    totalSize: number,
  ): { speedMbps: string; eta: string } {
    if (this.samples.length < 2) return { speedMbps: "0", eta: "--" };
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const bytesPerSec =
      (last.bytes - first.bytes) / ((last.time - first.time) / 1000);
    const remaining = totalSize - totalLoaded;
    const eta =
      bytesPerSec > 0 ? Math.round(remaining / bytesPerSec) : Infinity;
    return {
      speedMbps: (bytesPerSec / 1024 / 1024).toFixed(2),
      eta: formatDuration(eta),
    };
  }
}
