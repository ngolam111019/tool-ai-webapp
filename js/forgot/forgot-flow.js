// =========================
// STEP 1 — Gửi OTP Reset
// =========================
async function handleRequestReset(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  if (!email) {
    showToast("Vui lòng nhập email", "error");
    return false;
  }

  showLoading();
  const res = await apiRequestReset(email);
  hideLoading();

  if (res.ok) {
    localStorage.setItem("resetEmail", email);
    showToast("OTP đã được gửi!", "success");

    setTimeout(() => {
      window.location.href = "forgot-step2.html";
    }, 500);

  } else {
    showToast(res.data?.message || "Không thể gửi OTP", "error");
  }
}

// =========================
// STEP 2 — Verify OTP
// =========================
async function handleVerifyReset(e) {
  e.preventDefault();

  const email = localStorage.getItem("resetEmail");
  const otp = document.getElementById("otp").value.trim();

  if (!email) {
    showToast("Thiếu email, vui lòng nhập lại", "error");
    window.location.href = "forgot-step1.html";
    return false;
  }

  if (!otp) {
    showToast("Vui lòng nhập OTP!", "error");
    return false;
  }

  showLoading();
  const res = await apiVerifyReset(email, otp);
  hideLoading();

  if (!res.ok) {
    showToast(res.data?.message || "OTP không hợp lệ", "error");
    return false;
  }

  // OTP hợp lệ → gửi mật khẩu mới
  showToast("OTP hợp lệ, đang gửi mật khẩu mới...", "success");

  showLoading();
  const res2 = await apiSendNewPassword(email);
  hideLoading();

  if (res2.ok) {
    localStorage.removeItem("resetEmail");
    setTimeout(() => {
      window.location.href = "forgot-step3.html";
    }, 600);
  } else {
    showToast(res2.data?.message || "Không thể gửi mật khẩu mới", "error");
  }
}