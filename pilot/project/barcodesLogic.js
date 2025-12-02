import { supabase } from "./supabaseClient.js";

const statusEl = document.getElementById("barcodes-status");
const pilotFilter = document.getElementById("pilot-filter");
const businessFilter = document.getElementById("business-filter");
const creativeFilter = document.getElementById("creative-filter");
const vehicleFilter = document.getElementById("vehicle-filter");
const rowsBody = document.getElementById("barcode-rows");
const summaryEl = document.getElementById("summary");
const selectAll = document.getElementById("select-all");
const exportBtn = document.getElementById("export-selected");

const state = {
  pilots: [],
  businesses: [],
  vehicles: [],
  creatives: [],
  assignments: [],
  barcodes: [],
  testBarcodesEnsured: false,
  createdCount: 0,
};

function setStatus(text, tone = "info") {
  statusEl.textContent = text;
  statusEl.className = `note tone-${tone}`;
}

function optionHtml(value, label) {
  return `<option value="${value}">${label}</option>`;
}

async function fetchTable(name) {
  const { data, error } = await supabase.from(name).select("*");
  if (error) throw new Error(`שגיאה בטעינת ${name}: ${error.message}`);
  return data || [];
}

async function loadData() {
  setStatus("טוען נתונים מ-Supabase...", "info");
  rowsBody.innerHTML = `<tr><td colspan="7" class="muted">טוען...</td></tr>`;
  try {
    const [pilots, businesses, vehicles, creatives, assignments, barcodes] =
      await Promise.all([
        fetchTable("pilots"),
        fetchTable("businesses"),
        fetchTable("vehicles"),
        fetchTable("creatives"),
        fetchTable("vehicle_assignments"),
        fetchTable("barcodes"),
      ]);

    state.pilots = pilots;
    state.businesses = businesses;
    state.vehicles = vehicles;
    state.creatives = creatives;
    state.assignments = assignments;
    state.barcodes = barcodes;

    await ensureTestBarcodes();

    buildFilters();
    renderRows();
    const createdNote =
      state.createdCount > 0
        ? ` (נוצרו ${state.createdCount} ברקודים חדשים לפרויקט test_pilot)`
        : "";
    setStatus(`הנתונים נטענו בהצלחה${createdNote}.`, "success");
  } catch (err) {
    console.error(err);
    setStatus(err.message || "שגיאה בטעינת הנתונים", "danger");
    rowsBody.innerHTML = `<tr><td colspan="7" class="empty">לא נטענו נתונים.</td></tr>`;
  }
}

async function ensureTestBarcodes() {
  if (state.testBarcodesEnsured) return;
  const inserts = [];
  for (const assign of state.assignments) {
    const existing = state.barcodes.find(
      (b) => String(b.assignment_id) === String(assign.id)
    );
    if (existing) continue;
    const code = `https://www.l00k.net/he/qr/test/${assign.id}`;
    inserts.push({
      assignment_id: assign.id,
      code,
      status: "active",
      project_name: "test_pilot",
      label: "TEST",
    });
  }
  if (!inserts.length) {
    state.testBarcodesEnsured = true;
    return;
  }
  const { data, error } = await supabase
    .from("barcodes")
    .insert(inserts)
    .select();
  if (error) {
    console.warn("Failed to seed test barcodes:", error.message);
  } else if (data) {
    state.barcodes.push(...data);
    state.createdCount += data.length;
  }
  state.testBarcodesEnsured = true;
}

function buildFilters() {
  pilotFilter.innerHTML =
    optionHtml("", "כל הפיילוטים") +
    state.pilots.map((p) => optionHtml(p.id, p.name || `פיילוט #${p.id}`)).join("");

  businessFilter.innerHTML =
    optionHtml("", "כל העסקים") +
    state.businesses
      .map((b) => optionHtml(b.id, b.name || `עסק #${b.id}`))
      .join("");

  creativeFilter.innerHTML =
    optionHtml("", "כל המודעות") +
    state.creatives
      .map((c) => optionHtml(c.id, c.label || `מודעה #${c.id}`))
      .join("");

  vehicleFilter.innerHTML =
    optionHtml("", "כל הרכבים") +
    state.vehicles
      .map((v) => optionHtml(v.id, v.id_car || `${v.brand || ""} ${v.model || ""}`))
      .join("");
}

function generateQr(canvas, text) {
  if (!canvas || !window.QRCode) return;
  QRCode.toCanvas(
    canvas,
    text,
    { width: 120, margin: 2 },
    (err) => err && console.error(err)
  );
}

function renderRows() {
  const pilotId = pilotFilter.value;
  const businessId = businessFilter.value;
  const creativeId = creativeFilter.value;
  const vehicleId = vehicleFilter.value;

  const vehicleById = Object.fromEntries(state.vehicles.map((v) => [v.id, v]));
  const creativeById = Object.fromEntries(state.creatives.map((c) => [c.id, c]));
  const businessById = Object.fromEntries(state.businesses.map((b) => [b.id, b]));
  const barcodeByAssignment = Object.fromEntries(
    state.barcodes
      .filter((b) => b.assignment_id != null)
      .map((b) => [b.assignment_id, b])
  );

  let assignments = [...state.assignments];

  if (pilotId) {
    assignments = assignments.filter(
      (a) => String(a.pilot_id) === String(pilotId)
    );
  }

  if (businessId) {
    assignments = assignments.filter((a) => {
      const creative = creativeById[a.creative_id];
      const bizId = a.business_id || creative?.business_id;
      return String(bizId) === String(businessId);
    });
  }

  if (creativeId) {
    assignments = assignments.filter(
      (a) => String(a.creative_id) === String(creativeId)
    );
  }
  if (vehicleId) {
    assignments = assignments.filter(
      (a) => String(a.vehicle_id) === String(vehicleId)
    );
  }

  if (!assignments.length) {
    rowsBody.innerHTML = `<tr><td colspan="7" class="empty">לא נמצאו שיבוצים.</td></tr>`;
    summaryEl.textContent = "0 שורות";
    return;
  }

  rowsBody.innerHTML = assignments
    .map((assign) => {
      const vehicle = vehicleById[assign.vehicle_id];
      const creative = creativeById[assign.creative_id];
      const business =
        businessById[assign.business_id] ||
        businessById[creative?.business_id];
      const barcode = barcodeByAssignment[assign.id];
      const url =
        barcode?.target_url ||
        barcode?.landing_url ||
        barcode?.code ||
        `https://www.l00k.net/he/qr/test/${assign.id}`;

      return `
        <tr data-assignment="${assign.id}">
          <td><input type="checkbox" class="row-select" /></td>
          <td>${assign.id}</td>
          <td>
            <div class="small-title">${business?.name || "ללא עסק"}</div>
            <div class="muted">${creative ? creative.label || "A/B" : "—"}</div>
          </td>
          <td>
            ${creative ? (creative.label || "A/B") : "—"}
            <div class="muted">${creative?.name || ""}</div>
          </td>
          <td>
            ${vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""}` : "ללא רכב"}
            <div class="muted">${vehicle?.id_car || ""}</div>
          </td>
          <td>${barcode ? (barcode.short_code || barcode.id || "קיים") : "טרם נוצר"}</td>
          <td><a href="${url}" target="_blank" rel="noreferrer">${url}</a></td>
          <td><canvas class="qr-canvas" width="120" height="120" data-url="${url}"></canvas></td>
        </tr>
      `;
    })
    .join("");

  summaryEl.textContent = `${assignments.length} שורות`;
  requestAnimationFrame(() => {
    document.querySelectorAll(".qr-canvas").forEach((canvas) =>
      generateQr(canvas, canvas.dataset.url)
    );
  });
}

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

pilotFilter.addEventListener("change", renderRows);
businessFilter.addEventListener("change", renderRows);
creativeFilter.addEventListener("change", renderRows);
vehicleFilter.addEventListener("change", renderRows);
exportBtn.addEventListener("click", () => {
  const selected = Array.from(
    document.querySelectorAll(".row-select:checked")
  ).map((cb) => cb.closest("tr")?.dataset.assignment);
  alert(selected.length ? `נבחרו ${selected.length} ברקודים לייצוא.` : "לא נבחרו ברקודים.");
});

loadData();
