import { getCurrentMurajaaMission, getCurrentHifzMission } from "../../core/missions.js";
import { buildMissionCard } from "../components.js";
import {
  HIFZ_AWAITING_NOMINATION_STATUS,
  HIFZ_NOMINATED_FOR_TEST_STATUS,
  HIFZ_TEST_FAILED_STATUS,
  getStudentHifzStatus,
} from "../../modules/curriculum/curriculum-runtime.js";

export function getStudentHifzPauseCardCopy(student) {
  const hifzStatus = getStudentHifzStatus(student);

  if (hifzStatus === HIFZ_AWAITING_NOMINATION_STATUS) {
    return {
      body: "اكتملت المرحلية الحالية، والحفظ متوقف حتى يتم ترشيحك للاختبار.",
      status: "بانتظار ترشيح المعلم للاختبار",
    };
  }

  if (hifzStatus === HIFZ_NOMINATED_FOR_TEST_STATUS) {
    return {
      body: "تم ترشيحك للاختبار، والحفظ متوقف حتى يتم التعامل مع نتيجة الاختبار.",
      status: "أنت الآن ضمن مسار الاختبار",
    };
  }

  if (hifzStatus === HIFZ_TEST_FAILED_STATUS) {
    return {
      body: "الحفظ متوقف مؤقتًا حتى يُعاد تحديد وضعك بعد نتيجة الاختبار.",
      status: "بانتظار الإجراء التالي بعد الاختبار",
    };
  }

  return {
    body: "بانتظار تحديث حالة الحفظ.",
    status: "الحفظ متوقف مؤقتًا",
  };
}

function bindAsyncTaskButton(button, loadingText, action) {
  button.addEventListener("click", async () => {
    if (button.disabled) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;

    try {
      await action();
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });
}

function buildFlexibleHifzDescription(hifzMission, pendingFlex) {
  return `
    <div style="font-weight:800">${hifzMission.surah_name_ar}</div>
    <div>من آية: <strong>${hifzMission.startAyah}</strong></div>
    <div style="margin-top:6px">
      ${
        pendingFlex
          ? `إلى آية: <strong>${pendingFlex.flex_end_ayah}</strong>`
          : `إلى آية:
      <select id="flex-end-ayah" style="padding:6px;border-radius:10px">
        ${Array.from(
          { length: hifzMission.endAyahMax - hifzMission.startAyah + 1 },
          (_, k) => {
            const v = hifzMission.startAyah + k;
            return `<option value="${v}">${v}</option>`;
          }
        ).join("")}
      </select>`
      }
    </div>
  `;
}

export function renderStudentTasks(student, actions) {
  const studentTasksDiv = document.querySelector("#student-tasks");
  studentTasksDiv.innerHTML = "";
  const tasksArray = Array.isArray(student.tasks) ? student.tasks : [];
  const wrap = document.createElement("div");

  const hifzPaused = !!student.pause_hifz;
  const murajaaPaused = !!student.pause_murajaa;
  const hifzStatus = getStudentHifzStatus(student);
  const isAwaitingHifzTest = [
    HIFZ_AWAITING_NOMINATION_STATUS,
    HIFZ_NOMINATED_FOR_TEST_STATUS,
    HIFZ_TEST_FAILED_STATUS,
  ].includes(hifzStatus);

  const hifzMission = !hifzPaused && !isAwaitingHifzTest ? getCurrentHifzMission(student) : null;

  if (hifzMission) {
    if (hifzMission.mode === "flexible") {
      const pendingFlex = tasksArray.find(
        (t) =>
          t.type === "hifz_flexible" &&
          (t.status === "pending" || t.status === "pending_assistant") &&
          t.flex_surah_number === hifzMission.surah_number &&
          t.flex_start_ayah === hifzMission.startAyah
      );

      const isAssistantPending = pendingFlex && pendingFlex.status === "pending_assistant";

      const pendingText = pendingFlex
        ? isAssistantPending
          ? "قيد المراجعة لدى المساعد..."
          : "قيد المراجعة لدى المعلم..."
        : "";
      const buttonText = pendingFlex
        ? isAssistantPending
          ? "قيد المراجعة"
          : "إلغاء الإرسال"
        : "أنجزت المهمة";

      const card = buildMissionCard({
        title: "مهمة الحفظ (منهج مرن)",
        tagClass: "hifz",
        description: buildFlexibleHifzDescription(hifzMission, pendingFlex),
        points: hifzMission.points,
        pendingText,
        buttonText,
        disabled: !!isAssistantPending,
        onClick: () => {},
      });

      if (!isAssistantPending) {
        const originalButton = card.querySelector(".button.success");
        const asyncButton = originalButton.cloneNode(true);
        originalButton.replaceWith(asyncButton);

        if (pendingFlex) {
          bindAsyncTaskButton(asyncButton, "إلغاء", () =>
            actions.cancelCurriculumTask(student.code, "hifz_flexible", pendingFlex.id)
          );
        } else {
          bindAsyncTaskButton(asyncButton, "إرسال", async () => {
            const endAyah = parseInt(card.querySelector("#flex-end-ayah").value, 10);
            await actions.submitFlexibleHifzTask(student.code, hifzMission, endAyah);
          });
        }
      }

      wrap.appendChild(card);
    } else {
      const pendingCurriculumTask = tasksArray.find(
        (t) =>
          t.type === "hifz" &&
          (t.status === "pending" || t.status === "pending_assistant") &&
          t.mission_start === hifzMission.startIndex
      );

      const isAssistantPending =
        pendingCurriculumTask && pendingCurriculumTask.status === "pending_assistant";

      wrap.appendChild(
        buildMissionCard({
          title: "مهمة الحفظ",
          tagClass: "hifz",
          description: hifzMission.display_text || hifzMission.description,
          points: hifzMission.points,
          pendingText: pendingCurriculumTask
            ? isAssistantPending
              ? "قيد المراجعة لدى المساعد..."
              : "قيد المراجعة لدى المعلم..."
            : "",
          buttonText: pendingCurriculumTask
            ? isAssistantPending
              ? "قيد المراجعة"
              : "إلغاء الإرسال"
            : "أنجزت المهمة",
          disabled: !!pendingCurriculumTask && isAssistantPending,
          onClick: () =>
            pendingCurriculumTask
              ? !isAssistantPending &&
                actions.cancelCurriculumTask(student.code, "hifz", hifzMission.startIndex)
              : actions.submitCurriculumTask(student.code, hifzMission),
        })
      );
    }
  }

  const murMission = !murajaaPaused ? getCurrentMurajaaMission(student) : null;

  if (murMission) {
    const pendingMurTask = tasksArray.find(
      (t) =>
        t.type === "murajaa" &&
        (t.status === "pending" || t.status === "pending_assistant") &&
        t.murajaa_index === murMission.index &&
        t.murajaa_level === murMission.level
    );

    const isAssistantPending = pendingMurTask && pendingMurTask.status === "pending_assistant";

    wrap.appendChild(
      buildMissionCard({
        title: "مهمة المراجعة",
        tagClass: "murajaa",
        description: murMission.description,
        points: murMission.points,
        pendingText: pendingMurTask
          ? isAssistantPending
            ? "قيد المراجعة لدى المساعد..."
            : "قيد المراجعة لدى المعلم..."
          : "",
        buttonText: pendingMurTask
          ? isAssistantPending
            ? "قيد المراجعة"
            : "إلغاء الإرسال"
          : "أنجزت المهمة",
        disabled: !!pendingMurTask && isAssistantPending,
        onClick: () =>
          pendingMurTask
            ? !isAssistantPending && actions.cancelMurajaaTask(student.code, murMission)
            : actions.submitMurajaaTask(student.code, murMission),
      })
    );
  }

  const generalTasks = tasksArray.filter((t) => t.type === "general" && t.status !== "completed");

  for (const task of generalTasks) {
    const card = document.createElement("div");
    card.className = "task-card general";
    card.innerHTML = `
      <div class="task-header">
        <div class="task-title">${task.description}</div>
        <span class="task-type-tag general">عامة</span>
      </div>
      <div class="task-body">مهمة عامة من المعلم.</div>
      <div class="task-footer">
        <span class="task-points-tag">النقاط: ${task.points}</span>
        <span class="task-status-text">${
          task.status === "pending"
            ? "قيد المراجعة لدى المعلم..."
            : task.status === "pending_assistant"
            ? "قيد المراجعة لدى المساعد..."
            : task.status === "completed"
            ? "تم اعتمادها"
            : "بانتظار الإنجاز"
        }</span>
      </div>
    `;

    const footer = card.querySelector(".task-footer");
    const btn = document.createElement("button");
    btn.className = "button success";

    if (task.status === "assigned") {
      btn.textContent = "أنجزت المهمة";
      btn.addEventListener("click", () => actions.submitGeneralTask(student.code, task.id));
    } else if (task.status === "pending") {
      btn.textContent = "إلغاء الإرسال";
      btn.addEventListener("click", () => actions.cancelGeneralTask(student.code, task.id));
    } else if (task.status === "pending_assistant") {
      btn.textContent = "قيد المراجعة";
      btn.disabled = true;
    } else {
      btn.textContent = "منجزة";
      btn.disabled = true;
    }

    footer.appendChild(btn);
    wrap.appendChild(card);
  }

  if (!hifzPaused && isAwaitingHifzTest) {
    const pauseCopy = getStudentHifzPauseCardCopy(student);
    const card = document.createElement("div");
    card.className = "task-card hifz";
    card.innerHTML = `
      <div class="task-header">
        <div class="task-title">مهمة الحفظ</div>
        <span class="task-type-tag hifz">حفظ</span>
      </div>
      <div class="task-body mission-text">${pauseCopy.body}</div>
      <div class="task-footer">
        <span class="task-points-tag">النقاط: —</span>
        <span class="task-status-text">${pauseCopy.status}</span>
      </div>
    `;
    wrap.prepend(card);
  }

  if (!hifzMission && !murMission && !hifzPaused && !murajaaPaused && generalTasks.length === 0 && !isAwaitingHifzTest) {
    studentTasksDiv.innerHTML = '<p class="message info">لا توجد مهام حالياً. وفقك الله.</p>';
  } else {
    studentTasksDiv.appendChild(wrap);
  }
}
