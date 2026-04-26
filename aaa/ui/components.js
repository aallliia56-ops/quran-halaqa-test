export function buildMissionCard({
  title,
  tagClass,
  description,
  points,
  pendingText,
  buttonText,
  onClick,
  disabled = false,
}) {
  const card = document.createElement("div");
  card.className = `task-card ${tagClass}`;

  card.innerHTML = `
    <div class="task-header">
      <div class="task-title">${title}</div>
      <span class="task-type-tag ${tagClass}">
        ${tagClass === "hifz" ? "حفظ" : "مراجعة"}
      </span>
    </div>

    <div class="task-body mission-text">
      ${description}
    </div>

    <div class="task-footer">
      <span class="task-points-tag">النقاط: ${points}</span>
      <span class="task-status-text">${pendingText}</span>
    </div>
  `;

  const footer = card.querySelector(".task-footer");

  const btn = document.createElement("button");
  btn.className = "button success";
  btn.textContent = buttonText;

  if (disabled) {
    btn.disabled = true;
  } else {
    btn.addEventListener("click", onClick);
  }

  footer.appendChild(btn);

  return card;
}
