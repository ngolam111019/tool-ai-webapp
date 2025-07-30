
self.addEventListener('push', function(event) {
  const data = event.data.json();

  const title = data.title || 'Tool AI';
  const options = {
    body: data.body || 'Bạn có thông báo mới!',
    icon: '/assets/ic_launcher_round.png',
    badge: '/assets/ic_launcher_round.png',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});