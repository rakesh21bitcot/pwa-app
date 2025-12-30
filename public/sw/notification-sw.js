const NOTIFICATION_VERSION = "v10.1-notification-timers";
const TIMER_CACHE = `timer-state-${NOTIFICATION_VERSION}`;


const NotificationHandlers = {
  handlePush: (event) => {
    if (!event.data) return;
    const payload = event.data.json();

    const {
      title = "Notification",
      body = "",
      icon,
      image,
      badge,
      actions = [],
      requireInteraction
    } = payload;

    const notificationData = {
      title,
      body,
      icon,
      image,
      badge,
      actions,
    };

    event.waitUntil(
      self.registration
        .showNotification(title, {
          body: body,
          icon,
          image,
          badge,
          actions,
          requireInteraction,
          renotify: true,
          data: notificationData,
        })
    );
  },

  handleClick: (event) => {
    event.notification.close();
  },
};

self.NotificationHandlers = NotificationHandlers;
