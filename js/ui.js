function loadHeader() {
  $("#header").load("components/header.html");
}

function loadFooter() {
  $("#footer").load("components/footer.html");
}

function loadPage(pageName, params = {}) {
  // Tạo query string nếu có params
  let query = '';
  const keys = Object.keys(params);

  if (keys.length > 0) {
    query = '?' + keys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  }

  const fullPath = `pages/${pageName}.html${query}`;

  // Tải file HTML vào #content
  $('#content').load(fullPath, function (response, status) {
    if (status === "success") {
      setPageTitleByFile(pageName + ".html", params);

      // ✅ Gọi init tương ứng
      switch (pageName) {
        case "tool":
          if (typeof initToolPage === "function") initToolPage();
          break;
        case "tooluse":
          if (typeof initToolUsePage === "function") initToolUsePage();
          break;
        case "notifications":
          if (typeof initNotificationsPage === "function") initNotificationsPage();
          break;
      }

    } else {
      $("#content").html("<p class='text-danger'>Không thể tải trang.</p>");
    }
  });

  // ✅ Cập nhật URL trình duyệt
  const newUrl = `dashboard.html?page=${pageName}${query ? '&' + query.slice(1) : ''}`;
  window.history.pushState({}, '', newUrl);
}
function showFloatingView(gatewayId, gatewayName) {
  $("#floating-title").text(gatewayName);
  $("#prediction-result").text("Kết quả: ?");
  $("#floating-view").fadeIn();
  $("#floating-view").attr("data-gateway", gatewayId);
}

// Nút đóng
$("#close-floating").on("click", () => {
  $("#floating-view").fadeOut();
});

function setPageTitle(title) {
  $("#page-title").text(title);
}

function setPageTitleByFile(path, params) {
  const map = {
    "tooluse.html": "🤖 Tool" + (params && params.name ? " " + params.name : ".ai"),
    "tool.html": "🤖 tool.ai",
    "notifications.html": "🔔 Thông báo",
    "packages.html": "👑 Nâng cấp",
    "account.html": "🔐 Tài khoản",
    "payment.html": "💳 Thanh toán",
    "history.html": "📜 Lịch sử giao dịch"
  };
  const filename = path.split('/').pop();
  document.title = map[filename] || "🤖 tool.ai";
  setPageTitle(map[filename] || "🤖 tool.ai");
}
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        return await navigator.serviceWorker.register('/service-worker.js');
    }
}

function updateUnreadBadge() {
  const badge = document.getElementById("notiBadge");
  if (!badge) return;

  const notiList = JSON.parse(localStorage.getItem("notifications") || "[]");
  const unreadCount = notiList.filter(n => !n.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

// Gọi khi load footer xong
document.addEventListener("DOMContentLoaded", updateUnreadBadge);

navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data?.type === "PUSH_RECEIVED") {
    const noti = event.data.notification;
    const current = JSON.parse(localStorage.getItem("notifications") || "[]");
    current.unshift(noti);
    localStorage.setItem("notifications", JSON.stringify(current));
    updateUnreadBadge();
  }

  if (event.data?.type === "OPEN_NOTIFICATIONS_PAGE") {
    loadPage("notifications");
  }
});