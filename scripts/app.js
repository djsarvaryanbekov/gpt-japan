function loadProgress() {
    let progress = localStorage.getItem("progress") || 30;
    document.getElementById("progress").style.width = progress + "%";
}

function changeProgress(value) {
    let progressElement = document.getElementById("progress");
    let currentProgress = parseInt(progressElement.style.width);
    let newProgress = Math.max(0, Math.min(100, currentProgress + value));
    progressElement.style.width = newProgress + "%";
    localStorage.setItem("progress", newProgress);
}

window.onload = loadProgress;
