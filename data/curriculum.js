/**
 * ملف: curriculum.js
 * يحتوي على كل التفاصيل المنهجية (مقاطع الآيات، المستويات، مهام المراجعة).
 * النقاط المعتمدة: الحفظ (5 نقاط) والمراجعة (3 نقاط) لجميع المستويات.
 * السور مرتبة ترتيباً عكسياً للحفظ (من الناس 114 إلى الأحقاف 46، ثم الفاتحة 1).
 */

// =========================================================================
// 1. SURAH_DETAILS: القائمة الشاملة لجميع مقاطع السور (مرتبة عكسياً للحفظ)
// =========================================================================

const SURAH_DETAILS = [
  // --- سورة الناس (114) ---
  { surah_number: 114, surah_name_ar: "الناس", start_ayah: 1, end_ayah: 6, page: 604 },
  // --- سورة الفلق (113) ---
  { surah_number: 113, surah_name_ar: "الفلق", start_ayah: 1, end_ayah: 5, page: 604 },
  // --- سورة الإخلاص (112) ---
  { surah_number: 112, surah_name_ar: "الإخلاص", start_ayah: 1, end_ayah: 4, page: 604 },
  // --- سورة المسد (111) ---
  { surah_number: 111, surah_name_ar: "المسد", start_ayah: 1, end_ayah: 5, page: 604 },
  // --- سورة النصر (110) ---
  { surah_number: 110, surah_name_ar: "النصر", start_ayah: 1, end_ayah: 3, page: 603 },
  // --- سورة الكافرون (109) ---
  { surah_number: 109, surah_name_ar: "الكافرون", start_ayah: 1, end_ayah: 6, page: 603 },
  // --- سورة الكوثر (108) ---
  { surah_number: 108, surah_name_ar: "الكوثر", start_ayah: 1, end_ayah: 3, page: 603 },
  // --- سورة الماعون (107) ---
  { surah_number: 107, surah_name_ar: "الماعون", start_ayah: 1, end_ayah: 7, page: 602 },
  // --- سورة قريش (106) ---
  { surah_number: 106, surah_name_ar: "قريش", start_ayah: 1, end_ayah: 4, page: 602 },
  // --- سورة الفيل (105) ---
  { surah_number: 105, surah_name_ar: "الفيل", start_ayah: 1, end_ayah: 5, page: 601 },
  // --- سورة الهمزة (104) ---
  { surah_number: 104, surah_name_ar: "الهمزة", start_ayah: 1, end_ayah: 9, page: 601 },
  // --- سورة العصر (103) ---
  { surah_number: 103, surah_name_ar: "العصر", start_ayah: 1, end_ayah: 3, page: 601 },
  // --- سورة التكاثر (102) ---
  { surah_number: 102, surah_name_ar: "التكاثر", start_ayah: 1, end_ayah: 8, page: 600 },
  // --- سورة القارعة (101) ---
  { surah_number: 101, surah_name_ar: "القارعة", start_ayah: 1, end_ayah: 11, page: 600 },
  // --- سورة العاديات (100) ---
  { surah_number: 100, surah_name_ar: "العاديات", start_ayah: 1, end_ayah: 11, page: 599 },
  // --- سورة الزلزلة (99) ---
  { surah_number: 99, surah_name_ar: "الزلزلة", start_ayah: 1, end_ayah: 8, page: 599 },
  // --- سورة البينة (98) ---
  { surah_number: 98, surah_name_ar: "البينة", start_ayah: 1, end_ayah: 3, page: 598 },
  { surah_number: 98, surah_name_ar: "البينة", start_ayah: 4, end_ayah: 5, page: 598 },
  { surah_number: 98, surah_name_ar: "البينة", start_ayah: 6, end_ayah: 8, page: 598 },
  // --- سورة القدر (97) ---
  { surah_number: 97, surah_name_ar: "القدر", start_ayah: 1, end_ayah: 5, page: 598 },
  // --- سورة العلق (96) ---
  { surah_number: 96, surah_name_ar: "العلق", start_ayah: 1, end_ayah: 8, page: 597 },
  { surah_number: 96, surah_name_ar: "العلق", start_ayah: 9, end_ayah: 19, page: 597 },
  // --- سورة التين (95) ---
  { surah_number: 95, surah_name_ar: "التين", start_ayah: 1, end_ayah: 8, page: 597 },
  // --- سورة الشرح (94) ---
  { surah_number: 94, surah_name_ar: "الشرح", start_ayah: 1, end_ayah: 8, page: 596 },
  // --- سورة الضحى (93) ---
  { surah_number: 93, surah_name_ar: "الضحى", start_ayah: 1, end_ayah: 11, page: 596 },
  // --- سورة الليل (92) ---
  { surah_number: 92, surah_name_ar: "الليل", start_ayah: 1, end_ayah: 10, page: 595 },
  { surah_number: 92, surah_name_ar: "الليل", start_ayah: 11, end_ayah: 21, page: 595 },
  // --- سورة الشمس (91) ---
  { surah_number: 91, surah_name_ar: "الشمس", start_ayah: 1, end_ayah: 15, page: 595 },
  // --- سورة البلد (90) ---
  { surah_number: 90, surah_name_ar: "البلد", start_ayah: 1, end_ayah: 10, page: 594 },
  { surah_number: 90, surah_name_ar: "البلد", start_ayah: 11, end_ayah: 20, page: 594 },
  // --- سورة الفجر (89) ---
  { surah_number: 89, surah_name_ar: "الفجر", start_ayah: 1, end_ayah: 10, page: 593 },
  { surah_number: 89, surah_name_ar: "الفجر", start_ayah: 11, end_ayah: 16, page: 593 },
  { surah_number: 89, surah_name_ar: "الفجر", start_ayah: 17, end_ayah: 22, page: 593 },
  { surah_number: 89, surah_name_ar: "الفجر", start_ayah: 23, end_ayah: 30, page: 593 },
  // --- سورة الغاشية (88) ---
  { surah_number: 88, surah_name_ar: "الغاشية", start_ayah: 1, end_ayah: 16, page: 592 },
  { surah_number: 88, surah_name_ar: "الغاشية", start_ayah: 17, end_ayah: 26, page: 592 },
  // --- سورة الأعلى (87) ---
  { surah_number: 87, surah_name_ar: "الأعلى", start_ayah: 1, end_ayah: 8, page: 591 },
  { surah_number: 87, surah_name_ar: "الأعلى", start_ayah: 9, end_ayah: 19, page: 591 },
  // --- سورة الطارق (86) ---
  { surah_number: 86, surah_name_ar: "الطارق", start_ayah: 1, end_ayah: 9, page: 590 },
  { surah_number: 86, surah_name_ar: "الطارق", start_ayah: 10, end_ayah: 17, page: 590 },
  // --- سورة البروج (85) ---
  { surah_number: 85, surah_name_ar: "البروج", start_ayah: 1, end_ayah: 8, page: 589 },
  { surah_number: 85, surah_name_ar: "البروج", start_ayah: 9, end_ayah: 11, page: 589 },
  { surah_number: 85, surah_name_ar: "البروج", start_ayah: 12, end_ayah: 22, page: 589 },
  // --- سورة الانشقاق (84) ---
  { surah_number: 84, surah_name_ar: "الانشقاق", start_ayah: 1, end_ayah: 9, page: 588 },
  { surah_number: 84, surah_name_ar: "الانشقاق", start_ayah: 10, end_ayah: 18, page: 588 },
  { surah_number: 84, surah_name_ar: "الانشقاق", start_ayah: 19, end_ayah: 25, page: 588 },
  // --- سورة المطففين (83) ---
  { surah_number: 83, surah_name_ar: "المطففين", start_ayah: 1, end_ayah: 9, page: 587 },
  { surah_number: 83, surah_name_ar: "المطففين", start_ayah: 10, end_ayah: 17, page: 587 },
  { surah_number: 83, surah_name_ar: "المطففين", start_ayah: 18, end_ayah: 28, page: 587 },
  { surah_number: 83, surah_name_ar: "المطففين", start_ayah: 29, end_ayah: 36, page: 587 },
  // --- سورة الانفطار (82) ---
  { surah_number: 82, surah_name_ar: "الانفطار", start_ayah: 1, end_ayah: 8, page: 587 },
  { surah_number: 82, surah_name_ar: "الانفطار", start_ayah: 9, end_ayah: 19, page: 587 },
  // --- سورة التكوير (81) ---
  { surah_number: 81, surah_name_ar: "التكوير", start_ayah: 1, end_ayah: 9, page: 586 },
  { surah_number: 81, surah_name_ar: "التكوير", start_ayah: 10, end_ayah: 18, page: 586 },
  { surah_number: 81, surah_name_ar: "التكوير", start_ayah: 19, end_ayah: 29, page: 586 },
  // --- سورة عبس (80) ---
  { surah_number: 80, surah_name_ar: "عبس", start_ayah: 1, end_ayah: 16, page: 585 },
  { surah_number: 80, surah_name_ar: "عبس", start_ayah: 17, end_ayah: 23, page: 585 },
  { surah_number: 80, surah_name_ar: "عبس", start_ayah: 24, end_ayah: 32, page: 585 },
  { surah_number: 80, surah_name_ar: "عبس", start_ayah: 33, end_ayah: 42, page: 585 },
  // --- سورة النازعات (79) ---
  { surah_number: 79, surah_name_ar: "النازعات", start_ayah: 1, end_ayah: 14, page: 583 },
  { surah_number: 79, surah_name_ar: "النازعات", start_ayah: 15, end_ayah: 25, page: 583 },
  { surah_number: 79, surah_name_ar: "النازعات", start_ayah: 26, end_ayah: 33, page: 583 },
  { surah_number: 79, surah_name_ar: "النازعات", start_ayah: 34, end_ayah: 46, page: 583 },
  // --- سورة النبأ (78) ---
  { surah_number: 78, surah_name_ar: "النبأ", start_ayah: 1, end_ayah: 11, page: 582 },
  { surah_number: 78, surah_name_ar: "النبأ", start_ayah: 12, end_ayah: 20, page: 582 },
  { surah_number: 78, surah_name_ar: "النبأ", start_ayah: 21, end_ayah: 30, page: 582 },
  { surah_number: 78, surah_name_ar: "النبأ", start_ayah: 31, end_ayah: 37, page: 582 },
  { surah_number: 78, surah_name_ar: "النبأ", start_ayah: 38, end_ayah: 40, page: 582 },
  // --- سورة المرسلات (77) ---
  { surah_number: 77, surah_name_ar: "المرسلات", start_ayah: 1, end_ayah: 15, page: 580 },
  { surah_number: 77, surah_name_ar: "المرسلات", start_ayah: 16, end_ayah: 24, page: 580 },
  { surah_number: 77, surah_name_ar: "المرسلات", start_ayah: 25, end_ayah: 28, page: 580 },
  { surah_number: 77, surah_name_ar: "المرسلات", start_ayah: 29, end_ayah: 34, page: 580 },
  { surah_number: 77, surah_name_ar: "المرسلات", start_ayah: 35, end_ayah: 40, page: 580 },
  { surah_number: 77, surah_name_ar: "المرسلات", start_ayah: 41, end_ayah: 50, page: 580 },
  // --- سورة الإنسان (76) ---
  { surah_number: 76, surah_name_ar: "الإنسان", start_ayah: 1, end_ayah: 5, page: 578 },
  { surah_number: 76, surah_name_ar: "الإنسان", start_ayah: 6, end_ayah: 12, page: 578 },
  { surah_number: 76, surah_name_ar: "الإنسان", start_ayah: 13, end_ayah: 18, page: 578 },
  { surah_number: 76, surah_name_ar: "الإنسان", start_ayah: 19, end_ayah: 23, page: 578 },
  { surah_number: 76, surah_name_ar: "الإنسان", start_ayah: 24, end_ayah: 28, page: 578 },
  { surah_number: 76, surah_name_ar: "الإنسان", start_ayah: 29, end_ayah: 31, page: 578 },
  // --- سورة القيامة (75) ---
  { surah_number: 75, surah_name_ar: "القيامة", start_ayah: 1, end_ayah: 10, page: 577 },
  { surah_number: 75, surah_name_ar: "القيامة", start_ayah: 11, end_ayah: 19, page: 577 },
  { surah_number: 75, surah_name_ar: "القيامة", start_ayah: 20, end_ayah: 33, page: 577 },
  { surah_number: 75, surah_name_ar: "القيامة", start_ayah: 34, end_ayah: 40, page: 577 },
  // --- سورة المدثر (74) ---
  { surah_number: 74, surah_name_ar: "المدثر", start_ayah: 1, end_ayah: 10, page: 575 },
  { surah_number: 74, surah_name_ar: "المدثر", start_ayah: 11, end_ayah: 18, page: 575 },
  { surah_number: 74, surah_name_ar: "المدثر", start_ayah: 19, end_ayah: 30, page: 575 },
  { surah_number: 74, surah_name_ar: "المدثر", start_ayah: 31, end_ayah: 41, page: 575 },
  { surah_number: 74, surah_name_ar: "المدثر", start_ayah: 42, end_ayah: 47, page: 575 },
  { surah_number: 74, surah_name_ar: "المدثر", start_ayah: 48, end_ayah: 56, page: 575 },
  // --- سورة المزمل (73) ---
  { surah_number: 73, surah_name_ar: "المزمل", start_ayah: 1, end_ayah: 8, page: 574 },
  { surah_number: 73, surah_name_ar: "المزمل", start_ayah: 9, end_ayah: 14, page: 574 },
  { surah_number: 73, surah_name_ar: "المزمل", start_ayah: 15, end_ayah: 19, page: 574 },
  { surah_number: 73, surah_name_ar: "المزمل", start_ayah: 20, end_ayah: 20, page: 574 },
  // --- سورة الجن (72) ---
  { surah_number: 72, surah_name_ar: "الجن", start_ayah: 1, end_ayah: 4, page: 572 },
  { surah_number: 72, surah_name_ar: "الجن", start_ayah: 5, end_ayah: 8, page: 572 },
  { surah_number: 72, surah_name_ar: "الجن", start_ayah: 9, end_ayah: 11, page: 572 },
  { surah_number: 72, surah_name_ar: "الجن", start_ayah: 12, end_ayah: 14, page: 572 },
  { surah_number: 72, surah_name_ar: "الجن", start_ayah: 15, end_ayah: 19, page: 572 },
  { surah_number: 72, surah_name_ar: "الجن", start_ayah: 20, end_ayah: 23, page: 572 },
  { surah_number: 72, surah_name_ar: "الجن", start_ayah: 24, end_ayah: 28, page: 572 },
  // --- سورة نوح (71) ---
  { surah_number: 71, surah_name_ar: "نوح", start_ayah: 1, end_ayah: 4, page: 570 },
  { surah_number: 71, surah_name_ar: "نوح", start_ayah: 5, end_ayah: 10, page: 570 },
  { surah_number: 71, surah_name_ar: "نوح", start_ayah: 11, end_ayah: 20, page: 570 },
  { surah_number: 71, surah_name_ar: "نوح", start_ayah: 21, end_ayah: 25, page: 570 },
  { surah_number: 71, surah_name_ar: "نوح", start_ayah: 26, end_ayah: 28, page: 570 },
  // --- سورة المعارج (70) ---
  { surah_number: 70, surah_name_ar: "المعارج", start_ayah: 1, end_ayah: 10, page: 568 },
  { surah_number: 70, surah_name_ar: "المعارج", start_ayah: 11, end_ayah: 18, page: 568 },
  { surah_number: 70, surah_name_ar: "المعارج", start_ayah: 19, end_ayah: 28, page: 568 },
  { surah_number: 70, surah_name_ar: "المعارج", start_ayah: 29, end_ayah: 35, page: 568 },
  { surah_number: 70, surah_name_ar: "المعارج", start_ayah: 36, end_ayah: 40, page: 568 },
  { surah_number: 70, surah_name_ar: "المعارج", start_ayah: 41, end_ayah: 44, page: 568 },
  // --- سورة الحاقة (69) ---
  { surah_number: 69, surah_name_ar: "الحاقة", start_ayah: 1, end_ayah: 8, page: 566 },
  { surah_number: 69, surah_name_ar: "الحاقة", start_ayah: 9, end_ayah: 18, page: 566 },
  { surah_number: 69, surah_name_ar: "الحاقة", start_ayah: 19, end_ayah: 24, page: 566 },
  { surah_number: 69, surah_name_ar: "الحاقة", start_ayah: 25, end_ayah: 35, page: 566 },
  { surah_number: 69, surah_name_ar: "الحاقة", start_ayah: 36, end_ayah: 43, page: 566 },
  { surah_number: 69, surah_name_ar: "الحاقة", start_ayah: 44, end_ayah: 52, page: 566 },
  // --- سورة القلم (68) ---
  { surah_number: 68, surah_name_ar: "القلم", start_ayah: 1, end_ayah: 9, page: 564 },
  { surah_number: 68, surah_name_ar: "القلم", start_ayah: 10, end_ayah: 16, page: 564 },
  { surah_number: 68, surah_name_ar: "القلم", start_ayah: 17, end_ayah: 27, page: 564 },
  { surah_number: 68, surah_name_ar: "القلم", start_ayah: 28, end_ayah: 33, page: 564 },
  { surah_number: 68, surah_name_ar: "القلم", start_ayah: 34, end_ayah: 42, page: 564 },
  { surah_number: 68, surah_name_ar: "القلم", start_ayah: 43, end_ayah: 47, page: 564 },
  { surah_number: 68, surah_name_ar: "القلم", start_ayah: 48, end_ayah: 52, page: 564 },
  // --- سورة الملك (67) ---
  { surah_number: 67, surah_name_ar: "الملك", start_ayah: 1, end_ayah: 5, page: 562 },
  { surah_number: 67, surah_name_ar: "الملك", start_ayah: 6, end_ayah: 12, page: 562 },
  { surah_number: 67, surah_name_ar: "الملك", start_ayah: 13, end_ayah: 19, page: 562 },
  { surah_number: 67, surah_name_ar: "الملك", start_ayah: 20, end_ayah: 26, page: 562 },
  { surah_number: 67, surah_name_ar: "الملك", start_ayah: 27, end_ayah: 30, page: 562 },
  // --- سورة التحريم (66) ---
  { surah_number: 66, surah_name_ar: "التحريم", start_ayah: 1, end_ayah: 3, page: 560 },
  { surah_number: 66, surah_name_ar: "التحريم", start_ayah: 4, end_ayah: 5, page: 560 },
  { surah_number: 66, surah_name_ar: "التحريم", start_ayah: 6, end_ayah: 7, page: 560 },
  { surah_number: 66, surah_name_ar: "التحريم", start_ayah: 8, end_ayah: 10, page: 560 },
  { surah_number: 66, surah_name_ar: "التحريم", start_ayah: 11, end_ayah: 12, page: 560 },
  // --- سورة الطلاق (65) ---
  { surah_number: 65, surah_name_ar: "الطلاق", start_ayah: 1, end_ayah: 2, page: 558 },
  { surah_number: 65, surah_name_ar: "الطلاق", start_ayah: 3, end_ayah: 5, page: 558 },
  { surah_number: 65, surah_name_ar: "الطلاق", start_ayah: 6, end_ayah: 9, page: 558 },
  { surah_number: 65, surah_name_ar: "الطلاق", start_ayah: 10, end_ayah: 11, page: 558 },
  { surah_number: 65, surah_name_ar: "الطلاق", start_ayah: 12, end_ayah: 12, page: 558 },
  // --- سورة التغابن (64) ---
  { surah_number: 64, surah_name_ar: "التغابن", start_ayah: 1, end_ayah: 4, page: 556 },
  { surah_number: 64, surah_name_ar: "التغابن", start_ayah: 5, end_ayah: 7, page: 556 },
  { surah_number: 64, surah_name_ar: "التغابن", start_ayah: 8, end_ayah: 9, page: 556 },
  { surah_number: 64, surah_name_ar: "التغابن", start_ayah: 10, end_ayah: 13, page: 556 },
  { surah_number: 64, surah_name_ar: "التغابن", start_ayah: 14, end_ayah: 15, page: 556 },
  { surah_number: 64, surah_name_ar: "التغابن", start_ayah: 16, end_ayah: 18, page: 556 },
  // --- سورة المنافقون (63) ---
  { surah_number: 63, surah_name_ar: "المنافقون", start_ayah: 1, end_ayah: 3, page: 555 },
  { surah_number: 63, surah_name_ar: "المنافقون", start_ayah: 4, end_ayah: 5, page: 555 },
  { surah_number: 63, surah_name_ar: "المنافقون", start_ayah: 6, end_ayah: 7, page: 555 },
  { surah_number: 63, surah_name_ar: "المنافقون", start_ayah: 8, end_ayah: 9, page: 555 },
  { surah_number: 63, surah_name_ar: "المنافقون", start_ayah: 10, end_ayah: 11, page: 555 },
  // --- سورة الجمعة (62) ---
  { surah_number: 62, surah_name_ar: "الجمعة", start_ayah: 1, end_ayah: 3, page: 553 },
  { surah_number: 62, surah_name_ar: "الجمعة", start_ayah: 4, end_ayah: 5, page: 553 },
  { surah_number: 62, surah_name_ar: "الجمعة", start_ayah: 6, end_ayah: 8, page: 553 },
  { surah_number: 62, surah_name_ar: "الجمعة", start_ayah: 9, end_ayah: 11, page: 553 },
  // --- سورة الصف (61) ---
  { surah_number: 61, surah_name_ar: "الصف", start_ayah: 1, end_ayah: 4, page: 551 },
  { surah_number: 61, surah_name_ar: "الصف", start_ayah: 5, end_ayah: 6, page: 551 },
  { surah_number: 61, surah_name_ar: "الصف", start_ayah: 7, end_ayah: 9, page: 551 },
  { surah_number: 61, surah_name_ar: "الصف", start_ayah: 10, end_ayah: 13, page: 551 },
  { surah_number: 61, surah_name_ar: "الصف", start_ayah: 14, end_ayah: 14, page: 551 },
  // --- سورة الممتحنة (60) ---
  { surah_number: 60, surah_name_ar: "الممتحنة", start_ayah: 1, end_ayah: 2, page: 549 },
  { surah_number: 60, surah_name_ar: "الممتحنة", start_ayah: 3, end_ayah: 4, page: 549 },
  { surah_number: 60, surah_name_ar: "الممتحنة", start_ayah: 5, end_ayah: 7, page: 549 },
  { surah_number: 60, surah_name_ar: "الممتحنة", start_ayah: 8, end_ayah: 9, page: 549 },
  { surah_number: 60, surah_name_ar: "الممتحنة", start_ayah: 10, end_ayah: 11, page: 549 },
  { surah_number: 60, surah_name_ar: "الممتحنة", start_ayah: 12, end_ayah: 13, page: 549 },
  // --- سورة الحشر (59) ---
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 1, end_ayah: 3, page: 545 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 4, end_ayah: 6, page: 545 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 7, end_ayah: 8, page: 545 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 9, end_ayah: 10, page: 545 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 11, end_ayah: 12, page: 545 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 13, end_ayah: 14, page: 545 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 15, end_ayah: 19, page: 545 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 20, end_ayah: 24, page: 545 },
  // --- سورة المجادلة (58) ---
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 1, end_ayah: 2, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 3, end_ayah: 4, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 5, end_ayah: 6, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 7, end_ayah: 8, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 9, end_ayah: 10, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 11, end_ayah: 12, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 13, end_ayah: 16, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 17, end_ayah: 19, page: 542 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 20, end_ayah: 22, page: 542 },
  // --- سورة الحديد (57) ---
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 1, end_ayah: 6, page: 537 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 7, end_ayah: 11, page: 537 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 12, end_ayah: 15, page: 537 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 16, end_ayah: 18, page: 537 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 19, end_ayah: 20, page: 537 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 21, end_ayah: 24, page: 537 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 25, end_ayah: 27, page: 537 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 28, end_ayah: 29, page: 537 },
  // --- سورة الواقعة (56) ---
  { surah_number: 56, surah_name_ar: "الواقعة", start_ayah: 1, end_ayah: 16, page: 534 },
  { surah_number: 56, surah_name_ar: "الواقعة", start_ayah: 17, end_ayah: 40, page: 534 },
  { surah_number: 56, surah_name_ar: "الواقعة", start_ayah: 41, end_ayah: 57, page: 534 },
  { surah_number: 56, surah_name_ar: "الواقعة", start_ayah: 58, end_ayah: 74, page: 534 },
  { surah_number: 56, surah_name_ar: "الواقعة", start_ayah: 75, end_ayah: 96, page: 534 },
  // --- سورة الرحمن (55) ---
  { surah_number: 55, surah_name_ar: "الرحمن", start_ayah: 1, end_ayah: 18, page: 531 },
  { surah_number: 55, surah_name_ar: "الرحمن", start_ayah: 19, end_ayah: 32, page: 531 },
  { surah_number: 55, surah_name_ar: "الرحمن", start_ayah: 33, end_ayah: 45, page: 531 },
  { surah_number: 55, surah_name_ar: "الرحمن", start_ayah: 46, end_ayah: 61, page: 531 },
  { surah_number: 55, surah_name_ar: "الرحمن", start_ayah: 62, end_ayah: 78, page: 531 },
  // --- سورة القمر (54) ---
  { surah_number: 54, surah_name_ar: "القمر", start_ayah: 1, end_ayah: 8, page: 528 },
  { surah_number: 54, surah_name_ar: "القمر", start_ayah: 9, end_ayah: 22, page: 528 },
  { surah_number: 54, surah_name_ar: "القمر", start_ayah: 23, end_ayah: 32, page: 528 },
  { surah_number: 54, surah_name_ar: "القمر", start_ayah: 33, end_ayah: 42, page: 528 },
  { surah_number: 54, surah_name_ar: "القمر", start_ayah: 43, end_ayah: 55, page: 528 },
  // --- سورة النجم (53) ---
  { surah_number: 53, surah_name_ar: "النجم", start_ayah: 1, end_ayah: 18, page: 526 },
  { surah_number: 53, surah_name_ar: "النجم", start_ayah: 19, end_ayah: 26, page: 526 },
  { surah_number: 53, surah_name_ar: "النجم", start_ayah: 27, end_ayah: 32, page: 526 },
  { surah_number: 53, surah_name_ar: "النجم", start_ayah: 33, end_ayah: 44, page: 526 },
  { surah_number: 53, surah_name_ar: "النجم", start_ayah: 45, end_ayah: 62, page: 526 },
  // --- سورة الطور (52) ---
  { surah_number: 52, surah_name_ar: "الطور", start_ayah: 1, end_ayah: 14, page: 523 },
  { surah_number: 52, surah_name_ar: "الطور", start_ayah: 15, end_ayah: 23, page: 523 },
  { surah_number: 52, surah_name_ar: "الطور", start_ayah: 24, end_ayah: 31, page: 523 },
  { surah_number: 52, surah_name_ar: "الطور", start_ayah: 32, end_ayah: 43, page: 523 },
  { surah_number: 52, surah_name_ar: "الطور", start_ayah: 44, end_ayah: 49, page: 523 },
  // --- سورة الذاريات (51) ---
  { surah_number: 51, surah_name_ar: "الذاريات", start_ayah: 1, end_ayah: 23, page: 520 },
  { surah_number: 51, surah_name_ar: "الذاريات", start_ayah: 24, end_ayah: 30, page: 520 },
  { surah_number: 51, surah_name_ar: "الذاريات", start_ayah: 31, end_ayah: 42, page: 520 },
  { surah_number: 51, surah_name_ar: "الذاريات", start_ayah: 43, end_ayah: 51, page: 520 },
  { surah_number: 51, surah_name_ar: "الذاريات", start_ayah: 52, end_ayah: 60, page: 520 },
  // --- سورة ق (50) ---
  { surah_number: 50, surah_name_ar: "ق", start_ayah: 1, end_ayah: 8, page: 518 },
  { surah_number: 50, surah_name_ar: "ق", start_ayah: 9, end_ayah: 15, page: 518 },
  { surah_number: 50, surah_name_ar: "ق", start_ayah: 16, end_ayah: 30, page: 518 },
  { surah_number: 50, surah_name_ar: "ق", start_ayah: 31, end_ayah: 38, page: 518 },
  { surah_number: 50, surah_name_ar: "ق", start_ayah: 39, end_ayah: 45, page: 518 },
  // --- سورة الحجرات (49) ---
  { surah_number: 49, surah_name_ar: "الحجرات", start_ayah: 1, end_ayah: 4, page: 515 },
  { surah_number: 49, surah_name_ar: "الحجرات", start_ayah: 5, end_ayah: 8, page: 515 },
  { surah_number: 49, surah_name_ar: "الحجرات", start_ayah: 9, end_ayah: 11, page: 515 },
  { surah_number: 49, surah_name_ar: "الحجرات", start_ayah: 12, end_ayah: 14, page: 515 },
  { surah_number: 49, surah_name_ar: "الحجرات", start_ayah: 15, end_ayah: 18, page: 515 },
  // --- سورة الفتح (48) ---
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 1, end_ayah: 5, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 6, end_ayah: 9, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 10, end_ayah: 13, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 14, end_ayah: 15, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 16, end_ayah: 19, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 20, end_ayah: 23, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 24, end_ayah: 26, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 27, end_ayah: 28, page: 511 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 29, end_ayah: 29, page: 511 },
  // --- سورة محمد (47) ---
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 1, end_ayah: 6, page: 507 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 7, end_ayah: 11, page: 507 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 12, end_ayah: 15, page: 507 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 16, end_ayah: 19, page: 507 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 20, end_ayah: 24, page: 507 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 25, end_ayah: 29, page: 507 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 30, end_ayah: 34, page: 507 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 35, end_ayah: 38, page: 507 },
  // --- سورة الأحقاف (46) ---
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 1, end_ayah: 5, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 6, end_ayah: 10, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 11, end_ayah: 14, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 15, end_ayah: 16, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 17, end_ayah: 20, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 21, end_ayah: 25, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 26, end_ayah: 28, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 29, end_ayah: 32, page: 502 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 33, end_ayah: 35, page: 502 },
  // --- سورة الفاتحة (1) ---
  { surah_number: 1, surah_name_ar: "الفاتحة", start_ayah: 1, end_ayah: 7, page: 1 },
];

// =========================================================================
// 2. HIFZ_CURRICULUM: تحويل المقاطع إلى منهج حفظ مع نقاط
// =========================================================================

const HIFZ_CURRICULUM = SURAH_DETAILS.map((seg) => ({
  ...seg,
  points: 5, // جميع مقاطع الحفظ = 5 نقاط
}));

// =========================================================================
// 3. CURRICULUM_LEVELS: تعريف المستويات الثلاثة
// =========================================================================

const CURRICULUM_LEVELS = {
  BUILDING: {
    id: "BUILDING",
    name: "البناء",
    // نطاق الحفظ الثابت لإنهاء المستوى: من الناس (114) إلى البروج (85)
    hifz_range: { start_surah: 114, end_surah: 85 },
    hifz_label: "حفظ: من سورة الناس إلى سورة البروج",
    hifz_points: 5,
    murajaa_label: "مراجعة: قسم البناء (الطارق، الأعلى، الغاشية، الفجر إلى الناس)",
    murajaa_points: 3,
  },

  DEVELOPMENT: {
    id: "DEVELOPMENT",
    name: "التطوير",
    // نطاق الحفظ الثابت لإنهاء المستوى: من الانشقاق (84) إلى الملك (67)
    hifz_range: { start_surah: 84, end_surah: 67 },
    hifz_label: "حفظ: من سورة الانشقاق إلى سورة الملك",
    hifz_points: 5,
    murajaa_label: "مراجعة: قسم التطوير",
    murajaa_points: 3,
  },

  ADVANCED: {
    id: "ADVANCED",
    name: "المتقدم",
    // نطاق الحفظ الثابت لإنهاء المستوى: من التحريم (66) إلى المجادلة (58)
    hifz_range: { start_surah: 66, end_surah: 58 },
    hifz_label: "حفظ: من سورة التحريم إلى سورة المجادلة",
    hifz_points: 5,
    murajaa_label: "مراجعة: قسم المتقدم",
    murajaa_points: 3,
  },

  COMPLETION: {
    id: "COMPLETION",
    name: "إكمال المنهج",
    hifz_label: "أكمل حفظ المنهج",
    murajaa_label: "أكمل مراجعة المنهج",
  },
};

// =========================================================================
// 4. REVIEW_METHODOLOGY: نصوص مهام المراجعة (كما أرسلتها)
// =========================================================================

const REVIEW_METHODOLOGY = {
  BUILDING: [
  "النبأ (1-20)",
  "النبأ (21-40)",
  "النازعات (1-26)",
  "النازعات (27-46)",
  "عبس (1-23)",
  "عبس (24-42)",
  "التكوير (1-14)",
  "التكوير (15-29)",
  "الانفطار",
  "المطففين (1-21)",
  "المطففين (22-36)",
  "الانشقاق",
  "البروج والطارق",
  "الأعلى",
  "الغاشية",
  "الفجر (1-16)",
  "الفجر (17-30)",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى والشرح",
  "التين والعلق",
  "القدر والبينة",
  "الزلزلة والعاديات",
  "القارعة والتكاثر",
  "العصر والهمزة والفيل",
  "قريش والماعون والكوثر",
  "الكافرون والنصر والمسد",
  "الإخلاص والفلق والناس",
  ],
  DEVELOPMENT: [
    "القلم (1-33)",
    "القلم (34-52)",
    "الحاقة (1-24)",
    "الحاقة (25-52)",
    "المعارج (1-28)",
    "المعارج (29-44)",
    "نوح (1-20)",
    "نوح (21-28)",
    "الجن (1-13)",
    "الجن (14-28)",
    "المزمل",
    "المدثر (1-31)",
    "المدثر (32-56)",
    "القيامة (1-19)",
    "القيامة (20-40)",
    "الإنسان (1-18)",
    "الإنسان (19-31)",
    "المرسلات (1-33)",
    "المرسلات (34-50)",
    "النبأ (1-20)",
    "النبأ (21-40)",
    "النازعات (1-26)",
    "النازعات (27-46)",
    "عبس (1-23)",
    "عبس (24-42)",
    "التكوير (1-14)",
    "التكوير (15-29)",
    "الانفطار",
    "المطففين (1-21)",
    "المطففين (22-36)",
    "الانشقاق",
    "البروج والطارق",
    "الأعلى والغاشية",
    "الفجر والبلد",
    "الشمس والليل والضحى والشرح",
    "التين والعلق والقدر والبينة",
    "الزلزلة إلى الناس",
  ],
  ADVANCED: [
    "الأحقاف (1-16)",
    "الأحقاف (17-35)",
    "محمد (1-19)",
    "محمد (20-38)",
    "الفتح (1-15)",
    "الفتح (16-29)",
    "الحجرات",
    "ق",
    "الذاريات",
    "الطور",
    "النجم",
    "القمر",
    "الرحمن",
    "الواقعة",
    "الحديد (1-18)",
    "الحديد (19-29)",
    "المجادلة (1-12)",
    "المجادلة (13-22)",
    "الحشر (1-12)",
    "الحشر (13-24)",
    "الممتحنة (1-7)",
    "الممتحنة (8-13)",
    "الصف",
    "الجمعة",
    "المنافقون",
    "التغابن",
    "الطلاق",
    "التحريم",
    "الملك",
    "القلم",
    "الحاقة",
    "المعارج",
    "نوح",
    "الجن",
    "المزمل",
    "المدثر",
    "القيامة",
    "الإنسان",
    "المرسلات",
    "النبأ",
    "النازعات",
    "عبس والتكوير",
    "الانفطار والمطففين",
    "الانشقاق والبروج",
    "الطارق إلى الفجر",
    "البلد إلى الناس",
  ],
};

// =========================================================================
// 5. REVIEW_CURRICULUM: تحويل نصوص المراجعة إلى كائنات (name + points)
// =========================================================================

const REVIEW_CURRICULUM = {
  BUILDING: REVIEW_METHODOLOGY.BUILDING.map((name) => ({
    name,
    points: 3,
  })),
  DEVELOPMENT: REVIEW_METHODOLOGY.DEVELOPMENT.map((name) => ({
    name,
    points: 3,
  })),
  ADVANCED: REVIEW_METHODOLOGY.ADVANCED.map((name) => ({
    name,
    points: 3,
  })),
};

// =========================================================================
// ✅ 7) FLEXIBLE_HIFZ: منهج مرن (سورة كاملة بمدى آيات)
// =========================================================================

const FLEXIBLE_HIFZ = [
  { surah_number: 67, surah_name_ar: "الملك", start_ayah: 1, end_ayah: 30 },
  { surah_number: 66, surah_name_ar: "التحريم", start_ayah: 1, end_ayah: 12 },
  { surah_number: 65, surah_name_ar: "الطلاق", start_ayah: 1, end_ayah: 12 },
  { surah_number: 64, surah_name_ar: "التغابن", start_ayah: 1, end_ayah: 18 },
  { surah_number: 63, surah_name_ar: "المنافقون", start_ayah: 1, end_ayah: 11 },
  { surah_number: 62, surah_name_ar: "الجمعة", start_ayah: 1, end_ayah: 11 },
  { surah_number: 61, surah_name_ar: "الصف", start_ayah: 1, end_ayah: 14 },
  { surah_number: 60, surah_name_ar: "الممتحنة", start_ayah: 1, end_ayah: 13 },
  { surah_number: 59, surah_name_ar: "الحشر", start_ayah: 1, end_ayah: 24 },
  { surah_number: 58, surah_name_ar: "المجادلة", start_ayah: 1, end_ayah: 22 },
  { surah_number: 57, surah_name_ar: "الحديد", start_ayah: 1, end_ayah: 29 },
  { surah_number: 56, surah_name_ar: "الواقعة", start_ayah: 1, end_ayah: 96 },
  { surah_number: 55, surah_name_ar: "الرحمن", start_ayah: 1, end_ayah: 78 },
  { surah_number: 54, surah_name_ar: "القمر", start_ayah: 1, end_ayah: 55 },
  { surah_number: 53, surah_name_ar: "النجم", start_ayah: 1, end_ayah: 62 },
  { surah_number: 52, surah_name_ar: "الطور", start_ayah: 1, end_ayah: 49 },
  { surah_number: 51, surah_name_ar: "الذاريات", start_ayah: 1, end_ayah: 60 },
  { surah_number: 50, surah_name_ar: "ق", start_ayah: 1, end_ayah: 45 },
  { surah_number: 49, surah_name_ar: "الحجرات", start_ayah: 1, end_ayah: 18 },
  { surah_number: 48, surah_name_ar: "الفتح", start_ayah: 1, end_ayah: 29 },
  { surah_number: 47, surah_name_ar: "محمد", start_ayah: 1, end_ayah: 38 },
  { surah_number: 46, surah_name_ar: "الأحقاف", start_ayah: 1, end_ayah: 35 },
  { surah_number: 45, surah_name_ar: "الجاثية", start_ayah: 1, end_ayah: 37 },
  { surah_number: 44, surah_name_ar: "الدخان", start_ayah: 1, end_ayah: 59 },
  { surah_number: 43, surah_name_ar: "الزخرف", start_ayah: 1, end_ayah: 89 },
  { surah_number: 42, surah_name_ar: "الشورى", start_ayah: 1, end_ayah: 53 },
  { surah_number: 41, surah_name_ar: "فصلت", start_ayah: 1, end_ayah: 54 },
  { surah_number: 40, surah_name_ar: "غافر", start_ayah: 1, end_ayah: 85 },
  { surah_number: 39, surah_name_ar: "الزمر", start_ayah: 1, end_ayah: 75 },
  { surah_number: 38, surah_name_ar: "ص", start_ayah: 1, end_ayah: 88 },
  { surah_number: 37, surah_name_ar: "الصافات", start_ayah: 1, end_ayah: 182 },
  { surah_number: 36, surah_name_ar: "يس", start_ayah: 1, end_ayah: 83 },
  { surah_number: 35, surah_name_ar: "فاطر", start_ayah: 1, end_ayah: 45 },
  { surah_number: 34, surah_name_ar: "سبأ", start_ayah: 1, end_ayah: 54 },
  { surah_number: 33, surah_name_ar: "الأحزاب", start_ayah: 1, end_ayah: 73 },
  { surah_number: 32, surah_name_ar: "السجدة", start_ayah: 1, end_ayah: 30 },
  { surah_number: 31, surah_name_ar: "لقمان", start_ayah: 1, end_ayah: 34 },
  { surah_number: 30, surah_name_ar: "الروم", start_ayah: 1, end_ayah: 60 },
  { surah_number: 29, surah_name_ar: "العنكبوت", start_ayah: 1, end_ayah: 69 },
  { surah_number: 28, surah_name_ar: "القصص", start_ayah: 1, end_ayah: 88 },
  { surah_number: 27, surah_name_ar: "النمل", start_ayah: 1, end_ayah: 93 },
  { surah_number: 26, surah_name_ar: "الشعراء", start_ayah: 1, end_ayah: 227 },
  { surah_number: 25, surah_name_ar: "الفرقان", start_ayah: 1, end_ayah: 77 },
  { surah_number: 24, surah_name_ar: "النور", start_ayah: 1, end_ayah: 64 },
  { surah_number: 23, surah_name_ar: "المؤمنون", start_ayah: 1, end_ayah: 118 },
  { surah_number: 22, surah_name_ar: "الحج", start_ayah: 1, end_ayah: 78 },
];

const FLEXIBLE_POINTS = 5;



// =========================================================================
// 6. Exports
// =========================================================================

export { HIFZ_CURRICULUM, REVIEW_CURRICULUM, CURRICULUM_LEVELS, FLEXIBLE_HIFZ, FLEXIBLE_POINTS };