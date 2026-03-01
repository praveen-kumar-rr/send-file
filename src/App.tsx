import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Screen } from "./types";
import { ThemeProvider } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { LandingScreen } from "./components/LandingScreen";
import { SenderScreen } from "./components/SenderScreen";
import { ReceiverScreen } from "./components/ReceiverScreen";
import { ToastContainer, useToast } from "./components/Toast";
import { useSender } from "./hooks/useSender";
import { useReceiver } from "./hooks/useReceiver";
import { rawKey } from "./utils/crypto";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  const { toasts, addToast } = useToast();

  const toast = useCallback(
    (msg: string, type?: "success" | "error" | "info" | "warn") =>
      addToast(msg, type ?? "info"),
    [addToast],
  );

  const sender = useSender(toast);
  const receiver = useReceiver(toast);

  // ── Handle hash-based auto-receive (share links) ───────────────
  useEffect(() => {
    const hash = location.hash.slice(1).toUpperCase();
    if (hash && hash.length === 12) {
      const formatted =
        hash.slice(0, 4) + "-" + hash.slice(4, 8) + "-" + hash.slice(8);
      setScreen("receiver");
      setTimeout(() => receiver.start(formatted), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigation ─────────────────────────────────────────────────
  const goToSend = useCallback(() => {
    setScreen("sender");
    sender.init();
  }, [sender]);

  const goToReceive = useCallback(() => {
    setScreen("receiver");
  }, []);

  const goBack = useCallback(() => {
    sender.destroy();
    receiver.destroy();
    setScreen("landing");
  }, [sender, receiver]);

  // ── Receiver start callback ───────────────────────────────────
  const handleReceiverStart = useCallback(
    (key: string) => {
      const cleaned = key.replace(/-/g, "");
      if (cleaned.length !== 12 || !/^[A-Z0-9]+$/i.test(cleaned)) return;
      // Update URL hash so it's shareable
      history.replaceState(null, "", location.pathname + "#" + rawKey(key));
      receiver.start(key);
    },
    [receiver],
  );

  return (
    <ThemeProvider>
      <div className="font-sans min-h-screen antialiased">
        <Navbar screen={screen} />

        {/* Floating back — below header, only on sub-pages */}
        {screen !== "landing" && (
          <button
            onClick={goBack}
            aria-label="Back to home"
            className="floating-back-btn"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Back
          </button>
        )}

        {screen === "landing" && (
          <LandingScreen onSend={goToSend} onReceive={goToReceive} />
        )}

        {screen === "sender" && (
          <SenderScreen
            senderState={sender.state}
            addFiles={(files) => {
              sender.addFiles(files);
              // If peers already connected, auto-send
              if (sender.state.peers.length > 0) sender.sendAll();
            }}
            removeFile={sender.removeFile}
            sendAll={sender.sendAll}
            clearFiles={sender.clearFiles}
            onToast={toast}
          />
        )}

        {screen === "receiver" && (
          <ReceiverScreen
            receiverState={receiver.state}
            onStart={handleReceiverStart}
          />
        )}

        <ToastContainer toasts={toasts} />
      </div>
    </ThemeProvider>
  );
}
