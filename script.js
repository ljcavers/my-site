// Tiny heartbeat so you can confirm the live preview is current.
const status = document.getElementById("status");
if (status) {
  const t = new Date().toLocaleTimeString();
  status.textContent = `Live preview connected — loaded ${t}`;
}
