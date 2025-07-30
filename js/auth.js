function handleLogin(response) {
  const idToken = response.credential;
  const deviceId = getOrCreateDeviceId();
  //var url = 'http://127.0.0.1:3000';
  var url = 'https://tool-ai-api-4fdc58954ac0.herokuapp.com';
  fetch(url + "/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken, deviceId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        console.log(deviceId);

        // Lưu session
        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("deviceId", deviceId);
        if (Notification.permission === "granted") {
          // Đã cấp quyền → vào dashboard
          window.location.href = "dashboard.html";
        } else {
          // Chưa cấp → vào trang xin quyền
          window.location.href = "notification-permission.html";
        }

      } else {
        alert("Đăng nhập thất bại: " + (data.message || "Không rõ nguyên nhân"));
      }
    })
    .catch(err => {
      console.error("Lỗi đăng nhập:", err);
      alert("Lỗi kết nối đến server.");
    });
}

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Sinh deviceId nếu chưa có
function getOrCreateDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = 'device-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("deviceId", id);
  }
  return id;
}