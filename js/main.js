async function loadGateways(forceRefresh = false) {
  var cacheKey = "gateways";
  var cached = getDailyCache(cacheKey);

  if (cached && !forceRefresh) {
    renderGateways(cached);
    return;
  }


  try {
    showLoading();
    var token = localStorage.getItem("accessToken");

    var res = await fetch(getUrl() + "/api/gateway/gateways", {
      headers: { Authorization: "Bearer " + token }
    });

    var data = await res.json();
    renderGateways(data);
    setDailyCache(cacheKey, data);

  } catch (err) {
    console.error("Lỗi khi load gateway:", err);
    $("#gateway-list").html("<div class='text-danger'>Lỗi tải danh sách cổng game</div>");
  }
  finally {
    hideLoading();
  }
}

function renderGateways(gateways) {
  var html = gateways.map(gw => `
      <div class="col-6 col-md-4 col-lg-3 mb-4">
        <div class="gateway-card" onclick="showFloatingView('${gw.name}', '${gw.display_name}')">
          <img src="assets/${gw.logo}.png" alt="${gw.display_name}">
          <div><strong>${gw.display_name}</strong></div>
        </div>
      </div>
    `).join("");

  $("#gateway-list").html(html);
}

function isExpiredFunc(expired_at) {
  try {
    // expired_at là chuỗi ISO kiểu: "2025-07-18T06:55:00.000Z"
    const expiredDate = new Date(expired_at); // tự động parse theo UTC
    const now = new Date(); // Thời gian hiện tại theo local

    return now > expiredDate; // true nếu đã hết hạn
  } catch (err) {
    console.error("Lỗi khi kiểm tra expired:", err);
    return false;
  }
}

var resultEl = document.getElementById("txtKetQua");
var messageEl = document.getElementById("message");
var luotEl = document.getElementById("txtLuot");
var btnFetch = document.getElementById("btnFetch");
var _pkg;

function renderAccountInfo(data) {

  const { package, trial_used } = data;
  const expired = package.expired_at ? formatDateTimeVN(package.expired_at) : "Không có";

  document.getElementById("package-name").innerText = "📦 " + package.name;
  document.getElementById("package-expired").innerText = "⏳ Hết hạn: " + expired;
  document.getElementById("package-turns").innerText = `🎮 Lượt hôm nay: ${package.turns_used_today || 0}/${package.max_turns_per_day || 0}`;

}

function renderFloatingViewInfo(data) {
  const { package } = data;

  var isExpired = false;
  var turnsLeft = 0;
  if (package) {
    _pkg = data;
    isExpired = isExpiredFunc(package.expired_at);
    turnsLeft = (package.max_turns_per_day - package.turns_used_today);
    luotEl.textContent = "🎮 Còn " + turnsLeft + " lượt/ngày";
  }

  if (isExpired) {
    resultEl.textContent = "🎲 Hết hạn sử dụng";
  }
}

loadAccountInfo().then(data => {
  if (data) {
    renderAccountInfo(data);
    renderFloatingViewInfo(data);
  }
  else
    document.getElementById("account-info").innerHTML = "<p class='text-danger'>Không thể tải thông tin tài khoản.</p>";
});

loadGateways();

async function fetchPrediction() {
  const gateway = $("#floating-view").attr("data-gateway");
  console.log(gateway);
  if (gateway == "Zon88") {
    btnFetch.disabled = true;
    btnFetch.textContent = "Kết quả tự động";
    connectWebSocket(gateway, _pkg);
  }
  else {
    resetFormFloatingView();
    var startTime = Date.now();
    let dotCount = 1;
    const interval = setInterval(() => {
      resultEl.textContent = "🎲".repeat(dotCount);
      dotCount = dotCount < 3 ? dotCount + 1 : 1;
    }, 1000);

    var resultText = "", messageText = "", luotText = 0;
    try {
      const token = localStorage.getItem("accessToken");
      const deviceId = localStorage.getItem("deviceId");

      const res = await fetch(getUrl() + "/api/tool/use", {
        method: "POST", // ✅ thêm phương thức POST
        headers: {
          "Content-Type": "application/json", // ✅ quan trọng để server hiểu JSON
          Authorization: "Bearer " + token,
          "x-device-id": deviceId
        },
        body: JSON.stringify({
          gateway: gateway
        })
      });
      const data = await res.json();

      if (res.ok && data && data.result) {
        resultText = data.result;
        luotText = data.turns_left;

      } else {
        resultText = "Không có kết quả.";
        messageText = data.message;
      }
    } catch (err) {
      resultText = "Lỗi kết nối.";
      messageText = err;
    }

    // Tính thời gian đã trôi qua
    const elapsed = Date.now() - startTime;
    const remaining = 6000 - elapsed;

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    clearInterval(interval);
    luotEl.textContent = "🎮 Còn " + luotText + " lượt/ngày";
    resultEl.textContent = "🎲 " + resultText;
    messageEl.textContent = messageText;
  }
}

$('#game-loading').hide();

async function showFloatingView(gatewayId, gatewayName) {
  // 1. Hiện loading
  $('#game-loading').show();
  $('#floating-view').hide();
  // 2. Ghi tên gateway
  $('#gateway-name').text(gatewayName || "Cổng game");

  // 3. Giả lập kết nối 3 giây
  await new Promise(resolve => setTimeout(resolve, 3000));


  // 4. Ẩn loading, hiện floating view
  $('#game-loading').hide();
  $("#floating-title").text(gatewayName);
  $("#prediction-result").text("Kết quả: ?");
  $("#floating-view").fadeIn();
  $("#floating-view").attr("data-gateway", gatewayId);
}

// Nút đóng
$("#close-floating").on("click", () => {
  resetFormFloatingView();
  localStorage.setItem("forceRefresh", true);
  $("#floating-view").fadeOut();
  if (webSocket1) webSocket1.close();
});

// Kéo thả
function makeDraggable(el) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  const start = (e) => {
    isDragging = true;
    const evt = e.touches ? e.touches[0] : e;
    offsetX = evt.clientX - el.offsetLeft;
    offsetY = evt.clientY - el.offsetTop;

    document.addEventListener("mousemove", move);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchend", stop);
  };

  const move = (e) => {
    if (!isDragging) return;
    const evt = e.touches ? e.touches[0] : e;
    el.style.left = (evt.clientX - offsetX) + "px";
    el.style.top = (evt.clientY - offsetY) + "px";
    el.style.right = "auto";
    el.style.bottom = "auto";
    if (e.cancelable) e.preventDefault();
  };

  const stop = () => {
    isDragging = false;
    document.removeEventListener("mousemove", move);
    document.removeEventListener("touchmove", move);
    document.removeEventListener("mouseup", stop);
    document.removeEventListener("touchend", stop);
  };

  el.addEventListener("mousedown", start);
  el.addEventListener("touchstart", start);
}

makeDraggable(document.getElementById("floating-view"));

function resetFormFloatingView() {
  messageEl.textContent = "";
  resultEl.textContent = "🎲 Kết quả: ?";
  btnFetch.textContent = "Lấy kết quả";
  btnFetch.disabled = false;
}

var webSocket1;

function initToolPage() {
  const wsUrl = getWebSocketUrl(); // Hàm trả về URL WebSocket, ví dụ: "wss://tool-ai.example.com/ws"
  if (webSocket1) webSocket1.close();
  webSocket1 = new WebSocket(wsUrl);
}

function connectWebSocket(room, pkg) {
  try {
    if (btnFetch) btnFetch.textContent = 'Lấy kết quả tự động...';
    var wsUrl = getWebSocketUrl();
    if (webSocket1) webSocket1.close();
    // Bắt đầu kết nối
    webSocket1 = new WebSocket(wsUrl);
    // Khi kết nối thành công
    webSocket1.onopen = function () {
      console.log("✅ WebSocket connected");

      const joinObj = {
        event: "join_room",
        room: room,
        uid: pkg.email
      };
      webSocket1.send(JSON.stringify(joinObj));
    };

    // Khi nhận được tin nhắn
    webSocket1.onmessage = function (event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "game_result" && msg.data) {
          handleGameResult(msg.data, room); // Bạn cần định nghĩa hàm này ở nơi khác
        }
      } catch (e) {
        console.error("Lỗi xử lý message:", e);
      }
    };

    // Khi xảy ra lỗi
    webSocket1.onerror = function (err) {
      console.error("❌ WebSocket error:", err);
      if (btnFetch) btnFetch.textContent = 'Lấy kết quả';
    };

    // Khi bị đóng
    webSocket1.onclose = function (event) {
      console.log("❌ WebSocket closed:", event.reason);
      console.log("Reconnecting in 3s...");
      setTimeout(() => connectWebSocket(room, pkg), 3000);
    };

  } catch (e) {
    console.error(e);
    if (btnFetch) btnFetch.textContent = 'Lấy kết quả';
  }
}

async function handleGameResult(data, gatewayName) {
  isLoading = true;
  let dotCount = 0;

  // UI: reset trạng thái ban đầu
  resultEl.textContent = "Kết quả...";
  btnFetch.textContent = "Chờ kết quả...";

  // Bắt đầu cập nhật dấu chấm mỗi giây
  let dotUpdater = setInterval(() => {
    dotCount = (dotCount % 3) + 1;
    resultEl.textContent = "Kết quả" + ".".repeat(dotCount);
  }, 1000);

  const startTime = Date.now();

  try {
    const token = localStorage.getItem("accessToken");
    const deviceId = localStorage.getItem("deviceId");

    const body = {
      gateway: gatewayName,
      result: data.rs || 0,
      round_code: data.phien || 0
    };

    const res = await fetch(getUrl() + "/api/tool/use", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        "x-device-id": deviceId
      },
      body: JSON.stringify(body)
    });

    const elapsed = Date.now() - startTime;
    const delay = Math.max(6000 - elapsed, 0); // đảm bảo đủ 6 giây

    setTimeout(async () => {
      clearInterval(dotUpdater);
      isLoading = false;

      try {
        const resultJson = await res.json();
        const result = resultJson.result || "?";
        const turnsLeft = resultJson.turns_left || 0;
        const message = resultJson.message || "";

        // UI cập nhật
        localStorage.setItem("forcePackageStatusRefresh", "true");
        btnFetch.textContent = "Đã có kết quả";
        resultEl.textContent = "🎲 " + result;
        luotEl.textContent = "🎮 Còn " + turnsLeft + " lượt/ngày";

        if (turnsLeft <= 3 && turnsLeft > 0) {
          showAlert(`⚠️ Chỉ còn ${turnsLeft} lượt hôm nay`);
        }

        if (turnsLeft === 0) {
          showAlert(message);

        }
      } catch (err) {
        showAlert(err.message || "Lỗi xử lý kết quả", 'danger');
        btnFetch.textContent = "Lấy kết quả";
      }
    }, delay);

  } catch (err) {
    clearInterval(dotUpdater);
    isLoading = false;
    showAlert(err.message || "Lỗi gửi yêu cầu", 'danger');
    btnFetch.textContent = "Lấy kết quả";
  }
}
