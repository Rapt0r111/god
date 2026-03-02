"use client";

// components/ui/Toast.tsx

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

let globalSetToast: ((msg: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  globalSetToast?.(message, type);
}

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([]);
  let counter = 0;

  useEffect(() => {
    globalSetToast = (message, type = "info") => {
      const id = ++counter;
      setItems(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setItems(prev => prev.filter(t => t.id !== id));
      }, 3200);
    };
    return () => { globalSetToast = null; };
  }, []);

  if (items.length === 0) return null;

  const icons: Record<ToastType, string> = {
    success: "✓",
    error:   "✕",
    info:    "◆",
  };

  const colors: Record<ToastType, string> = {
    success: "var(--success)",
    error:   "var(--danger)",
    info:    "oklch(68% 0.18 288)",
  };

  return (
    <div className="toast-container">
      {items.map(item => (
        <div
          key={item.id}
          className={`toast ${item.type}`}
          style={{ animationDelay: "0s" }}
        >
          <span style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700,
            background: `${colors[item.type].replace(")", " / 0.15)")}`,
            border: `1px solid ${colors[item.type].replace(")", " / 0.30)")}`,
            color: colors[item.type],
          }}>
            {icons[item.type]}
          </span>
          <span style={{ fontSize: 12, color: "var(--tx-1)" }}>{item.message}</span>
        </div>
      ))}
    </div>
  );
}