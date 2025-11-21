function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}
function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

let toastTimeout;
function showToast(message, type="default") {
    const toast = document.getElementById("toast");
    toast.innerHTML = message;
    toast.className = "show";

    if (type === "error") toast.style.background = "#d9534f";
    else if (type === "success") toast.style.background = "#28a745";
    else toast.style.background = "#333";

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 2500);
}