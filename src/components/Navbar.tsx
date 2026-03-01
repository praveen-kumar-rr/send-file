import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeMode, useTheme } from "../context/ThemeContext";
import { Screen } from "../types";

interface NavbarProps {
  screen: Screen;
}

// ── Theme toggle cycling through light → dark → system ────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const order: ThemeMode[] = ["light", "dark", "system"];
  const next = order[(order.indexOf(theme) + 1) % order.length];

  const icons: Record<ThemeMode, JSX.Element> = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />,
  };

  const labels: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return (
    <button
      onClick={() => setTheme(next)}
      className="icon-btn"
      title={`Theme: ${labels[theme]} — click for ${labels[next]}`}
      aria-label={`Switch to ${labels[next]} theme`}
    >
      {icons[theme]}
    </button>
  );
}

export function Navbar({ screen }: NavbarProps) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-3.5 glass-bar">
      {/* ── Left: logo ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 group no-underline flex-shrink-0"
          aria-label="SendFile home"
        >
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Send <span className="text-brand-400">File</span>
          </span>
        </a>
      </div>

      {/* ── Right: tagline · theme toggle · github ───────────── */}
      <div className="flex items-center gap-2.5">
        <span
          className="text-xs hidden md:inline"
          style={{ color: "var(--text-muted)" }}
        >
          No server · E2E encrypted
        </span>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* GitHub link */}
        <a
          href="https://github.com/praveen-kumar-rr/send-file"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          title="View source on GitHub"
          aria-label="GitHub repository"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </nav>
  );
}
