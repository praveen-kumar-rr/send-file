import { useState } from "react";
import {
  Upload,
  Download,
  ChevronRight,
  ChevronDown,
  Lock,
  CloudOff,
  Zap,
} from "lucide-react";

interface LandingScreenProps {
  onSend: () => void;
  onReceive: () => void;
}

export function LandingScreen({ onSend, onReceive }: LandingScreenProps) {
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  return (
    <main className="screen-enter min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="max-w-xl w-full text-center space-y-5">
        {/* Badge */}
        <div className="feature-badge">
          WebRTC · Browser-to-Browser · End-to-End Encrypted
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] text-white">
          Share files{" "}
          <span className="text-brand-400">directly &amp; securely</span>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-sm leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Browser-to-browser file transfer — encrypted end-to-end, no sign-up,
          nothing stored on a server.
        </p>

        {/* ── Role Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* Send */}
          <button
            onClick={onSend}
            className="role-card group text-left hover:border-brand-500/50"
          >
            <div
              className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center flex-shrink-0
                         shadow-lg shadow-brand-700/40"
            >
              <Upload className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-lg leading-snug">
                Send Files
              </div>
              <div className="text-gray-400 text-sm mt-1 leading-snug">
                Create a room &amp; share the key — instant P2P session
              </div>
            </div>
            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
          </button>

          {/* Receive */}
          <button
            onClick={onReceive}
            className="role-card group text-left hover:border-brand-400/50"
          >
            <div
              className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center flex-shrink-0
                         shadow-lg shadow-brand-700/40"
            >
              <Download className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-lg leading-snug">
                Receive Files
              </div>
              <div className="text-gray-400 text-sm mt-1 leading-snug">
                Enter the sender's room key — files arrive encrypted
              </div>
            </div>
            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* 3 key facts */}
        <div
          className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs pt-1"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> AES-256 encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <CloudOff className="w-3 h-3" /> No uploads · no cloud
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Any file, any size
          </span>
        </div>
      </div>

      {/* ── Footer Disclaimer ─────────────────────────────────── */}
      <footer className="mt-10 max-w-xl w-full text-center">
        <button
          onClick={() => setDisclaimerOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
          style={{ color: "var(--text-muted)" }}
          aria-expanded={disclaimerOpen}
        >
          Disclaimer
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform duration-200"
            style={{
              transform: disclaimerOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {disclaimerOpen && (
          <p
            className="mt-2 text-xs leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            This service facilitates direct peer-to-peer file transfers entirely
            within your browser. We do not transmit, store, access, or moderate
            any files or content exchanged between peers. We are not responsible
            for the nature, legality, or accuracy of any files shared. Users are
            solely responsible for ensuring they have the right to share any
            content and that the recipient is a trusted party. All transfers are
            end-to-end encrypted; however, you assume all risk associated with
            sharing files over a P2P connection. Use responsibly and in
            compliance with applicable laws.
          </p>
        )}
      </footer>
    </main>
  );
}
