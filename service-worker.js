// =============================
// Tool AI - Service Worker
// =============================

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
  return self.clients.claim();
});

// =============================
// Lắng nghe Push Notification
// =============================
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Tool AI", body: event.data.text() };
  }

  const title = data.title || "Tool AI";
  const message = data.message || "Bạn có thông báo mới!";
  const icon = data.icon || "/assets/ic_launcher_round.png";
  const badge = data.badge || "/assets/ic_launcher_round.png";
  const btnText = data.btnText || "";
  const screenRedirect = data.screen_redirect || "";
  

  const url = data.url || "/dashboard.html?page=notifications";
  
  const options = {
    body: message,
    icon,
    badge,
    data: {
      url,
      title,
      message,
      btnText,
      screenRedirect,
      time: Date.now(),
    },
  };

  // Hiển thị thông báo
  event.waitUntil(self.registration.showNotification(title, options));

  // Gửi thông tin noti sang client (để lưu vào localStorage)
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      for (const client of clients) {
        client.postMessage({
          type: "PUSH_RECEIVED",
          notification: {
            title,
            message,
            btnText,
            screenRedirect,
            time: Date.now(),
            read: false,
          },
        });
      }
    })
  );
});

// =============================
// Khi người dùng click vào thông báo
// =============================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard.html?page=notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Nếu tab app đã mở → focus vào tab đó
      for (const client of clientList) {
        if (client.url.includes("/dashboard.html")) {
          client.focus();
          client.postMessage({ type: "OPEN_NOTIFICATIONS_PAGE" });
          return;
        }
      }
      // Nếu chưa có tab nào → mở mới
      self.clients.openWindow(targetUrl);
    })
  );
});

// =============================
// (Tuỳ chọn) Lắng nghe thông báo đóng
// =============================
self.addEventListener("notificationclose", (event) => {
  console.log("🔕 Notification closed:", event.notification.data);
});