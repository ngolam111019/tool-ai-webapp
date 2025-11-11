function initNotificationsPage() {
  const notiListEl = document.getElementById("notiList");
  const emptyMsg = document.getElementById("emptyMsg");
  const btnClearAll = document.getElementById("btnClearAll");

  if (!notiListEl) return;

  let notiList = JSON.parse(localStorage.getItem("notifications") || "[]");

  // =========================
  // RENDER DANH SÁCH
  // =========================
  function renderList() {
    notiListEl.innerHTML = "";
    if (!notiList.length) {
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    notiList.forEach((n, index) => {
      const div = document.createElement("div");
      div.className =
        "card mb-2 noti-item border-0 shadow-sm " + (n.read ? "" : "unread");
      div.innerHTML = `
        <div class="card-body p-3 position-relative">
          ${!n.read ? '<span class="unread-dot"></span>' : ""}
          <div class="noti-title font-weight-bold">${n.title || "Thông báo"}</div>
          <div class="noti-message text-secondary small mt-1">${n.message || ""}</div>
          <div class="noti-time text-muted small mt-2">${formatTime(n.time)}</div>

          <div class="text-right mt-3">
            <button class="btn btn-sm btn-outline-primary btn-view-detail"
                    data-index="${index}">
              👉 Xem chi tiết
            </button>
          </div>
        </div>
      `;
      notiListEl.appendChild(div);
    });

    // Gán sự kiện cho nút "Xem chi tiết"
    $(".btn-view-detail").on("click", function () {
      const index = $(this).data("index");
      openDetail(index);
    });
  }

  // =========================
  // MỞ CHI TIẾT THÔNG BÁO
  // =========================
  function openDetail(index) {
    const noti = notiList[index];
    if (!noti) return;

    // Đánh dấu đã đọc
    noti.read = true;
    localStorage.setItem("notifications", JSON.stringify(notiList));
    updateUnreadBadge();

    // Tạo popup hiển thị chi tiết
    const modalHtml = `
      <div class="modal fade" id="notiModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title">${noti.title || "Thông báo"}</h6>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <p>${noti.message || ""}</p>
              <p class="text-muted small mb-0">${formatTime(noti.time)}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Đóng</button>
              ${generateRedirectButton(noti.screenRedirect, noti.btnText)}
            </div>
          </div>
        </div>
      </div>
    `;

    // Xóa modal cũ (nếu có)
    $("#notiModal").remove();
    $("body").append(modalHtml);
    $("#notiModal").modal("show");
  }

  // =========================
  // TẠO NÚT ĐIỀU HƯỚNG
  // =========================
  function generateRedirectButton(screen, btnText) {
    if (!screen) return "";

    const map = {
      "tool": "/dashboard.html?page=tool",
      "noti": "/dashboard.html?page=notifications",
      "package": "/dashboard.html?page=packages",
      "history": "/dashboard.html?page=history",
      "account": "/dashboard.html?page=account",
      "trial": "/dashboard.html?page=tooluse&gateway=Zon88&name=Zon%2088"
    };

    const redirectUrl = map[screen] || null;
    if (!redirectUrl) return "";

    return `<button class="btn btn-primary" onclick="handleNotiRedirect('${redirectUrl}')">${btnText || "Đi đến trang"}</button>`;
  }

  // =========================
  // NÚT XÓA TẤT CẢ
  // =========================
  btnClearAll.addEventListener("click", () => {
    if (confirm("Bạn có chắc muốn xóa tất cả thông báo?")) {
      localStorage.removeItem("notifications");
      notiList = [];
      updateUnreadBadge();
      renderList();
    }
  });

  renderList();
  updateUnreadBadge();
}

// =========================
// XỬ LÝ ĐIỀU HƯỚNG SAU KHI NHẤN
// =========================
function handleNotiRedirect(url) {
  $("#notiModal").modal("hide");
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// =========================
// HỖ TRỢ HIỂN THỊ THỜI GIAN
// =========================
function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("vi-VN") +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

// =========================
// CSS CHẤM ĐỎ
// =========================
if (!document.getElementById("notif-style")) {
  const s = document.createElement("style");
  s.id = "notif-style";
  s.textContent = `
    .unread-dot {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 8px;
      height: 8px;
      background-color: red;
      border-radius: 50%;
    }
  `;
  document.head.appendChild(s);
}