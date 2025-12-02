import { supabase } from "./supabaseClient.js";

const app = document.getElementById("app");
const manageBarcodesBtn = document.getElementById("manage-barcodes-btn");

const state = {
    businesses: [],
    vehicles: [],
    creatives: [],
    assignments: [],
    scans: [],
    actions: [],
    selectedBusiness: "",
    openCards: new Set(),
    loading: true,
};

const statusBar = document.createElement("div");
statusBar.id = "supabase-status";
statusBar.className = "note";
statusBar.textContent = "טוען נתונים מ-Supabase...";

function setStatus(text, tone = "info") {
    statusBar.textContent = text;
    statusBar.className = `note tone-${tone}`;
}

function optionHtml(value, label) {
    return `<option value="${value}">${label}</option>`;
}

function renderSkeleton() {
    app.innerHTML = `
        <div class="section hero">
            <div class="hero-title">
                <h1>טוען נתוני הפיילוט...</h1>
                <span class="period">המערכת מחברת את הנתונים</span>
            </div>
            <p class="lead">אנא המתן שנאסוף נתונים מ-Supabase.</p>
            <div class="grid cols-4">
                ${["", "", "", ""].map(() => `<div class="metric-card skeleton"></div>`).join("")}
            </div>
        </div>
        <section class="section">
            <div class="hero-title">
                <h2>פילוח עסקים וקריאייטיב</h2>
            </div>
            <div class="grid cols-2">
                ${["", ""].map(() => `<div class="business-card skeleton" style="min-height:180px;"></div>`).join("")}
            </div>
        </section>
        <section class="section">
            <div class="hero-title" style="margin-bottom:12px;">
                <h2>דגמי רכב מובילים</h2>
            </div>
            <div class="grid cols-3">
                ${["", "", ""].map(() => `<div class="metric-card skeleton"></div>`).join("")}
            </div>
            <div class="table-wrapper" style="margin-top:14px;">
                <table>
                    <thead>
                        <tr>
                            <th>תמונה</th><th>מס' רכב</th><th>מותג</th><th>דגם</th><th>שנה</th><th>צבע</th><th>אחראי</th><th>הערות</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="8" class="muted">טוען נתונים...</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
    `;
    app.prepend(statusBar);
}

async function loadAllData() {
    setStatus("טוען טבלאות...", "info");
    const results = await Promise.allSettled([
        supabase.from("businesses").select("*"),
        supabase.from("vehicles").select("*"),
        supabase.from("creatives").select("*"),
        supabase.from("vehicle_assignments").select("*"),
        supabase.from("scan_events").select("*"),
        supabase.from("action_events").select("*"),
    ]);

    const [bizRes, vehRes, crRes, assignRes, scansRes, actionsRes] = results;

    function unwrap(res, label) {
        if (res.status === "rejected") throw res.reason;
        if (res.value.error) throw new Error(`שגיאה ב-${label}: ${res.value.error.message}`);
        return res.value.data || [];
    }

    state.businesses = unwrap(bizRes, "עסקים");
    state.vehicles = unwrap(vehRes, "רכבים");
    state.creatives = unwrap(crRes, "מודעות");
    state.assignments = unwrap(assignRes, "שיבוצים");
    state.scans = unwrap(scansRes, "סריקות");
    state.actions = unwrap(actionsRes, "אקשנים");
    state.loading = false;
    setStatus("הנתונים נטענו בהצלחה.", "success");
}

function aggregateByBusiness(businessId) {
    const scans = state.scans.filter((s) => String(s.business_id) === String(businessId)).length;
    const actions = state.actions.filter((a) => String(a.business_id) === String(businessId)).length;
    const ctr = scans ? ((actions / scans) * 100).toFixed(1) : "0.0";

    const scansByHour = Array(24).fill(0);
    state.scans.forEach((s) => {
        if (String(s.business_id) !== String(businessId) || !s.created_at) return;
        const hour = new Date(s.created_at).getHours();
        scansByHour[hour] += 1;
    });

    return { scans, actions, ctr, scansByHour };
}

function renderHeatStrip(scansByHour) {
    const max = Math.max(...scansByHour, 1);
    return `
        <div class="heat-strip">
            ${scansByHour
                .map(
                    (count, hour) => `
                    <div class="heat-cell" title="${hour}:00 – ${count} סריקות" style="opacity:${count / max};"></div>
                `
                )
                .join("")}
        </div>
    `;
}

function resolveBusinessVehicles(bizId) {
    const linkedAssignments = state.assignments.filter((a) => {
        if (a.business_id && String(a.business_id) === String(bizId)) return true;
        const creative = state.creatives.find((c) => c.id === a.creative_id);
        return creative && String(creative.business_id) === String(bizId);
    });
    const vehicleIds = new Set(linkedAssignments.map((a) => a.vehicle_id));
    return state.vehicles.filter((v) => vehicleIds.has(v.id));
}

function renderVehicleChips(vehicles) {
    if (!vehicles.length) return `<div class="muted">אין רכבים משויכים</div>`;
    return `
        <div class="vehicle-chip-row">
            ${vehicles
                .map(
                    (v) => `
                    <div class="vehicle-chip" data-id="${v.id}">
                        <div class="chip-img">${v.image_url ? `<img src="${v.image_url}" alt="${v.brand || ""} ${v.model || ""}">` : `<span class="muted">אין תמונה</span>`}</div>
                        <div class="chip-body">
                            <div class="chip-title">${v.brand || ""} ${v.model || ""}</div>
                            <div class="chip-sub">${v.id_car || ""} • ${v.year || ""} • ${v.color || ""}</div>
                        </div>
                    </div>
                `
                )
                .join("")}
        </div>
    `;
}

function renderCreatives(bizCreatives) {
    const variants = bizCreatives.length ? bizCreatives : [];
    const ensured = variants.length >= 2 ? variants : [...variants, { label: "B", missing: true }];

    return `
        <div class="creative-grid">
            ${ensured
                .map((c, idx) => {
                    const label = c.label || (idx === 0 ? "A" : "B");
                    return `
                        <div class="creative-variant">
                            <div class="creative-tag">וריאנט ${label}</div>
                            <div class="creative-img">
                                ${
                                    c.missing
                                        ? `<div class="muted" style="text-align:center;">טרם הוגדר</div>`
                                        : c.image_url
                                        ? `<img src="${c.image_url}" alt="${c.label || ""}">`
                                        : `<div class="muted" style="text-align:center;">אין תמונה</div>`
                                }
                            </div>
                            <div class="creative-link">
                                ${
                                    c.landing_url
                                        ? `<a href="${c.landing_url}" target="_blank" rel="noreferrer">${c.landing_url}</a>`
                                        : `<span class="muted">אין דף נחיתה</span>`
                                }
                            </div>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;
}

function renderBusinessCard(biz) {
    const stats = aggregateByBusiness(biz.id);
    const bizCreatives = state.creatives.filter((c) => String(c.business_id) === String(biz.id));
    const vehicles = resolveBusinessVehicles(biz.id);

    const open = state.openCards.has(biz.id);
    const brandBg = biz.primary_color || "#fff";
    const brandFg = biz.secondary_color || "#0f172a";

    return `
        <div class="business-card collapsible ${open ? "is-open" : ""}" data-biz="${biz.id}">
            <div class="business-header">
                <div class="biz-title">
                    ${biz.logo_url ? `<img src="${biz.logo_url}" alt="${biz.name}" class="biz-logo">` : ""}
                    <div>
                        <h3>${biz.name || ""}</h3>
                        ${biz.landing_title ? `<span class="badge tone-secondary">${biz.landing_title}</span>` : ""}
                    </div>
                </div>
                <div class="business-actions">
                    ${biz.website_url ? `<a class="btn secondary" href="${biz.website_url}" target="_blank" rel="noreferrer">כניסה לאתר</a>` : ""}
                    <button class="btn ghost toggle-card">פתיחה/סגירה</button>
                </div>
            </div>
            <div class="business-meta" style="background:${brandBg}; color:${brandFg};">
                ${biz.offer_text ? `<div class="business-tagline">${biz.offer_text}</div>` : ""}
                ${biz.cta_text ? `<div class="pill tone-primary">CTA: ${biz.cta_text}</div>` : ""}
            </div>
            <div class="business-stats">
                סריקות: ${stats.scans} | אקשנים: ${stats.actions} | CTR: ${stats.ctr}%
            </div>
            <div class="heat-strip-title">סריקות לפי שעה</div>
            ${renderHeatStrip(stats.scansByHour)}
            <div class="business-body ${open ? "open" : "collapsed"}">
                <div class="business-block">
                    <div class="small-title">מודעות A/B</div>
                    ${renderCreatives(bizCreatives)}
                </div>
                <div class="business-block">
                    <div class="small-title">רכבים בפיילוט</div>
                    ${renderVehicleChips(vehicles)}
                </div>
            </div>
        </div>
    `;
}

function renderVehicleHighlights(vehicles) {
    if (!vehicles.length) return `<div class="empty">אין רכבים להצגה.</div>`;
    const sorted = [...vehicles].sort((a, b) => {
        const aKey = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bKey = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bKey - aKey;
    });
    const top = sorted.slice(0, 3);
    return top
        .map((v) => {
            const badge = v.notes && v.notes.includes("בדפוס") ? `<span class="badge tone-danger">לבדוק בדפוס</span>` : "";
            return `
                <div class="vehicle-highlight">
                    <div class="vehicle-img">${v.image_url ? `<img src="${v.image_url}" alt="${v.brand || ""} ${v.model || ""}">` : `<span class="muted">אין תמונה</span>`}</div>
                    <div class="vehicle-meta">
                        <div class="vehicle-title">${v.brand || ""} ${v.model || ""}</div>
                        <div class="vehicle-sub">${[v.year, v.color].filter(Boolean).join(" • ")}</div>
                        <div class="vehicle-sub">אחראי: ${v.responsible || "-"}</div>
                        <div class="vehicle-badges">
                            ${badge}
                            <span class="pill muted">קליקים: 0</span>
                            <span class="pill muted">לידים: 0</span>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");
}

function renderVehicleRows(vehicles) {
    if (!vehicles.length) {
        return `<tr><td colspan="8" class="empty">אין רכבים להציג.</td></tr>`;
    }
    return vehicles
        .map(
            (v) => `
        <tr>
            <td>${v.image_url ? `<img src="${v.image_url}" alt="${v.brand || ""} ${v.model || ""}" style="width:72px; height:auto; border-radius:12px; object-fit:cover;">` : `<span class="muted">אין תמונה</span>`}</td>
            <td>${v.id_car || ""}</td>
            <td>${v.brand || ""}</td>
            <td>${v.model || ""}</td>
            <td>${v.year || ""}</td>
            <td>${v.color || ""}</td>
            <td>${v.responsible || ""}</td>
            <td>${v.notes || ""}</td>
        </tr>
    `
        )
        .join("");
}

function renderDashboard() {
    const { businesses, vehicles } = state;

    const metrics = [
        { label: "עסקים", value: businesses.length, tone: "primary" },
        { label: "רכבים", value: vehicles.length, tone: "secondary" },
        { label: "סריקות", value: state.scans.length, tone: "success" },
        { label: "אקשנים", value: state.actions.length, tone: "warning" },
    ];

    const businessFilter = `
        <div class="filters" style="margin-bottom:16px;">
            <select id="business-filter">
                ${optionHtml("", "כל העסקים")}
                ${businesses.map((b) => optionHtml(b.id, b.name || `עסק #${b.id}`)).join("")}
            </select>
            <button class="btn secondary" id="reset-filter">להציג הכל</button>
        </div>
    `;

    const hero = `
        <section class="section hero">
            <div class="hero-title">
                <h1>דשבורד פיילוט LOOK</h1>
                <span class="period">נתונים חיים מ-Supabase</span>
            </div>
            <p class="lead">צילום מצב של נתוני הפיילוט – עסקים, רכבים וברקודים.</p>
            <div class="grid cols-4">
                ${metrics
                    .map(
                        (card) => `
                    <div class="metric-card tone-${card.tone}">
                        <div class="metric-label">${card.label}</div>
                        <div class="metric-value">${card.value ?? "-"}</div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        </section>
    `;

    const filteredBusinesses = state.selectedBusiness
        ? businesses.filter((b) => String(b.id) === String(state.selectedBusiness))
        : businesses;

    const businessesHtml = `
        <section class="section" id="businesses-section">
            <div class="hero-title">
                <h2>פילוח עסקים וקריאייטיב</h2>
                <p class="lead">נתונים ישירות מטבלת העסקים.</p>
            </div>
            ${businessFilter}
            <div class="grid cols-2" id="businesses-container">
                ${filteredBusinesses.length ? filteredBusinesses.map(renderBusinessCard).join("") : `<div class="empty">אין עסקים להציג.</div>`}
            </div>
        </section>
    `;

    const vehiclesHtml = `
        <section class="section" id="vehicles-section">
            <div class="hero-title" style="margin-bottom:12px;">
                <h2>דגמי רכב מובילים</h2>
            </div>
            <div class="grid cols-3 vehicle-highlight-grid">
                ${renderVehicleHighlights(vehicles)}
            </div>
            <div class="table-wrapper" style="margin-top:14px;">
                <table>
                    <thead>
                        <tr>
                            <th>תמונה</th>
                            <th>מס' רכב</th>
                            <th>מותג</th>
                            <th>דגם</th>
                            <th>שנה</th>
                            <th>צבע</th>
                            <th>אחראי</th>
                            <th>הערות</th>
                        </tr>
                    </thead>
                    <tbody id="vehicles-table-body">
                        ${renderVehicleRows(vehicles)}
                    </tbody>
                </table>
            </div>
        </section>
    `;

    app.innerHTML = hero + businessesHtml + vehiclesHtml;
    app.prepend(statusBar);

    const bizFilterEl = document.getElementById("business-filter");
    const resetFilterEl = document.getElementById("reset-filter");
    bizFilterEl?.addEventListener("change", (e) => {
        state.selectedBusiness = e.target.value;
        renderDashboard();
    });
    resetFilterEl?.addEventListener("click", () => {
        state.selectedBusiness = "";
        renderDashboard();
    });

    app.querySelectorAll(".toggle-card").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".business-card");
            if (!card) return;
            const bizId = card.dataset.biz;
            if (state.openCards.has(bizId)) state.openCards.delete(bizId);
            else state.openCards.add(bizId);
            renderDashboard();
        });
    });
}

async function initDashboard() {
    renderSkeleton();
    try {
        await loadAllData();
        renderDashboard();
    } catch (err) {
        console.error(err);
        setStatus(err.message || "שגיאה בטעינת הנתונים", "danger");
        app.innerHTML = `
            <div class="section hero">
                <h1>שגיאה בטעינת נתונים</h1>
                <p class="lead">${err.message || "לא ניתן להתחבר ל-Supabase."}</p>
                <div class="callout">בדוק הרשאות, Policies ושה-API זמין.</div>
            </div>
        `;
        app.prepend(statusBar);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (manageBarcodesBtn) {
        manageBarcodesBtn.addEventListener("click", () => {
            window.location.href = "barcodes.html";
        });
    }
    initDashboard();
});
