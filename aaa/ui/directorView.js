import {
  DIRECTOR_TAB_IDS,
  DIRECTOR_DEFAULT_TAB_ID,
  buildDirectorTabDefinitions,
} from "../modules/director/director.config.js";
import { fetchDirectorDashboardData } from "../modules/director/director.service.js";
import {
  deleteDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { createHalaqaRecord } from "../modules/halaqas/halaqas.service.js";
import { PROGRAM_STATUSES } from "../modules/programs/program-engine.js";
import { saveDailyStreakProgramSettings } from "../modules/programs/programs.service.js";
import { getDailyApprovedTaskSubmissionsReport } from "../modules/reports/daily-task-submissions.report.js";
import { invalidateStudentsSnapshotCache } from "../modules/students/students.service.js";
import { createTeacherRecord } from "../modules/teachers/teachers.service.js";

const DIRECTOR_STUDENT_MODAL_STYLE_ID = "director-student-modal-styles";
const DIRECTOR_STUDENT_MODAL_ID = "director-student-modal";
const DIRECTOR_STUDENT_MODAL_BODY_ID = "director-student-modal-body";
const DIRECTOR_STUDENT_MODAL_FOOTER_ID = "director-student-modal-footer";
const DIRECTOR_HALAQA_MODAL_ID = "director-halaqa-modal";
const DIRECTOR_TEACHER_MODAL_ID = "director-teacher-modal";

let directorStudentFormHome = null;
let directorStudentFormTextSnapshot = null;
let directorHalaqasViewState = {
  teacherFilter: "",
  selectedHalaqaCode: "",
};
let directorAccountsViewState = {
  activeSection: "students",
  selectedStudentHalaqa: "",
  studentSearchQuery: "",
};
let directorReportsViewState = {
  period: "today",
  halaqaCode: "",
};

function getDirectorTabLabel(label) {
  const labelMap = {
    Overview: "نظرة عامة",
    Halaqas: "الحلقات",
    Accounts: "الحسابات",
    Reports: "التقارير",
    Settings: "الإعدادات",
  };

  return labelMap[label] || label;
}

function buildDirectorTabButtonsHtml(activeTabId = DIRECTOR_DEFAULT_TAB_ID) {
  return buildDirectorTabDefinitions()
    .map(
      (tab) => `
        <button
          class="tab-button${tab.id === activeTabId ? " active" : ""}"
          data-director-tab="${tab.id}"
        >
          ${getDirectorTabLabel(tab.label)}
        </button>
      `
    )
    .join("");
}

function buildDirectorSummaryCard(title, value) {
  return `
    <div class="director-stat-card">
      <div class="director-stat-label">${title}</div>
      <div class="director-stat-value">${value}</div>
    </div>
  `;
}

function buildDirectorSectionHeader(title, subtitle = "", actionHtml = "") {
  return `
    <div class="director-section-head">
      <div>
        <h3 class="director-section-title">${title}</h3>
        ${subtitle ? `<p class="director-section-subtitle">${subtitle}</p>` : ""}
      </div>
      ${actionHtml ? `<div class="director-section-actions">${actionHtml}</div>` : ""}
    </div>
  `;
}

function buildDirectorInlineMetric(label, value, tone = "neutral") {
  return `
    <div class="director-inline-metric director-inline-metric-${tone}">
      <span class="director-inline-metric-label">${label}</span>
      <strong class="director-inline-metric-value">${value}</strong>
    </div>
  `;
}

function getDirectorTodayAlertTone(absentCount) {
  return absentCount >= 5 ? "danger" : absentCount > 0 ? "warning" : "success";
}

function buildDirectorTodayAlert(absentCount = 0) {
  const tone = getDirectorTodayAlertTone(absentCount);
  const statusText = absentCount >= 5 ? "الغياب مرتفع اليوم" : absentCount > 0 ? "يوجد غياب يحتاج متابعة" : "الحضور مستقر اليوم";

  return `
    <section class="tasks-section director-section">
      <div class="director-today-alert director-today-alert-${tone}">
        <div class="director-today-alert-label">تنبيه اليوم</div>
        <div class="director-today-alert-main">
          <strong>${absentCount}</strong>
          <span>غياب اليوم</span>
        </div>
        <div class="director-today-alert-text">${statusText}</div>
      </div>
    </section>
  `;
}

function getDirectorHalaqaHealth(summary = {}) {
  const studentCount = Number(summary.studentCount || 0);
  const presentCount = Number(summary.presentTodayCount || 0);

  if (!studentCount) {
    return { tone: "warning", label: "متوسط" };
  }

  const ratio = presentCount / studentCount;
  if (ratio >= 0.75) {
    return { tone: "success", label: "نشط" };
  }
  if (ratio >= 0.4) {
    return { tone: "warning", label: "متوسط" };
  }

  return { tone: "danger", label: "ضعيف" };
}

function buildDirectorHalaqaSummaryItem(summary) {
  return `
    <div class="task-card">
      <div class="task-header">
        <div class="task-title">${summary.halaqa}</div>
        <span class="task-type-tag general">حلقة</span>
      </div>
      <div class="task-body mission-text" style="line-height:1.9">
        <div>الطلاب: <strong>${summary.studentCount}</strong></div>
        <div>الطلاب النشطين: <strong>${summary.activeStudentsCount}</strong></div>
        <div>مجموع النقاط: <strong>${summary.totalPoints}</strong></div>
      </div>
    </div>
  `;
}

function buildDirectorOverviewQuickActionsHtml() {
  return `
    <section class="tasks-section director-section director-quick-actions-section">
      ${buildDirectorSectionHeader("إجراءات سريعة")}
      <div class="director-surface-card director-actions-card">
        <div class="action-buttons director-quick-actions">
          <button id="director-open-halaqa-modal" class="button success">إضافة حلقة</button>
          <button id="director-open-student-modal" class="button primary">إضافة طالب</button>
          <button id="director-open-teacher-modal" class="button secondary">إضافة معلم</button>
        </div>
      </div>
    </section>
  `;
}

function buildDirectorStudentModalHtml() {
  return `
    <div id="${DIRECTOR_STUDENT_MODAL_ID}" class="hidden" aria-hidden="true">
      <div class="director-student-modal-backdrop" data-director-student-close></div>
      <div class="director-student-modal-dialog task-card" role="dialog" aria-modal="true" aria-labelledby="director-student-modal-title">
        <div class="task-header">
          <div>
            <div id="director-student-modal-title" class="task-title">إضافة طالب</div>
            <div class="subtitle" style="margin-top:.35rem;">نفس النموذج الحالي لكن داخل نافذة مرتبة ومريحة.</div>
          </div>
          <button type="button" class="button secondary" data-director-student-close>إلغاء</button>
        </div>
        <div id="${DIRECTOR_STUDENT_MODAL_BODY_ID}" class="director-student-modal-body"></div>
        <div id="${DIRECTOR_STUDENT_MODAL_FOOTER_ID}" class="director-student-modal-footer action-buttons">
          <button type="button" class="button secondary" data-director-student-close>إلغاء</button>
        </div>
      </div>
    </div>
  `;
}

function buildDirectorTeacherModalHtml(halaqaOptionsHtml = "") {
  return `
    <div id="${DIRECTOR_TEACHER_MODAL_ID}" class="hidden" aria-hidden="true">
      <div class="director-student-modal-backdrop" data-director-teacher-close></div>
      <div class="director-student-modal-dialog task-card" role="dialog" aria-modal="true" aria-labelledby="director-teacher-modal-title">
        <div class="task-header">
          <div>
            <div id="director-teacher-modal-title" class="task-title">إضافة معلم</div>
            <div class="subtitle" style="margin-top:.35rem;">أدخل بيانات المعلم وحدد الحلقة المرتبطة به.</div>
          </div>
          <button type="button" class="button secondary" data-director-teacher-close>إلغاء</button>
        </div>
        <div class="director-student-modal-body">
          <div class="form-section">
            <div class="input-group">
              <label for="director-teacher-code">رمز المعلم</label>
              <input id="director-teacher-code" type="text" placeholder="مثال: teacher-west" />
            </div>
            <div class="input-group">
              <label for="director-teacher-name">اسم المعلم</label>
              <input id="director-teacher-name" type="text" placeholder="مثال: أستاذ أحمد" />
            </div>
            <div class="input-group">
              <label for="director-teacher-halaqa">الحلقة</label>
              <select id="director-teacher-halaqa">${halaqaOptionsHtml}</select>
            </div>
          </div>
        </div>
        <div class="director-student-modal-footer action-buttons">
          <button id="director-save-teacher-button" type="button" class="button primary">حفظ المعلم</button>
          <button type="button" class="button secondary" data-director-teacher-close>إلغاء</button>
          <p id="director-teacher-message" class="message hidden"></p>
        </div>
      </div>
    </div>
  `;
}

function buildDirectorHalaqaModalHtml() {
  return `
    <div id="${DIRECTOR_HALAQA_MODAL_ID}" class="hidden" aria-hidden="true">
      <div class="director-student-modal-backdrop" data-director-halaqa-close></div>
      <div class="director-student-modal-dialog task-card" role="dialog" aria-modal="true" aria-labelledby="director-halaqa-modal-title">
        <div class="task-header">
          <div>
            <div id="director-halaqa-modal-title" class="task-title">إضافة حلقة</div>
            <div class="subtitle" style="margin-top:.35rem;">أدخل رمز الحلقة واسمها كما تريد أن يظهرا في لوحة المدير.</div>
          </div>
          <button type="button" class="button secondary" data-director-halaqa-close>إلغاء</button>
        </div>
        <div class="director-student-modal-body">
          <div class="form-section">
            <div class="input-group">
              <label for="director-halaqa-code">رمز الحلقة</label>
              <input id="director-halaqa-code" type="text" placeholder="مثال: WEST" />
            </div>
            <div class="input-group">
              <label for="director-halaqa-label">اسم الحلقة</label>
              <input id="director-halaqa-label" type="text" placeholder="مثال: حلقة الغرب" />
            </div>
          </div>
        </div>
        <div class="director-student-modal-footer action-buttons">
          <button id="director-save-halaqa-button" type="button" class="button primary">حفظ الحلقة</button>
          <button type="button" class="button secondary" data-director-halaqa-close>إلغاء</button>
          <p id="director-halaqa-message" class="message hidden"></p>
        </div>
      </div>
    </div>
  `;
}

function buildDirectorPendingTestsHtml(overview = {}) {
  const items = Array.isArray(overview.nominatedHifzTests) ? overview.nominatedHifzTests : [];

  if (!items.length) {
    return `
      <section class="tasks-section director-section">
        ${buildDirectorSectionHeader("اختبارات الحفظ المرشحة")}
        <div class="director-surface-card">
          <p class="small-text muted" style="margin:0;">لا يوجد طلاب بانتظار إدخال نتيجة اختبار الآن.</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("اختبارات الحفظ المرشحة", "سجّل النتيجة لإكمال انتقال الطالب في المسار.")}
      <div class="director-card-grid">
        ${items.map((item) => `
          <div class="task-card director-surface-card">
            <div class="task-header">
              <div class="task-title">${item.name}</div>
              <span class="task-type-tag general">${item.halaqaLabel || "بدون حلقة"}</span>
            </div>
            <div class="task-body" style="line-height:1.9">
              <div>الرمز: <strong>${item.code}</strong></div>
            </div>
            <div class="action-buttons" style="margin-top:1rem;align-items:end;flex-wrap:wrap;">
              <div class="input-group" style="margin:0;min-width:180px;">
                <label for="director-hifz-test-score-${item.code}">درجة الاختبار</label>
                <input
                  id="director-hifz-test-score-${item.code}"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="من 100"
                  data-director-hifz-test-score="${item.code}"
                />
              </div>
              <button class="button success" data-director-hifz-test-pass="${item.code}">نجاح</button>
              <button class="button danger" data-director-hifz-test-fail="${item.code}">رسوب</button>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function buildDirectorOverviewHtml(dashboardData) {
  const overview = dashboardData?.overview || {};
  const accounts = dashboardData?.accounts || {};
  const dailySummary = dashboardData?.dailySummary || {};
  const halaqaOptionsHtml = (accounts.halaqaOptions || [])
    .map((halaqa) => `<option value="${halaqa.code}">${halaqa.label}</option>`)
    .join("");

  return `
    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("نظرة سريعة")}
      <div class="director-stats-grid">
        ${buildDirectorSummaryCard("عدد الحلقات", overview.totalHalaqas || 0)}
        ${buildDirectorSummaryCard("عدد الطلاب", overview.totalStudents || 0)}
        ${buildDirectorSummaryCard("عدد المعلمين", accounts.totalTeacherAccounts || 0)}
        <div class="director-stat-card director-stat-card-primary">
          <div class="director-stat-label">الحضور اليوم</div>
          <div class="director-stat-value">${dailySummary.presentTodayCount || 0}</div>
        </div>
        ${buildDirectorSummaryCard("المهام المعلقة", dailySummary.pendingTasksCount || 0)}
        ${buildDirectorSummaryCard("المهام المعتمدة اليوم", dailySummary.approvedTasksTodayCount || 0)}
      </div>
    </section>

    ${buildDirectorTodayAlert(dailySummary.absentTodayCount || 0)}

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("الوضع اليومي")}
      <div class="director-surface-card">
        <div class="director-inline-metrics-grid">
          ${buildDirectorInlineMetric("الحاضرون اليوم", dailySummary.presentTodayCount || 0, "success")}
          ${buildDirectorInlineMetric("الغائبون اليوم", dailySummary.absentTodayCount || 0, "danger")}
          ${buildDirectorInlineMetric("المهام المعلقة", dailySummary.pendingTasksCount || 0, "warning")}
          ${buildDirectorInlineMetric("المهام المعتمدة", dailySummary.approvedTasksTodayCount || 0, "info")}
        </div>
      </div>
    </section>

    ${buildDirectorOverviewQuickActionsHtml()}
    ${buildDirectorPendingTestsHtml(overview)}

    ${buildDirectorStudentModalHtml()}
    ${buildDirectorTeacherModalHtml(halaqaOptionsHtml)}
    ${buildDirectorHalaqaModalHtml()}
  `;
}

function buildDirectorSettingsListItem(title, value, tag = "إعداد") {
  return `
    <div class="task-card director-surface-card">
      <div class="task-header">
        <div class="task-title">${title}</div>
        <span class="task-type-tag general">${tag}</span>
      </div>
      <div class="task-body" style="line-height:1.9;text-align:right;">
        <div><strong>${value}</strong></div>
      </div>
    </div>
  `;
}

function buildDirectorSettingsRoleCard(roleItem) {
  const permissionsText = roleItem.permissions.length
    ? roleItem.permissions.join("، ")
    : "لا توجد صلاحيات معرفة.";

  return `
    <div class="task-card director-surface-card">
      <div class="task-header">
        <div class="task-title">${roleItem.role}</div>
        <span class="task-type-tag general">دور</span>
      </div>
      <div class="task-body" style="line-height:1.9;text-align:right;">
        <div>${permissionsText}</div>
      </div>
    </div>
  `;
}

function buildDirectorSettingsHtml(settings = {}) {
  const generalHtml = (settings.generalSettings || [])
    .map((item) => buildDirectorSettingsListItem(item.label, item.value))
    .join("");
  const rolesHtml = (settings.roleItems || [])
    .map(buildDirectorSettingsRoleCard)
    .join("");
  const adminHtml = (settings.adminItems || [])
    .map((item) => buildDirectorSettingsListItem(item.label, item.value, "إداري"))
    .join("");
  const dailyStreak = settings.dailyStreak || {};
  const isDailyStreakActive = dailyStreak.status === PROGRAM_STATUSES.ACTIVE;
  const holidayDateKeys = Array.isArray(dailyStreak.holidayDateKeys)
    ? dailyStreak.holidayDateKeys
    : [];
  const holidaysListHtml = holidayDateKeys.length
    ? holidayDateKeys
      .map(
        (dateKey) => `
          <div class="task-card" style="padding:10px 12px;">
            <div class="task-header" style="gap:.75rem;">
              <div class="task-title">${dateKey}</div>
              <button
                type="button"
                class="button secondary"
                data-director-daily-streak-remove-holiday="${dateKey}"
                style="min-width:auto;padding:6px 10px;"
              >
                حذف
              </button>
            </div>
          </div>
        `
      )
      .join("")
    : '<p class="message info">لا توجد أيام إجازة مضافة حاليًا.</p>';

  return `
    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("الإعدادات العامة")}
      <div class="director-card-grid">
        ${generalHtml || '<p class="message info">لا توجد إعدادات عامة معروضة حاليًا.</p>'}
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("الأدوار والصلاحيات")}
      <div class="director-card-grid">
        ${rolesHtml || '<p class="message info">لا توجد بيانات أدوار متاحة حاليًا.</p>'}
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("إعدادات إدارية")}
      <div class="director-card-grid">
        ${adminHtml || '<p class="message info">لا توجد عناصر إدارية معروضة حاليًا.</p>'}
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("برنامج الستريك اليومي")}
      <div class="task-card director-surface-card">
        <div class="task-header">
          <div class="task-title">التحكم السريع</div>
          <span class="task-type-tag general">ستريك</span>
        </div>
        <div class="task-body" style="line-height:1.9;text-align:right;">
          <div>الحالة الحالية: <strong>${isDailyStreakActive ? "نشط" : "متوقف"}</strong></div>
          <div class="grid-2" style="margin-top:1rem;align-items:end;">
            <div class="input-group" style="margin:0;">
              <label for="director-daily-streak-holiday-date">يوم الإجازة</label>
              <input id="director-daily-streak-holiday-date" type="date" />
            </div>
            <div class="action-buttons" style="margin:0;justify-content:flex-start;">
              <button
                id="director-daily-streak-add-holiday"
                type="button"
                class="button secondary"
              >
                إضافة اليوم
              </button>
            </div>
          </div>
          <div
            id="director-daily-streak-holidays-list"
            data-holiday-date-keys="${holidayDateKeys.join(",")}"
            style="margin-top:1rem;"
          >
            ${holidaysListHtml}
          </div>
        </div>
        <div class="action-buttons" style="margin-top:1rem;">
          <button
            id="director-daily-streak-toggle"
            type="button"
            class="button ${isDailyStreakActive ? "secondary" : "success"}"
            data-next-status="${isDailyStreakActive ? PROGRAM_STATUSES.PAUSED : PROGRAM_STATUSES.ACTIVE}"
            data-program-id="${dailyStreak.id || "daily_streak_1"}"
          >
            ${isDailyStreakActive ? "إيقاف البرنامج" : "تشغيل البرنامج"}
          </button>
          <button
            id="director-daily-streak-save-holidays"
            type="button"
            class="button primary"
            data-program-id="${dailyStreak.id || "daily_streak_1"}"
            data-program-status="${dailyStreak.status || PROGRAM_STATUSES.DRAFT}"
          >
            حفظ الإجازات
          </button>
        </div>
        <p id="director-daily-streak-message" class="message hidden"></p>
      </div>
    </section>
  `;
}

function buildDirectorAccountCodesList(title, codes = [], emptyMessage) {
  const content = codes.length
    ? codes.map((code) => `<span class="task-type-tag general">${code}</span>`).join(" ")
    : `<p class="message info">${emptyMessage}</p>`;

  return `
    <div class="task-card">
      <div class="task-header">
        <div class="task-title">${title}</div>
      </div>
      <div class="task-body mission-text" style="line-height:1.9">
        ${content}
      </div>
    </div>
  `;
}

function buildDirectorAccountsSectionTabsHtml(activeSection = "students") {
  const sections = [
    { id: "students", label: "الطلاب" },
    { id: "teachers", label: "المعلمون" },
    { id: "parents", label: "أولياء الأمور" },
    { id: "directors", label: "المديرون" },
  ];

  return sections
    .map(
      (section) => `
        <button
          type="button"
          class="student-tab-button${section.id === activeSection ? " active" : ""}"
          data-director-accounts-section="${section.id}"
        >
          ${section.label}
        </button>
      `
    )
    .join("");
}

function buildDirectorStudentAccountsListHtml(students = []) {
  return students
    .map(
      (student) => `
        <div class="task-card director-surface-card">
          <div class="task-header">
            <div class="task-title">${student.name}</div>
            <span class="task-type-tag general">${student.code}</span>
          </div>
          <div class="task-body" style="line-height:1.9;text-align:right;">
            <div>الحلقة: <strong>${student.halaqaLabel || "غير محددة"}</strong></div>
            <div>الحالة: <strong>${student.statusLabel || "غير محددة"}</strong></div>
          </div>
          <div class="action-buttons" style="margin-top:1rem;">
            <button
              type="button"
              class="button danger"
              data-director-delete-student="${student.code}"
              data-director-delete-student-name="${student.name || "طالب"}"
            >
              حذف الطالب
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function buildDirectorTeacherAccountsListHtml(teachers = []) {
  if (!teachers.length) {
    return '<p class="message info">لا توجد حسابات معلمين مربوطة بالحلقات حتى الآن.</p>';
  }

  return teachers
    .map(
      (teacher) => `
        <div class="task-card director-surface-card">
          <div class="task-header">
            <div class="task-title">${teacher.name}</div>
            <span class="task-type-tag general">${teacher.code}</span>
          </div>
          <div class="task-body" style="line-height:1.9;text-align:right;">
            <div>الحلقة: <strong>${teacher.halaqaLabel || "غير مربوط"}</strong></div>
            <div>الحالة: <strong>${teacher.statusLabel || "غير محددة"}</strong></div>
          </div>
          <div class="action-buttons" style="margin-top:1rem;">
            <button
              type="button"
              class="button danger"
              data-director-delete-teacher="${teacher.code}"
              data-director-delete-teacher-name="${teacher.name || "معلم"}"
            >
              حذف المعلم
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function buildDirectorParentAccountsListHtml(parents = []) {
  if (!parents.length) {
    return '<p class="message info">لا توجد بيانات أولياء أمور مستقلة أكثر من الربط الحالي داخل الطلاب.</p>';
  }

  return parents
    .map(
      (parent) => `
        <div class="task-card director-surface-card">
          <div class="task-header">
            <div class="task-title">${parent.name}</div>
            <span class="task-type-tag general">${parent.code}</span>
          </div>
          <div class="task-body" style="line-height:1.9;text-align:right;">
            <div>الطالب المرتبط: <strong>${parent.linkedStudentLabel || "غير مرتبط"}</strong></div>
          </div>
        </div>
      `
    )
    .join("");
}

function buildDirectorItemsListHtml(title, items = [], emptyMessage, detailLabel, detailKey = "statusLabel") {
  if (!items.length) {
    return `<p class="message info">${emptyMessage}</p>`;
  }

  return items
    .map(
      (item) => `
        <div class="task-card director-surface-card">
          <div class="task-header">
            <div class="task-title">${item.name}</div>
            <span class="task-type-tag general">${item.code}</span>
          </div>
          <div class="task-body" style="line-height:1.9;text-align:right;">
            <div>${detailLabel}: <strong>${item[detailKey] || "غير محدد"}</strong></div>
          </div>
        </div>
      `
    )
    .join("");
}

function buildDirectorAccountsSectionContentHtml(accounts, activeSection = "students") {
  if (activeSection === "teachers") {
    return buildDirectorTeacherAccountsListHtml(accounts.teacherItems || []);
  }

  if (activeSection === "parents") {
    return buildDirectorParentAccountsListHtml(accounts.parentItems || []);
  }

  if (activeSection === "directors") {
    return buildDirectorItemsListHtml(
      "المديرون",
      accounts.directorItems || [],
      "لا توجد حسابات مديرين معرفة.",
      "النوع"
    );
  }

  const studentItems = Array.isArray(accounts.studentItems) ? accounts.studentItems : [];
  const halaqaOptions = Array.isArray(accounts.halaqaOptions) ? accounts.halaqaOptions : [];
  const activeHalaqaCode = directorAccountsViewState.selectedStudentHalaqa || halaqaOptions[0]?.code || "";
  const searchQuery = (directorAccountsViewState.studentSearchQuery || "").trim().toLowerCase();
  const studentsForHalaqa = activeHalaqaCode
    ? studentItems.filter((student) => student.halaqaCode === activeHalaqaCode)
    : [];
  const filteredStudents = searchQuery
    ? studentsForHalaqa.filter((student) => String(student.name || "").toLowerCase().includes(searchQuery))
    : studentsForHalaqa;
  const halaqaOptionsHtml = halaqaOptions
    .map(
      (halaqa) => `
        <option value="${halaqa.code}"${halaqa.code === activeHalaqaCode ? " selected" : ""}>
          ${halaqa.label}
        </option>
      `
    )
    .join("");

  return `
    <div class="task-card director-surface-card" style="margin-bottom:1rem;">
      <div class="task-header">
        <div class="task-title">قائمة الطلاب</div>
        <span class="task-type-tag general">فلترة</span>
      </div>
      <div class="task-body" style="text-align:right;">
        <div class="grid-2">
          <div class="input-group">
            <label for="director-students-halaqa-filter">اختر الحلقة</label>
            <select id="director-students-halaqa-filter">
              ${halaqaOptionsHtml}
            </select>
          </div>
          <div class="input-group">
            <label for="director-students-search">بحث داخل الحلقة</label>
            <input
              id="director-students-search"
              type="text"
              value="${directorAccountsViewState.studentSearchQuery || ""}"
              placeholder="ابحث باسم الطالب"
            />
          </div>
        </div>
      </div>
    </div>

    ${
      !halaqaOptions.length
        ? '<p class="message info">لا توجد حلقات معرفة لعرض الطلاب حسب الحلقة.</p>'
        : !filteredStudents.length
          ? '<p class="message info">لا يوجد طلاب مطابقون للحلقة أو البحث الحالي.</p>'
          : buildDirectorStudentAccountsListHtml(filteredStudents)
    }
  `;
}

function buildDirectorAccountsHtml(accounts) {
  const halaqaOptionsHtml = (accounts.halaqaOptions || [])
    .map((halaqa) => `<option value="${halaqa.code}">${halaqa.label}</option>`)
    .join("");
  const activeSection = directorAccountsViewState.activeSection || "students";
  const sectionTabsHtml = buildDirectorAccountsSectionTabsHtml(activeSection);
  const sectionContentHtml = buildDirectorAccountsSectionContentHtml(accounts, activeSection);

  return `
    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("ملخص الحسابات")}
      <div class="director-stats-grid">
        ${buildDirectorSummaryCard("حسابات الطلاب", accounts.totalStudentAccounts)}
        ${buildDirectorSummaryCard("أولياء الأمور", accounts.totalParentAccounts)}
        ${buildDirectorSummaryCard("المعلمون", accounts.totalTeacherAccounts)}
        ${buildDirectorSummaryCard("المديرون", accounts.totalDirectorAccounts)}
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("إجراءات سريعة")}
      <div class="director-surface-card director-actions-card">
        <div class="action-buttons director-quick-actions">
          <button id="director-open-student-modal" class="button success">إضافة طالب</button>
          <button id="director-open-teacher-modal" class="button primary">إضافة معلم</button>
        </div>
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("قائمة الحسابات")}
      <div class="student-tabs director-subtabs" style="margin-bottom:1rem;">
        ${sectionTabsHtml}
      </div>
      <div class="director-card-grid director-accounts-list">
        ${sectionContentHtml}
      </div>
    </section>

    <div id="${DIRECTOR_STUDENT_MODAL_ID}" class="hidden" aria-hidden="true">
      <div class="director-student-modal-backdrop" data-director-student-close></div>
      <div class="director-student-modal-dialog task-card" role="dialog" aria-modal="true" aria-labelledby="director-student-modal-title">
        <div class="task-header">
          <div>
            <div id="director-student-modal-title" class="task-title">إضافة طالب</div>
            <div class="subtitle" style="margin-top:.35rem;">نفس النموذج الحالي لكن داخل نافذة مرتبة ومريحة.</div>
          </div>
          <button type="button" class="button secondary" data-director-student-close>إلغاء</button>
        </div>
        <div id="${DIRECTOR_STUDENT_MODAL_BODY_ID}" class="director-student-modal-body"></div>
        <div id="${DIRECTOR_STUDENT_MODAL_FOOTER_ID}" class="director-student-modal-footer action-buttons">
          <button type="button" class="button secondary" data-director-student-close>إلغاء</button>
        </div>
      </div>
    </div>

    <div id="${DIRECTOR_TEACHER_MODAL_ID}" class="hidden" aria-hidden="true">
      <div class="director-student-modal-backdrop" data-director-teacher-close></div>
      <div class="director-student-modal-dialog task-card" role="dialog" aria-modal="true" aria-labelledby="director-teacher-modal-title">
        <div class="task-header">
          <div>
            <div id="director-teacher-modal-title" class="task-title">إضافة معلم</div>
            <div class="subtitle" style="margin-top:.35rem;">أدخل بيانات المعلم وحدد الحلقة المرتبطة به.</div>
          </div>
          <button type="button" class="button secondary" data-director-teacher-close>إلغاء</button>
        </div>
        <div class="director-student-modal-body">
          <div class="form-section">
            <div class="input-group">
              <label for="director-teacher-code">رمز المعلم</label>
              <input id="director-teacher-code" type="text" placeholder="مثال: teacher-west" />
            </div>
            <div class="input-group">
              <label for="director-teacher-name">اسم المعلم</label>
              <input id="director-teacher-name" type="text" placeholder="مثال: أستاذ أحمد" />
            </div>
            <div class="input-group">
              <label for="director-teacher-halaqa">الحلقة</label>
              <select id="director-teacher-halaqa">${halaqaOptionsHtml}</select>
            </div>
          </div>
        </div>
        <div class="director-student-modal-footer action-buttons">
          <button id="director-save-teacher-button" type="button" class="button primary">حفظ المعلم</button>
          <button type="button" class="button secondary" data-director-teacher-close>إلغاء</button>
          <p id="director-teacher-message" class="message hidden"></p>
        </div>
      </div>
    </div>
  `;
}

function ensureDirectorStudentModalStyles() {
  if (document.getElementById(DIRECTOR_STUDENT_MODAL_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = DIRECTOR_STUDENT_MODAL_STYLE_ID;
  style.textContent = `
    #${DIRECTOR_STUDENT_MODAL_ID} {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    #${DIRECTOR_STUDENT_MODAL_ID}.hidden {
      display: none;
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-dialog {
      position: relative;
      width: min(760px, 100%);
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      overflow: hidden;
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-body {
      overflow-y: auto;
      padding-inline: 2px;
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-body .student-form {
      display: block;
      background: transparent;
      padding: 0;
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-body .student-form.hidden {
      display: none;
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-body .form-section {
      margin-bottom: .85rem;
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-body .input-group:last-child {
      margin-bottom: 0;
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-footer {
      justify-content: flex-end;
      align-items: center;
      gap: .75rem;
      border-top: 1px solid #e5e7eb;
      padding-top: 1rem;
      flex-wrap: wrap;
    }

    #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-footer .message {
      margin: 0;
      flex: 1 1 100%;
    }

    @media (max-width: 640px) {
      #${DIRECTOR_STUDENT_MODAL_ID} {
        padding: .75rem;
      }

      #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-dialog {
        width: 100%;
        max-height: calc(100vh - 1.5rem);
        padding: .9rem;
      }

      #${DIRECTOR_STUDENT_MODAL_ID} .director-student-modal-footer .button {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
}

function getDirectorStudentFormNodes() {
  return {
    modal: document.getElementById(DIRECTOR_STUDENT_MODAL_ID),
    modalBody: document.getElementById(DIRECTOR_STUDENT_MODAL_BODY_ID),
    modalFooter: document.getElementById(DIRECTOR_STUDENT_MODAL_FOOTER_ID),
    openButton: document.getElementById("director-open-student-modal"),
    formWrapper: document.getElementById("student-form-wrapper"),
    teacherOpenButton: document.getElementById("open-student-form"),
    teacherCloseButton: document.getElementById("close-student-form"),
    title: document.getElementById("student-form-title"),
    registerButton: document.getElementById("register-student-button"),
    registerMessage: document.getElementById("register-student-message"),
  };
}

function captureDirectorStudentFormHome(nodes) {
  if (!nodes.formWrapper || directorStudentFormHome) return;

  directorStudentFormHome = {
    parent: nodes.formWrapper.parentElement,
    nextSibling: nodes.formWrapper.nextSibling,
  };
}

function captureDirectorStudentFormTextSnapshot() {
  if (directorStudentFormTextSnapshot) return;

  const findText = (selector, fallback = "") => {
    const element = document.querySelector(selector);
    return element?.textContent?.trim() || fallback;
  };

  const details = Array.from(document.querySelectorAll("#student-form-wrapper details.form-section summary"));

  directorStudentFormTextSnapshot = {
    formTitle: findText("#student-form-title", "الطلاب"),
    registerButton: findText("#register-student-button", "حفظ بيانات الطالب"),
    summaries: details.map((summary) => summary.textContent.trim()),
    labels: {
      hifzStart: findText('label[for="new-student-hifz-start"]'),
      hifzEnd: findText('label[for="new-student-hifz-end"]'),
      hifzLevel: findText('label[for="new-student-hifz-level"]'),
    },
  };
}

function applyDirectorStudentFormUiCopy(nodes) {
  captureDirectorStudentFormTextSnapshot();

  if (nodes.title) {
    nodes.title.textContent = "إضافة طالب";
  }

  const summaries = nodes.formWrapper?.querySelectorAll("details.form-section summary") || [];
  if (summaries[0]) summaries[0].textContent = "البيانات الأساسية";
  if (summaries[1]) summaries[1].textContent = "خطة الحفظ";
  if (summaries[2]) summaries[2].textContent = "خطة المراجعة";
  if (summaries[3]) summaries[3].textContent = "بيانات ولي الأمر (اختياري)";

  const labelMap = [
    ['label[for="new-student-hifz-start"]', "بداية الحفظ"],
    ['label[for="new-student-hifz-end"]', "نهاية الحفظ"],
    ['label[for="new-student-hifz-level"]', "مستوى الحفظ"],
  ];

  labelMap.forEach(([selector, text]) => {
    const label = document.querySelector(selector);
    if (label) label.textContent = text;
  });

  if (nodes.registerButton) {
    nodes.registerButton.textContent = "حفظ الطالب";
  }
}

function restoreDirectorStudentFormUiCopy(nodes) {
  if (!directorStudentFormTextSnapshot) return;

  if (nodes.title) {
    nodes.title.textContent = directorStudentFormTextSnapshot.formTitle;
  }

  const summaries = nodes.formWrapper?.querySelectorAll("details.form-section summary") || [];
  directorStudentFormTextSnapshot.summaries.forEach((text, index) => {
    if (summaries[index]) summaries[index].textContent = text;
  });

  const labelRestoreMap = [
    ['label[for="new-student-hifz-start"]', directorStudentFormTextSnapshot.labels.hifzStart],
    ['label[for="new-student-hifz-end"]', directorStudentFormTextSnapshot.labels.hifzEnd],
    ['label[for="new-student-hifz-level"]', directorStudentFormTextSnapshot.labels.hifzLevel],
  ];

  labelRestoreMap.forEach(([selector, text]) => {
    const label = document.querySelector(selector);
    if (label && text) label.textContent = text;
  });

  if (nodes.registerButton) {
    nodes.registerButton.textContent = directorStudentFormTextSnapshot.registerButton;
  }
}

function mountStudentFormIntoDirectorModal(nodes) {
  if (!nodes.formWrapper || !nodes.modalBody || !nodes.modalFooter) return;

  captureDirectorStudentFormHome(nodes);
  applyDirectorStudentFormUiCopy(nodes);

  nodes.modalBody.appendChild(nodes.formWrapper);
  if (nodes.registerButton) nodes.modalFooter.prepend(nodes.registerButton);
  if (nodes.registerMessage) nodes.modalFooter.appendChild(nodes.registerMessage);
}

function restoreStudentFormToTeacherSection() {
  const nodes = getDirectorStudentFormNodes();
  if (!nodes.formWrapper || !directorStudentFormHome?.parent) return;

  if (nodes.registerButton) nodes.formWrapper.appendChild(nodes.registerButton);
  if (nodes.registerMessage) nodes.formWrapper.appendChild(nodes.registerMessage);

  if (directorStudentFormHome.nextSibling) {
    directorStudentFormHome.parent.insertBefore(nodes.formWrapper, directorStudentFormHome.nextSibling);
  } else {
    directorStudentFormHome.parent.appendChild(nodes.formWrapper);
  }

  restoreDirectorStudentFormUiCopy(nodes);
}

function closeDirectorStudentModal() {
  const nodes = getDirectorStudentFormNodes();

  if (nodes.teacherCloseButton) {
    nodes.teacherCloseButton.click();
  } else {
    nodes.formWrapper?.classList.add("hidden");
  }

  restoreStudentFormToTeacherSection();

  if (nodes.modal) {
    nodes.modal.classList.add("hidden");
    nodes.modal.setAttribute("aria-hidden", "true");
  }

  document.body.style.overflow = "";
}

function openDirectorStudentModal() {
  const nodes = getDirectorStudentFormNodes();
  if (!nodes.formWrapper || !nodes.modal || !nodes.modalBody || !nodes.modalFooter) return;

  if (nodes.teacherOpenButton) {
    nodes.teacherOpenButton.click();
  } else {
    nodes.formWrapper.classList.remove("hidden");
  }

  mountStudentFormIntoDirectorModal(nodes);
  nodes.modal.classList.remove("hidden");
  nodes.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function bindDirectorAccountsUi(runtimeActions = {}) {
  ensureDirectorStudentModalStyles();

  document.querySelectorAll("[data-director-accounts-section]").forEach((button) => {
    button.onclick = () => {
      directorAccountsViewState.activeSection = button.dataset.directorAccountsSection || "students";
      runtimeActions.renderCurrentTab?.();
    };
  });

  const studentHalaqaFilter = document.getElementById("director-students-halaqa-filter");
  if (studentHalaqaFilter) {
    if (!directorAccountsViewState.selectedStudentHalaqa) {
      directorAccountsViewState.selectedStudentHalaqa = studentHalaqaFilter.value || "";
    }

    studentHalaqaFilter.onchange = () => {
      directorAccountsViewState.selectedStudentHalaqa = studentHalaqaFilter.value || "";
      runtimeActions.renderCurrentTab?.();
    };
  }

  const studentSearchInput = document.getElementById("director-students-search");
  if (studentSearchInput) {
    studentSearchInput.oninput = () => {
      directorAccountsViewState.studentSearchQuery = studentSearchInput.value || "";
      runtimeActions.renderCurrentTab?.();
    };
  }

  document.querySelectorAll("[data-director-delete-student]").forEach((button) => {
    button.onclick = async () => {
      const studentCode = button.dataset.directorDeleteStudent || "";
      const studentName = button.dataset.directorDeleteStudentName || "الطالب";
      if (!studentCode) return;

      const confirmed = confirm(`هل أنت متأكد من حذف الطالب: ${studentName} (${studentCode})؟`);
      if (!confirmed) return;

      try {
        button.disabled = true;
        const studentRef = doc(runtimeActions.db, "students", studentCode);
        const snap = await getDoc(studentRef);
        if (!snap.exists()) {
          runtimeActions.showMessage?.(runtimeActions.authMessage, "الطالب غير موجود.", "error");
          return;
        }

        await deleteDoc(studentRef);
        invalidateStudentsSnapshotCache();
        runtimeActions.showMessage?.(runtimeActions.authMessage, "تم حذف الطالب بنجاح.", "success");
        await runtimeActions.run?.(DIRECTOR_TAB_IDS.ACCOUNTS);
      } catch (error) {
        runtimeActions.showMessage?.(
          runtimeActions.authMessage,
          `تعذر حذف الطالب: ${error.message}`,
          "error"
        );
      } finally {
        button.disabled = false;
      }
    };
  });

  document.querySelectorAll("[data-director-delete-teacher]").forEach((button) => {
    button.onclick = async () => {
      const teacherCode = button.dataset.directorDeleteTeacher || "";
      const teacherName = button.dataset.directorDeleteTeacherName || "المعلم";
      if (!teacherCode) return;

      const confirmed = confirm(`هل أنت متأكد من حذف المعلم: ${teacherName} (${teacherCode})؟`);
      if (!confirmed) return;

      try {
        button.disabled = true;
        const teacherRef = doc(runtimeActions.db, "teachers", teacherCode);
        const snap = await getDoc(teacherRef);
        if (!snap.exists()) {
          runtimeActions.showMessage?.(runtimeActions.authMessage, "المعلم غير موجود.", "error");
          return;
        }

        await deleteDoc(teacherRef);
        runtimeActions.showMessage?.(runtimeActions.authMessage, "تم حذف المعلم بنجاح.", "success");
        await runtimeActions.run?.(DIRECTOR_TAB_IDS.ACCOUNTS);
      } catch (error) {
        runtimeActions.showMessage?.(
          runtimeActions.authMessage,
          `تعذر حذف المعلم: ${error.message}`,
          "error"
        );
      } finally {
        button.disabled = false;
      }
    };
  });

  const nodes = getDirectorStudentFormNodes();
  if (!nodes.openButton || !nodes.modal) return;

  nodes.openButton.onclick = () => openDirectorStudentModal();

  nodes.modal.querySelectorAll("[data-director-student-close]").forEach((button) => {
    button.onclick = () => closeDirectorStudentModal();
  });

  nodes.modal.onkeydown = (event) => {
    if (event.key === "Escape") {
      closeDirectorStudentModal();
    }
  };
}

function getDirectorTeacherModalNodes() {
  return {
    modal: document.getElementById(DIRECTOR_TEACHER_MODAL_ID),
    openButton: document.getElementById("director-open-teacher-modal"),
    saveButton: document.getElementById("director-save-teacher-button"),
    codeInput: document.getElementById("director-teacher-code"),
    nameInput: document.getElementById("director-teacher-name"),
    halaqaInput: document.getElementById("director-teacher-halaqa"),
    message: document.getElementById("director-teacher-message"),
  };
}

function openDirectorTeacherModal() {
  const nodes = getDirectorTeacherModalNodes();
  if (!nodes.modal) return;

  if (nodes.codeInput) nodes.codeInput.value = "";
  if (nodes.nameInput) nodes.nameInput.value = "";
  if (nodes.message) {
    nodes.message.textContent = "";
    nodes.message.className = "message hidden";
  }

  nodes.modal.classList.remove("hidden");
  nodes.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  nodes.codeInput?.focus();
}

function closeDirectorTeacherModal() {
  const nodes = getDirectorTeacherModalNodes();
  if (!nodes.modal) return;

  nodes.modal.classList.add("hidden");
  nodes.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setDirectorTeacherMessage(message, type = "info") {
  const { message: messageNode } = getDirectorTeacherModalNodes();
  if (!messageNode) return;

  messageNode.textContent = message;
  messageNode.className = `message ${type}`;
}

function readDirectorTeacherFormInput() {
  const nodes = getDirectorTeacherModalNodes();

  return {
    code: nodes.codeInput?.value?.trim() || "",
    name: nodes.nameInput?.value?.trim() || "",
    halaqa: nodes.halaqaInput?.value || "",
  };
}

function bindDirectorTeacherUi(runtimeActions = {}) {
  const nodes = getDirectorTeacherModalNodes();
  if (!nodes.modal || !nodes.openButton || !nodes.saveButton) return;

  nodes.openButton.onclick = () => openDirectorTeacherModal();

  nodes.modal.querySelectorAll("[data-director-teacher-close]").forEach((button) => {
    button.onclick = () => closeDirectorTeacherModal();
  });

  nodes.modal.onkeydown = (event) => {
    if (event.key === "Escape") {
      closeDirectorTeacherModal();
    }
  };

  nodes.saveButton.onclick = async () => {
    const input = readDirectorTeacherFormInput();
    if (!input.code || !input.name || !input.halaqa) {
      setDirectorTeacherMessage("رمز المعلم واسمه والحلقة مطلوبة.", "error");
      return;
    }

    try {
      nodes.saveButton.disabled = true;
      await createTeacherRecord(runtimeActions.db, input);
      setDirectorTeacherMessage("تم حفظ المعلم بنجاح.", "success");
      await runtimeActions.run?.(DIRECTOR_TAB_IDS.ACCOUNTS);
      closeDirectorTeacherModal();
    } catch (error) {
      setDirectorTeacherMessage(`تعذر حفظ المعلم: ${error.message}`, "error");
    } finally {
      nodes.saveButton.disabled = false;
    }
  };
}

function bindDirectorOverviewUi(runtimeActions = {}) {
  bindDirectorAccountsUi(runtimeActions);
  bindDirectorTeacherUi(runtimeActions);
  bindDirectorHalaqaUi(runtimeActions);

  document.querySelectorAll("[data-director-hifz-test-pass], [data-director-hifz-test-fail]").forEach((button) => {
    button.onclick = async () => {
      const studentCode =
        button.dataset.directorHifzTestPass || button.dataset.directorHifzTestFail || "";
      const scoreInput = document.querySelector(`[data-director-hifz-test-score="${studentCode}"]`);
      const rawScore = scoreInput?.value ?? "";
      const passed = Boolean(button.dataset.directorHifzTestPass);

      button.disabled = true;
      try {
        await runtimeActions.approveStudentHifzPhaseTest?.({
          db: runtimeActions.db,
          studentCode,
          score: rawScore,
          passed,
          showMessage: runtimeActions.showMessage,
          authMessage: runtimeActions.authMessage,
        });
        await runtimeActions.run?.(DIRECTOR_TAB_IDS.OVERVIEW);
      } finally {
        button.disabled = false;
      }
    };
  });
}

function bindDirectorReportsUi(runtimeActions = {}) {
  const periodInput = document.getElementById("director-reports-period");
  const halaqaInput = document.getElementById("director-reports-halaqa");

  if (periodInput) {
    periodInput.onchange = () => {
      directorReportsViewState.period = periodInput.value || "today";
      runtimeActions.renderCurrentTab?.();
    };
  }

  if (halaqaInput) {
    halaqaInput.onchange = () => {
      directorReportsViewState.halaqaCode = halaqaInput.value || "";
      runtimeActions.renderCurrentTab?.();
    };
  }
}

function parseDirectorHolidayDateKeys(rawValue = "") {
  return String(rawValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getDirectorDailyStreakHolidayDateKeys() {
  const holidaysList = document.getElementById("director-daily-streak-holidays-list");
  return parseDirectorHolidayDateKeys(holidaysList?.dataset.holidayDateKeys || "");
}

function renderDirectorDailyStreakHolidayItems(dateKeys = []) {
  const holidaysList = document.getElementById("director-daily-streak-holidays-list");
  if (!holidaysList) return;

  holidaysList.dataset.holidayDateKeys = dateKeys.join(",");
  holidaysList.innerHTML = dateKeys.length
    ? dateKeys
      .map(
        (dateKey) => `
          <div class="task-card" style="padding:10px 12px;">
            <div class="task-header" style="gap:.75rem;">
              <div class="task-title">${dateKey}</div>
              <button
                type="button"
                class="button secondary"
                data-director-daily-streak-remove-holiday="${dateKey}"
                style="min-width:auto;padding:6px 10px;"
              >
                حذف
              </button>
            </div>
          </div>
        `
      )
      .join("")
    : '<p class="message info">لا توجد أيام إجازة مضافة حاليًا.</p>';
}

function setDirectorDailyStreakMessage(message, type = "info") {
  const messageNode = document.getElementById("director-daily-streak-message");
  if (!messageNode) return;

  messageNode.textContent = message;
  messageNode.className = `message ${type}`;
}

function bindDirectorSettingsUi(runtimeActions = {}) {
  const toggleButton = document.getElementById("director-daily-streak-toggle");
  const saveHolidaysButton = document.getElementById("director-daily-streak-save-holidays");
  const addHolidayButton = document.getElementById("director-daily-streak-add-holiday");
  const holidayDateInput = document.getElementById("director-daily-streak-holiday-date");
  const holidaysList = document.getElementById("director-daily-streak-holidays-list");

  if (addHolidayButton) {
    addHolidayButton.onclick = () => {
      const nextDateKey = String(holidayDateInput?.value || "").trim();
      if (!nextDateKey) {
        setDirectorDailyStreakMessage("اختر تاريخ يوم الإجازة أولًا.", "error");
        return;
      }

      const currentDateKeys = getDirectorDailyStreakHolidayDateKeys();
      if (currentDateKeys.includes(nextDateKey)) {
        setDirectorDailyStreakMessage("هذا اليوم مضاف بالفعل ضمن الإجازات.", "info");
        return;
      }

      const nextDateKeys = [...currentDateKeys, nextDateKey].sort();
      renderDirectorDailyStreakHolidayItems(nextDateKeys);
      if (holidayDateInput) {
        holidayDateInput.value = "";
      }
      setDirectorDailyStreakMessage("تمت إضافة يوم الإجازة إلى القائمة.", "success");
    };
  }

  holidaysList?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-director-daily-streak-remove-holiday]");
    if (!removeButton) return;

    const dateKeyToRemove = removeButton.dataset.directorDailyStreakRemoveHoliday || "";
    const nextDateKeys = getDirectorDailyStreakHolidayDateKeys()
      .filter((dateKey) => dateKey !== dateKeyToRemove);
    renderDirectorDailyStreakHolidayItems(nextDateKeys);
    setDirectorDailyStreakMessage("تم حذف يوم الإجازة من القائمة.", "success");
  });

  if (toggleButton) {
    toggleButton.onclick = async () => {
      try {
        toggleButton.disabled = true;
        await saveDailyStreakProgramSettings(runtimeActions.db, {
          id: toggleButton.dataset.programId || "daily_streak_1",
          status: toggleButton.dataset.nextStatus || PROGRAM_STATUSES.ACTIVE,
          holiday_date_keys: getDirectorDailyStreakHolidayDateKeys(),
        });
        setDirectorDailyStreakMessage("تم تحديث حالة برنامج الستريك.", "success");
        await runtimeActions.run?.(DIRECTOR_TAB_IDS.SETTINGS);
      } catch (error) {
        setDirectorDailyStreakMessage(`تعذر تحديث برنامج الستريك: ${error.message}`, "error");
      } finally {
        toggleButton.disabled = false;
      }
    };
  }

  if (saveHolidaysButton) {
    saveHolidaysButton.onclick = async () => {
      try {
        saveHolidaysButton.disabled = true;
        await saveDailyStreakProgramSettings(runtimeActions.db, {
          id: saveHolidaysButton.dataset.programId || "daily_streak_1",
          status: saveHolidaysButton.dataset.programStatus || PROGRAM_STATUSES.DRAFT,
          holiday_date_keys: getDirectorDailyStreakHolidayDateKeys(),
        });
        setDirectorDailyStreakMessage("تم حفظ أيام الإجازة بنجاح.", "success");
        await runtimeActions.run?.(DIRECTOR_TAB_IDS.SETTINGS);
      } catch (error) {
        setDirectorDailyStreakMessage(`تعذر حفظ أيام الإجازة: ${error.message}`, "error");
      } finally {
        saveHolidaysButton.disabled = false;
      }
    };
  }
}

function buildDirectorReportHighlightCard(title, value, subtitle = "") {
  return `
    <div class="task-card director-surface-card">
      <div class="task-header">
        <div class="task-title">${title}</div>
        <span class="task-type-tag general">تقرير</span>
      </div>
      <div class="task-body mission-text" style="line-height:1.9">
        <div style="font-size:1.35rem;font-weight:700;">${value}</div>
        ${subtitle ? `<div style="margin-top:.35rem;">${subtitle}</div>` : ""}
      </div>
    </div>
  `;
}

function getDirectorReportPeriodLabel(period) {
  const labels = {
    today: "اليوم",
    week: "الأسبوع",
    month: "الشهر",
  };

  return labels[period] || "اليوم";
}

function buildDirectorHalaqaListItem(summary, isExpanded = false) {
  const health = getDirectorHalaqaHealth(summary);

  return `
    <div class="task-card director-halaqa-card" style="padding:0;overflow:hidden;">
      <div
        class="task-header director-halaqa-card-header"
        style="padding:12px;cursor:pointer;"
        data-director-halaqa-details="${summary.code}"
        aria-expanded="${isExpanded ? "true" : "false"}"
      >
        <div>
          <div class="task-title">${summary.halaqa}</div>
          <div class="director-halaqa-quick-meta">
            <span>${summary.teacherName || "غير مربوط"}</span>
            <span>${summary.studentCount || 0} طالب</span>
            <span>حضور اليوم ${summary.presentTodayCount || 0}</span>
          </div>
        </div>
        <div class="director-halaqa-header-actions">
          <span class="director-health-badge director-health-badge-${health.tone}">${health.label}</span>
          <span class="task-type-tag general">${summary.code || "حلقة"}</span>
          <button
            type="button"
            class="button secondary"
            data-director-halaqa-details="${summary.code}"
            aria-label="${isExpanded ? "إخفاء التفاصيل" : "إظهار التفاصيل"}"
            style="min-width:42px;padding:6px 10px;line-height:1;"
          >
            ${isExpanded ? "▴" : "▾"}
          </button>
        </div>
      </div>
      <div
        class="task-body${isExpanded ? "" : " hidden"}"
        style="line-height:1.9;text-align:right;padding:0 12px 12px;"
      >
        <div class="director-inline-metrics-grid director-inline-metrics-compact">
          ${buildDirectorInlineMetric("المعلم", summary.teacherName || "غير مربوط")}
          ${buildDirectorInlineMetric("عدد الطلاب", summary.studentCount || 0)}
          ${buildDirectorInlineMetric("حضور اليوم", summary.presentTodayCount || 0, "success")}
          ${buildDirectorInlineMetric("مهام اليوم", summary.tasksTodayCount || 0, "info")}
        </div>
        <div class="action-buttons" style="margin-top:1rem;">
          <button
            type="button"
            class="button danger"
            data-director-delete-halaqa="${summary.code}"
            data-director-delete-halaqa-name="${summary.halaqa || "الحلقة"}"
          >
            حذف الحلقة
          </button>
        </div>
      </div>
    </div>
  `;
}

function buildDirectorReportsHtml(reports) {
  const dailyTaskReport = reports.dailyTaskSubmissionsReport || {
    dateKey: "",
    totalApprovedToday: 0,
    byType: {
      hifz: 0,
      murajaa: 0,
      hifz_flexible: 0,
      general: 0,
    },
    byHalaqa: {},
  };
  const activePeriod = directorReportsViewState.period || "today";
  const activeHalaqaCode = directorReportsViewState.halaqaCode || "";
  const halaqaLabelMap = Object.fromEntries(
    (reports.halaqaOptions || []).map((halaqa) => [halaqa.code, halaqa.label])
  );
  const halaqaOptionsHtml = (reports.halaqaOptions || [])
    .map(
      (halaqa) => `
        <option value="${halaqa.code}"${halaqa.code === activeHalaqaCode ? " selected" : ""}>
          ${halaqa.label}
        </option>
      `
    )
    .join("");
  const selectedRow = (reports.halaqaRows || []).find((row) => row.code === activeHalaqaCode) || null;
  const periodStats = selectedRow
    ? (selectedRow.periodStats?.[activePeriod] || {})
    : (reports.overallPeriodStats?.[activePeriod] || {});
  const visibleRows = activeHalaqaCode
    ? (selectedRow ? [selectedRow] : [])
    : (reports.halaqaRows || []);
  const halaqaRowsHtml = visibleRows.length
    ? visibleRows
      .map((row) => {
        const rowStats = row.periodStats?.[activePeriod] || {};
        return `
          <div class="task-card">
            <div class="task-header">
              <div class="task-title">${row.halaqa}</div>
              <span class="task-type-tag general">${getDirectorReportPeriodLabel(activePeriod)}</span>
            </div>
            <div class="task-body" style="line-height:1.9;text-align:right;">
              <div>عدد المهام: <strong>${rowStats.tasksSentCount || 0}</strong></div>
              <div>الحضور: <strong>${rowStats.attendanceCount || 0}</strong></div>
            </div>
          </div>
        `;
      })
      .join("")
    : '<p class="message info">لا توجد بيانات حلقات مطابقة للفلاتر الحالية.</p>';
  const dailyByHalaqaEntries = Object.entries(dailyTaskReport.byHalaqa || {});
  const topDailyHalaqaEntry = dailyByHalaqaEntries.reduce((topEntry, currentEntry) => {
    if (!topEntry || currentEntry[1] > topEntry[1]) {
      return currentEntry;
    }
    return topEntry;
  }, null);
  const topDailyHalaqaLabel = topDailyHalaqaEntry
    ? (halaqaLabelMap[topDailyHalaqaEntry[0]] || topDailyHalaqaEntry[0])
    : "لا توجد حلقة متصدرة اليوم";
  const dailyByHalaqaHtml = dailyByHalaqaEntries.length
    ? dailyByHalaqaEntries
      .map(([halaqaCode, count]) => buildDirectorInlineMetric(
        halaqaLabelMap[halaqaCode] || `حلقة ${halaqaCode}`,
        count,
        topDailyHalaqaEntry?.[0] === halaqaCode ? "success" : "info"
      ))
      .join("")
    : '<p class="message info">لا توجد مهام معتمدة اليوم حتى الآن. سيظهر التقرير هنا تلقائيًا عند اعتماد أول مهمة اليوم.</p>';

  return `
    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("تقرير اليوم من المهام", dailyTaskReport.dateKey ? `اعتمادًا على task_submissions ليوم ${dailyTaskReport.dateKey}` : "")}
      <div class="director-stats-grid">
        <div class="director-stat-card director-stat-card-primary">
          <div class="director-stat-label">إجمالي المهام المعتمدة اليوم</div>
          <div class="director-stat-value">${dailyTaskReport.totalApprovedToday || 0}</div>
        </div>
        ${buildDirectorSummaryCard("الحفظ", dailyTaskReport.byType?.hifz || 0)}
        ${buildDirectorSummaryCard("المراجعة", dailyTaskReport.byType?.murajaa || 0)}
        ${buildDirectorSummaryCard("الحفظ المرن", dailyTaskReport.byType?.hifz_flexible || 0)}
        ${buildDirectorSummaryCard("العامة", dailyTaskReport.byType?.general || 0)}
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("توزيع اليوم حسب الحلقة", topDailyHalaqaEntry ? `الأعلى نشاطًا اليوم: ${topDailyHalaqaLabel} (${topDailyHalaqaEntry[1]})` : "لا توجد بيانات نشاط لليوم حتى الآن")}
      <div class="director-surface-card">
        <div class="director-inline-metrics-grid">
          ${dailyByHalaqaHtml}
        </div>
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("التقرير")}
      <div class="task-card director-surface-card">
        <div class="task-body" style="text-align:right;">
          <div class="grid-2">
            <div class="input-group">
              <label for="director-reports-period">الفترة</label>
              <select id="director-reports-period">
                <option value="today"${activePeriod === "today" ? " selected" : ""}>اليوم</option>
                <option value="week"${activePeriod === "week" ? " selected" : ""}>أسبوع</option>
                <option value="month"${activePeriod === "month" ? " selected" : ""}>شهر</option>
              </select>
            </div>
            <div class="input-group">
              <label for="director-reports-halaqa">الحلقة</label>
              <select id="director-reports-halaqa">
                <option value="">جميع الحلقات</option>
                ${halaqaOptionsHtml}
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="tasks-section director-section">
      <div class="director-stats-grid">
        ${buildDirectorSummaryCard("المهام المرسلة", periodStats.tasksSentCount || 0)}
        ${buildDirectorSummaryCard("المهام المعتمدة", periodStats.tasksApprovedCount || 0)}
        ${buildDirectorSummaryCard("الطلاب النشطون", periodStats.activeStudentsCount || 0)}
        ${buildDirectorSummaryCard("الحضور خلال الفترة", periodStats.attendanceCount || 0)}
      </div>
    </section>

    <section class="tasks-section director-section">
      <div class="director-card-grid">
        ${buildDirectorReportHighlightCard(
          "النشاط",
          `${periodStats.tasksSentCount || 0} / ${periodStats.tasksApprovedCount || 0}`,
          "مرسلة / معتمدة"
        )}
        ${buildDirectorReportHighlightCard(
          "الحضور خلال الفترة",
          periodStats.attendanceCount || 0,
          `حسب نشاط ${getDirectorReportPeriodLabel(activePeriod)}`
        )}
      </div>
    </section>

    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("تفصيل الحلقات")}
      <div class="director-card-grid">
        ${halaqaRowsHtml}
      </div>
    </section>
  `;
}

function buildDirectorHalaqasHtml(halaqaData = {}) {
  const halaqaItems = Array.isArray(halaqaData?.items) ? halaqaData.items : [];
  const teacherOptions = Array.isArray(halaqaData?.teacherOptions) ? halaqaData.teacherOptions : [];
  const activeTeacherFilter = directorHalaqasViewState.teacherFilter || "";
  const filteredHalaqas = activeTeacherFilter
    ? halaqaItems.filter((item) => item.teacherName === activeTeacherFilter)
    : halaqaItems;
  const selectedHalaqa =
    filteredHalaqas.find((item) => item.code === directorHalaqasViewState.selectedHalaqaCode) || null;
  const halaqaSummaryHtml = filteredHalaqas.length
    ? filteredHalaqas
      .map((item) => buildDirectorHalaqaListItem(item, item.code === selectedHalaqa?.code))
      .join("")
    : '<p class="message info">لا توجد حلقات مطابقة للفلتر الحالي.</p>';
  const teacherOptionsHtml = teacherOptions
    .map(
      (teacher) => `
        <option value="${teacher.value}"${teacher.value === activeTeacherFilter ? " selected" : ""}>
          ${teacher.label}
        </option>
      `
    )
    .join("");

  return `
    <section class="tasks-section director-section">
      ${buildDirectorSectionHeader("الحلقات", "", '<button id="director-open-halaqa-modal" class="button success">إضافة حلقة</button>')}
      <div class="task-card director-surface-card">
        <div class="action-buttons" style="margin-top:1rem;justify-content:space-between;align-items:flex-end;gap:1rem;flex-wrap:wrap;">
          <div class="input-group" style="margin:0;min-width:220px;flex:1 1 220px;">
            <label for="director-halaqa-teacher-filter">فلترة حسب المعلم</label>
            <select id="director-halaqa-teacher-filter">
              <option value="">جميع المعلمين</option>
              ${teacherOptionsHtml}
            </select>
          </div>
        </div>
      </div>
    </section>

    <section class="tasks-section director-section">
      <div class="director-card-grid">
        ${halaqaSummaryHtml}
      </div>
    </section>

    ${buildDirectorHalaqaModalHtml()}
  `;
}

function getDirectorHalaqaModalNodes() {
  return {
    modal: document.getElementById(DIRECTOR_HALAQA_MODAL_ID),
    openButton: document.getElementById("director-open-halaqa-modal"),
    saveButton: document.getElementById("director-save-halaqa-button"),
    codeInput: document.getElementById("director-halaqa-code"),
    labelInput: document.getElementById("director-halaqa-label"),
    message: document.getElementById("director-halaqa-message"),
  };
}

function openDirectorHalaqaModal() {
  const nodes = getDirectorHalaqaModalNodes();
  if (!nodes.modal) return;

  if (nodes.codeInput) nodes.codeInput.value = "";
  if (nodes.labelInput) nodes.labelInput.value = "";
  if (nodes.message) {
    nodes.message.textContent = "";
    nodes.message.className = "message hidden";
  }

  nodes.modal.classList.remove("hidden");
  nodes.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  nodes.codeInput?.focus();
}

function closeDirectorHalaqaModal() {
  const nodes = getDirectorHalaqaModalNodes();
  if (!nodes.modal) return;

  nodes.modal.classList.add("hidden");
  nodes.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function readDirectorHalaqaFormInput() {
  const nodes = getDirectorHalaqaModalNodes();

  return {
    code: nodes.codeInput?.value?.trim() || "",
    label: nodes.labelInput?.value?.trim() || "",
  };
}

function setDirectorHalaqaMessage(message, type = "info") {
  const { message: messageNode } = getDirectorHalaqaModalNodes();
  if (!messageNode) return;

  messageNode.textContent = message;
  messageNode.className = `message ${type}`;
}

function bindDirectorHalaqaUi(runtimeActions = {}) {
  const nodes = getDirectorHalaqaModalNodes();
  const teacherFilterInput = document.getElementById("director-halaqa-teacher-filter");

  if (teacherFilterInput) {
    teacherFilterInput.onchange = () => {
      directorHalaqasViewState.teacherFilter = teacherFilterInput.value || "";
      directorHalaqasViewState.selectedHalaqaCode = "";
      runtimeActions.renderCurrentTab?.();
    };
  }

  document.querySelectorAll("[data-director-halaqa-details]").forEach((button) => {
    button.onclick = () => {
      const nextCode = button.dataset.directorHalaqaDetails || "";
      directorHalaqasViewState.selectedHalaqaCode =
        directorHalaqasViewState.selectedHalaqaCode === nextCode ? "" : nextCode;
      runtimeActions.renderCurrentTab?.();
    };
  });

  document.querySelectorAll("[data-director-delete-halaqa]").forEach((button) => {
    button.onclick = async (event) => {
      event.stopPropagation();
      const halaqaCode = button.dataset.directorDeleteHalaqa || "";
      const halaqaName = button.dataset.directorDeleteHalaqaName || "الحلقة";
      if (!halaqaCode) return;

      const confirmed = confirm(`هل أنت متأكد من حذف الحلقة: ${halaqaName} (${halaqaCode})؟`);
      if (!confirmed) return;

      try {
        button.disabled = true;
        const halaqaRef = doc(runtimeActions.db, "halaqas", halaqaCode);
        const snap = await getDoc(halaqaRef);
        if (!snap.exists()) {
          runtimeActions.showMessage?.(runtimeActions.authMessage, "الحلقة غير موجودة.", "error");
          return;
        }

        await deleteDoc(halaqaRef);
        directorHalaqasViewState.selectedHalaqaCode = "";
        runtimeActions.showMessage?.(runtimeActions.authMessage, "تم حذف الحلقة بنجاح.", "success");
        await runtimeActions.run?.(DIRECTOR_TAB_IDS.HALAQAS);
      } catch (error) {
        runtimeActions.showMessage?.(
          runtimeActions.authMessage,
          `تعذر حذف الحلقة: ${error.message}`,
          "error"
        );
      } finally {
        button.disabled = false;
      }
    };
  });

  if (!nodes.modal || !nodes.openButton || !nodes.saveButton) return;

  nodes.openButton.onclick = () => openDirectorHalaqaModal();

  nodes.modal.querySelectorAll("[data-director-halaqa-close]").forEach((button) => {
    button.onclick = () => closeDirectorHalaqaModal();
  });

  nodes.modal.onkeydown = (event) => {
    if (event.key === "Escape") {
      closeDirectorHalaqaModal();
    }
  };

  nodes.saveButton.onclick = async () => {
    const input = readDirectorHalaqaFormInput();
    if (!input.code || !input.label) {
      setDirectorHalaqaMessage("رمز الحلقة واسمها مطلوبان.", "error");
      return;
    }

    try {
      nodes.saveButton.disabled = true;
      await createHalaqaRecord(runtimeActions.db, input);
      setDirectorHalaqaMessage("تم حفظ الحلقة بنجاح.", "success");
      directorHalaqasViewState.selectedHalaqaCode = input.code;
      await runtimeActions.run?.(DIRECTOR_TAB_IDS.HALAQAS);
      closeDirectorHalaqaModal();
    } catch (error) {
      setDirectorHalaqaMessage(`تعذر حفظ الحلقة: ${error.message}`, "error");
    } finally {
      nodes.saveButton.disabled = false;
    }
  };
}

function ensureDirectorScreen() {
  let directorScreen = document.querySelector("#director-screen");
  if (directorScreen) return directorScreen;

  directorScreen = document.createElement("div");
  directorScreen.id = "director-screen";
  directorScreen.className = "container hidden";
  directorScreen.dir = "rtl";
  directorScreen.style.textAlign = "right";
  directorScreen.innerHTML = `
    <header class="dashboard-header">
      <div>
        <div>
          <h2 id="director-title">لوحة المدير</h2>
          <p id="director-subtitle" class="subtitle">نظرة عامة، الحلقات، الحسابات، التقارير، والبرامج</p>
        </div>
      </div>
      <div class="header-actions">
        <button id="director-logout-button" class="button danger">تسجيل الخروج</button>
      </div>
    </header>

    <nav id="director-tabs" class="tabs"></nav>
    <section class="tab-content-container">
      <div id="director-content" class="tab-content"></div>
    </section>
  `;

  document.body.appendChild(directorScreen);
  return directorScreen;
}

function renderDirectorDashboardShell(activeTabId = DIRECTOR_DEFAULT_TAB_ID) {
  const directorScreen = ensureDirectorScreen();
  const tabsContainer = directorScreen.querySelector("#director-tabs");
  const contentContainer = directorScreen.querySelector("#director-content");

  if (tabsContainer) {
    tabsContainer.innerHTML = buildDirectorTabButtonsHtml(activeTabId);
  }

  if (contentContainer) {
    contentContainer.innerHTML = '<p class="message info">جارٍ تحميل نظرة عامة المدير...</p>';
  }

  return {
    directorScreen,
    tabsContainer,
    contentContainer,
  };
}

function buildDirectorTabContentHtml(activeTabId, dashboardData) {
  if (activeTabId === DIRECTOR_TAB_IDS.HALAQAS) {
    return buildDirectorHalaqasHtml(dashboardData.halaqas);
  }

  if (activeTabId === DIRECTOR_TAB_IDS.SETTINGS) {
    return buildDirectorSettingsHtml(dashboardData.settings);
  }

  if (activeTabId === DIRECTOR_TAB_IDS.ACCOUNTS) {
    return buildDirectorAccountsHtml(dashboardData.accounts);
  }

  if (activeTabId === DIRECTOR_TAB_IDS.REPORTS) {
    return buildDirectorReportsHtml(dashboardData.reports);
  }

  return buildDirectorOverviewHtml(dashboardData);
}

function setActiveDirectorTab(tabsContainer, activeTabId) {
  tabsContainer?.querySelectorAll("[data-director-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.directorTab === activeTabId);
  });
}

function renderDirectorTabContent(contentContainer, activeTabId, dashboardData, runtimeActions = {}) {
  if (!contentContainer) return;

  closeDirectorStudentModal();
  closeDirectorHalaqaModal();
  closeDirectorTeacherModal();
  contentContainer.innerHTML = buildDirectorTabContentHtml(activeTabId, dashboardData);

  if (activeTabId === DIRECTOR_TAB_IDS.OVERVIEW) {
    bindDirectorOverviewUi(runtimeActions);
  }

  if (activeTabId === DIRECTOR_TAB_IDS.ACCOUNTS) {
    bindDirectorAccountsUi(runtimeActions);
    bindDirectorTeacherUi(runtimeActions);
  }

  if (activeTabId === DIRECTOR_TAB_IDS.HALAQAS) {
    bindDirectorHalaqaUi(runtimeActions);
  }

  if (activeTabId === DIRECTOR_TAB_IDS.REPORTS) {
    bindDirectorReportsUi(runtimeActions);
  }

  if (activeTabId === DIRECTOR_TAB_IDS.SETTINGS) {
    bindDirectorSettingsUi(runtimeActions);
  }
}

function bindDirectorTabButtons({ tabsContainer, contentContainer, getDashboardData, runtimeActions = {} }) {
  if (!tabsContainer) return;

  tabsContainer.onclick = (event) => {
    const tabButton = event.target.closest("[data-director-tab]");
    if (!tabButton) return;

    const activeTabId = tabButton.dataset.directorTab || DIRECTOR_DEFAULT_TAB_ID;
    runtimeActions.setActiveTab?.(activeTabId);
    setActiveDirectorTab(tabsContainer, activeTabId);
    renderDirectorTabContent(contentContainer, activeTabId, getDashboardData(), runtimeActions);
  };
}

export async function displayDirectorDashboard({
  db,
  hideAllScreens,
  onLogout,
  approveStudentHifzPhaseTest,
  showMessage,
  authMessage,
}) {
  const { directorScreen, tabsContainer, contentContainer } = renderDirectorDashboardShell();
  const logoutButton = directorScreen.querySelector("#director-logout-button");

  try {
    let dashboardData = await fetchDirectorDashboardData(db);
    dashboardData = {
      ...dashboardData,
      reports: {
        ...(dashboardData.reports || {}),
        dailyTaskSubmissionsReport: await getDailyApprovedTaskSubmissionsReport(db),
      },
    };
    let activeTabId = DIRECTOR_DEFAULT_TAB_ID;
    const runtimeActions = {
      db,
      approveStudentHifzPhaseTest,
      showMessage,
      authMessage,
      setActiveTab: (nextTabId) => {
        activeTabId = nextTabId;
      },
      renderCurrentTab: () => {
        renderDirectorTabContent(contentContainer, activeTabId, dashboardData, runtimeActions);
      },
      run: async (nextTabId = activeTabId) => {
        dashboardData = await fetchDirectorDashboardData(db);
        dashboardData = {
          ...dashboardData,
          reports: {
            ...(dashboardData.reports || {}),
            dailyTaskSubmissionsReport: await getDailyApprovedTaskSubmissionsReport(db),
          },
        };
        activeTabId = nextTabId;
        setActiveDirectorTab(tabsContainer, activeTabId);
        renderDirectorTabContent(contentContainer, activeTabId, dashboardData, runtimeActions);
      },
    };

    setActiveDirectorTab(tabsContainer, activeTabId);
    renderDirectorTabContent(contentContainer, activeTabId, dashboardData, runtimeActions);
    bindDirectorTabButtons({
      tabsContainer,
      contentContainer,
      getDashboardData: () => dashboardData,
      runtimeActions,
    });
    if (logoutButton) {
      logoutButton.onclick = () => onLogout?.();
    }

    hideAllScreens?.();
    directorScreen.classList.remove("hidden");
  } catch (error) {
    if (contentContainer) {
      contentContainer.innerHTML = `<p class="message error">تعذر تحميل لوحة المدير: ${error.message}</p>`;
    }
  }
}

export {
  ensureDirectorScreen,
  buildDirectorSettingsHtml,
  renderDirectorDashboardShell,
  buildDirectorOverviewHtml,
};
