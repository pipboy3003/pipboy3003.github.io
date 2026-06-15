const seedVehicles = [
      { id: 1, brand: 'BMW', vehicle: 'E36 328i', status: 'OPEN', keyNumber: '0005 556', vin: 'WBACD11030AR05211', year: '—', owner: '#SOLD', location: 'Lager Nord', maintenanceDue: '2026-06-28', category: 'Coupé', color: 'Arktissilber', notes: 'Klassischer Bestandseintrag mit offener Prüfung der Unterlagen.', docs: ['Zulassung', 'Serviceheft'], history: ['Datensatz geprüft', 'Bilder ergänzt', 'VIN gegengecheckt'] },
      { id: 2, brand: 'BMW', vehicle: 'F31 320iX', status: 'OPEN', keyNumber: '0005 BPE', vin: 'WBA3H110X0KV72844', year: '—', owner: '#SOLD', location: 'Außenstellplatz', maintenanceDue: '2026-07-05', category: 'Touring', color: 'Schwarz', notes: 'Allrad, guter Kandidat für schnelle Filterung nach Karosserie und Status.', docs: ['Kaufvertrag'], history: ['Importiert', 'Status gesetzt', 'Besitzer markiert'] },
      { id: 3, brand: 'BMW', vehicle: 'E46 328i #R', status: 'OPEN', keyNumber: '0005 623', vin: 'WBAAM51040FN70518', year: '—', owner: '#SOLD', location: 'Halle 2', maintenanceDue: '2026-06-22', category: 'Limousine', color: 'Topasblau', notes: 'Interner Referenzwagen mit knapper Titelstruktur wie in der Notion-Vorlage.', docs: ['VIN-Prüfung'], history: ['Reserveteile zugeordnet', 'Datensatz aktualisiert'] },
      { id: 4, brand: 'BMW', vehicle: 'E36 316i Compact', status: 'OPEN', keyNumber: '0005 565', vin: 'WBACG11060KD91127', year: '1996 / 06', owner: '#SOLD', location: 'Halle 1', maintenanceDue: '2026-07-13', category: 'Compact', color: 'Boston Grün', notes: 'Baujahr ist sauber formatiert, Besitzerfeld bleibt frei nutzbar für interne Zustände.', docs: ['Wartungsnotiz'], history: ['Baujahr ergänzt', 'Compact-Tag bestätigt'] },
      { id: 5, brand: 'BMW', vehicle: 'E91 320i', status: 'OPEN', keyNumber: '0005 ADX', vin: 'WBAVR71050KS97542', year: '06 / 2006', owner: 'Andy Piechaczek', location: 'Hof West', maintenanceDue: '2026-06-20', category: 'Touring', color: 'Titansilber', notes: 'Beispiel für echten Besitzerwert statt Status-Token.', docs: ['Besitzerwechsel'], history: ['Besitzer übertragen', 'Standort geändert'] },
      { id: 6, brand: 'Audi', vehicle: 'A4 B7 2.0 TFSI', status: 'RESERVED', keyNumber: '0588 AJO', vin: 'WAUZZZ8E26A184221', year: '2006 / 11', owner: 'Reservierung', location: 'Showroom', maintenanceDue: '2026-06-25', category: 'Limousine', color: 'Phantomschwarz', notes: 'Reservierte Fahrzeuge bleiben sichtbar, aber farblich klar unterscheidbar.', docs: ['Reservierungsblatt'], history: ['Reservierung gesetzt', 'Preisnotiz ergänzt'] },
      { id: 7, brand: 'Volkswagen', vehicle: 'Golf 2 GTI', status: 'SOLD', keyNumber: '0600 412', vin: 'WVWZZZ19ZJW000214', year: '1988 / 03', owner: 'Verkauft', location: 'Archiv', maintenanceDue: '—', category: 'Hatchback', color: 'Rot', notes: 'Abgeschlossene Fahrzeuge wandern logisch ins Archiv, bleiben aber durchsuchbar.', docs: ['Verkaufsbeleg'], history: ['Verkauft markiert', 'Archiviert'] }
    ];

    const state = { selectedId: 1, selectedIds: new Set(), view: 'overview', storageLabel: 'Wird geladen …' };
    const storageKey = 'fahrzeugliste-admin-store-v1';
    const DB_NAME = 'fahrzeuglisteAdminDB';
    const STORE_NAME = 'appState';
    const STORE_ID = 'main';
    let vehicles = [];
    let maintenanceEvents = [];
    let partsInventory = [];
    let filterState = { period: 'all', vehicle: 'all' };
    let chartInstances = {};
    const serviceRules = { oil: 10000, inspection: 15000, brake: 30000 };
    let pendingImport = null;
    let pendingHeaders = [];
    let pendingRows = [];
    let suggestionMap = {};
    const importPrefsKey = 'fahrzeugliste-import-prefs-v1';
    const importLogKey = 'fahrzeugliste-import-log-v1';

    const $ = sel => document.querySelector(sel);
    const $$ = sel => [...document.querySelectorAll(sel)];

    const storage = {
      async openDB() {
        return new Promise((resolve, reject) => {
          if (!('indexedDB' in window)) return reject(new Error('IndexedDB nicht verfügbar'));
          const request = indexedDB.open(DB_NAME, 1);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error || new Error('IndexedDB Fehler'));
        });
      },
      async load() {
        try {
          const db = await this.openDB();
          const data = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(STORE_ID);
            req.onsuccess = () => resolve(req.result?.payload || null);
            req.onerror = () => reject(req.error || new Error('Lesefehler'));
          });
          db.close();
          if (data?.vehicles?.length) {
            state.storageLabel = 'Gespeichert in IndexedDB';
            return data;
          }
        } catch (err) {
          console.warn(err);
        }
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const data = JSON.parse(raw);
            if (data?.vehicles?.length) {
              state.storageLabel = 'Gespeichert in localStorage';
              return data;
            }
          }
        } catch (err) {
          console.warn(err);
        }
        state.storageLabel = 'Demodaten geladen';
        return { vehicles: structuredClone(seedVehicles) };
      },
      async save(payload) {
        const snapshot = { vehicles: structuredClone(payload), savedAt: new Date().toISOString() };
        let stored = false;
        try {
          const db = await this.openDB();
          await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put({ id: STORE_ID, payload: snapshot });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error || new Error('Schreibfehler'));
          });
          db.close();
          state.storageLabel = 'Gespeichert in IndexedDB';
          stored = true;
        } catch (err) {
          console.warn(err);
        }
        if (!stored) {
          localStorage.setItem(storageKey, JSON.stringify(snapshot));
          state.storageLabel = 'Gespeichert in localStorage';
        }
        renderStorageHint();
      },
      async reset() {
        vehicles = structuredClone(seedVehicles);
        await this.save(vehicles);
      }
    };

    function renderStorageHint() {
      let node = document.getElementById('storageHint');
      if (!node) {
        node = document.createElement('span');
        node.id = 'storageHint';
        node.className = 'badge';
        document.querySelector('.topbar .toolbar').prepend(node);
      }
      node.textContent = state.storageLabel;
    }

    function filteredVehicles() {
      const search = $('#searchInput').value.trim().toLowerCase();
      const brand = $('#brandFilter').value;
      const status = $('#statusFilter').value;
      return vehicles.filter(v => {
        const haystack = [v.brand, v.vehicle, v.vin, v.owner, v.keyNumber, v.location].join(' ').toLowerCase();
        return (!search || haystack.includes(search)) && (!brand || v.brand === brand) && (!status || v.status === status);
      });
    }

    function daysUntil(dateStr) {
      if (!dateStr || dateStr === '—') return null;
      const today = new Date('2026-06-15T00:00:00');
      const target = new Date(dateStr + 'T00:00:00');
      const diff = Math.round((target - today) / 86400000);
      return Number.isFinite(diff) ? diff : null;
    }

    function refreshBrandFilter() {
      const current = $('#brandFilter').value;
      const brands = [...new Set(vehicles.map(v => v.brand))].sort();
      $('#brandFilter').innerHTML = '<option value="">Alle Marken</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');
      $('#brandFilter').value = brands.includes(current) ? current : '';
    }

    function renderStats() {
      const list = filteredVehicles();
      $('#statTotal').textContent = list.length;
      $('#statOpen').textContent = list.filter(v => v.status === 'OPEN').length;
      $('#statReserved').textContent = list.filter(v => v.status === 'RESERVED').length;
      $('#statSold').textContent = list.filter(v => v.status === 'SOLD').length;
      $('#statMaintenance').textContent = list.filter(v => { const d = daysUntil(v.maintenanceDue); return d !== null && d <= 14; }).length;
      $('#todayTasks').textContent = list.filter(v => v.status !== 'SOLD' && ((daysUntil(v.maintenanceDue) ?? 999) <= 14 || v.year === '—')).length;
    }

    function statusClass(status) { return status === 'SOLD' ? 'sold' : status === 'RESERVED' ? 'reserved' : ''; }

    function renderOverview() {
      const list = filteredVehicles();
      const statusMap = ['OPEN','RESERVED','SOLD'].map(key => ({ key, count: list.filter(v => v.status === key).length }));
      const maxStatus = Math.max(1, ...statusMap.map(i => i.count));
      $('#statusBars').innerHTML = statusMap.map(item => `<div class="bar"><label><span>${item.key}</span><strong>${item.count}</strong></label><div class="track"><div class="fill" style="width:${(item.count/maxStatus)*100}%"></div></div></div>`).join('');
      const brandMap = [...new Set(list.map(v => v.brand))].map(brand => ({ brand, count: list.filter(v => v.brand === brand).length })).sort((a,b)=>b.count-a.count);
      const maxBrand = Math.max(1, ...brandMap.map(i => i.count));
      $('#brandBars').innerHTML = brandMap.map(item => `<div class="bar"><label><span>${item.brand}</span><strong>${item.count}</strong></label><div class="track"><div class="fill" style="width:${(item.count/maxBrand)*100}%"></div></div></div>`).join('');
      const tasks = [];
      list.forEach(v => {
        const due = daysUntil(v.maintenanceDue);
        if (v.year === '—') tasks.push(`${v.vehicle}: Baujahr fehlt`);
        if (due !== null && due <= 14) tasks.push(`${v.vehicle}: Wartung in ${due} Tagen`);
        if (v.status === 'RESERVED') tasks.push(`${v.vehicle}: Reservierung prüfen`);
      });
      $('#taskList').innerHTML = (tasks.slice(0,6).length ? tasks.slice(0,6) : ['Keine akuten Aufgaben']).map(task => `<div class="task"><input type="checkbox" /><div>${task}</div></div>`).join('');
      const log = loadImportLog();
      const overdueCount = vehicles.filter(v => { const due = String(v.maintenanceDue || ''); const nextNum = parseFloat(due.replace(/[^0-9]/g,'')); const curKm = parseFloat(String(v.mileage || v.kilometerstand || 0).replace(/[^0-9.,]/g,'').replace(',','.')) || 0; return (due.toLowerCase().includes('überfällig') || due.toLowerCase().includes('ueberfaellig')) || (nextNum && curKm > nextNum); }).length;
      const dueSoonCount = vehicles.filter(v => { const curKm = parseFloat(String(v.mileage || v.kilometerstand || 0).replace(/[^0-9.,]/g,'').replace(',','.')) || 0; const threshold = parseFloat(String(v.maintenanceDue || '').replace(/[^0-9]/g,'')); return threshold && curKm > threshold*0.9 && curKm <= threshold; }).length;
      const overviewPanel = document.querySelector('[data-panel=dashboard-overview]');
      if (overviewPanel && !document.getElementById('dashboardFilters')) { const el = document.createElement('div'); el.id='dashboardFilters'; el.className='tasklist'; el.innerHTML = `<div class="task" style="display:flex;gap:12px;flex-wrap:wrap"><select id="periodFilter"><option value="all">Alle Zeiträume</option><option value="2026-06">2026-06</option></select><select id="vehicleFilter"><option value="all">Alle Fahrzeuge</option>${vehicles.map(v=>`<option value="${v.vehicle}">${v.vehicle}</option>`).join('')}</select><button class="btn" id="resetFiltersBtn">Filter zurücksetzen</button></div>`; overviewPanel.prepend(el); document.getElementById('periodFilter').addEventListener('change', e=>{ filterState.period=e.target.value; renderAll(); }); document.getElementById('vehicleFilter').addEventListener('change', e=>{ filterState.vehicle=e.target.value; renderAll(); }); document.getElementById('resetFiltersBtn').addEventListener('click', ()=>{ filterState={period:'all',vehicle:'all'}; renderAll(); }); }
      const controls = document.getElementById('dashboardFilters');
      if (controls) controls.innerHTML = `<select id="periodFilter"><option value="all">Alle Zeiträume</option></select><select id="vehicleFilter"><option value="all">Alle Fahrzeuge</option>${vehicles.map(v=>`<option value="${v.vehicle}">${v.vehicle}</option>`).join('')}</select>`;
      const logTarget = document.getElementById('importLog');
      if (logTarget) logTarget.innerHTML = log.length ? log.map(item => `<div class="task"><span class="badge">${item.type}</span><div><strong>${item.file}</strong><div class="muted">${item.added} neu · ${item.updated} ergänzt · ${item.skipped} übersprungen</div></div></div>`).join('') : '<div class="task"><div>Noch kein Import-Log vorhanden.</div></div>';
      const filteredEvents = maintenanceEvents.filter(e => (filterState.vehicle === 'all' || e.vehicle === filterState.vehicle) && (filterState.period === 'all' || String(e.date || '').startsWith(filterState.period)));
      const events = filteredEvents.slice(0,12);
      const eventsTarget = document.getElementById('maintenanceEvents');
      if (eventsTarget) eventsTarget.innerHTML = events.length ? events.map(ev => `<div class="task"><span class="badge">${ev.type}</span><div><strong>${ev.vehicle}</strong><div class="muted">${ev.date} · KM ${ev.mileage || '—'} · ${ev.parts || 'ohne Teileangabe'}</div><div class="muted">Kosten: ${ev.cost || '—'}</div></div></div>`).join('') : '<div class="task"><div>Noch keine Wartungseinträge vorhanden.</div></div>';
      const totalCost = maintenanceEvents.reduce((s,e)=> s + (parseFloat(String(e.cost).replace(/[^0-9.,]/g,'').replace(',','.')) || 0), 0);
      const mileageSum = maintenanceEvents.reduce((s,e)=> s + (parseFloat(String(e.mileage).replace(/[^0-9.,]/g,'').replace(',','.')) || 0), 0);
      const kpiTarget = document.getElementById('kpiBars');
      if (kpiTarget) kpiTarget.innerHTML = [`<div class="bar"><label><span>Gesamtkosten</span><strong>${totalCost.toFixed(2)}</strong></label><div class="track"><div class="fill" style="width:${Math.min(100, totalCost / 1000 * 100)}%"></div></div></div>`, `<div class="bar"><label><span>Erfasste KM-Summe</span><strong>${mileageSum.toFixed(0)}</strong></label><div class="track"><div class="fill" style="width:${Math.min(100, mileageSum / 100000 * 100)}%"></div></div></div>`].join('');
      const chartTarget = document.getElementById('chartPanels');
      const byVehicle = Object.values(filteredEvents.reduce((acc,e)=>{ const k=e.vehicle||'Unbekannt'; acc[k]=acc[k]||{vehicle:k,cost:0,count:0,mileage:0}; acc[k].cost += parseFloat(String(e.cost).replace(/[^0-9.,]/g,'').replace(',','.')) || 0; acc[k].count += 1; acc[k].mileage += parseFloat(String(e.mileage).replace(/[^0-9.,]/g,'').replace(',','.')) || 0; return acc; }, {})).sort((a,b)=>b.cost-a.cost).slice(0,5);
      const trend = Object.values(filteredEvents.reduce((acc,e)=>{ const k=String(e.date || '').slice(0,7) || 'Unbekannt'; acc[k]=acc[k]||{period:k,cost:0,count:0}; acc[k].cost += parseFloat(String(e.cost).replace(/[^0-9.,]/g,'').replace(',','.')) || 0; acc[k].count += 1; return acc; }, {})).sort((a,b)=>a.period.localeCompare(b.period)).slice(-6);
      const bars = byVehicle.map(item => ({label:item.vehicle, value:item.cost}));
      const maxBar = Math.max(1, ...bars.map(b=>b.value));
      const trendMax = Math.max(1, ...trend.map(t=>t.cost));
      const chartHTML = [
        `<div class="task"><strong>Top Fahrzeuge nach Kosten</strong>${bars.length ? bars.map(item => `<div class="bar"><label><span>${item.label}</span><strong>${item.value.toFixed(2)}</strong></label><div class="track"><div class="fill" style="width:${(item.value/maxBar*100).toFixed(1)}%"></div></div></div>`).join('') : '<div class="muted">Noch keine Diagrammdaten vorhanden.</div>'}</div>`,
        `<div class="task"><strong>Kosten-Trend</strong>${trend.length ? trend.map(item => `<div class="bar"><label><span>${item.period}</span><strong>${item.cost.toFixed(2)}</strong></label><div class="track"><div class="fill" style="width:${(item.cost/trendMax*100).toFixed(1)}%"></div></div></div>`).join('') : '<div class="muted">Noch kein Trend vorhanden.</div>'}</div>`
      ];
      const sparkSvg = (points, color='#2d6cdf') => { const w=320,h=90,pad=10; const vals=points.map(p=>p.value); const max=Math.max(1,...vals), min=Math.min(0,...vals); const step=points.length>1 ? (w-2*pad)/(points.length-1) : 0; const pts=points.map((p,i)=>`${pad+i*step},${h-pad-((p.value-min)/(max-min||1))*(h-2*pad)}`).join(' '); return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="90" role="img" aria-label="Chart"><polyline fill="none" stroke="${color}" stroke-width="3" points="${pts}" /><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#c9ced6"/><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" stroke="#c9ced6"/></svg>`; };
      const trendPoints = trend.map(t => ({label:t.period, value:t.cost}));
      const partsPoints = Object.values(partsInventory.reduce((acc,p)=>{ acc[p.name]=(acc[p.name]||0)+((parseFloat(p.stock)||0)); return acc; }, {})).map((v,i)=>({label:`P${i+1}`, value:v}));
      if (chartTarget) chartTarget.innerHTML = chartHTML.join('') + `<div class="task"><strong>Kostenkurve</strong>${trendPoints.length ? sparkSvg(trendPoints) : '<div class="muted">Noch kein Trend vorhanden.</div>'}</div>` + `<div class="task"><strong>Teilebestand</strong>${partsInventory.length ? sparkSvg(partsInventory.slice(0,8).map(p=>({label:p.name,value:parseFloat(p.stock)||0})), '#d97706') : '<div class="muted">Noch kein Teilebestand vorhanden.</div>'}</div>`;
      const remindersTarget = document.getElementById('serviceReminders');
      const sortedVehicles = [...vehicles].sort((a,b)=>(parseFloat(b.year)||0)-(parseFloat(a.year)||0)).slice(0,8);
      if (remindersTarget) remindersTarget.innerHTML = sortedVehicles.length ? sortedVehicles.map(v => `<div class="task"><div><strong>${v.vehicle}</strong><div class="muted">Nächste Wartung: ${v.maintenanceDue || '—'} · KM: ${v.mileage || v.kilometerstand || '—'}</div></div></div>`).join('') : '<div class="task"><div>Noch keine Fahrzeuge vorhanden.</div></div>';
      const partsTarget = document.getElementById('partsInventory');
      if (partsTarget) partsTarget.innerHTML = partsInventory.length ? partsInventory.map(p => `<div class="task"><div><strong>${p.name}</strong><div class="muted">Bestand: ${p.stock} · Mindestbestand: ${p.minStock} · Preis: ${p.price || '—'}</div></div></div>`).join('') : '<div class="task"><div>Noch kein Teilebestand erfasst.</div></div>';
      const partsAlertsTarget = document.getElementById('partsAlerts');
      if (partsAlertsTarget) { const low = partsInventory.filter(p => (parseFloat(p.stock)||0) <= (parseFloat(p.minStock)||0)); partsAlertsTarget.innerHTML = low.length ? low.map(p => `<div class="task"><span class="badge">Niedrig</span><div><strong>${p.name}</strong><div class="muted">${p.stock} / ${p.minStock}</div></div></div>`).join('') : '<div class="task"><div>Keine niedrigen Bestände.</div></div>'; }
    }

    function renderInventory() {
      const list = filteredVehicles();
      if (!list.some(v => v.id === state.selectedId) && list[0]) state.selectedId = list[0].id;
      $('#resultCount').textContent = `${list.length} Einträge`;
      $('#vehicleTable').innerHTML = list.map(v => `<tr class="${v.id === state.selectedId ? 'active' : ''}" data-id="${v.id}" tabindex="0"><td><input type="checkbox" class="check row-check" data-id="${v.id}" ${state.selectedIds.has(v.id) ? 'checked' : ''} aria-label="Fahrzeug markieren"></td><td><span class="tag">${v.brand}</span></td><td><div class="row-title"><svg class="docicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"></path><path d="M14 2v5h5"></path></svg><strong>${v.vehicle}</strong></div></td><td><span class="status ${statusClass(v.status)}"><span class="dot"></span>${v.status}</span></td><td>${v.keyNumber || '—'}</td><td>${v.vin || '—'}</td><td>${v.year || '—'}</td><td>${v.owner || '—'}</td><td>${v.location || '—'}</td><td>${v.maintenanceDue || '—'}</td></tr>`).join('');
      $$('#vehicleTable tr').forEach(row => {
        row.addEventListener('click', e => { if (e.target.matches('.row-check')) return; state.selectedId = Number(row.dataset.id); renderAll(); });
        row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); state.selectedId = Number(row.dataset.id); renderAll(); } });
      });
      $$('.row-check').forEach(box => box.addEventListener('change', () => { const id = Number(box.dataset.id); box.checked ? state.selectedIds.add(id) : state.selectedIds.delete(id); }));
      $('#selectAllCheckbox').checked = list.length > 0 && list.every(v => state.selectedIds.has(v.id));
      renderDetail();
    }

    function renderDetail() {
      const v = vehicles.find(item => item.id === state.selectedId) || filteredVehicles()[0];
      if (!v) { $('#detailPane').innerHTML = '<p class="muted">Keine Einträge gefunden.</p>'; return; }
      $('#detailChip').textContent = v.status;
      $('#detailPane').innerHTML = `<section class="hero"><span class="tag">${v.brand}</span><h4>${v.vehicle}</h4><p class="muted">${v.category || 'Fahrzeug'} · ${v.location || 'Kein Standort'} · ${v.color || 'Keine Farbe'}</p><p>${v.notes || 'Keine Notiz hinterlegt.'}</p></section><section><h3 style="margin:0 0 12px;font-size:var(--text-lg)">Bearbeiten</h3><form class="form" id="editForm"><input name="vehicle" value="${v.vehicle}"><div class="grid"><input name="brand" value="${v.brand}"><select name="status"><option ${v.status==='OPEN'?'selected':''}>OPEN</option><option ${v.status==='RESERVED'?'selected':''}>RESERVED</option><option ${v.status==='SOLD'?'selected':''}>SOLD</option></select></div><div class="grid"><input name="keyNumber" value="${v.keyNumber || ''}" placeholder="Schlüsselnummer"><input name="vin" value="${v.vin || ''}" placeholder="Fahrgestellnummer"></div><div class="grid"><input name="year" value="${v.year || ''}" placeholder="Baujahr"><input name="owner" value="${v.owner || ''}" placeholder="Besitzer"></div><div class="grid"><input name="location" value="${v.location || ''}" placeholder="Standort"><input name="maintenanceDue" value="${v.maintenanceDue === '—' ? '' : (v.maintenanceDue || '')}" placeholder="2026-07-10"></div><textarea name="notes" placeholder="Interne Notiz">${v.notes || ''}</textarea><div class="footer-actions"><button class="btn primary" type="submit">Änderungen speichern</button><button class="btn" type="button" id="duplicateBtn">Duplizieren</button><button class="btn" type="button" id="deleteBtn">Löschen</button></div></form></section><section><h3 style="margin:0 0 12px;font-size:var(--text-lg)">Datenfelder</h3><div class="grid"><div class="field"><label>Farbe</label><strong>${v.color || '—'}</strong></div><div class="field"><label>Kategorie</label><strong>${v.category || '—'}</strong></div><div class="field"><label>Nächste Wartung</label><strong>${v.maintenanceDue || '—'}</strong></div><div class="field"><label>Dokumente</label><strong>${(v.docs || []).length}</strong></div></div></section><section><h3 style="margin:0 0 12px;font-size:var(--text-lg)">Historie</h3><div class="timeline">${(v.history || []).map(item => `<div class="event"><span class="pin"></span><div><strong>${item}</strong><div class="muted">Interner Verlaufseintrag</div></div></div>`).join('')}</div></section>`;
      $('#editForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        Object.assign(v, { vehicle: fd.get('vehicle'), brand: fd.get('brand'), status: fd.get('status'), keyNumber: fd.get('keyNumber'), vin: fd.get('vin'), year: fd.get('year') || '—', owner: fd.get('owner'), location: fd.get('location'), maintenanceDue: fd.get('maintenanceDue') || '—', notes: fd.get('notes') });
        v.history.unshift('Datensatz manuell bearbeitet');
        refreshBrandFilter();
        await storage.save(vehicles);
        renderAll();
      });
      $('#maintenanceForm').addEventListener('submit', async e => { e.preventDefault(); const fd = new FormData(e.currentTarget); const total = (parseFloat(String(fd.get('partCost')).replace(/[^0-9.,]/g,'').replace(',','.')) || 0) + (parseFloat(String(fd.get('laborCost')).replace(/[^0-9.,]/g,'').replace(',','.')) || 0); addMaintenanceEvent({ vehicle: v.vehicle, date: fd.get('date'), mileage: fd.get('mileage'), cost: total || fd.get('cost'), parts: fd.get('parts'), shop: fd.get('shop'), notes: fd.get('notes'), type: 'Wartung' }); v.history.unshift(`Wartung am ${fd.get('date')} gespeichert`); await storage.save(vehicles); renderAll(); });
      $('#partsForm').addEventListener('submit', async e => { e.preventDefault(); const fd = new FormData(e.currentTarget); partsInventory.unshift({ id: crypto?.randomUUID?.() || String(Date.now()), name: fd.get('name'), stock: fd.get('stock'), minStock: fd.get('minStock'), price: fd.get('price'), notes: fd.get('notes') }); await storage.save(vehicles); renderAll(); });

      $('#duplicateBtn').addEventListener('click', async () => {
        const newId = Math.max(...vehicles.map(x => x.id), 0) + 1;
        vehicles.unshift({ ...structuredClone(v), id: newId, vehicle: v.vehicle + ' Kopie', history: ['Datensatz dupliziert', ...(v.history || [])] });
        state.selectedId = newId;
        refreshBrandFilter();
        await storage.save(vehicles);
        renderAll();
      });
      $('#deleteBtn').addEventListener('click', async () => {
        if (!confirm(`Soll ${v.vehicle} wirklich gelöscht werden?`)) return;
        vehicles = vehicles.filter(item => item.id !== v.id);
        state.selectedIds.delete(v.id);
        state.selectedId = vehicles[0]?.id || null;
        refreshBrandFilter();
        await storage.save(vehicles);
        renderAll();
      });
    }

    function renderBoard() {
      const groups = ['OPEN','RESERVED','SOLD'];
      $('#kanbanBoard').innerHTML = groups.map(status => {
        const items = filteredVehicles().filter(v => v.status === status);
        return `<section class="lane"><h3>${status}</h3>${items.map(v => `<article class="card"><div style="display:flex;justify-content:space-between;gap:12px"><span class="tag">${v.brand}</span><span class="badge">${v.location}</span></div><strong>${v.vehicle}</strong><div class="muted">${v.vin}</div><div class="footer-actions"><button class="btn" data-move="${v.id}" data-next="${status === 'OPEN' ? 'RESERVED' : status === 'RESERVED' ? 'SOLD' : 'OPEN'}">Weiter</button></div></article>`).join('') || `<div class="card faint">Keine Fahrzeuge</div>`}</section>`;
      }).join('');
      $$('[data-move]').forEach(btn => btn.addEventListener('click', async () => {
        const vehicle = vehicles.find(v => v.id === Number(btn.dataset.move));
        vehicle.status = btn.dataset.next;
        vehicle.history.unshift(`Status auf ${btn.dataset.next} geändert`);
        await storage.save(vehicles);
        renderAll();
      }));
    }

    function renderMaintenance() {
      const list = filteredVehicles().filter(v => v.status !== 'SOLD').sort((a,b) => (daysUntil(a.maintenanceDue) ?? 9999) - (daysUntil(b.maintenanceDue) ?? 9999));
      $('#maintenanceList').innerHTML = list.map(v => {
        const due = daysUntil(v.maintenanceDue);
        const text = due === null ? 'Kein Termin' : due < 0 ? `Überfällig seit ${Math.abs(due)} Tagen` : `In ${due} Tagen fällig`;
        return `<article class="metric"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start"><div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="tag">${v.brand}</span><strong>${v.vehicle}</strong></div><p class="muted" style="margin:8px 0 0">${v.location} · ${v.vin}</p></div><span class="badge">${v.maintenanceDue || '—'}</span></div><div style="margin-top:12px">${text}</div></article>`;
      }).join('') || '<article class="metric">Keine offenen Wartungen.</article>';
    }

    function setView(view) {
      state.view = view;
      $$('.nav button').forEach(btn => btn.classList.toggle('active', btn.dataset.viewTarget === view));
      $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    }

    function parseCSV(csv) {
      const lines = csv.replace(/
/g, '').split('
').filter(Boolean);
      if (!lines.length) return [];
      const splitRow = row => {
        const out = []; let cur = ''; let q = false;
        for (let i=0; i<row.length; i++) {
          const ch = row[i], next = row[i+1];
          if (ch === '"' && q && next === '"') { cur += '"'; i++; continue; }
          if (ch === '"') { q = !q; continue; }
          if (ch === ';' && !q) { out.push(cur.trim()); cur = ''; continue; }
          cur += ch;
        }
        out.push(cur.trim());
        return out;
      };
      const headers = splitRow(lines.shift()).map(h => h.trim().toLowerCase());
      return lines.map(line => {
        const vals = splitRow(line);
        const obj = {}; headers.forEach((h, i) => obj[h] = (vals[i] ?? '').trim());
        return obj;
      });
    }

    function mergeImportedRows(rows) {
      const key = v => [v.brand, v.vehicle, v.vin, v.keyNumber].map(x => String(x || '').trim().toLowerCase()).filter(Boolean).join('|');
      const map = new Map(vehicles.map(v => [key(v), v]));
      let added = 0, updated = 0;
      rows.forEach(row => {
        const normalized = {
          brand: row.brand || row.marke || '',
          vehicle: row.fahrzeug || row.vehicle || row.name || '',
          status: String(row.status || 'OPEN').toUpperCase(),
          keyNumber: row['schlüsselnummer'] || row.schluesselnummer || row.keynumber || row.key_number || row.key || '—',
          vin: row['fahrgestellnummer'] || row.vin || '—',
          year: row.baujahr || row.year || '—',
          owner: row.besitzer || row.owner || '—',
          location: row.standort || row.location || 'Eingang',
          maintenanceDue: row['nächste wartung'] || row.naechste_wartung || row.maintenance_due || row.maintenance || '—',
          category: row.kategorie || row.category || 'Import',
          color: row.farbe || row.color || '—',
          notes: row.notiz || row.notes || 'Importiert aus Datei.',
          docs: ['Import'],
          history: ['Import aus Datei']
        };
        const k = key(normalized);
        if (map.has(k)) {
          const existing = map.get(k);
          for (const [prop, val] of Object.entries(normalized)) {
            if (val && val !== '—' && (!existing[prop] || existing[prop] === '—')) existing[prop] = val;
          }
          existing.history = ['Import abgeglichen', ...(existing.history || [])];
          updated += 1;
        } else if (normalized.brand && normalized.vehicle) {
          const id = Math.max(0, ...vehicles.map(v => v.id)) + 1 + added;
          const item = { id, ...normalized };
          vehicles.unshift(item);
          map.set(k, item);
          added += 1;
        }
      });
      return { added, updated };
    }

    function normalizeImportRow(row) {
      return {
        brand: row.brand || row.marke || '',
        vehicle: row.fahrzeug || row.vehicle || row.name || '',
        status: String(row.status || 'OPEN').toUpperCase(),
        keyNumber: row['schlüsselnummer'] || row.schluesselnummer || row.keynumber || row.key_number || row.key || '—',
        vin: row['fahrgestellnummer'] || row.vin || '—',
        year: row.baujahr || row.year || '—',
        owner: row.besitzer || row.owner || '—',
        location: row.standort || row.location || 'Eingang',
        maintenanceDue: row['nächste wartung'] || row.naechste_wartung || row.maintenance_due || row.maintenance || '—',
        category: row.kategorie || row.category || 'Import',
        color: row.farbe || row.color || '—',
        notes: row.notiz || row.notes || 'Importiert aus Datei.',
        docs: ['Import'],
        history: ['Import aus Datei']
      };
    }

    function previewImportRows(rows) {
      const key = v => [v.brand, v.vehicle, v.vin, v.keyNumber].map(x => String(x || '').trim().toLowerCase()).filter(Boolean).join('|');
      const map = new Map(vehicles.map(v => [key(v), v]));
      const preview = rows.map(row => {
        const normalized = normalizeImportRow(row);
        const k = key(normalized);
        const existing = map.get(k);
        if (!normalized.brand || !normalized.vehicle) return { ...normalized, kind: 'skip', reason: 'Pflichtfelder fehlen' };
        if (!existing) return { ...normalized, kind: 'add', reason: 'Neuer Datensatz' };
        const changed = ['year','owner','location','maintenanceDue','category','color','notes','status','keyNumber','vin'].some(prop => !existing[prop] && normalized[prop] && normalized[prop] !== '—');
        return { ...normalized, kind: changed ? 'update' : 'same', reason: changed ? 'Ergänzt ohne Überschreiben' : 'Schon vorhanden' };
      });
      return preview;
    }


    const fieldOptions = [
      ['brand','Brand'],['vehicle','Fahrzeug'],['status','Status'],['keyNumber','Schlüsselnummer'],['vin','Fahrgestellnummer'],['year','Baujahr'],['owner','Besitzer'],['location','Standort'],['maintenanceDue','Nächste Wartung'],['category','Kategorie'],['color','Farbe'],['notes','Notiz']
    ];

    function parseCSV(csv) {
      const lines = csv.replace(/
/g, '').split('
').filter(Boolean);
      if (!lines.length) return { headers: [], rows: [] };
      const splitRow = row => {
        const out = []; let cur = ''; let q = false;
        for (let i=0; i<row.length; i++) {
          const ch = row[i], next = row[i+1];
          if (ch === '"' && q && next === '"') { cur += '"'; i++; continue; }
          if (ch === '"') { q = !q; continue; }
          if (ch === ';' && !q) { out.push(cur.trim()); cur = ''; continue; }
          cur += ch;
        }
        out.push(cur.trim()); return out;
      };
      const headers = splitRow(lines.shift()).map(h => h.trim());
      const rows = lines.map(line => { const vals = splitRow(line); const obj = {}; headers.forEach((h, i) => obj[h] = (vals[i] ?? '').trim()); return obj; });
      return { headers, rows };
    }

    function loadImportPrefs() { try { return JSON.parse(localStorage.getItem(importPrefsKey) || '{}'); } catch { return {}; } }

    function saveImportPrefs(prefs) { localStorage.setItem(importPrefsKey, JSON.stringify(prefs)); }
    function resetImportPrefs() { localStorage.removeItem(importPrefsKey); }
    function loadImportLog() { try { return JSON.parse(localStorage.getItem(importLogKey) || '[]'); } catch { return []; } }
    function saveImportLog(log) { localStorage.setItem(importLogKey, JSON.stringify(log.slice(0, 20))); }

    function suggestMapping(headers) {
      const map = {};
      const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
      const rules = {brand:['brand','marke'],vehicle:['fahrzeug','vehicle','name'],status:['status'],keyNumber:['schlüsselnummer','schluesselnummer','keynumber','key'],vin:['fahrgestellnummer','vin'],year:['baujahr','year'],owner:['besitzer','owner'],location:['standort','location'],maintenanceDue:['nächstewartung','naechstewartung','maintenancedue','maintenance'],category:['kategorie','category'],color:['farbe','color'],notes:['notiz','notes']};
      headers.forEach(h => { const n = normalize(h); for (const [field, keys] of Object.entries(rules)) { if (keys.some(k => n.includes(k))) { map[h] = field; break; } } });
      return map;
    }

    function normalizeImportRow(row) {
      return { brand: row.brand || row.marke || '', vehicle: row.fahrzeug || row.vehicle || row.name || '', status: String(row.status || 'OPEN').toUpperCase(), keyNumber: row['schlüsselnummer'] || row.schluesselnummer || row.keynumber || row.key_number || row.key || '—', vin: row['fahrgestellnummer'] || row.vin || '—', year: row.baujahr || row.year || '—', owner: row.besitzer || row.owner || '—', location: row.standort || row.location || 'Eingang', maintenanceDue: row['nächste wartung'] || row.naechste_wartung || row.maintenance_due || row.maintenance || '—', category: row.kategorie || row.category || 'Import', color: row.farbe || row.color || '—', notes: row.notiz || row.notes || 'Importiert aus Datei.', docs: ['Import'], history: ['Import aus Datei'] };
    }

    function openMappingModal() {
      const old = document.getElementById('mappingModal'); if (old) old.remove();
      const modal = document.createElement('div');
      modal.id = 'mappingModal';
      modal.className = 'modal-backdrop open';
      modal.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mappingTitle">
          <div class="modal-head"><div><h3 id="mappingTitle" style="margin:0 0 6px">Import-Mapping</h3><p class="muted" style="margin:0">Ordne Quellspalten den Zielfeldern zu.</p></div><button class="iconbtn" id="closeMappingModal" aria-label="Schließen">✕</button></div>
          <div class="modal-body"><div class="field" style="margin-bottom:0"><label>Hinweis</label><strong>Fahrzeug und Brand sind Pflichtfelder. Gespeicherte Zuordnungen kannst du jederzeit zurücksetzen.</strong></div><div class="preview-grid"><section class="panel" style="box-shadow:none"><div class="panel-head"><div><h3>Quellspalten</h3><p>Aus der Datei erkannt</p></div></div><div style="padding:20px;display:grid;gap:12px" id="mappingRows"></div></section><section class="panel" style="box-shadow:none"><div class="panel-head"><div><h3>Vorschau</h3><p>Erste Zeile mit aktuellem Mapping</p></div></div><div style="padding:20px" id="mappingPreview"></div></section></div><div class="footer-actions"><button class="btn primary" id="runImportBtn">Import starten</button><button class="btn" id="resetMappingBtn">Mapping zurücksetzen</button><button class="btn" id="cancelMappingBtn">Abbrechen</button></div></div>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('#mappingRows').innerHTML = pendingHeaders.map(h => `<div class="field"><label>${h}</label><select class="mappingSelect" data-header="${h}">${fieldOptions.map(([v,t])=>`<option value="${v}" ${suggestionMap[h]===v?'selected':''}>${t}</option>`).join('')}</select></div>`).join('');
      const preview = () => { const map = {}; modal.querySelectorAll('.mappingSelect').forEach(sel => map[sel.dataset.header] = sel.value); const sample = pendingRows[0] || {}; const converted = {}; Object.entries(map).forEach(([src,dst]) => { if (dst) converted[dst] = sample[src] || ''; }); modal.querySelector('#mappingPreview').innerHTML = `<div class="grid">${fieldOptions.map(([v,t])=>`<div class="field"><label>${t}</label><strong>${converted[v] || '—'}</strong></div>`).join('')}</div>`; };
      modal.querySelectorAll('.mappingSelect').forEach(s => s.addEventListener('change', preview)); preview();
      modal.querySelector('#closeMappingModal').onclick = () => modal.remove();
      modal.querySelector('#resetMappingBtn').onclick = () => { resetImportPrefs(); suggestionMap = suggestMapping(pendingHeaders); modal.remove(); openMappingModal(); };
      modal.querySelector('#cancelMappingBtn').onclick = () => modal.remove();
      const validate = () => { const map = {}; modal.querySelectorAll('.mappingSelect').forEach(sel => map[sel.dataset.header] = sel.value); const required = ['brand','vehicle']; const missing = required.filter(f => !Object.values(map).includes(f)); const btn = modal.querySelector('#runImportBtn'); btn.disabled = missing.length > 0; btn.textContent = missing.length ? `Fehlend: ${missing.join(', ')}` : 'Import starten'; return { map, missing }; };
      const persist = () => { const prefs = loadImportPrefs(); prefs.lastMapping = validate().map; saveImportPrefs(prefs); };
      modal.querySelectorAll('.mappingSelect').forEach(s => s.addEventListener('change', () => { preview(); persist(); validate(); }));
      preview(); validate();
      modal.querySelector('#closeMappingModal').onclick = () => modal.remove();
      modal.querySelector('#resetMappingBtn').onclick = () => { resetImportPrefs(); suggestionMap = suggestMapping(pendingHeaders); modal.remove(); openMappingModal(); };
      modal.querySelector('#cancelMappingBtn').onclick = () => modal.remove();
      modal.querySelector('#runImportBtn').onclick = () => { const { map } = validate(); const imported = pendingRows.map(row => { const out = {}; Object.entries(map).forEach(([src, dst]) => { if (dst) out[dst] = row[src]; }); return out; }); pendingImport = previewImportRows(imported); const same = pendingImport.filter(r => r.kind === 'same').length; const add = pendingImport.filter(r => r.kind === 'add').length; const update = pendingImport.filter(r => r.kind === 'update').length; const skip = pendingImport.filter(r => r.kind === 'skip').length; $('#importSummary').textContent = `${add} neu · ${update} ergänzt · ${same} bereits vorhanden · ${skip} übersprungen`; $('#previewRows').innerHTML = pendingImport.slice(0, 40).map(r => `<tr><td class="diff-${r.kind}">${r.kind === 'add' ? 'Neu' : r.kind === 'update' ? 'Abgleich' : r.kind === 'same' ? 'Vorhanden' : 'Skip'}</td><td>${r.brand || '—'}</td><td>${r.vehicle || '—'}</td><td>${r.vin || '—'} / ${r.keyNumber || '—'}</td></tr>`).join(''); modal.remove(); };
    }

    function addMaintenanceEvent(event) { maintenanceEvents.unshift({ id: crypto?.randomUUID?.() || String(Date.now()), ...event }); maintenanceEvents = maintenanceEvents.slice(0, 200); }
    function exportBackup() { const payload = { vehicles, maintenanceEvents, partsInventory, exportedAt: new Date().toISOString(), app: 'fahrzeugliste-admin' }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `fahrzeugliste-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); }


    function renderCharts(byVehicle, trend, filteredEvents) {
      if (!window.Chart) return;
      Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
      chartInstances = {};
      const costCtx = document.getElementById('costChart');
      const trendCtx = document.getElementById('trendChart');
      const topLabels = byVehicle.map(v => v.vehicle);
      const topData = byVehicle.map(v => Number(v.cost.toFixed(2)));
      const trendLabels = trend.map(v => v.period);
      const trendData = trend.map(v => Number(v.cost.toFixed(2)));
      if (costCtx) chartInstances.cost = new Chart(costCtx, { type: 'bar', data: { labels: topLabels, datasets: [{ label: 'Kosten', data: topData, backgroundColor: '#2d6cdf' }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'nearest', intersect: true }, plugins: { legend: { display: false }, tooltip: { enabled: true, callbacks: { label: ctx => `Kosten: ${ctx.parsed.y?.toFixed?.(2) ?? ctx.parsed.x?.toFixed?.(2) ?? ctx.raw}` } } }, scales: { y: { beginAtZero: true } }, onClick: (evt, els) => { if (!els.length) return; const i = els[0].index; const vehicle = topLabels[i]; filterState.vehicle = vehicle; renderAll(); const panel = document.querySelector('[data-panel=dashboard-overview]'); if (panel) panel.scrollIntoView({behavior:'smooth', block:'start'}); } } });
      if (trendCtx) chartInstances.trend = new Chart(trendCtx, { type: 'line', data: { labels: trendLabels, datasets: [{ label: 'Kostenverlauf', data: trendData, borderColor: '#d97706', backgroundColor: 'rgba(217,119,6,.15)', tension: .35, fill: true, pointRadius: 4, pointHoverRadius: 7 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'nearest', intersect: true }, plugins: { legend: { display: false }, tooltip: { enabled: true, callbacks: { label: ctx => `Kosten: ${ctx.parsed.y?.toFixed?.(2) ?? ctx.raw}` } } }, scales: { y: { beginAtZero: true } }, onClick: (evt, els) => { if (!els.length) return; const i = els[0].index; const period = trendLabels[i]; filterState.period = period; renderAll(); const panel = document.querySelector('[data-panel=dashboard-overview]'); if (panel) panel.scrollIntoView({behavior:'smooth', block:'start'}); } } });
    }
    function exportCSV() {
      const rows = [['Brand','Fahrzeug','Status','Schlüsselnummer','Fahrgestellnummer','Baujahr','Besitzer','Standort','Nächste Wartung']].concat(filteredVehicles().map(v => [v.brand,v.vehicle,v.status,v.keyNumber,v.vin,v.year,v.owner,v.location,v.maintenanceDue]));
      const csv = rows.map(row => row.map(val => `"${String(val ?? '').replaceAll('"','""')}"`).join(';')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'fahrzeugliste-export.csv'; a.click(); URL.revokeObjectURL(url);
    }

    function renderAll() { renderStorageHint(); renderStats(); renderOverview(); renderInventory(); renderBoard(); renderMaintenance(); }
    function toggleTheme() { document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }

    function attachEvents() {
      ['input','change'].forEach(evt => {
        $('#searchInput').addEventListener(evt, renderAll);
        $('#brandFilter').addEventListener(evt, renderAll);
        $('#statusFilter').addEventListener(evt, renderAll);
      });
      $('#themeToggle').addEventListener('click', toggleTheme);
      $('#mobileThemeBtn').addEventListener('click', toggleTheme);
      $$('.nav button').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.viewTarget)));
      $('#addBtn').addEventListener('click', () => { setView('overview'); $('#createForm').scrollIntoView({behavior:'smooth', block:'start'}); });
      $('#exportBtn').addEventListener('click', exportCSV);
      const exportDataBtn = document.createElement('button'); exportDataBtn.className='btn'; exportDataBtn.id='exportDataBtn'; exportDataBtn.textContent='Daten ausgeben'; $('#backupBtn').before(exportDataBtn); exportDataBtn.addEventListener('click', () => { const payload = { vehicles, maintenanceEvents, partsInventory, importLog: loadImportLog(), exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `fahrzeugliste-daten-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); });
      const exportCsvBtn = document.createElement('button'); exportCsvBtn.className='btn'; exportCsvBtn.id='exportCsvBtn'; exportCsvBtn.textContent='CSV'; $('#exportDataBtn').before(exportCsvBtn); exportCsvBtn.addEventListener('click', () => exportCSV());
      const backupBtn = document.createElement('button'); backupBtn.className = 'btn'; backupBtn.id='backupBtn'; backupBtn.textContent='Backup JSON'; $('#exportBtn').before(backupBtn); backupBtn.addEventListener('click', exportBackup);
      const restoreBtn = document.createElement('button'); restoreBtn.className = 'btn'; restoreBtn.id='restoreBtn'; restoreBtn.textContent='Backup laden'; $('#backupBtn').after(restoreBtn);
      const restoreInput = document.createElement('input'); restoreInput.type='file'; restoreInput.accept='.json'; restoreInput.hidden=true; restoreInput.id='restoreInput'; document.body.appendChild(restoreInput);
      restoreBtn.addEventListener('click', () => restoreInput.click());
      restoreInput.addEventListener('change', async e => {
        const file = e.target.files?.[0]; if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          if (!Array.isArray(data.vehicles)) throw new Error('Ungültiges Backup');
          vehicles = data.vehicles;
          maintenanceEvents = Array.isArray(data.maintenanceEvents) ? data.maintenanceEvents : maintenanceEvents;
          partsInventory = Array.isArray(data.partsInventory) ? data.partsInventory : partsInventory;
          state.selectedId = vehicles[0]?.id || null;
          await storage.save(vehicles);
          const log = loadImportLog(); log.unshift({ file: file.name, type: 'Restore', added: vehicles.length, updated: 0, skipped: 0, at: new Date().toISOString() }); saveImportLog(log);
          refreshBrandFilter(); renderAll(); alert('Backup wiederhergestellt.');
        } catch (err) { alert('Backup konnte nicht geladen werden.'); }
        e.target.value = '';
      });
      $('#importBtn').addEventListener('click', () => $('#importFile').click());
      $('#importFile').addEventListener('change', async e => {
        const file = e.target.files?.[0]; if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        let rows = [];
        if (ext === 'json') {
          const data = JSON.parse(await file.text());
          rows = Array.isArray(data) ? data : (data.vehicles || data.rows || []);
        } else {
          rows = parseCSV(await file.text());
        }
        pendingImport = previewImportRows(rows);
        const modal = $('#importModal');
        const same = pendingImport.filter(r => r.kind === 'same').length;
        const add = pendingImport.filter(r => r.kind === 'add').length;
        const update = pendingImport.filter(r => r.kind === 'update').length;
        const skip = pendingImport.filter(r => r.kind === 'skip').length;
        $('#importSummary').textContent = `${add} neu · ${update} ergänzt · ${same} bereits vorhanden · ${skip} übersprungen`;
        $('#previewRows').innerHTML = pendingImport.slice(0, 40).map(r => `<tr><td class="diff-${r.kind}">${r.kind === 'add' ? 'Neu' : r.kind === 'update' ? 'Abgleich' : r.kind === 'same' ? 'Vorhanden' : 'Skip'}</td><td>${r.brand || '—'}</td><td>${r.vehicle || '—'}</td><td>${r.vin || '—'} / ${r.keyNumber || '—'}</td></tr>`).join('');
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        e.target.value = '';
      });
      $('#closeImportModal').addEventListener('click', () => { $('#importModal').classList.remove('open'); $('#importModal').setAttribute('aria-hidden', 'true'); });
      $('#cancelImportBtn').addEventListener('click', () => { $('#importModal').classList.remove('open'); $('#importModal').setAttribute('aria-hidden', 'true'); pendingImport = null; });
      $('#confirmImportBtn').addEventListener('click', async () => {
        if (!pendingImport) return;
        const key = v => [v.brand, v.vehicle, v.vin, v.keyNumber].map(x => String(x || '').trim().toLowerCase()).filter(Boolean).join('|');
        const map = new Map(vehicles.map(v => [key(v), v]));
        let added = 0, updated = 0;
        pendingImport.forEach(row => {
          if (row.kind === 'skip' || !row.brand || !row.vehicle) return;
          const normalized = normalizeImportRow(row);
          const k = key(normalized);
          if (map.has(k)) {
            const existing = map.get(k);
            for (const prop of ['year','owner','location','maintenanceDue','category','color','notes','status','keyNumber','vin']) {
              if (!existing[prop] || existing[prop] === '—') existing[prop] = normalized[prop];
            }
            existing.history = ['Import abgeglichen', ...(existing.history || [])];
            updated += 1;
          } else {
            const id = Math.max(0, ...vehicles.map(v => v.id)) + 1 + added;
            const item = { id, ...normalized };
            vehicles.unshift(item);
            map.set(k, item);
            added += 1;
          }
        });
        const fileName = ($('#importFile').files && $('#importFile').files[0] && $('#importFile').files[0].name) || 'import';
        const log = loadImportLog(); log.unshift({ file: fileName, type: 'Import', added, updated, skipped: skip, at: new Date().toISOString() }); saveImportLog(log);
        await storage.save(vehicles);
        pendingImport = null;
        $('#importModal').classList.remove('open');
        $('#importModal').setAttribute('aria-hidden', 'true');
        renderAll();
        alert(`Import fertig: ${added} neu, ${updated} ergänzt, nichts überschrieben.`);
      });
      $('#prefillCreate').addEventListener('click', () => {
        const f = $('#createForm');
        f.vehicle.value = 'E30 325i Cabrio'; f.brand.value = 'BMW'; f.status.value = 'OPEN'; f.keyNumber.value = '0005 DEM'; f.vin.value = 'WBAAA71090AE30001'; f.year.value = '1991 / 04'; f.owner.value = 'Interner Bestand'; f.location.value = 'Annahme'; f.maintenanceDue.value = '2026-07-01'; f.notes.value = 'Demodatensatz für Schnellanlage.';
      });
      $('#createForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const id = Math.max(...vehicles.map(x => x.id), 0) + 1;
        vehicles.unshift({ id, brand: fd.get('brand'), vehicle: fd.get('vehicle'), status: fd.get('status'), keyNumber: fd.get('keyNumber') || '—', vin: fd.get('vin') || '—', year: fd.get('year') || '—', owner: fd.get('owner') || '—', location: fd.get('location') || 'Eingang', maintenanceDue: fd.get('maintenanceDue') || '—', category: 'Neu', color: 'Offen', notes: fd.get('notes') || 'Neu angelegter Eintrag.', docs: ['Neuer Datensatz'], history: ['Eintrag angelegt'] });
        state.selectedId = id;
        e.currentTarget.reset();
        refreshBrandFilter();
        await storage.save(vehicles);
        setView('inventory');
        renderAll();
      });
      $('#selectAllBtn').addEventListener('click', () => { filteredVehicles().forEach(v => state.selectedIds.add(v.id)); renderAll(); });
      $('#selectAllCheckbox').addEventListener('change', e => { const checked = e.target.checked; filteredVehicles().forEach(v => checked ? state.selectedIds.add(v.id) : state.selectedIds.delete(v.id)); renderAll(); });
      $('#archiveSelectedBtn').addEventListener('click', async () => {
        vehicles.forEach(v => { if (state.selectedIds.has(v.id)) { v.status = 'SOLD'; v.history.unshift('Per Sammelaktion auf SOLD gesetzt'); } });
        state.selectedIds.clear();
        await storage.save(vehicles);
        renderAll();
      });

      const resetButton = document.createElement('button');
      resetButton.className = 'btn';
      resetButton.id = 'resetDataBtn';
      resetButton.textContent = 'Daten zurücksetzen';
      $('#exportBtn').after(resetButton);
      resetButton.addEventListener('click', async () => {
        if (!confirm('Alle gespeicherten Fahrzeugdaten zurücksetzen?')) return;
        await storage.reset();
        state.selectedId = seedVehicles[0].id;
        state.selectedIds.clear();
        refreshBrandFilter();
        renderAll();
      });
    }

    async function boot() {
      const data = await storage.load();
      vehicles = data.vehicles?.length ? data.vehicles : structuredClone(seedVehicles);
      state.selectedId = vehicles[0]?.id || null;
      refreshBrandFilter();
      attachEvents();
      renderAll();
      if (state.storageLabel === 'Demodaten geladen') await storage.save(vehicles);
    }

    boot();