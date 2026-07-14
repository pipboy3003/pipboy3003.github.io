// Wiederverwendbares Monatskalender-Modul für Admin, Lehrer und Klassenbereich.
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const MONATSNAMEN = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const KLASSEN_FARBEN = ['#2563eb','#16a34a','#d97706','#9333ea','#dc2626','#0891b2','#65a30d','#be185d'];

function klasseFarbe(klasseId, alleKlassenIds){
  const idx = alleKlassenIds.indexOf(klasseId);
  return KLASSEN_FARBEN[idx % KLASSEN_FARBEN.length];
}

class MonatsKalender{
  constructor({containerId, klassen, termineProKlasse, onEventClick, aktiveKlassenIds}){
    this.container = document.getElementById(containerId);
    this.klassen = klassen;
    this.termineProKlasse = termineProKlasse;
    this.onEventClick = onEventClick || function(){};
    this.aktiveKlassenIds = aktiveKlassenIds || klassen.map(k => k.id);
    this.heute = new Date();
    this.anzeigeMonat = this.heute.getMonth();
    this.anzeigeJahr = this.heute.getFullYear();
    this.render();
  }
  toggleKlasse(klasseId){
    if(this.aktiveKlassenIds.includes(klasseId)) this.aktiveKlassenIds = this.aktiveKlassenIds.filter(id => id !== klasseId);
    else this.aktiveKlassenIds.push(klasseId);
    this.render();
  }
  vorherigerMonat(){ this.anzeigeMonat--; if(this.anzeigeMonat<0){this.anzeigeMonat=11;this.anzeigeJahr--;} this.render(); }
  naechsterMonat(){ this.anzeigeMonat++; if(this.anzeigeMonat>11){this.anzeigeMonat=0;this.anzeigeJahr++;} this.render(); }
  getTermineFuerTag(dateStr){
    const ergebnisse = [];
    this.aktiveKlassenIds.forEach(klasseId => {
      (this.termineProKlasse[klasseId] || []).filter(t => t.datum === dateStr).forEach(t => ergebnisse.push({...t, klasseId}));
    });
    return ergebnisse;
  }
  render(){
    const alleKlassenIds = this.klassen.map(k => k.id);
    const jahr = this.anzeigeJahr, monat = this.anzeigeMonat;
    const heuteStr = this.heute.toISOString().slice(0,10);
    const ersterTag = new Date(jahr, monat, 1);
    const letzterTag = new Date(jahr, monat+1, 0);
    const startOffset = (ersterTag.getDay()+6)%7;
    const anzahlTage = letzterTag.getDate();

    let chipsHtml = this.klassen.map(k => {
      const farbe = klasseFarbe(k.id, alleKlassenIds);
      const active = this.aktiveKlassenIds.includes(k.id);
      return `<span class="klasse-chip ${active?'active':''}" data-klasse="${k.id}"
        style="${active?`background:${farbe};border-color:${farbe}`:''}">${k.name}</span>`;
    }).join('');

    let gridHtml = WOCHENTAGE.map(w => `<div class="calendar-weekday">${w}</div>`).join('');
    for(let i=0;i<startOffset;i++) gridHtml += `<div class="calendar-day empty"></div>`;

    for(let tag=1; tag<=anzahlTage; tag++){
      const dateObj = new Date(jahr, monat, tag);
      const dateStr = dateObj.toISOString().slice(0,10);
      const istHeute = dateStr === heuteStr;
      const termine = this.getTermineFuerTag(dateStr);
      let eventsHtml = termine.map(t => {
        const farbe = klasseFarbe(t.klasseId, alleKlassenIds);
        const statusClass = t.abgesagt ? 'abgesagt' : (t.abgemeldet ? 'abgemeldet' : '');
        return `<div class="calendar-event ${statusClass}" style="background:${farbe}"
          data-klasse="${t.klasseId}" data-termin="${t.id||''}" data-datum="${dateStr}">
          ${t.zeit ? t.zeit.split(' ')[0]+' ' : ''}${t.thema||''}</div>`;
      }).join('');
      gridHtml += `<div class="calendar-day ${istHeute?'today':''}"><span class="calendar-day-num">${tag}</span>${eventsHtml}</div>`;
    }

    this.container.innerHTML = `
      <div class="calendar-wrap">
        <div class="calendar-head">
          <h3>${MONATSNAMEN[monat]} ${jahr}</h3>
          <div class="calendar-nav">
            <button data-nav="prev">← Vorheriger</button>
            <button data-nav="next">Nächster →</button>
            <button data-nav="pdf">🖨 Als PDF</button>
          </div>
        </div>
        <div class="calendar-klassen-filter">${chipsHtml}</div>
        <div class="calendar-grid">${gridHtml}</div>
      </div>`;

    this.container.querySelector('[data-nav="prev"]').addEventListener('click', () => this.vorherigerMonat());
    this.container.querySelector('[data-nav="next"]').addEventListener('click', () => this.naechsterMonat());
    this.container.querySelector('[data-nav="pdf"]').addEventListener('click', () => this.exportPDF());
    this.container.querySelectorAll('.klasse-chip').forEach(chip => chip.addEventListener('click', () => this.toggleKlasse(chip.dataset.klasse)));
    this.container.querySelectorAll('.calendar-event').forEach(ev => ev.addEventListener('click', (e) => {
      e.stopPropagation(); this.onEventClick(ev.dataset.klasse, ev.dataset.termin, ev.dataset.datum);
    }));
  }
  exportPDF(){
    const printWindow = window.open('', '_blank');
    const kalenderHtml = this.container.querySelector('.calendar-wrap').outerHTML;
    printWindow.document.write(`<html><head><title>Stundenplan ${MONATSNAMEN[this.anzeigeMonat]} ${this.anzeigeJahr}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;}.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
      .calendar-day{border:1px solid #ccc;min-height:80px;padding:4px;font-size:11px;}
      .calendar-weekday{font-weight:bold;text-align:center;padding:4px;}
      .calendar-event{border-radius:4px;padding:2px 4px;margin-bottom:2px;color:#fff;font-size:10px;}
      .calendar-nav,.calendar-klassen-filter{display:none;}</style></head>
      <body>${kalenderHtml}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }
}
