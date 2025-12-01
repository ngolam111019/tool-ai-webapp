// ============================
// Read Queue Manager (LocalStorage Only)
// ============================
const MarkReadQueue = (() => {

  const KEY = "noti_read_queue";

  function getQueue() {
    try {
      const raw = localStorage.getItem(KEY) || "[]";
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveQueue(list) {
    localStorage.setItem(KEY, JSON.stringify(list || []));
  }

  // Add ID khi user click vào xem chi tiết
  function add(id) {
    if (!id) return;

    const q = getQueue();
    if (!q.includes(id)) {
      q.push(id);
      saveQueue(q);
      console.log("📌 [ReadQueue] added:", id);
    }
  }

  // Lấy toàn bộ và xoá
  function popAll() {
    const q = getQueue();
    saveQueue([]); // reset queue
    return q;
  }

  return {
    add,
    popAll,
    getQueue
  };

})();