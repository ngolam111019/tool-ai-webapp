// ====================================================================
// BƯỚC 1: GỬI OTP RESET PASSWORD
// ====================================================================
function handleRequestReset(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const btn = document.getElementById("btnSendOtp");
  const status = document.getElementById("status");

  if (!email) {
    alert("Vui lòng nhập email hợp lệ.");
    return false;
  }

  btn.disabled = true;
  btn.textContent = "Đang gửi...";
  status.textContent = "Đang gửi mã OTP đến email...";

  fetch(getUrl() + "/api/auth/request-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể gửi mã OTP.");

      alert(data.message || "Đã gửi mã OTP tới email của bạn.");
      localStorage.setItem("resetEmail", email);
      window.location.href = "forgot-step2.html";
    })
    .catch((err) => {
      console.error("❌ Lỗi request-reset:", err);
      alert(err.message || "Không thể gửi OTP. Vui lòng thử lại.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Gửi mã OTP";
      status.textContent = "";
    });

  return false;
}

// ====================================================================
// BƯỚC 2: XÁC NHẬN OTP & GỬI MẬT KHẨU MỚI
// ====================================================================
function handleVerifyReset(e) {
  e.preventDefault();

  const email = localStorage.getItem("resetEmail");
  const otp = document.getElementById("otp").value.trim();
  const btn = document.getElementById("btnVerifyOtp");
  const status = document.getElementById("status");

  if (!email) {
    alert("Thiếu thông tin email, vui lòng quay lại bước 1.");
    window.location.href = "forgot-step1.html";
    return false;
  }

  if (!otp) {
    alert("Vui lòng nhập mã OTP.");
    return false;
  }

  btn.disabled = true;
  btn.textContent = "Đang xác minh...";
  status.textContent = "Đang xác minh mã OTP...";

  // --- Gọi API verify-reset ---
  fetch(getUrl() + "/api/auth/verify-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");

      // OTP hợp lệ → gọi tiếp API gửi mật khẩu mới
      return fetch(getUrl() + "/api/auth/send-new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
    })
    .then(async (res2) => {
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.message || "Không thể gửi mật khẩu mới.");

      alert(data2.message || "Mật khẩu mới đã được gửi về email của bạn.");
      localStorage.removeItem("resetEmail");
      window.location.href = "forgot-step3.html";
    })
    .catch((err) => {
      console.error("❌ Lỗi verify-reset:", err);
      alert(err.message || "Không thể xác nhận OTP hoặc gửi mật khẩu mới.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Xác nhận";
      status.textContent = "";
    });

  return false;
}