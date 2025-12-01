function initNotificationsPage() {
  const notiListEl = document.getElementById("notiList");
  const emptyMsg = document.getElementById("emptyMsg");
  const btnClearAll = document.getElementById("btnClearAll");

  let notiList = [];

  // ==============================
  // LOAD (SERVER → LOCAL → UI)
  // ==============================
  NotiSync.sync().then(list => {
    notiList = list;
    renderList();
    updateUnreadBadge();
  });

  // ==============================
  // RENDER UI
  // ==============================
  function renderList() {
    notiListEl.innerHTML = "";

    if (!notiList.length) {
      emptyMsg.style.display = "block";
      notiListEl.style.display = "none";
      return;
    }

    emptyMsg.style.display = "none";
    notiListEl.style.display = "block";

    notiList.forEach((n, index) => {
      const card = document.createElement("div");
      card.className =
        "card mb-2 noti-item border-0 shadow-sm " + (n.read ? "" : "unread");

      card.innerHTML = `
        <div class="card-body p-3 position-relative">
          ${!n.read ? `<span class="unread-dot"></span>` : ""}
          <div class="noti-title font-weight-bold">${n.title}</div>
          <div class="noti-message text-secondary small mt-1">${n.message}</div>
          <div class="noti-time text-muted small mt-2">${formatTime(n.time)}</div>

          <div class="text-right mt-3">
            <button class="btn btn-sm btn-outline-primary btn-view-detail"
                    data-index="${index}">
                👉 Xem chi tiết
            </button>
          </div>
        </div>
      `;

      notiListEl.appendChild(card);
    });

    $(".btn-view-detail").off("click").on("click", function () {
      const index = $(this).data("index");
      openDetail(index);
    });
  }

  // ==============================
  // DETAIL MODAL
  // ==============================
  function openDetail(index) {
    const n = notiList[index];
    if (!n) return;
    MarkReadQueue.add(n.id);
    n.read = true;
    NotiStorage.saveLocal(notiList);
    updateUnreadBadge();
    renderList(); // để remove chấm đỏ ngay lập tức

    const modalHtml = `
      <div class="modal fade" id="notiModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title">${n.title}</h6>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <p>${n.message}</p>
              <p class="text-muted small">${formatTime(n.time)}</p>
            </div>
            <div class="modal-footer">
              ${generateRedirectButton(n.screenRedirect, n.btnText)}
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Đóng</button>
            </div>
          </div>
        </div>
      </div>`;

    $("#notiModal").remove();
    $("body").append(modalHtml);
    $("#notiModal").modal("show");
  }

  // ==============================
  // CLEAR ALL
  // ==============================
  btnClearAll.addEventListener("click", () => {
    if (confirm("Bạn muốn xóa tất cả thông báo?")) {
      NotiStorage.clearLocal();
      notiList = [];
      updateUnreadBadge();
      renderList();
    }
  });
}

// FORMATTING
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("vi-VN") + " " +
         d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function generateRedirectButton(screen, btnText) {
  if (!screen) return "";
  const map = {
    tool: "/dashboard.html?page=tool",
    noti: "/dashboard.html?page=notifications",
    package: "/dashboard.html?page=packages",
    history: "/dashboard.html?page=history",
    account: "/dashboard.html?page=account",
    trial: "/dashboard.html?page=tooluse&gateway=Zon88&name=Zon 88"
  };
  const url = map[screen];
  if (!url) return "";
  return `<button class="btn btn-primary" onclick="handleNotiRedirect('${url}')">${btnText || "Đi đến trang"}</button>`;
}

function handleNotiRedirect(url) {
  $("#notiModal").modal("hide");
  setTimeout(() => window.location.href = url, 300);
}

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
    .noti-item.unread .noti-title {
      font-weight: bold;
    }
  `;
  document.head.appendChild(s);
}