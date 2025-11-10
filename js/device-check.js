function isIosDevice() {
  //return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  return true;
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator) && window.navigator.standalone;
}

function checkDeviceSupport() {
  // Nếu không phải iOS → chặn truy cập
  if (!isIosDevice()) {
    window.location.href = "unsupported.html";
    return false;
  }

  // Nếu là iOS nhưng chưa vào chế độ standalone → gợi ý add to home screen
  if (!isInStandaloneMode() && !localStorage.getItem('hideIosGuide')) {
    showAddToHomeScreenPrompt();
  }

  return true;
}

function showAddToHomeScreenPrompt() {
  const guide = document.createElement('div');
  guide.id = 'ios-install-guide';
  guide.innerHTML = `
    <div class="guide-overlay" style="
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.5);z-index:9999;
      display:flex;align-items:center;justify-content:center;
    ">
      <div class="guide-box" style="
        background:white;border-radius:12px;padding:20px;
        max-width:320px;text-align:center;
        box-shadow:0 4px 12px rgba(0,0,0,0.2);
      ">
        <h5>Thêm Tool AI ra Màn hình chính 📱</h5>
        <p>Nhấn biểu tượng <img src="/assets/share-icon.png" alt="Share" style="width:20px;vertical-align:middle;"> 
        sau đó chọn <strong>Thêm vào Màn hình chính</strong>.</p>
        <button id="closeGuide" class="btn btn-primary btn-sm mt-2">Đã hiểu</button>
      </div>
    </div>
  `;
  document.body.appendChild(guide);
  document.getElementById('closeGuide').onclick = () => {
    guide.remove();
    localStorage.setItem('hideIosGuide', '1');
  };
}

// Đảm bảo chạy sau khi DOM đã sẵn sàng
window.addEventListener('DOMContentLoaded', checkDeviceSupport);