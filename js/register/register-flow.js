async function handleRequestOtp(e) {
    e.preventDefault();
    let email = document.getElementById("email").value.trim();

    if (!validateEmail(email)) {
        showToast("Email không hợp lệ", "error");
        return;
    }

    showLoading();
    const res = await apiRequestOtp(email);
    hideLoading();
    console.log(res);
    if (res.ok) {
        showToast("Mã OTP đã được gửi!", "success");

        const nextUrl = new URL("register-step2.html", window.location.origin);
        nextUrl.searchParams.set("email", email);

        setTimeout(() => {
            window.location.href = nextUrl.toString();
        }, 600);

    } else {
        showToast(res.data?.message || "Gửi OTP thất bại", "error");
    }
}

async function handleVerifyOtp(e) {
    e.preventDefault();
    const otp = document.getElementById("otp").value.trim();

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (!email) {
        showToast("Thiếu email, vui lòng nhập lại", "error");
        return;
    }

    showLoading();
    const res = await apiVerifyOtp(email, otp);
    hideLoading();

    if (res.ok) {
        showToast("Xác thực thành công", "success");

        const nextUrl = new URL("register-step3.html", window.location.origin);
        nextUrl.searchParams.set("email", email);

        setTimeout(() => {
            window.location.href = nextUrl.toString();
        }, 600);

    } else {
        showToast(res.data?.message || "OTP không đúng", "error");
    }
}

async function handleConfirmRegister(e) {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;
    const email = new URLSearchParams(window.location.search).get("email");
    
    if (password.length < 8) {
        showToast("Mật khẩu phải có ít nhất 8 ký tự", "error");
        return false;
    }

    if (password !== confirm) {
        showToast("Mật khẩu không khớp", "error");
        return false;
    }

    showLoading();
    const res = await apiRegister(email, password);
    hideLoading();

    if (res.ok) {
        showToast("Đăng ký thành công!", "success");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);
    } else {
        showToast(res.data?.message || "Đăng ký thất bại", "error");
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}