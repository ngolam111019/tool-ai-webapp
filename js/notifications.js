const publicKey = 'BBeZbEwXml_v93n0caqGDxOEdX8WMjFMc018zOtujFo-w6mTLDWDqXqGot4CoyFz0VJUKiYCA6TmDUq9Bk4964U'; // phải là key Base64URL từ server

async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

async function registerPush() {
  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) {
    alert('Bạn cần cho phép thông báo để tiếp tục!');
    return false;
  }

  const registration = await navigator.serviceWorker.register('/service-worker.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });

  // Gửi subscription lên server
  const token = localStorage.getItem('accessToken');

  const res = await fetch(getUrl() + '/api/auth/save-web-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      'x-device-id': getDeviceId()
    },
    body: JSON.stringify({
      subscription
    })
  });

  const result = await res.json();
  return result.success;
}

// Hàm hỗ trợ chuyển Base64URL → Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = window.atob(base64);
  return new Uint8Array([...raw].map(char => char.charCodeAt(0)));
}