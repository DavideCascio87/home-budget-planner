let lastPercentField = null;
let budgetChart = null;

function euro(v) {
  return Number(v).toFixed(2).replace(".", ",") + " €";
}

function val(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return isNaN(v) ? 0 : v;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function attachInputListeners() {
  document.querySelectorAll("input, select").forEach(i => {
    i.removeEventListener("input", calcola);
    i.addEventListener("input", calcola);
    i.removeEventListener("change", calcola);
    i.addEventListener("change", calcola);
  });

  ["percNecessita", "percRisparmio", "percCrescita", "percSvago", "percGenerosita"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("focus", () => {
        lastPercentField = id;
      });
      el.addEventListener("input", () => {
        lastPercentField = id;
      });
    }
  });
}

function sommaSpeseAnnuali() {
  let totale = 0;
  document.querySelectorAll(".annual-amount").forEach(input => {
    const v = parseFloat(input.value);
    if (!isNaN(v)) totale += v;
  });
  return totale;
}

function getSpeseAnnuali() {
  const items = [];
  document.querySelectorAll("#annualList .annual-item").forEach(item => {
    const name = item.querySelector(".annual-name")?.value || "";
    const amount = item.querySelector(".annual-amount")?.value || "";
    items.push({ name, amount });
  });
  return items;
}

function setSpeseAnnuali(items) {
  const annualList = document.getElementById("annualList");
  annualList.innerHTML = "";

  items.forEach(spesa => {
    const wrapper = document.createElement("div");
    wrapper.className = "annual-item";
    wrapper.innerHTML = `
      <input type="text" class="annual-name" placeholder="Nome spesa" value="${spesa.name || ""}">
      <input type="number" class="annual-amount" placeholder="Importo annuale" value="${spesa.amount || ""}">
    `;
    annualList.appendChild(wrapper);
  });

  attachInputListeners();
}

function aggiungiSpesaAnnuale() {
  const annualList = document.getElementById("annualList");
  const wrapper = document.createElement("div");
  wrapper.className = "annual-item";
  wrapper.innerHTML = `
    <input type="text" class="annual-name" placeholder="Nome spesa">
    <input type="number" class="annual-amount" placeholder="Importo annuale">
  `;
  annualList.appendChild(wrapper);
  attachInputListeners();
}

function normalizzaPercentuali() {
  const ids = ["percNecessita", "percRisparmio", "percCrescita", "percSvago", "percGenerosita"];

  ids.forEach(id => {
    const el = document.getElementById(id);
    let v = parseFloat(el.value);
    if (isNaN(v) || v < 0) el.value = 0;
  });

  let totale = ids.reduce((sum, id) => sum + val(id), 0);

  if (totale > 100 && lastPercentField) {
    const current = document.getElementById(lastPercentField);
    const overflow = totale - 100;
    let nuovoValore = val(lastPercentField) - overflow;
    if (nuovoValore < 0) nuovoValore = 0;
    current.value = nuovoValore;
    totale = ids.reduce((sum, id) => sum + val(id), 0);
  }

  document.getElementById("percentUsed").innerText = totale.toFixed(0) + "%";
  document.getElementById("percentRemaining").innerText = (100 - totale).toFixed(0) + "%";
  document.getElementById("progressFill").style.width = Math.min(totale, 100) + "%";

  const message = document.getElementById("percentMessage");
  if (totale < 100) {
    message.innerText = `Ti manca ancora ${(100 - totale).toFixed(0)}% da distribuire.`;
  } else if (totale === 100) {
    message.innerText = "Percentuali complete.";
  } else {
    message.innerText = "Hai superato il 100%.";
  }
}

function aggiornaSemaforo(nonAssegnato, income, risparmioReale, risparmioIdeale) {
  const box = document.getElementById("statusBox");
  const emoji = document.getElementById("statusEmoji");
  const text = document.getElementById("statusText");

  box.className = "status-box";

  if (income === 0) {
    box.classList.add("status-neutral");
    emoji.textContent = "⚪";
    text.textContent = "Stato: Inserisci i dati";
    return;
  }

  if (nonAssegnato < 0) {
    box.classList.add("status-red");
    emoji.textContent = "🔴";
    text.textContent = "Stato: Stai sforando";
    return;
  }

  if (risparmioReale >= risparmioIdeale) {
    box.classList.add("status-green");
    emoji.textContent = "🟢";
    text.textContent = "Stato: Stai procedendo bene";
    return;
  }

  box.classList.add("status-yellow");
  emoji.textContent = "🟡";
  text.textContent = "Stato: Sei in equilibrio, ma puoi rafforzare il risparmio";
}

function calcola() {
  normalizzaPercentuali();

  const income = val("income");

  const pNec = val("percNecessita") / 100;
  const pRis = val("percRisparmio") / 100;
  const pCre = val("percCrescita") / 100;
  const pSva = val("percSvago") / 100;
  const pGenTot = val("percGenerosita") / 100;

  const bNec = income * pNec;
  const bRis = income * pRis;
  const bCre = income * pCre;
  const bSva = income * pSva;
  const bGen = income * pGenTot;

  let decima;
  let offerte;
  const pGenPercent = val("percGenerosita");

  if (pGenPercent >= 10) {
    decima = income * 0.10;
    offerte = bGen - decima;
    document.getElementById("decimaLabel").innerText = "✝️ Decima (fissa 10%)";
    document.getElementById("offertaLabel").innerText = `❤️ Offerta (ideale ${(pGenPercent - 10).toFixed(1)}%)`;
  } else {
    decima = bGen;
    offerte = 0;
    document.getElementById("decimaLabel").innerText = `✝️ Decima (copre tutto il ${pGenPercent.toFixed(1)}%)`;
    document.getElementById("offertaLabel").innerText = "❤️ Offerta (ideale 0%)";
  }

  const totaleAnnuale = sommaSpeseAnnuali();
  const quotaMensile = totaleAnnuale / 12;

  document.getElementById("necessita").innerText = euro(bNec);
  document.getElementById("totAnnuale").innerText = euro(totaleAnnuale);
  document.getElementById("quotaMensile").innerText = euro(quotaMensile);

  document.getElementById("risparmio").innerText = euro(bRis);
  document.getElementById("crescita").innerText = euro(bCre);
  document.getElementById("svago").innerText = euro(bSva);

  document.getElementById("decima").innerText = euro(decima);
  document.getElementById("offerte").innerText = euro(offerte);
  document.getElementById("generosita").innerText = euro(bGen);

  const sNec = val("spesaNecessita");
  const sRis = val("spesaRisparmio");
  const sCre = val("spesaCrescita");
  const sSva = val("spesaSvago");
  const sDec = val("spesaDecima");
  const sOff = val("spesaOfferte");
  const sGen = sDec + sOff;

  document.getElementById("totNecessita").innerText = euro(sNec);
  document.getElementById("restoNecessita").innerText = euro(bNec - sNec);

  document.getElementById("totRisparmio").innerText = euro(sRis);
  document.getElementById("restoRisparmio").innerText = euro(sRis - bRis);

  document.getElementById("totCrescita").innerText = euro(sCre);
  document.getElementById("restoCrescita").innerText = euro(bCre - sCre);

  document.getElementById("totSvago").innerText = euro(sSva);
  document.getElementById("restoSvago").innerText = euro(bSva - sSva);

  document.getElementById("totGenerosita").innerText = euro(sGen);
  document.getElementById("restoGenerosita").innerText = euro(sGen - bGen);

  const totaleInserito = sNec + sRis + sCre + sSva + sGen;
  const nonAssegnato = income - totaleInserito;

  document.getElementById("totaleEntrata").innerText = euro(income);
  document.getElementById("totaleInserito").innerText = euro(totaleInserito);
  document.getElementById("nonAssegnato").innerText = euro(nonAssegnato);

  aggiornaSemaforo(nonAssegnato, income, sRis, bRis);
}

function getFormData() {
  return {
    nome: document.getElementById("nome").value.trim(),
    cognome: document.getElementById("cognome").value.trim(),
    mese: document.getElementById("mese").value,
    anno: document.getElementById("anno").value,

    income: document.getElementById("income").value,

    percNecessita: document.getElementById("percNecessita").value,
    percRisparmio: document.getElementById("percRisparmio").value,
    percCrescita: document.getElementById("percCrescita").value,
    percSvago: document.getElementById("percSvago").value,
    percGenerosita: document.getElementById("percGenerosita").value,

    spesaNecessita: document.getElementById("spesaNecessita").value,
    spesaRisparmio: document.getElementById("spesaRisparmio").value,
    spesaCrescita: document.getElementById("spesaCrescita").value,
    spesaSvago: document.getElementById("spesaSvago").value,
    spesaDecima: document.getElementById("spesaDecima").value,
    spesaOfferte: document.getElementById("spesaOfferte").value,

    speseAnnuali: getSpeseAnnuali()
  };
}

function setFormData(data) {
  setValue("nome", data.nome || "");
  setValue("cognome", data.cognome || "");
  setValue("mese", data.mese || "");
  setValue("anno", data.anno || "");
  setValue("income", data.income || "");

  setValue("percNecessita", data.percNecessita || 60);
  setValue("percRisparmio", data.percRisparmio || 10);
  setValue("percCrescita", data.percCrescita || 5);
  setValue("percSvago", data.percSvago || 13);
  setValue("percGenerosita", data.percGenerosita || 12);

  setValue("spesaNecessita", data.spesaNecessita || "");
  setValue("spesaRisparmio", data.spesaRisparmio || "");
  setValue("spesaCrescita", data.spesaCrescita || "");
  setValue("spesaSvago", data.spesaSvago || "");
  setValue("spesaDecima", data.spesaDecima || "");
  setValue("spesaOfferte", data.spesaOfferte || "");

  if (data.speseAnnuali && Array.isArray(data.speseAnnuali)) {
    setSpeseAnnuali(data.speseAnnuali);
  }

  calcola();
}

function makeBudgetKey(data) {
  const nome = (data.nome || "famiglia").replace(/\s+/g, "_");
  const cognome = (data.cognome || "").replace(/\s+/g, "_");
  return `budget|${nome}|${cognome}|${data.anno}|${data.mese}`;
}

function makeBudgetLabel(data) {
  const fullName = `${data.nome || ""} ${data.cognome || ""}`.trim() || "Famiglia";
  return `${fullName} - ${data.mese} ${data.anno}`;
}

function saveMonth() {
  const data = getFormData();

  if (!data.mese || !data.anno) {
    alert("Inserisci mese e anno prima di salvare.");
    return;
  }

  const key = makeBudgetKey(data);
  localStorage.setItem(key, JSON.stringify(data));

  aggiornaListaMesi();
  aggiornaStatistiche();
  document.getElementById("savedMonths").value = key;

  alert("Mese salvato correttamente.");
}

function loadMonth() {
  const key = document.getElementById("savedMonths").value;
  if (!key) {
    alert("Seleziona un mese salvato.");
    return;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    alert("Mese non trovato.");
    return;
  }

  const data = JSON.parse(raw);
  setFormData(data);
}

function aggiornaListaMesi() {
  const select = document.getElementById("savedMonths");
  const currentValue = select.value;

  select.innerHTML = `<option value="">Seleziona mese salvato</option>`;

  Object.keys(localStorage)
    .filter(key => key.startsWith("budget|"))
    .sort()
    .forEach(key => {
      const raw = localStorage.getItem(key);
      if (!raw) return;

      try {
        const data = JSON.parse(raw);
        const option = document.createElement("option");
        option.value = key;
        option.textContent = makeBudgetLabel(data);
        select.appendChild(option);
      } catch (e) {}
    });

  if ([...select.options].some(opt => opt.value === currentValue)) {
    select.value = currentValue;
  }
}

function resetForm() {
  const conferma = confirm("Vuoi iniziare un nuovo mese? I dati non salvati andranno persi.");
  if (!conferma) return;

  setValue("nome", "");
  setValue("cognome", "");
  setValue("mese", "");
  setValue("anno", "");
  setValue("income", "");

  setValue("percNecessita", 60);
  setValue("percRisparmio", 10);
  setValue("percCrescita", 5);
  setValue("percSvago", 13);
  setValue("percGenerosita", 12);

  setValue("spesaNecessita", "");
  setValue("spesaRisparmio", "");
  setValue("spesaCrescita", "");
  setValue("spesaSvago", "");
  setValue("spesaDecima", "");
  setValue("spesaOfferte", "");

  setSpeseAnnuali([
    { name: "Bollo", amount: "" },
    { name: "Assicurazione", amount: "" },
    { name: "Tari", amount: "" }
  ]);

  document.getElementById("savedMonths").value = "";
  calcola();
}

function ensureChartJsLoaded() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossibile caricare Chart.js"));
    document.head.appendChild(script);
  });
}

async function aggiornaStatistiche() {
  let risparmioTot = 0;
  let speseTot = 0;
  let count = 0;
  const labels = [];
  const risparmi = [];

  Object.keys(localStorage)
    .filter(key => key.startsWith("budget|"))
    .sort()
    .forEach(key => {
      const raw = localStorage.getItem(key);
      if (!raw) return;

      try {
        const data = JSON.parse(raw);
        const risp = parseFloat(data.spesaRisparmio || 0);
        const spese = parseFloat(data.spesaNecessita || 0);

        risparmioTot += risp;
        speseTot += spese;
        count++;

        labels.push(`${data.mese || ""} ${data.anno || ""}`.trim());
        risparmi.push(risp);
      } catch (e) {}
    });

  document.getElementById("mediaRisparmio").innerText = count ? euro(risparmioTot / count) : euro(0);
  document.getElementById("mediaSpese").innerText = count ? euro(speseTot / count) : euro(0);

  try {
    await ensureChartJsLoaded();
  } catch (e) {
    return;
  }

  const canvas = document.getElementById("chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (budgetChart) {
    budgetChart.destroy();
    budgetChart = null;
  }

  budgetChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Risparmio mensile",
        data: risparmi,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

document.getElementById("addAnnualBtn").addEventListener("click", aggiungiSpesaAnnuale);
document.getElementById("saveBtn").addEventListener("click", saveMonth);
document.getElementById("loadBtn").addEventListener("click", loadMonth);
document.getElementById("resetBtn").addEventListener("click", resetForm);

attachInputListeners();
aggiornaListaMesi();
calcola();
aggiornaStatistiche();