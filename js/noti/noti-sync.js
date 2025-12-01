// ============================
// Notification Sync Manager
// ============================
const NotiSync = (() => {

    const API_LIST = "/api/noti/list";

    // Format server → client
    function mapServerItem(n) {
        return {
            id: n.id,
            title: n.title || "Thông báo",
            message: n.body || "",
            btnText: n.btn_text || "",
            screenRedirect: n.screen_redirect || "",
            time: n.created_at || new Date().toISOString(),
            read: !!n.is_read
        };
    }

    // Merge local + server
    function mergeLists(localList, serverMapped) {
        const merged = {};

        // Base từ local
        localList.forEach(n => {
            if (n.id) merged[n.id] = n;
        });

        // Override bằng server
        serverMapped.forEach(n => {
            const local = merged[n.id];
            merged[n.id] = {
                ...n,
                read: local?.read ? true : n.read
            };
        });

        // convert về array + sort mới nhất lên trước
        const arr = Object.values(merged);
        arr.sort((a, b) => new Date(b.time) - new Date(a.time));
        return arr;
    }

    // ===========================
    // MAIN: đồng bộ
    // ===========================
    async function sync() {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            return NotiStorage.getLocal();
        }

        // 1️⃣ Lấy queue mark-read từ local
        const readQueue = MarkReadQueue.getQueue();

        // 2️⃣ Nếu có → gửi batch trước khi sync
        if (readQueue.length > 0) {
            try {
                await fetch(getUrl() + "/api/noti/mark-read", {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + token,
                        "x-device-id": getDeviceId(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ids: readQueue })
                });

                console.log("📤 [Sync] Sent mark-read queue:", readQueue);

                // Xoá queue sau khi gửi thành công
                MarkReadQueue.popAll();

            } catch (e) {
                console.warn("⚠️ [Sync] Failed sending readQueue, retry next sync");
                // Không xoá queue → để lần sau retry
            }
        }

        // 3️⃣ Chuẩn bị URL API list
        let url = getUrl() + API_LIST;
        const lastSync = NotiStorage.getLastSync();
        if (lastSync) url += "?since=" + encodeURIComponent(lastSync);

        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token,
                    "x-device-id": getDeviceId()
                }
            });

            if (!res.ok) return NotiStorage.getLocal();

            const data = await res.json();
            const serverMapped = (data.notifications || []).map(mapServerItem);

            // 4️⃣ Lưu server_time
            if (data.server_time) {
                NotiStorage.setLastSync(data.server_time);
            }

            const localList = NotiStorage.getLocal();

            // 5️⃣ Merge dữ liệu mới
            const merged = mergeLists(localList, serverMapped);

            NotiStorage.saveLocal(merged);

            return merged;

        } catch (e) {
            console.error("[NotiSync] sync error:", e);
            return NotiStorage.getLocal();
        }
    }

    return { sync };

})();