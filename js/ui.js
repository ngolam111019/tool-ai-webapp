function loadHeader() {
  $("#header").load("components/header.html");
}

function loadFooter() {
  $("#footer").load("components/footer.html", function () {
    initFooterMenu(); // gắn lại ripple + click sau khi footer được chèn vào
  });
}

function showLoader() {
  const loader = document.getElementById("page-loader");
  loader.classList.remove("d-none");
  setTimeout(() => loader.classList.add("active"), 10);
}

function hideLoader() {
  const loader = document.getElementById("page-loader");
  loader.classList.remove("active");
  setTimeout(() => loader.classList.add("d-none"), 300);
}

function loadPage(pageName, params = {}) {
  showLoader();
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
        case "payment-result":
          if (typeof initPaymentResultPage === "function") initPaymentResultPage();
          break;
      }
      hideLoader();

    } else {
      $("#content").html("<p class='text-danger'>Không thể tải trang.</p>");
      hideLoader();
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

  const notiList = JSON.parse(localStorage.getItem(getKey()) || "[]");
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

function initFooterMenu() {
  const buttons = document.querySelectorAll(".menu-btn");
  if (!buttons.length) return; // footer chưa load, thoát

  buttons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      // Hiệu ứng ripple
      const ripple = document.createElement("span");
      ripple.classList.add("ripple");
      this.appendChild(ripple);

      const rect = this.getBoundingClientRect();
      ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + "px";
      ripple.style.left = e.clientX - rect.left - rect.width / 2 + "px";
      ripple.style.top = e.clientY - rect.top - rect.height / 2 + "px";

      setTimeout(() => ripple.remove(), 600);

      // Active menu
      document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
      this.classList.add("active");

      // Gọi loadPage
      const page = this.getAttribute("data-page");
      if (page) loadPage(page);
    });

    btn.addEventListener("touchstart", () => btn.classList.add("pressed"));
    btn.addEventListener("touchend", () => btn.classList.remove("pressed"));
  });
}