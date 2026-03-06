export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const sendNotification = async (
  title: string,
  body: string,
  tag?: string,
): Promise<void> => {
  if (typeof window === "undefined" || Notification.permission !== "granted") {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    const options = {
      body: body,
      icon: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      tag: tag || "class-alert",
      renotify: true,
      badge: "/icons/icon-192.png",
    } as any;

    if (registration && registration.active) {
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
};
