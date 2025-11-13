
// ====================================================================
// BƯỚC 1: GỬI MÃ OTP VỀ EMAIL
// ====================================================================
function handleRequestOtp(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const btn = document.getElementById("btnRequestOtp");
  const status = document.getElementById("status");

  if (!email) {
    alert("Vui lòng nhập email hợp lệ.");
    return false;
  }

  btn.disabled = true;
  btn.textContent = "Đang gửi...";
  status.textContent = "Đang gửi mã OTP đến email...";

  fetch(getUrl() + "/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Không thể gửi OTP.");

      alert(data.message || "Đã gửi mã OTP đến email của bạn.");
      localStorage.setItem("registerEmail", email);
      window.location.href = "register-step2.html";
    })
    .catch((err) => {
      console.error("❌ Lỗi gửi OTP:", err);
      alert(err.message || "Không thể gửi mã OTP. Vui lòng thử lại.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Gửi mã OTP";
      status.textContent = "";
    });

  return false;
}

// ====================================================================
// BƯỚC 2: XÁC NHẬN MÃ OTP
// ====================================================================
function handleVerifyOtp(e) {
  e.preventDefault();

  const otp = document.getElementById("otp").value.trim();
  const email = localStorage.getItem("registerEmail");
  const btn = document.getElementById("btnVerifyOtp");
  const status = document.getElementById("status");

  if (!email) {
    alert("Thiếu thông tin email, vui lòng quay lại bước 1.");
    window.location.href = "register-step1.html";
    return false;
  }

  if (!otp) {
    alert("Vui lòng nhập mã OTP.");
    return false;
  }

  btn.disabled = true;
  btn.textContent = "Đang xác minh...";
  status.textContent = "Đang xác minh mã OTP...";

  fetch(getUrl() + "/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "OTP không hợp lệ hoặc đã hết hạn.");

      alert(data.message || "Xác minh OTP thành công!");
      window.location.href = "register-step3.html";
    })
    .catch((err) => {
      console.error("❌ Lỗi xác minh OTP:", err);
      alert(err.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Xác nhận";
      status.textContent = "";
    });

  return false;
}

// ====================================================================
// BƯỚC 3: TẠO MẬT KHẨU VÀ ĐĂNG NHẬP
// ====================================================================
function handleConfirmRegister(e) {
  e.preventDefault();

  const email = localStorage.getItem("registerEmail");
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const btn = document.getElementById("btnRegister");
  const status = document.getElementById("status");

  if (!email) {
    alert("Thiếu thông tin email, vui lòng quay lại bước đầu.");
    window.location.href = "register-step1.html";
    return false;
  }

  if (!password || !confirmPassword) {
    alert("Vui lòng nhập mật khẩu đầy đủ.");
    return false;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu nhập lại không khớp.");
    return false;
  }

  // Gợi ý: có thể thêm validate mạnh hơn
  if (password.length < 6) {
    alert("Mật khẩu phải có ít nhất 6 ký tự.");
    return false;
  }

  btn.disabled = true;
  btn.textContent = "Đang đăng ký...";
  status.textContent = "Đang tạo tài khoản...";

  fetch(getUrl() + "/api/auth/confirm-register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, device_id: getDeviceId() })
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại.");

      // Đăng ký thành công → lưu token, email
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.removeItem("registerEmail");

      alert(data.message || "Đăng ký tài khoản thành công!");

      // Chuyển hướng như flow đăng nhập
      if (data.isSub == false) {
        window.location.href = "notification-permission.html";
      }
      else if (Notification.permission === "granted") {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "notification-permission.html";
      }
    })
    .catch((err) => {
      console.error("❌ Lỗi confirmRegister:", err);
      alert(err.message || "Không thể đăng ký. Vui lòng thử lại.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Đăng ký & Đăng nhập";
      status.textContent = "";
    });

  return false;
}
