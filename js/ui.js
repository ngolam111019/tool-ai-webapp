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
      setPageTitleByFile(pageName + ".html");
      if (pageName === 'tool') initToolPage();
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

function setPageTitleByFile(path) {
  const map = {
    "tool.html": "🤖 tool.ai",
    "packages.html": "👑 Nâng cấp",
    "account.html": "🔐 Tài khoản",
    "payment.html": "💳 Thanh toán",
    "history.html": "📜 Lịch sử giao dịch"
  };
  const filename = path.split('/').pop();
  setPageTitle(map[filename] || "🤖 tool.ai");
}
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        return await navigator.serviceWorker.register('/service-worker.js');
    }
}