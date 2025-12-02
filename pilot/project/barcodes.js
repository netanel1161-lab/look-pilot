// barcodes.js
import { supabase } from "./supabaseClient.js";

// מבנה נתונים בזיכרון
let state = {
  pilots: [],
  businesses: [],
  vehicles: [],
  creatives: [],
  assignments: [],
  barcodes: [],
};

const rowsBody = document.getElementById("barcode-rows");
const pilotFilter = document.getElementById("pilot-filter");
const businessFilter = document.getElementById("business-filter");
const summaryEl = document.getElementById("summary");
const selectAll = document.getElementById("select-all");
const exportBtn = document.getElementById("export-selected");

// מודאל
const modal = document.getElementById("preview-modal");
const closeModalBtn = document.getElementById("close-modal");
const previewTitle = document.getElementById("preview-title");
const previewSubtitle = document.getElementById("preview-subtitle");
const previewCode = document.getElementById("preview-code");
const qrCanvas = document.getElementById("qr-canvas");

// ========= שלב 1: טעינת נתונים מהדאטהבייס =========

async function loadTable(table) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.error("שגיאה בטעינת טבלה", table, error);
    return [];
  }
  return data || [];
}

async function loadData() {
  rowsBody.innerHTML = `<tr><td colspan="6" class="text-muted">טוען נתונים…</td></tr>`;

  const [
    pilots,
    businesses,
    vehicles,
    creatives,
    assignments,
    barcodes,
  ] = await Promise.all([
    loadTable("pilots"),
    loadTable("businesses"),
    loadTable("vehicles"),
    loadTable("creatives"),
    loadTable("vehicle_assignments"),
    loadTable("barcodes"),
  ]);

  state = { pilots, businesses, vehicles, creatives, assignments, barcodes };

  buildFilters();
  renderRows();
}

// ========= שלב 2: פילטרים =========

function buildFilters() {
  // פיילוטים
  pilotFilter.innerHTML = `<option value="">כל הפיילוטים</option>`;
  state.pilots.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name || `פיילוט #${p.id}`;
    pilotFilter.appendChild(opt);
  });

  // עסקים
  businessFilter.innerHTML = `<option value="">כל העסקים</option>`;
  state.businesses.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name || `עסק #${b.id}`;
    businessFilter.appendChild(opt);
  });
}

// ========= שלב 3: רינדור שורות =========

function renderRows() {
  const pilotId = pilotFilter.value;
  const businessId = businessFilter.value;

  const vehicleById = Object.fromEntries(state.vehicles.map(v => [v.id, v]));
  const creativeById = Object.fromEntries(state.creatives.map(c => [c.id, c]));
  const businessById = Object.fromEntries(state.businesses.map(b => [b.id, b]));

  const barcodeByAssignment = {};
  state.barcodes.forEach(bc => {
    if (bc.assignment_id != null) {
      barcodeByAssignment[bc.assignment_id] = bc;
    }
  });

  let assignments = state.assignments;

  if (pilotId) {
    assignments = assignments.filter(a => String(a.pilot_id) === String(pilotId));
  }

  if (businessId) {
    assignments = assignments.filter(a => {
      const creative = creativeById[a.creative_id];
      if (!creative) return false;
      return String(creative.business_id) === String(businessId);
    });
  }

  if (!assignments.length) {
    rowsBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted">לא נמצאו שיוכים לפי הסינון הנוכחי.</td>
      </tr>`;
    summaryEl.textContent = "0 שיוכי רכב־מודעה";
    exportBtn.disabled = true;
    return;
  }

  rowsBody.innerHTML = "";

  assignments.forEach((assign) => {
    const vehicle = vehicleById[assign.vehicle_id];
    const creative = creativeById[assign.creative_id];
    const business = creative ? businessById[creative.business_id] : null;
    const barcode = barcodeByAssignment[assign.id];

    const tr = document.createElement("tr");
    tr.dataset.assignmentId = assign.id;

    // בחירה
    const tdSelect = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "row-select";
    tdSelect.appendChild(checkbox);

    // רכב
    const tdVehicle = document.createElement("td");
    if (vehicle) {
      const title = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
      const meta = [
        vehicle.id_car ? `#${vehicle.id_car}` : null,
        vehicle.year || null,
        vehicle.color || null,
      ]
        .filter(Boolean)
        .join(" · ");

      tdVehicle.innerHTML = `
        <div style="font-weight:600;">${title || "רכב ללא שם"}</div>
        <div class="text-muted">${meta}</div>
      `;
    } else {
      tdVehicle.innerHTML = `<span class="text-muted">רכב לא נמצא</span>`;
    }

    // עסק
    const tdBusiness = document.createElement("td");
    if (business) {
      tdBusiness.innerHTML = `
        <div style="font-weight:600;">${business.name}</div>
      `;
    } else {
      tdBusiness.innerHTML = `<span class="text-muted">עסק לא נמצא</span>`;
    }

    // מודעה
    const tdCreative = document.createElement("td");
    if (creative) {
      tdCreative.innerHTML = `
        <div style="font-weight:600;">${creative.name || "מודעה ללא שם"}</div>
        <span class="tag">${creative.type || "קמפיין"}</span>
      `;
    } else {
      tdCreative.innerHTML = `<span class="text-muted">מודעה לא נמצאה</span>`;
    }

    // סטטוס ברקוד
    const tdStatus = document.createElement("td");
    let statusText = "אין ברקוד";
    let statusClass = "status-none";

    if (barcode) {
      statusText = barcode.status || "פעיל";
      if (statusText === "active") statusText = "פעיל";
      if (statusText === "printed") statusText = "נשלח לדפוס";

      statusClass =
        barcode.status === "printed"
          ? "status-printed"
          : barcode.status === "replaced"
          ? "status-replaced"
          : "status-active";
    }

    tdStatus.innerHTML = `<span class="${statusClass}">${statusText}</span>`;

    // פעולות
    const tdActions = document.createElement("td");
    tdActions.style.whiteSpace = "nowrap";

    const genBtn = document.createElement("button");
    genBtn.className = "btn btn-primary btn-sm";
    genBtn.textContent = barcode ? "יצירת QR מחדש" : "יצירת QR";
    genBtn.addEventListener("click", () =>
      handleGenerate(assign, vehicle, creative, business)
    );

    const previewBtn = document.createElement("button");
    previewBtn.className = "btn btn-outline btn-sm";
    previewBtn.textContent = "תצוגה מקדימה";
    previewBtn.disabled = !barcode;
    previewBtn.addEventListener("click", () =>
      handlePreview(assign, vehicle, creative, business, barcodeByAssignment[assign.id])
    );

    tdActions.appendChild(genBtn);
    tdActions.appendChild(previewBtn);

    tr.appendChild(tdSelect);
    tr.appendChild(tdVehicle);
    tr.appendChild(tdBusiness);
    tr.appendChild(tdCreative);
    tr.appendChild(tdStatus);
    tr.appendChild(tdActions);

    rowsBody.appendChild(tr);
  });

  summaryEl.textContent = `${assignments.length} שיוכי רכב־מודעה`;
  updateExportButtonState();
}

// ========= שלב 4: יצירת ברקוד =========

// מייצר URL רשמי לברקוד לפי השיוך
function buildBarcodeUrl(assign) {
  // כאן אתה מחליט על הפורמט הרשמי:
  // אפשר לשנות ל: https://www.l00k.net/scan?ba=${assign.id}
  return `https://www.l00k.net/scan?assignment=${assign.id}`;
}

async function handleGenerate(assign, vehicle, creative, business) {
  const code = buildBarcodeUrl(assign);

  try {
    // בודק אם כבר יש ברקוד לשיוך הזה
    const { data: existing } = await supabase
      .from("barcodes")
      .select("*")
      .eq("assignment_id", assign.id)
      .maybeSingle();

    let barcodeRow;

    if (existing) {
      const { data, error } = await supabase
        .from("barcodes")
        .update({ code, status: "active" })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      barcodeRow = data;
    } else {
      const { data, error } = await supabase
        .from("barcodes")
        .insert({
          assignment_id: assign.id,
          code,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      barcodeRow = data;
    }

    // מעדכן בזיכרון
    const idx = state.barcodes.findIndex((b) => b.assignment_id === assign.id);
    if (idx >= 0) {
      state.barcodes[idx] = barcodeRow;
    } else {
      state.barcodes.push(barcodeRow);
    }

    renderRows();
    alert("הברקוד נוצר / עודכן בהצלחה.");
  } catch (err) {
    console.error("שגיאה ביצירת ברקוד:", err);
    alert("אירעה שגיאה ביצירת הברקוד. ראה קונסול.");
  }
}

// ========= שלב 5: תצוגה מקדימה =========

function handlePreview(assign, vehicle, creative, business, barcode) {
  if (!barcode) {
    alert("אין ברקוד לשיוך הזה עדיין.");
    return;
  }

  const vehicleTitle = vehicle
    ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
    : "רכב לא ידוע";

  const businessName = business ? business.name : "עסק לא ידוע";

  previewTitle.textContent = businessName;
  previewSubtitle.textContent = `${vehicleTitle} • #${vehicle?.id_car || assign.vehicle_id}`;
  previewCode.textContent = barcode.code;

  // יצירת QR על הקנבס
  const ctx = qrCanvas.getContext("2d");
  ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  QRCode.toCanvas(
    qrCanvas,
    barcode.code,
    { width: 220, margin: 2 },
    function (error) {
      if (error) console.error(error);
    }
  );

  modal.style.display = "flex";
}

// ========= שלב 6: בחירה וייצוא (בינתיים רק בחירה) =========

function updateExportButtonState() {
  const anyChecked = !!document.querySelector(".row-select:checked");
  exportBtn.disabled = !anyChecked;
}

selectAll.addEventListener("change", () => {
  const checked = selectAll.checked;
  document.querySelectorAll(".row-select").forEach((cb) => {
    cb.checked = checked;
  });
  updateExportButtonState();
});

rowsBody.addEventListener("change", (e) => {
  if (e.target.classList.contains("row-select")) {
    updateExportButtonState();
  }
});

exportBtn.addEventListener("click", () => {
  // כאן בעתיד נעשה יצוא לדפוס.
  // כרגע רק מציג מה נבחר.
  const selectedIds = Array.from(
    document.querySelectorAll(".row-select:checked")
  ).map((cb) => cb.closest("tr").dataset.assignmentId);

  if (!selectedIds.length) return;

  alert(`נבחרו ${selectedIds.length} ברקודים לייצוא (פיצ'ר בקרוב).`);
});

// ========= שלב 7: מודאל =========

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// ========= שלב 8: אירועי פילטר וטעינה =========

pilotFilter.addEventListener("change", renderRows);
businessFilter.addEventListener("change", renderRows);

// התחלה
loadData();
