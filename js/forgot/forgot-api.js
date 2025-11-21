async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return null; }
}

async function apiCall(path, payload = {}) {
  try {
    const res = await fetch(getUrl() + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await safeJson(res);

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

// APIs forgot
async function apiRequestReset(email) {
  return apiCall("/api/auth/request-reset", { email });
}

async function apiVerifyReset(email, otp) {
  return apiCall("/api/auth/verify-reset", { email, otp });
}

async function apiSendNewPassword(email) {
  return apiCall("/api/auth/send-new-password", { email });
}