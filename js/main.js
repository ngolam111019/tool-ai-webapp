// ==========================
// 🔹 Xác định trang hiện tại
// ==========================
//const currentPage = window.location.pathname.split("/").pop();
//console.log("urlParams: " + urlParams);
// 🔹 Khai báo urlParams an toàn (chống trùng biến khi load lại qua AJAX)
var pageMain = new URLSearchParams(window.location.search).get("page");

var webSocket1;

// ==========================
// 🔹 Trang tool.html
// ==========================
async function initToolPage() {
  try {
    const data = await loadAccountInfo();
    if (data) {
      renderAccountInfo(data);
      loadGateways(data.package);
    } else {
      $("#account-info").html("<p class='text-danger'>Không thể tải thông tin tài khoản.</p>");
    }
  } catch (err) {
    console.error("Lỗi initToolPage:", err);
  }
}


// ==========================
// 🔹 Trang tooluse.html
// ==========================
async function initToolUsePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const gateway = urlParams.get("gateway");
  const gatewayName = urlParams.get("name") || gateway;

  // DOM elements
  resultEl = document.getElementById("txtKetQua");
  messageEl = document.getElementById("message");
  luotEl = document.getElementById("txtLuot");
  btnFetch = document.getElementById("btnFetch");
  _pkg = null;
  btnFetch.textContent = "Bắt đầu chơi";

  const gatewayNameEl = document.getElementById("gateway-name");
  if (gatewayNameEl) gatewayNameEl.textContent = gatewayName;

  const backBtn = document.getElementById("btnBack");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      loadPage("tool");
    });
  }

  // Load gói & lượt còn lại
  const data = await loadAccountInfo();
  if (data) {
    _pkg = data;
    const pkg = data.package;
    const turnsLeft = pkg.max_turns_per_day - pkg.turns_used_today;
    if (luotEl) luotEl.textContent = `🎮 Còn ${turnsLeft} lượt/ngày`;
  }

  // Khi bấm nút Lấy kết quả
  if (btnFetch) {
    btnFetch.addEventListener("click", async () => {
      if (gateway === "Zon88") {
        btnFetch.disabled = true;
        btnFetch.textContent = "Đang kết nối...";
        connectWebSocket(gateway, _pkg);
      } else {
        await fetchPredictionDirect(gateway);
      }
    });
  }
}

// ==========================
// 🔹 Các hàm dùng chung
// ==========================

async function loadGateways(pkg, forceRefresh = false) {
  var cacheKey = "gateways";
  var cached = getDailyCache(cacheKey);

  if (cached && !forceRefresh) {
    renderGateways(pkg, cached);
    return;
  }

  try {
    showLoading();
    var token = localStorage.getItem("accessToken");

    var res = await fetch(getUrl() + "/api/gateway/gateways", {
      headers: { Authorization: "Bearer " + token }
    });

    var data = await res.json();
    renderGateways(pkg, data);
    setDailyCache(cacheKey, data);
  } catch (err) {
    console.error("Lỗi khi load gateway:", err);
    $("#gateway-list").html("<div class='text-danger'>Lỗi tải danh sách cổng game</div>");
  } finally {
    hideLoading();
  }
}

function renderGateways(pkg, gateways) {


  var html = gateways.map(gw => {
    var msgExpired = '';
    if (pkg.id == 0 && pkg.gateways.length > 0) {
      pkg.gateways.forEach(function (name, index) {
        if (gw.name == name) { 
          var expiredStr;
          if (pkg.expired_at == null || pkg.expired_at == 'null') {
            expiredStr = '';
          }
          else {
            expiredStr =  (isExpiredFunc(pkg.expired_at)? "đã hết hạn ":"sẽ hết hạn ") + formatDateTimeVN(pkg.expired_at);
          }
          msgExpired = '<div class="text-danger small blink-text">' + (pkg.max_turns_per_day - pkg.turns_used_today) + ' lượt miễn phí ' + expiredStr + '</div>';
        }
      });
    }
    return `
      <div class="col-6 col-md-4 col-lg-3 mb-4">
        <div class="gateway-card" onclick="showFloatingView('${gw.name}', '${gw.display_name}')">
          <img src="assets/${gw.logo}.png" alt="${gw.display_name}">
          <div><strong>${gw.display_name}</strong></div>
          ${msgExpired}
        </div>
      </div>
    `;
  }).join("");

  $("#gateway-list").html(html);
}

function isExpiredFunc(expired_at) {
  try {
    const expiredDate = new Date(expired_at);
    const now = new Date();
    return now > expiredDate;
  } catch (err) {
    console.error("Lỗi khi kiểm tra expired:", err);
    return false;
  }
}

function renderFloatingViewInfo(data) {
  const { package } = data;
  var isExpired = false;
  var turnsLeft = 0;
  if (package) {
    _pkg = data;
    isExpired = isExpiredFunc(package.expired_at);
    turnsLeft = (package.max_turns_per_day - package.turns_used_today);
    if (luotEl) luotEl.textContent = "🎮 Còn " + turnsLeft + " lượt/ngày";
  }
  if (isExpired && resultEl) {
    resultEl.textContent = "🎲 Hết hạn sử dụng";
  }
}

// ==========================
// 🔹 Các hàm dùng trong tooluse.html
// ==========================

async function fetchPredictionDirect(gateway) {
  const startTime = Date.now();
  let dotCount = 1;

  // 🎲 Hiệu ứng loading chấm động
  const interval = setInterval(() => {
    resultEl.textContent = "🎲".repeat(dotCount);
    dotCount = dotCount < 3 ? dotCount + 1 : 1;
  }, 1000);

  // ⚙️ Trạng thái ban đầu
  btnFetch.disabled = true;
  btnFetch.textContent = "Đang lấy kết quả...";
  btnFetch.style.backgroundColor = "#ffc107"; // màu cam (đang xử lý)
  btnFetch.style.color = "#212529";

  let resultText = "", messageText = "", luotText = 0;
  let success = false;

  try {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(getUrl() + "/api/tool/use", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        "x-device-id": getDeviceId()
      },
      body: JSON.stringify({ gateway })
    });

    const data = await res.json();

    if (res.ok && data?.result) {
      resultText = data.result;
      luotText = data.turns_left;
      success = true;
    } else {
      resultText = "Không có kết quả.";
      messageText = data?.message || "";
    }

  } catch (err) {
    resultText = "Lỗi kết nối.";
    messageText = err.message || "Không thể kết nối tới máy chủ.";
  }

  // 🕒 Đảm bảo loading ít nhất 6 giây
  const elapsed = Date.now() - startTime;
  const remaining = 6000 - elapsed;
  if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

  clearInterval(interval);

  // ✅ Hiển thị kết quả
  resultEl.textContent = "🎲 " + resultText;
  messageEl.textContent = messageText || "";
  luotEl.textContent = luotText ? ("🎮 Còn " + luotText + " lượt/ngày") : "";

  // 🌿 Nếu có kết quả → hiển thị "Đã có kết quả" + màu xanh lá
  if (success) {
    btnFetch.textContent = "Đã có kết quả 👆";
    btnFetch.style.backgroundColor = "#28a745"; // xanh lá
    btnFetch.style.color = "#fff";
    await new Promise(r => setTimeout(r, 5000));
  }

  // 🔁 Khôi phục nút về trạng thái ban đầu
  btnFetch.disabled = false;
  btnFetch.textContent = "Lấy kết quả";
  btnFetch.style.backgroundColor = "#007bff"; // xanh dương gốc
  btnFetch.style.color = "#fff";

  localStorage.setItem("forceRefresh", "true");
}

// ==========================
// 🔹 WebSocket & xử lý kết quả
// ==========================

function showFloatingView(gatewayId, gatewayName) {
  loadPage('tooluse', { gateway: gatewayId, name: gatewayName });
}

function resetFormFloatingView() {
  if (messageEl) messageEl.textContent = "";
  if (resultEl) resultEl.textContent = "🎲 Kết quả: ?";
  if (btnFetch) {
    btnFetch.textContent = "Lấy kết quả";
    btnFetch.disabled = false;
  }
}

function connectWebSocket(room, pkg) {
  try {
    var wsUrl = getWebSocketUrl();
    if (webSocket1) webSocket1.close();
    webSocket1 = new WebSocket(wsUrl);

    // Khi kết nối thành công
    webSocket1.onopen = function () {
      console.log("✅ WebSocket connected");

      const joinObj = { event: "join_room", room: room, uid: pkg.email };
      webSocket1.send(JSON.stringify(joinObj));

      // ⚠️ Thêm cảnh báo khi reload nếu đang kết nối
      window.onbeforeunload = function (e) {
        if (webSocket1 && webSocket1.readyState === WebSocket.OPEN) {
          const message = "Bạn đang kết nối với Zon88. Reload sẽ ngắt kết nối, bạn có chắc muốn tải lại trang?";
          e.preventDefault();
          e.returnValue = message; // cần cho Chrome
          return message;
        }
      };

      // Hiển thị nút ngắt kết nối sau khi kết nối thành công
      if (!document.getElementById("btnDisconnect")) {
        const disconnectBtn = document.createElement("button");
        disconnectBtn.id = "btnDisconnect";
        disconnectBtn.className = "btn btn-danger ml-2";
        disconnectBtn.textContent = "Ngắt kết nối";

        btnFetch.insertAdjacentElement("afterend", disconnectBtn);
        btnFetch.textContent = "Đang nhận tín hiệu...";
        btnFetch.disabled = true;
        messageEl.textContent = "Đã kết nối tới Zon88, đang chờ tín hiệu...";

        disconnectBtn.addEventListener("click", () => {
          if (webSocket1) {
            webSocket1.close();
            console.log("🔌 Đã ngắt kết nối WebSocket");
          }
          disconnectBtn.remove();
          btnFetch.disabled = false;
          btnFetch.textContent = "Bắt đầu chơi";
          messageEl.textContent = "Đã ngắt kết nối khỏi Zon88.";

          // 🔹 Gỡ cảnh báo reload khi đã ngắt kết nối
          window.onbeforeunload = null;
        });
      }
    };

    // Khi nhận được tin nhắn
    webSocket1.onmessage = function (event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "game_result" && msg.data) {
          handleGameResult(msg.data, room);
        }
      } catch (e) {
        console.error("Lỗi xử lý message:", e);
      }
    };

    // Khi xảy ra lỗi
    webSocket1.onerror = function (err) {
      console.error("❌ WebSocket error:", err);
      messageEl.textContent = "Không thể kết nối WebSocket.";
      btnFetch.disabled = false;
      btnFetch.textContent = "Lấy kết quả";
    };

    // Khi bị đóng
    webSocket1.onclose = function (event) {
      console.log("❌ WebSocket closed:", event.reason);
      window.onbeforeunload = null; // ✅ không cảnh báo khi reload nữa
      const disconnectBtn = document.getElementById("btnDisconnect");
      if (disconnectBtn) disconnectBtn.remove();
      btnFetch.disabled = false;
      btnFetch.textContent = "Lấy kết quả";
      messageEl.textContent = "Kết nối đã đóng.";
    };
  } catch (e) {
    console.error(e);
    btnFetch.disabled = false;
    btnFetch.textContent = "Lấy kết quả";
  }
}

async function handleGameResult(data, gatewayName) {
  if (!resultEl || !btnFetch) return;
  let dotCount = 0;
  resultEl.textContent = "Kết quả...";
  btnFetch.textContent = "Chờ kết quả...";

  let dotUpdater = setInterval(() => {
    dotCount = (dotCount % 3) + 1;
    resultEl.textContent = "Kết quả" + ".".repeat(dotCount);
  }, 1000);

  const startTime = Date.now();
  try {
    const token = localStorage.getItem("accessToken");

    const res = await fetch(getUrl() + "/api/tool/use", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        "x-device-id": getDeviceId()
      },
      body: JSON.stringify({
        gateway: gatewayName,
        result: data.rs || 0,
        round_code: data.phien || 0
      })
    });

    localStorage.setItem("forceRefresh", true);
    const elapsed = Date.now() - startTime;
    const delay = Math.max(6000 - elapsed, 0);
    setTimeout(async () => {
      clearInterval(dotUpdater);
      const resultJson = await res.json();
      const result = resultJson.result || "?";
      const turnsLeft = resultJson.turns_left || 0;
      const message = resultJson.message || "";

      btnFetch.textContent = "Đã có kết quả";
      resultEl.textContent = "🎲 " + result;
      if (luotEl) luotEl.textContent = "🎮 Còn " + turnsLeft + " lượt/ngày";

      if (turnsLeft <= 3 && turnsLeft > 0) showAlert(`⚠️ Chỉ còn ${turnsLeft} lượt hôm nay`);
      if (turnsLeft === 0) showAlert(message);

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Tín hiệu mới từ Tool AI ⚡', {
          body: "🎲 " + result,
          icon: '/icons/icon-512.png',
          tag: 'tool-txai',
          requireInteraction: true
        });
      }
    }, delay);
  } catch (err) {
    clearInterval(dotUpdater);
    showAlert(err.message || "Lỗi xử lý kết quả", 'danger');
    if (btnFetch) btnFetch.textContent = "Lấy kết quả";
  }
}