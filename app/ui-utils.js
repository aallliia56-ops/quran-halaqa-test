function safeSetText(el, text = "") {
  if (el) el.textContent = text;
}

function safeSetWidth(el, pct = 0) {
  if (el) el.style.width = `${pct}%`;
}

function showMessage(el, msg, type = "info") {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden", "error", "success", "info");
  el.classList.add(type);
  setTimeout(() => el.classList.add("hidden"), 5000);
}

function hideElements(elements) {
  (Array.isArray(elements) ? elements : []).forEach((el) => {
    el?.classList.add("hidden");
  });
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export { safeSetText, safeSetWidth, showMessage, hideElements, generateUniqueId };
