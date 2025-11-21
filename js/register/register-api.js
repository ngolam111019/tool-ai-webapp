// Helper: parse JSON an toàn
async function safeJson(res) {
    const text = await res.text();

    try {
        return JSON.parse(text);
    } catch (err) {
        console.error("❌ JSON parse error:", err);
        console.log("📌 Raw response:", text);
        return null; // vẫn return để tránh throw
    }
}

// Helper: call API chuẩn
async function apiCall(path, payload = {}) {
    const url = getUrl() + path;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await safeJson(res);

        return {
            ok: res.ok,
            status: res.status,
            data
        };
    } catch (err) {
        console.error("❌ Fetch error:", err);
        return {
            ok: false,
            status: 0,
            data: null,
            error: err
        };
    }
}

// === Specific APIs ===

async function apiRequestOtp(email) {
    return apiCall("/api/auth/request-otp", { email });
}

async function apiVerifyOtp(email, otp) {
    return apiCall("/api/auth/verify-otp", { email, otp });
}

async function apiRegister(email, password) {
    return apiCall("/api/auth/confirm-register", { email, password });
}