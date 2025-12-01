// ============================
// Notification Storage Manager
// ============================
const NotiStorage = (() => {

  return {

    getLocal() {
      try {
        const raw = localStorage.getItem(getKey()) || "[]";
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    },

    saveLocal(list) {
      localStorage.setItem(getKey(), JSON.stringify(list || []));
    },

    clearLocal() {
      localStorage.removeItem(getKey());
    },

    getLastSync() {
      try {
        return localStorage.getItem(getLastSyncKey());
      } catch (e) {
        return null;
      }
    },

    setLastSync(time) {
      if (time) {
        localStorage.setItem(getLastSyncKey(), time);
      }
    }
  };

})();