export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const sendNotification = async (title, body, tag) => {
  if (Notification.permission === "granted") {
    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration && registration.active) {
        registration.showNotification(title, {
          body: body,
          icon: "/icons/icon-192.png",
          vibrate: [200, 100, 200],
          tag: tag || "class-alert",
          renotify: true,
        });
      } else {
        new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
          tag: tag || "class-alert",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
};
