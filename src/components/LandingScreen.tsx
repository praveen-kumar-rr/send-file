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
        <div className="flex flex-col items-center gap-2">
          <div className="feature-badge">
            WebRTC · Browser-to-Browser · End-to-End Encrypted
          </div>
          <a
            href="https://github.com/praveen-kumar-rr/send-file"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium no-underline"
            style={{ color: "var(--text-muted)" }}
          >
            {/* GitHub mark */}
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Open Source · MIT License
          </a>
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
                Create a room &amp; share the link
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
                Enter the sender's key &amp; receive files
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
