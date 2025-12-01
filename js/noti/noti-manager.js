// ============================
// Mark Read Manager (Batch Mode)
// ============================
const MarkReadManager = (() => {

  let pending = new Set();
  let timer = null;
  const DELAY = 3000;
  const API_BATCH = "/api/noti/mark-read";

  function add(id) {
    if (!id) return;
    pending.add(id);
    console.log("pending.add(id): " + id);
    if (timer) clearTimeout(timer);
    timer = setTimeout(sendBatch, DELAY);
  }

  async function sendBatch() {
    if (!pending.size) return;

    const ids = [...pending];
    console.log("ids: "+ids);
    pending.clear();

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await fetch(getUrl() + API_BATCH, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "x-device-id": getDeviceId(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids })
      });

      console.log("📩 [Web] Sent Mark-Read Batch:", ids);
    } catch (e) {
      console.warn("⚠️ Mark-Read Batch Failed:", e);
      ids.forEach(id => pending.add(id)); // retry vòng sau
    }
  }

  return { add };

})();