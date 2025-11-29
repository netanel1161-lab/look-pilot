(() => {
    const state = { data: null };

    const els = {
        title: document.getElementById('title'),
        subtitle: document.getElementById('subtitle'),
        start: document.getElementById('start'),
        end: document.getElementById('end'),
        defaultSession: document.getElementById('default-session'),
        countersList: document.getElementById('counters-list'),
        overallList: document.getElementById('overall-list'),
        addCounter: document.getElementById('add-counter'),
        addOverall: document.getElementById('add-overall'),
        jsonArea: document.getElementById('json-area'),
        applyJson: document.getElementById('apply-json'),
        refreshJson: document.getElementById('refresh-json'),
        preview: document.getElementById('preview'),
        status: document.getElementById('status'),
        fileInput: document.getElementById('file-input'),
        loadFileBtn: document.getElementById('load-file-btn'),
        saveFileBtn: document.getElementById('save-file-btn')
    };

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadFromDefault();
        bindEvents();
        renderAll();
    }

    async function loadFromDefault() {
        try {
            const res = await fetch('../data/pilot.json');
            if (!res.ok) throw new Error('טעינה נכשלה');
            state.data = await res.json();
            setStatus('pilot.json נטען מתוך התיקייה.');
        } catch (err) {
            state.data = createEmptyData();
            setStatus('לא נמצאו נתונים, נוצר מבנה ריק.');
        }
        ensureShape();
    }

    function createEmptyData() {
        return {
            title: '',
            subtitle: '',
            period: { start: '', end: '' },
            hero: { summary: '', counters: [], filters: ['All'] },
            overall: [],
            businesses: [],
            vehicles: { topList: [], table: [] },
            geo: [],
            sessions: { default: 'All', segments: {} },
            actions: { wins: [], next: [] },
            conclusion: []
        };
    }

    function ensureShape() {
        const d = state.data || {};
        d.period = d.period || { start: '', end: '' };
        d.hero = d.hero || {};
        d.hero.counters = Array.isArray(d.hero.counters) ? d.hero.counters : [];
        d.hero.filters = Array.isArray(d.hero.filters) ? d.hero.filters : ['All'];
        d.overall = Array.isArray(d.overall) ? d.overall : [];
        d.sessions = d.sessions || { default: 'All', segments: {} };
        d.sessions.segments = d.sessions.segments || {};
        d.actions = d.actions || { wins: [], next: [] };
        d.actions.wins = Array.isArray(d.actions.wins) ? d.actions.wins : [];
        d.actions.next = Array.isArray(d.actions.next) ? d.actions.next : [];
        d.conclusion = Array.isArray(d.conclusion) ? d.conclusion : [];
        state.data = d;
    }

    function bindEvents() {
        [els.title, els.subtitle].forEach(input => {
            input.addEventListener('input', () => {
                if (!state.data) return;
                state.data[input.id === 'title' ? 'title' : 'subtitle'] = input.value;
                sync();
            });
        });

        els.start.addEventListener('input', () => {
            state.data.period.start = els.start.value;
            sync();
        });

        els.end.addEventListener('input', () => {
            state.data.period.end = els.end.value;
            sync();
        });

        els.defaultSession.addEventListener('input', () => {
            state.data.sessions.default = els.defaultSession.value;
            sync();
        });

        els.addCounter.addEventListener('click', () => {
            state.data.hero.counters.push({ label: '', value: '', tone: 'secondary', note: '' });
            renderLists();
            sync();
        });

        els.addOverall.addEventListener('click', () => {
            state.data.overall.push({ label: '', value: '', tone: 'secondary', note: '' });
            renderLists();
            sync();
        });

        els.countersList.addEventListener('input', handleListInput);
        els.overallList.addEventListener('input', handleListInput);
        els.countersList.addEventListener('click', handleListRemove);
        els.overallList.addEventListener('click', handleListRemove);

        els.applyJson.addEventListener('click', applyJsonText);
        els.refreshJson.addEventListener('click', () => {
            updateJsonArea();
            setStatus('הטקסט עודכן מהשדות.');
        });

        els.loadFileBtn.addEventListener('click', () => els.fileInput.click());
        els.fileInput.addEventListener('change', onFileChange);
        els.saveFileBtn.addEventListener('click', saveToFile);
    }

    function handleListInput(event) {
        const row = event.target.closest('.list-row');
        if (!row) return;
        const type = row.dataset.type;
        const index = Number(row.dataset.index);
        const field = event.target.name;
        const target = type === 'counter' ? state.data.hero.counters : state.data.overall;
        if (!target[index]) return;
        target[index][field] = event.target.value;
        sync(false);
    }

    function handleListRemove(event) {
        const btn = event.target.closest('[data-remove]');
        if (!btn) return;
        const row = btn.closest('.list-row');
        const type = row.dataset.type;
        const index = Number(row.dataset.index);
        const target = type === 'counter' ? state.data.hero.counters : state.data.overall;
        target.splice(index, 1);
        renderLists();
        sync();
    }

    function applyJsonText() {
        try {
            const parsed = JSON.parse(els.jsonArea.value);
            state.data = parsed;
            ensureShape();
            renderAll();
            setStatus('הטקסט נטען והוחל על השדות.');
        } catch (err) {
            setStatus('שגיאה בקריאת JSON: ' + err.message);
        }
    }

    async function onFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            state.data = JSON.parse(text);
            ensureShape();
            renderAll();
            setStatus('הנתונים נטענו מקובץ: ' + file.name);
        } catch (err) {
            setStatus('טעינת קובץ נכשלה: ' + err.message);
        } finally {
            event.target.value = '';
        }
    }

    async function saveToFile() {
        const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'pilot.json',
                    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
                    excludeAcceptAllOption: true
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                setStatus('הקובץ נשמר בהצלחה.');
                return;
            } catch (err) {
                setStatus('שמירה בוטלה או נכשלה.');
            }
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'pilot.json';
        link.click();
        URL.revokeObjectURL(link.href);
        setStatus('הקובץ הורד כ-pilot.json');
    }

    function renderAll() {
        ensureShape();
        renderBasicFields();
        renderLists();
        updateJsonArea();
        renderPreview();
    }

    function renderBasicFields() {
        els.title.value = state.data.title || '';
        els.subtitle.value = state.data.subtitle || '';
        els.start.value = state.data.period.start || '';
        els.end.value = state.data.period.end || '';
        els.defaultSession.value = state.data.sessions.default || 'All';
    }

    function renderLists() {
        els.countersList.innerHTML = renderListHtml(state.data.hero.counters, 'counter');
        els.overallList.innerHTML = renderListHtml(state.data.overall, 'overall');
    }

    function renderListHtml(items, type) {
        return items.map((item, index) => `
            <div class="list-row" data-type="${type === 'counter' ? 'counter' : 'overall'}" data-index="${index}">
                <div class="grid two">
                    <div>
                        <label>כותרת</label>
                        <input name="label" value="${escapeHtml(item.label || '')}">
                    </div>
                    <div>
                        <label>ערך</label>
                        <input name="value" value="${escapeHtml(item.value ?? '')}">
                    </div>
                </div>
                <div class="grid two">
                    <div>
                        <label>טון</label>
                        <select name="tone">
                            ${['primary','secondary','success','warning','danger','muted'].map(tone => `
                                <option value="${tone}" ${tone === (item.tone || 'secondary') ? 'selected' : ''}>${tone}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label>הערה</label>
                        <input name="note" value="${escapeHtml(item.note || '')}">
                    </div>
                </div>
                <div class="controls">
                    <button type="button" class="secondary" data-remove>מחיקה</button>
                </div>
            </div>
        `).join('') || '<div class="muted">אין פריטים. הוסף אחד.</div>';
    }

    function updateJsonArea() {
        els.jsonArea.value = JSON.stringify(state.data, null, 2);
    }

    function renderPreview() {
        const counters = (state.data.hero.counters || []).map(counter => `
            <div class="metric-card tone-${counter.tone || 'secondary'}">
                <div class="metric-label">${escapeHtml(counter.label || '')}</div>
                <div class="metric-value">${escapeHtml(counter.value ?? '')}</div>
                ${counter.note ? `<div class="metric-note">${escapeHtml(counter.note)}</div>` : ''}
            </div>
        `).join('');

        const overall = (state.data.overall || []).slice(0, 4).map(metric => `
            <div class="metric-card tone-${metric.tone || 'secondary'}">
                <div class="metric-label">${escapeHtml(metric.label || '')}</div>
                <div class="metric-value">${escapeHtml(metric.value ?? '')}</div>
                ${metric.note ? `<div class="metric-note">${escapeHtml(metric.note)}</div>` : ''}
            </div>
        `).join('');

        els.preview.innerHTML = `
            <div class="section hero">
                <h3 style="margin:0 0 8px 0;">${escapeHtml(state.data.title || 'פיילוט LOOK')}</h3>
                <p class="lead">${escapeHtml(state.data.subtitle || state.data.hero.summary || '')}</p>
                <div class="grid cols-3">${counters}</div>
            </div>
            <div class="section" style="margin-top:12px;">
                <h4 style="margin:0 0 8px 0;">ביצועים כלליים</h4>
                <div class="grid cols-3">${overall}</div>
            </div>
        `;
    }

    function sync(withRender = true) {
        ensureShape();
        updateJsonArea();
        renderPreview();
        setStatus('שינויים לא נשמרו עדיין.');
        if (withRender) {
            renderBasicFields();
        }
    }

    function setStatus(text) {
        els.status.textContent = text;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
})();
