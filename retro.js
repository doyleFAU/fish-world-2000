function updateRetroClock() {
  const el = document.getElementById("retro-clock");
  if (!el) return;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  el.textContent = `${hours}:${minutes}:${seconds}`;
}

updateRetroClock();
setInterval(updateRetroClock, 1000);
