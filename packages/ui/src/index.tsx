"use client";

import { useEffect, useState } from "react";

export type StatusKind = "loading" | "empty" | "error" | "offline";

type StatusPanelProps = {
  kind: StatusKind;
  title: string;
  message: string;
  action?: React.ReactNode;
};

export function StatusPanel({
  kind,
  title,
  message,
  action,
}: StatusPanelProps) {
  if (kind === "loading") {
    return (
      <section className="pl-status-panel" aria-label={title} aria-busy="true">
        <span className="pl-skeleton pl-skeleton-icon" aria-hidden="true" />
        <span className="pl-skeleton pl-skeleton-title" aria-hidden="true" />
        <span className="pl-skeleton pl-skeleton-copy" aria-hidden="true" />
        <span className="pl-sr-only">{title}</span>
      </section>
    );
  }

  return (
    <section
      className={`pl-status-panel pl-status-${kind}`}
      aria-labelledby={`pl-status-${kind}-title`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span className="pl-status-symbol" aria-hidden="true">
        {kind === "empty" ? "✦" : kind === "error" ? "!" : "↗"}
      </span>
      <h2 id={`pl-status-${kind}-title`}>{title}</h2>
      <p>{message}</p>
      {action}
    </section>
  );
}

export function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <p className="pl-offline-notice" role="status" aria-live="polite">
      You are offline. Downloaded learning content will still be available.
    </p>
  );
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations.map((registration) => registration.unregister()),
          ),
        )
        .catch((error: unknown) => {
          console.error("Development service worker cleanup failed.", error);
        });
      return;
    }
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((error: unknown) => {
        console.error("Service worker registration failed.", error);
      });
  }, []);

  return null;
}
