function getUserEmail() {
  return localStorage.getItem("userEmail");
}

function redirectIfNotLogin() {
  if (!getUserEmail()) {
    window.location.href = "index.html";
  }
}

function getUrl() {
  //return "http://127.0.0.1:3000";
  return "https://tool-ai-api-4fdc58954ac0.herokuapp.com";
}

function getWebSocketUrl() {
    return "https://zon88.onrender.com/websocket";
}

// Load thông tin account từ API hoặc cache
async function loadAccountInfo() {
  var forceRefresh = JSON.parse(localStorage.getItem("forceRefresh") || 'false');
  
  const token = localStorage.getItem("accessToken");
  const deviceId = localStorage.getItem("deviceId");
  const cacheKey = "packageStatusData";
  const cacheTimeKey = "packageStatusFetchedAt";
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (!token) return null;

  const cachedAt = parseInt(localStorage.getItem(cacheTimeKey) || "0");

  if (!forceRefresh && cachedAt && now - cachedAt < oneDay) {
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    if (cachedData) return cachedData;
  }
  else {
    localStorage.setItem("forceRefresh", false);
  }

  try {
    const res = await fetch(getUrl() + "/api/package/status", {
      headers: {
        Authorization: "Bearer " + token,
        "x-device-id": deviceId
      }
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheTimeKey, now.toString());
      return data;
    } else {
      console.error("Lỗi API:", data.message);
      return null;
    }
  } catch (err) {
    console.error("Lỗi gọi API package-status:", err);
    return null;
  }
}
async function loadPackages(forceRefresh = false) {
  const token = localStorage.getItem("accessToken");
  const cacheKey = "cachedPackages";
  const cacheTimeKey = "cachedPackagesFetchedAt";
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Kiểm tra cache
  const cachedAt = parseInt(localStorage.getItem(cacheTimeKey) || "0");
  if (!forceRefresh && cachedAt && now - cachedAt < oneDay) {
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    if (cachedData) {
      return cachedData;
    }
    else return null;
  }

  // Gọi API nếu không có cache hoặc cần làm mới
  try {
    const res = await fetch(getUrl() + "/api/package/packages", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const packages = await res.json();

    // Cache kết quả
    localStorage.setItem(cacheKey, JSON.stringify(packages));
    localStorage.setItem(cacheTimeKey, now.toString());

    return packages;
  } catch (err) {
    console.error("Lỗi tải danh sách gói:", err);
    //document.getElementById("package-list").innerHTML = "<p class='text-danger'>Không thể tải gói</p>";
    return null;
  }
}

async function fetchPaymentInfo(packageId, amount) {
  const token = localStorage.getItem("accessToken");
  const deviceId = localStorage.getItem("deviceId");

  try {
    const response = await fetch(getUrl() + "/api/payment/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        "x-device-id": deviceId
      },
      body: JSON.stringify({
        package_id: packageId,
        amount: amount
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[fetchPaymentInfo] API trả về lỗi:", data);
      throw new Error(data.message || "Không thể tạo thanh toán.");
    }

    return data;
  } catch (err) {
    console.error("[fetchPaymentInfo] Lỗi:", err);
    throw err;
  }
}

function formatThousandsVNXu(number) {
  if (typeof number !== "number") number = parseFloat(number);
  if (isNaN(number)) return "0 xu";
  return number.toLocaleString("vi-VN") + " xu";
}
function formatThousandsVN(number) {
  if (typeof number !== "number") number = parseFloat(number);
  if (isNaN(number)) return "0";
  return number.toLocaleString("vi-VN");
}
function formatDateTimeVN(dateStr) {
  const date = new Date(dateStr);

  // Lấy thời gian theo múi giờ Việt Nam (UTC+7)
  const options = {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };

  return new Intl.DateTimeFormat("vi-VN", options).format(date);
}

function clearLocalStorage(exclude) {
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);

    if (exclude.indexOf(key) === -1) {
      localStorage.removeItem(key);
    }
  }
}

function showLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.style.display = "flex";
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.style.display = "none";
}

function getTodayKey(prefix) {
  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
  return `${prefix}_${today}`;
}

function setDailyCache(keyPrefix, data) {
  const fullKey = getTodayKey(keyPrefix);
  localStorage.setItem(fullKey, JSON.stringify(data));
}

function getDailyCache(keyPrefix) {
  const fullKey = getTodayKey(keyPrefix);
  const raw = localStorage.getItem(fullKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function showAlert(message, type = 'info', timeout = 3000) {
    const alertId = `alert-${Date.now()}`;
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show mx-auto" role="alert" style="max-width: 600px;">
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close" style="outline: none;">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;

    const container = document.getElementById('global-alert-container');
    if (container) {
        container.insertAdjacentHTML('beforeend', alertHTML);

        // Tự động xóa sau timeout (mặc định 3s)
        setTimeout(() => {
            const el = document.getElementById(alertId);
            if (el) {
                $(el).alert('close');
            }
        }, timeout);
    }
}