function handleLogin(response) {
  const idToken = response.credential;
  const deviceId = getDeviceId();
  const statusEl = document.getElementById("loginStatus");

  statusEl.textContent = "Đang xử lý đăng nhập Google...";
  statusEl.style.color = "#333";
  statusEl.style.display = "block";

  fetch(getUrl() + "/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, deviceId, platform: 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data?.token) {
        gtag('event', 'login', { method: 'google' });
        handleAuthResponse(data, deviceId);
      } else {
        throw new Error(data?.message || "Đăng nhập Google thất bại.");
      }
    })
    .catch(err => {
      console.error("Lỗi đăng nhập Google:", err);
      statusEl.textContent = "Lỗi đăng nhập Google: " + (err?.message || "Không rõ nguyên nhân");
      statusEl.style.color = "red";
      statusEl.style.display = "block";
    });
}

// =====================================
// Đăng nhập bằng Email & Password
// =====================================
function handleEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const deviceId = getDeviceId();
  const btn = document.getElementById("btnLogin");
  const statusEl = document.getElementById("loginStatus");

  // reset trạng thái label
  statusEl.textContent = "";
  statusEl.style.display = "none";

  if (!email || !password) {
    statusEl.textContent = "Vui lòng nhập đầy đủ email và mật khẩu.";
    statusEl.style.color = "red";
    statusEl.style.display = "block";
    return false;
  }

  btn.disabled = true;
  btn.textContent = "Đang đăng nhập...";
  statusEl.textContent = "Đang xử lý, vui lòng chờ...";
  statusEl.style.color = "#333";
  statusEl.style.display = "block";

  fetch(getUrl() + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, device_id: deviceId })
  })
    .then(res => res.json())
    .then(data => {
      if (data?.token) {
        gtag('event', 'login', { method: 'email' });
        handleAuthResponse(data, deviceId);
      } else {
        throw new Error(data?.message || "Sai email hoặc mật khẩu.");
      }
    })
    .catch(err => {
      console.error("Lỗi đăng nhập:", err);
      statusEl.textContent = "Đăng nhập thất bại: " + (err?.message || "Không rõ nguyên nhân");
      statusEl.style.color = "red";
      statusEl.style.display = "block";
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Đăng nhập";
    });

  return false;
}

// =====================================
// Xử lý phản hồi sau khi đăng nhập thành công
// =====================================
function handleAuthResponse(data, deviceId) {
  const statusEl = document.getElementById("loginStatus");
  if (data?.token) {
    localStorage.setItem("accessToken", data.token);
    localStorage.setItem("userEmail", data.email);

    statusEl.textContent = "Đăng nhập thành công! Đang chuyển hướng...";
    statusEl.style.color = "green";
    statusEl.style.display = "block";

    setTimeout(() => {
      if (Notification.permission === "granted") {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "notification-permission.html";
      }
    }, 1000);
  } else {
    statusEl.textContent = "Đăng nhập thất bại: " + (data?.message || "Không rõ nguyên nhân");
    statusEl.style.color = "red";
    statusEl.style.display = "block";
  }
}

// =====================================
// Tiện ích
// =====================================
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