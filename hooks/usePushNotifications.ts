"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function registerAndSubscribe(userName: string, roomCode: string) {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), userName, roomCode }),
  });
}

export function usePushNotifications(userName: string, roomCode: string) {
  // null = push not supported by this browser
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;

    // Always read the real permission state on mount
    const current = Notification.permission;
    setPermission(current);

    // Already granted — silently re-subscribe (keeps subscription fresh on each visit)
    if (current === "granted" && VAPID_PUBLIC_KEY) {
      registerAndSubscribe(userName, roomCode).catch((err) =>
        console.error("[push auto-subscribe]", err)
      );
    }
  }, [userName, roomCode]);

  // Must be called from a user-gesture (button click) — required by mobile browsers
  const requestPermission = useCallback(async () => {
    if (!isPushSupported()) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;
      if (!VAPID_PUBLIC_KEY) {
        console.warn("[push] VAPID public key not set in env");
        return;
      }
      await registerAndSubscribe(userName, roomCode);
    } catch (err) {
      console.error("[push requestPermission]", err);
    }
  }, [userName, roomCode]);

  return { permission, requestPermission };
}
