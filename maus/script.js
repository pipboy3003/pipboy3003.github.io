/*
================================================================================
CHANGELOG & TIMESTAMPS
Date / Time (CEST): 2026-09-30 17:53:00
Version: 1.0.1
Author: pipboy3003
Changes:
- Preloader-Logik überarbeitet:
  - 'removePreloader()' entfernt die Scroll-Sperre am body ('preloader-active').
  - Zweistufige Ausblendung: Erst CSS-Klasse 'fade-out', anschließend nach 600ms 'destroyed' (display: none).
  - Doppelte Absicherung: Sowohl 'window.onload' als auch ein harter Fallback-Timer (max. 2000ms), damit der Screen niemals hängenbleibt.
- Bestehende Logik für Kalender, Preiskalkulation und Buchung beibehalten.
================================================================================
*/

document.addEventListener('DOMContentLoaded', () => {

  // ================= 1. PRELOADER LOGIK & SCROLL-RELEASE =================
  const preloader = document.getElementById('preloader');
  let preloaderRemoved = false;

  function removePreloader() {
    if (preloaderRemoved || !preloader) return;
    preloaderRemoved = true;

    // Weiche Transition einleiten
    preloader.classList.add('fade-out');
    // Scrollen der Webseite freigeben
    document.body.classList.remove('preloader-active');

    // Nach Beendigung der CSS-Animation komplett aus dem Rendering entfernen
    setTimeout(() => {
      preloader.classList.add('destroyed');
    }, 600);
  }

  // Reguläres Ausblenden bei fertigem Ladevorgang
  if (document.readyState === 'complete') {
    setTimeout(removePreloader, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(removePreloader, 1000);
    });
  }

  // Absoluter Fail-Safe-Timer: Spätestens nach 2 Sekunden wird die Seite freigegeben
  setTimeout(removePreloader, 2000);

  // ================= 2. STATE & PREISE =================
  const packageData = {
    'day-spa': { name: 'Day Spa & Wellness', price: 149 },
    'beauty-glow': { name: 'Beauty Glow & Relax', price: 229 },
    'royal-overnight': { name: 'Royal Overnight Retreat', price: 399 }
  };

  const addonData = {
    'addonDinner': { name: 'Gourmet-Dinner (3 Gänge)', price: 65 },
    'addonChampagne': { name: 'Flasche Champagner & Erdbeeren', price: 45 },
    'addonOvernight': { name: 'Übernachtungs-Upgrade & Frühstück', price: 130 }
  };

  let selectedDate = null;

  // DOM Elemente
  const baseRadios = document.querySelectorAll('input[name="basePackage"]');
  const addonCheckboxes = document.querySelectorAll('.addons-list input[type="checkbox"]');
  const guestCountSelect = document.getElementById('guestCount');

  // Summary DOM
  const sumPackageName = document.getElementById('sumPackageName');
  const sumPackagePrice = document.getElementById('sumPackagePrice');
  const sumAddonsList = document.getElementById('sumAddonsList');
  const sumDate = document.getElementById('sumDate');
  const sumGuests = document.getElementById('sumGuests');
  const sumTotalPrice = document.getElementById('sumTotalPrice');

  // ================= 3. LIVE-PREISRECHNER =================
  function calculateTotal() {
    let currentTotal = 0;

    // Basispaket
    const checkedRadio = document.querySelector('input[name="basePackage"]:checked');
    const pkgKey = checkedRadio ? checkedRadio.value : 'day-spa';
    const pkg = packageData[pkgKey];

    currentTotal += pkg.price;
    sumPackageName.textContent = pkg.name;
    sumPackagePrice.textContent = `${pkg.price} €`;

    // Addons
    sumAddonsList.innerHTML = '';
    addonCheckboxes.forEach(cb => {
      if (cb.checked) {
        const item = addonData[cb.id];
        if (item) {
          currentTotal += item.price;
          const line = document.createElement('div');
          line.className = 'summary-line';
          line.innerHTML = `<span>+ ${item.name}</span><span>${item.price} €</span>`;
          sumAddonsList.appendChild(line);
        }
      }
    });

    // Gäste & Gesamtsumme
    sumGuests.textContent = guestCountSelect.value;
    sumTotalPrice.textContent = `${currentTotal} €`;

    return {
      packageName: pkg.name,
      totalPrice: currentTotal
    };
  }

  // Event Listener für Konfigurationsänderungen
  baseRadios.forEach(radio => radio.addEventListener('change', calculateTotal));
  addonCheckboxes.forEach(cb => cb.addEventListener('change', calculateTotal));
  guestCountSelect.addEventListener('change', calculateTotal);

  // Paket-Karten Klick-Verknüpfung
  const packageCards = document.querySelectorAll('.package-card');
  packageCards.forEach(card => {
    const btn = card.querySelector('.btn-select-package');
    btn.addEventListener('click', () => {
      const pkgType = card.getAttribute('data-package');
      const targetRadio = document.querySelector(`input[name="basePackage"][value="${pkgType}"]`);
      if (targetRadio) {
        targetRadio.checked = true;
        calculateTotal();
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ================= 4. INTERAKTIVER KALENDER =================
  const calendarDaysEl = document.getElementById('calendarDays');
  const calendarMonthYearEl = document.getElementById('calendarMonthYear');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');
  const displaySelectedDateEl = document.getElementById('displaySelectedDate');
  const selectedDateInput = document.getElementById('selectedDateInput');

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  function renderCalendar(month, year) {
    calendarDaysEl.innerHTML = '';
    calendarMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Erster Tag des Monats (Montag als 0)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay === 0 ? 7 : firstDay) - 1;

    // Leere Felder für Offset
    for (let i = 0; i < startOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day disabled';
      calendarDaysEl.appendChild(emptyCell);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Monatstage
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'cal-day';
      dayCell.textContent = day;

      const cellDate = new Date(year, month, day);

      // Vergangene Tage sperren
      if (cellDate < today) {
        dayCell.classList.add('disabled');
      } else {
        // Tag auswählen
        dayCell.addEventListener('click', () => {
          document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
          dayCell.classList.add('selected');

          const formattedDay = String(day).padStart(2, '0');
          const formattedMonth = String(month + 1).padStart(2, '0');
          selectedDate = `${formattedDay}.${formattedMonth}.${year}`;

          displaySelectedDateEl.textContent = selectedDate;
          selectedDateInput.value = selectedDate;
          sumDate.textContent = selectedDate;
        });

        // Markierung beibehalten, falls ausgewählt
        if (selectedDate === `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`) {
          dayCell.classList.add('selected');
        }
      }

      calendarDaysEl.appendChild(dayCell);
    }
  }

  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  });

  renderCalendar(currentMonth, currentYear);
  calculateTotal();

  // ================= 5. FORMULAR-VALIDIERUNG & VERSAND =================
  const feedbackEl = document.getElementById('bookingFeedback');

  function validateBooking() {
    const name = document.getElementById('guestName').value.trim();
    const phone = document.getElementById('guestPhone').value.trim();
    const email = document.getElementById('guestEmail').value.trim();

    if (!selectedDate) {
      feedbackEl.style.color = '#ff6b6b';
      feedbackEl.textContent = 'Bitte wählen Sie zuerst ein Datum im Kalender aus.';
      return null;
    }

    if (!name || !phone || !email) {
      feedbackEl.style.color = '#ff6b6b';
      feedbackEl.textContent = 'Bitte füllen Sie Name, Telefon und E-Mail aus.';
      return null;
    }

    feedbackEl.textContent = '';
    const calc = calculateTotal();

    const selectedAddons = [];
    addonCheckboxes.forEach(cb => {
      if (cb.checked) {
        selectedAddons.push(addonData[cb.id].name);
      }
    });

    return {
      name,
      phone,
      email,
      guests: guestCountSelect.value,
      notes: document.getElementById('guestNotes').value.trim() || 'Keine besonderen Angaben',
      date: selectedDate,
      package: calc.packageName,
      addons: selectedAddons.length > 0 ? selectedAddons.join(', ') : 'Keine Extras',
      total: calc.totalPrice
    };
  }

  // WhatsApp Button
  document.getElementById('btnBookWhatsApp').addEventListener('click', () => {
    const data = validateBooking();
    if (!data) return;

    // Telefonnummer im internationalen Format ohne führendes Plus
    const hostWhatsAppNumber = '491701234567';

    const message = `*Buchungsanfrage: MausTastisch Private Retreat* 🐭✨%0A%0A` +
      `*Name:* ${encodeURIComponent(data.name)}%0A` +
      `*Telefon:* ${encodeURIComponent(data.phone)}%0A` +
      `*E-Mail:* ${encodeURIComponent(data.email)}%0A` +
      `*Wunschtermin:* ${encodeURIComponent(data.date)}%0A` +
      `*Gäste:* ${encodeURIComponent(data.guests)}%0A%0A` +
      `*Gewähltes Paket:* ${encodeURIComponent(data.package)}%0A` +
      `*Zusatzoptionen:* ${encodeURIComponent(data.addons)}%0A` +
      `*Gesamtpreis:* ${data.total} €%0A%0A` +
      `*Wünsche / Notizen:* ${encodeURIComponent(data.notes)}`;

    window.open(`https://wa.me/${hostWhatsAppNumber}?text=${message}`, '_blank');
  });

  // E-Mail Button
  document.getElementById('btnBookMail').addEventListener('click', () => {
    const data = validateBooking();
    if (!data) return;

    const hostEmail = 'ihre-adresse@beispiel.de';

    const subject = encodeURIComponent(`Buchungsanfrage MausTastisch: ${data.package} am ${data.date}`);
    const body = encodeURIComponent(
      `Hallo,\n\nich möchte gerne folgendes Arrangement im MausTastisch Hideaway anfragen:\n\n` +
      `Name: ${data.name}\n` +
      `Telefon: ${data.phone}\n` +
      `E-Mail: ${data.email}\n` +
      `Wunschtermin: ${data.date}\n` +
      `Gäste: ${data.guests}\n\n` +
      `Paket: ${data.package}\n` +
      `Zusatzleistungen: ${data.addons}\n` +
      `Gesamtpreis: ${data.total} €\n\n` +
      `Wünsche / Notizen:\n${data.notes}\n\n` +
      `Ich freue mich über Ihre Bestätigung!`
    );

    window.location.href = `mailto:${hostEmail}?subject=${subject}&body=${body}`;
  });

});
