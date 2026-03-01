import { useCallback, useRef } from "react";
import { ToastItem, ToastType } from "../types";

// Hook to manage toast notifications
export function useToast() {
  const [toasts, setToasts] = useToastState();
  return {
    toasts,
    addToast: useCallback(
      (msg: string, type: ToastType = "info", duration = 4000) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, msg, type, removing: false }]);
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, removing: true } : t)),
          );
          setTimeout(
            () => setToasts((prev) => prev.filter((t) => t.id !== id)),
            300,
          );
        }, duration);
      },
      [setToasts],
    ),
  };
}

import { useState } from "react";
function useToastState() {
  return useState<ToastItem[]>([]);
}

// Toast container component
interface ToastContainerProps {
  toasts: ToastItem[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}${t.removing ? " removing" : ""}`}
        >
          <span>{iconFor(t.type)}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

function iconFor(type: ToastType) {
  return { success: "✓", error: "✗", info: "ℹ", warn: "⚠" }[type];
}
