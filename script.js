// ============================================================
// ZORGSTART - ZIEKENHUIS ONTSLAGMANAGEMENT - VOLLEDIGE WORKFLOW
// script.js
// Versie: 2.0 - 3 maart 2026
// - Detectie probleemgebieden via lexicon
// - NIEUWE kwetsbaarheidsscore (ZKI 0-100) op basis van:
//   (gewicht per bundel) × (intensiteit per bundel, gecapt)
// - Modal + Zorgplan modal (professioneel + patiënt)
// - Patiëntenlijst + localStorage
// - Progress bar onderaan
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Zorgstart script geladen - versie 2.0 (ZKI kwetsbaarheidsscore)");

  // ============================================================
  // CONFIG
  // ============================================================
  const CONFIG = {
    onePatientUrl: "https://test.onepatient.bingli.be",
    zorgverlenersUrl: "https://jvnds1969-png.github.io/Zorgverleners/providers.json",
    storageKey: "zorgstart_patienten",
  };

  // ============================================================
  // DOM ELEMENTS
  // ============================================================
  const fileInput = document.getElementById("dischargeDoc");
  const uploadLabel = document.querySelector('label[for="dischargeDoc"]');
  const uploadModal = document.getElementById("uploadModal");
  const modalBody = document.getElementById("modalBody");
  const zorgplanModal = document.getElementById("zorgplanModal");
  const zorgplanContent = document.getElementById("zorgplanContent");

  // ============================================================
  // HELPERS - MODALS
  // ============================================================
  function showModal(contentHtml) {
    if (!uploadModal || !modalBody) return;
    modalBody.innerHTML = contentHtml;
    uploadModal.style.display = "flex";
  }

  function hideModal() {
    if (!uploadModal) return;
    uploadModal.style.display = "none";
  }

  function showZorgplanModal(proHtml, patHtml) {
    if (!zorgplanModal || !zorgplanContent) return;

    zorgplanContent.innerHTML =
      '<div id="professionalContent">' +
      proHtml +
      "</div>" +
      '<div id="patientContent" style="display:none;">' +
      patHtml +
      "</div>";

    zorgplanModal.style.display = "flex";
  }

  // Close buttons
  document.querySelectorAll(".modal-close").forEach(function (closeBtn) {
    closeBtn.addEventListener("click", function () {
      const modal = this.closest(".modal");
      if (modal) modal.style.display = "none";
    });
  });

  // ============================================================
  // PROGRESS BAR (BOTTOM)
  // ============================================================
  function showProgressBar() {
    const existing = document.getElementById("zorgstart-progress");
    if (existing) existing.remove();

    const progressContainer = document.createElement("div");
    progressContainer.id = "zorgstart-progress";
    progressContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: white;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
      z-index: 9999;
      padding: 15px 20px;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const progressText = document.createElement("div");
    progressText.id = "progress-text";
    progressText.textContent = "Document wordt verwerkt...";
    progressText.style.cssText = "margin-bottom: 8px; font-size: 14px; color: #333;";

    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    `;

    const progressFill = document.createElement("div");
    progressFill.id = "progress-fill";
    progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      border-radius: 4px;
      transition: width 0.3s ease;
    `;

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressText);
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);
  }

  function updateProgressBar(progress, text) {
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    if (progressFill) progressFill.style.width = progress + "%";
    if (progressText) progressText.textContent = text || "";
  }

  function hideProgressBar() {
    const progressContainer = document.getElementById("zorgstart-progress");
    if (!progressContainer) return;
    setTimeout(() => progressContainer.remove(), 500);
  }

  // ============================================================
  // UPLOAD LABEL TRIGGER
  // ============================================================
  if (uploadLabel && fileInput) {
    uploadLabel.addEventListener("click", function (e) {
      e.preventDefault();
      fileInput.click();
    });
  } else {
    console.warn("⚠️ Upload label of file input niet gevonden (dischargeDoc).");
  }

  // ============================================================
  // ZORGBUNDELS (16) + GEWICHT (voor kwetsbaarheid)
  // gewicht: 3 = hoog, 2 = middel, 1 = lager
  // ============================================================
  const zorgbundels = [
    {
      nr: 1,
      naam: "Diabetes met verhoogd thuisrisico",
      gewicht: 2,
      medischLexicon: [
        "diabetes", "DM2", "DM1", "insuline", "hypoglycemie", "hyperglycemie",
        "HbA1c", "diabetische", "glucosecontrole", "suikerziekte", "metformine", "glycemie",
      ],
      zorgverleners: ["Huisarts", "POH/diabetesverpleegkundige", "Thuisverpleging", "Diëtist", "Podotherapeut", "Apotheker"],
      klinisch: "Glycemies (nuchter/postprandiaal), symptomen hypo/hyper, voetstatus, gewicht.",
      educatie: "Hypo-/hyperherkenning + actieplan, correcte glucosemeting, medicatieschema.",
      monitoring: "Herhaalde hypo's, glycemie >20 mmol/L → huisarts; levensbedreiging → 112.",
    },
    {
      nr: 2,
      naam: "Polyfarmacie & medicatieveiligheid",
      gewicht: 2,
      medischLexicon: ["polyfarmacie", "medicatie", "medicijn", "geneesmiddel", "bijwerkingen", "therapietrouw", "STOPP", "START", "pillen", "tablet", "interactie"],
      zorgverleners: ["Huisarts", "Huisapotheker", "Thuisverpleging", "POH/ouderen", "Geriater"],
      klinisch: "Bijwerkingen (sufheid, verwardheid, vallen), therapietrouw, aantal medicaties.",
      educatie: "Nieuw schema uitleggen, gevaar dubbelgebruik, teach-back methode.",
      monitoring: "Geen medicatieoverdracht, dubbelgebruik, ernstige bijwerkingen → huisarts + apotheker.",
    },
    {
      nr: 3,
      naam: "Cardiovasculair hoog risico",
      gewicht: 2,
      medischLexicon: ["hypertensie", "bloeddruk", "cholesterol", "CVRM", "hartinfarct", "myocardinfarct", "CVA", "TIA", "coronair", "angina", "statine"],
      zorgverleners: ["Huisarts", "POH (CVRM)", "Cardioloog", "Diëtist", "Fysiotherapeut", "Apotheker"],
      klinisch: "Bloeddruk, lipiden, gewicht, rookstatus, CVRM-profiel.",
      educatie: "Persoonlijk risico uitleggen, belang leefstijl en medicatie.",
      monitoring: "Zeer hoge bloeddruk, nieuwe angina/TIA → huisarts; pijn op de borst → 112.",
    },
    {
      nr: 4,
      naam: "Cardiovasculaire instabiliteit / collapsrisico",
      gewicht: 3,
      medischLexicon: ["atriumfibrilleren", "AF", "boezemfibrilleren", "ritmestoornis", "syncope", "collaps", "flauwvallen", "pacemaker", "ICD", "hypotensie", "bradycardie", "tachycardie"],
      zorgverleners: ["Huisarts", "Cardioloog", "Thuisverpleging", "Kinesitherapeut", "Ergotherapeut", "Alarmcentrale"],
      klinisch: "Bloeddruk (ook orthostatisch), pols/ritme, syncope-episodes.",
      educatie: "Herkenning pijn op borst, dyspnoe, syncope; veilig opstaan.",
      monitoring: "Syncope, ernstige hypotensie, ritmestoornis → huisarts; pijn op borst/dyspnoe → 112.",
    },
    {
      nr: 5,
      naam: "Chronische respiratoire kwetsbaarheid (COPD/astma)",
      gewicht: 3,
      medischLexicon: ["COPD", "astma", "longaanval", "exacerbatie", "dyspnoe", "kortademig", "ademhalingsmoeilijkheden", "inhalatie", "puffer", "zuurstof", "emfyseem", "bronchitis", "saturatie"],
      zorgverleners: ["Huisarts", "POH/longverpleegkundige", "Longarts", "Fysiotherapeut", "Diëtist", "Apotheker"],
      klinisch: "Ademfrequentie, dyspnoe-score, saturatie, hoest/sputum.",
      educatie: "Actieplan, vroege exacerbatiesignalen, correcte inhalatietechniek, rookstop.",
      monitoring: "Ernstige dyspnoe, cyanose, verwardheid → 112; toenemende benauwdheid → huisarts.",
    },
    {
      nr: 6,
      naam: "Metabool-renale kwetsbaarheid (CNI, hartfalen)",
      gewicht: 3,
      medischLexicon: ["nierinsufficiëntie", "CNI", "nierfalen", "eGFR", "creatinine", "hartfalen", "decompensatie", "oedeem", "vocht", "diuretica", "lasix", "furosemide"],
      zorgverleners: ["Huisarts", "Nefroloog", "Cardioloog", "POH", "Diëtist", "Apotheker", "Thuisverpleging"],
      klinisch: "eGFR, elektrolyten, bloeddruk, gewicht (dagelijks bij HF), oedeem, dyspnoe.",
      educatie: "Vocht- en zoutbeperking, tekenen decompensatie herkennen.",
      monitoring: "Hartfalen: +2kg in 3 dagen, ernstige dyspnoe → huisarts; snelle eGFR-daling → nefroloog.",
    },
    {
      nr: 7,
      naam: "Functionele achteruitgang & valrisico",
      gewicht: 1,
      medischLexicon: ["valrisico", "gevallen", "val", "mobiliteit", "loopstoornis", "frailty", "kwetsbaar", "ADL", "sarcopenie", "rollator", "loophulpmiddel"],
      zorgverleners: ["Huisarts", "Kinesitherapeut", "Ergotherapeut", "Diëtist", "Thuisverpleging", "Maatschappelijk werker"],
      klinisch: "Mobiliteit (TUG-test), ADL/iADL, spierkracht, valincidenten, visus.",
      educatie: "Valrisico uitleggen, veilig bewegen, gebruik hulpmiddelen.",
      monitoring: "≥2 vallen/jaar, snel ADL-verlies → huisarts/kine; ernstige val met letsel → SEH.",
    },
    {
      nr: 8,
      naam: "Ondervoeding & verminderde voedselinname",
      gewicht: 2,
      medischLexicon: ["ondervoeding", "malnutritie", "gewichtsverlies", "afgevallen", "eetlust", "anorexie", "BMI", "cachexie", "dysfagie", "slikproblemen", "sondevoeding"],
      zorgverleners: ["Diëtist", "Huisarts", "Thuisverpleging", "Logopedist", "Maatschappelijk werker"],
      klinisch: "Gewicht, MUST/SNAQ65+ screening, eetlust, intake, kauw-/slikproblemen.",
      educatie: "Belang eiwit/energie, kleine frequente maaltijden, verrijking.",
      monitoring: ">5kg verlies in 3 maanden, <50% intake, slikproblemen → huisarts + diëtist/logopedist.",
    },
    {
      nr: 9,
      naam: "Cognitieve kwetsbaarheid",
      gewicht: 3,
      medischLexicon: ["dementie", "Alzheimer", "cognitief", "geheugen", "vergeetachtig", "verwardheid", "delirium", "desoriëntatie", "MMSE", "MCI"],
      zorgverleners: ["Huisarts", "Geriater", "Thuisverpleging", "Casemanager/dementiecoach", "Ergotherapeut", "Maatschappelijk werker"],
      klinisch: "Oriëntatie, geheugen, uitvoerende functies, ADL-zelfstandigheid.",
      educatie: "Uitleg geheugenproblemen, structuur en compensaties, veilig gedrag.",
      monitoring: "Acuut delier, wegloopgedrag, ernstige verwaarlozing → huisarts/spoed.",
    },
    {
      nr: 10,
      naam: "Psychosociaal lijden & eenzaamheid",
      gewicht: 1,
      medischLexicon: ["depressie", "depressief", "somber", "angst", "angstig", "eenzaam", "isolement", "slaapproblemen", "insomnia", "suïcide", "suïcidaal", "rouw"],
      zorgverleners: ["Huisarts", "POH-GGZ", "Eerstelijnspsycholoog", "Maatschappelijk werker", "Welzijnsorganisatie"],
      klinisch: "Depressie-/angstscreening, suïcidaliteit, slaap, sociaal functioneren.",
      educatie: "Psycho-educatie over depressie/angst, coping, info over hulp.",
      monitoring: "Suïcidegedachten, ernstige depressie → huisarts/GGZ-crisis; acuut gevaar → 112.",
    },
    {
      nr: 11,
      naam: "Mantelzorger-overbelasting",
      gewicht: 2,
      medischLexicon: ["mantelzorg", "mantelzorger", "overbelast", "caregiver", "zorglast", "respijtzorg", "uitputting"],
      zorgverleners: ["Huisarts", "Thuisverpleging", "Mantelzorgsteunpunt", "Maatschappelijk werker", "Psycholoog"],
      klinisch: "Belasting, draagkracht, eigen gezondheid mantelzorger.",
      educatie: "Risico's overbelasting, grenzen stellen, beschikbare ondersteuning.",
      monitoring: "Ernstige uitputting, agressie, verwaarlozing → huisarts/maatschappelijk werker.",
    },
    {
      nr: 12,
      naam: "Veiligheid & angst om alleen te zijn",
      gewicht: 1,
      medischLexicon: ["valangst", "alleenwonend", "alleen", "onveilig", "nachtelijke onrust", "personenalarm", "valdetectie"],
      zorgverleners: ["Thuisverpleging", "Ergotherapeut", "Huisarts", "Alarmcentrale", "Maatschappelijk werker"],
      klinisch: "Valrisico, nachtelijke onrust, feitelijk gebruik alarm, angstniveau.",
      educatie: "Werking alarm, noodnummers, stappenplan bij incident.",
      monitoring: "Herhaalde vallen, paniekaanvallen → huisarts/ergotherapeut; ernstig letsel → 112.",
    },
    {
      nr: 13,
      naam: "Palliatieve zorgnoden",
      gewicht: 3,
      medischLexicon: ["palliatief", "palliatie", "terminaal", "levenseinde", "comfort", "DNR", "wilsverklaring", "pijnbestrijding", "morfine"],
      zorgverleners: ["Huisarts", "Palliatief team", "Thuisverpleging", "Apotheker", "Diëtist", "Psycholoog", "Geestelijk verzorger"],
      klinisch: "Symptomen (pijn, dyspnoe, misselijkheid, angst), functionele status.",
      educatie: "Ziekteverloop, symptoomcontrole, wat te doen bij verslechtering.",
      monitoring: "Onvoldoende symptoomcontrole, refractaire onrust → huisarts/palliatief team.",
    },
    {
      nr: 14,
      naam: "Incontinentie & delirium-risico",
      gewicht: 2,
      medischLexicon: ["incontinentie", "urineverlies", "plasmoeilijkheden", "katheter", "blaas", "delirium", "nachtelijke onrust", "verward"],
      zorgverleners: ["Huisarts", "Thuisverpleging", "Continentieverpleegkundige", "Kinesitherapeut", "Ergotherapeut"],
      klinisch: "Mictiepatroon, nachtelijke toiletgang, episodes delier/onrust.",
      educatie: "Gebruik incontinentiemateriaal, toiletgedrag, vroege deliersignalen.",
      monitoring: "Acute verwardheid, urineretentie, UWI met delier → huisarts/spoed.",
    },
    {
      nr: 15,
      naam: "Ernstige zintuiglijke beperkingen",
      gewicht: 1,
      medischLexicon: ["slechtziend", "blind", "visus", "gehoorverlies", "slechthorend", "doof", "hoortoestel", "bril", "glaucoom", "cataract", "maculadegeneratie"],
      zorgverleners: ["Huisarts", "Oogarts", "Audioloog", "Thuisverpleging", "Ergotherapeut", "Maatschappelijk werker"],
      klinisch: "Functioneren met bril/hoortoestel, impact op ADL/veiligheid.",
      educatie: "Belang hulpmiddelen, onderhoud, aangepaste communicatie.",
      monitoring: "Plots visusverlies, onveilige situaties → oogarts/audioloog/huisarts.",
    },
    {
      nr: 16,
      naam: "Verslaving / psychosociaal ontwrichtend gedrag",
      gewicht: 3,
      medischLexicon: ["alcohol", "alcoholmisbruik", "verslaving", "drugs", "intoxicatie", "ontwenning", "agressie", "huiselijk geweld"],
      zorgverleners: ["Huisarts", "CGG/verslavingszorg", "Maatschappelijk werker", "Thuisverpleging", "GGZ-crisisdienst"],
      klinisch: "Gebruikspatroon, intoxicaties, onthouding, veiligheid gezin.",
      educatie: "Motiverende gespreksvoering, risico's, behandelopties.",
      monitoring: "Agressie, suïcidaliteit, ernstige intoxicatie → spoed/politie/GGZ-crisis.",
    },
  ];

  // ============================================================
  // PATIËNTEN - STORAGE
  // ============================================================
  let patienten = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "[]");
  let patientCounter = patienten.length + 1;

  function savePatients() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(patienten));
  }

  // ============================================================
  // KWETSBAARHEID (ZKI) - NIEUWE SCORE (0-100)
  // - per bundel: gewicht × intensiteit
  // - intensiteit = min(score, 3) (cap)
  // - normaliseer naar 0-100
  // ============================================================
  function calculateZKI(detectedBundels) {
    if (!detectedBundels || detectedBundels.length === 0) return 0;

    let totaal = 0;

    detectedBundels.forEach((item) => {
      const gewicht = item?.bundel?.gewicht ?? 1;
      const intensiteit = Math.min(item?.score ?? 0, 3);
      totaal += gewicht * intensiteit;
    });

    // theoretisch maximum: 16 bundels × gewicht 3 × intensiteit 3 = 144
    const maxTheoretisch = 16 * 3 * 3;
    const index = Math.round((totaal / maxTheoretisch) * 100);

    return Math.max(0, Math.min(100, index));
  }

  function zkiMeta(score) {
    if (score < 20) return { label: "Laag", bg: "#dcfce7", fg: "#166534" };
    if (score < 40) return { label: "Mild verhoogd", bg: "#fef9c3", fg: "#854d0e" };
    if (score < 60) return { label: "Matig kwetsbaar", bg: "#fde68a", fg: "#78350f" };
    if (score < 80) return { label: "Hoog kwetsbaar", bg: "#fee2e2", fg: "#991b1b" };
    return { label: "Zeer hoog risico", bg: "#fecaca", fg: "#7f1d1d" };
  }

  function renderZKIBadge(score) {
    const meta = zkiMeta(score);
    return `
      <span style="
        display:inline-block;
        background:${meta.bg};
        color:${meta.fg};
        padding:4px 12px;
        border-radius:999px;
        font-size:14px;">
        ${meta.label} (${score})
      </span>`;
  }

  // ============================================================
  // FILE INPUT CHANGE - MAIN WORKFLOW
  // ============================================================
  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      console.log("📄 Document upload gestart");
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileName = file.name;

      showProgressBar();
      startUploadWorkflow(file, fileName);

      // reset for next upload
      e.target.value = "";
    });
  }

  // ============================================================
  // UPLOAD WORKFLOW (SIMULATIE)
  // ============================================================
  function startUploadWorkflow(file, fileName) {
    showModal(`
      <h2 style="margin-top:0;">📄 Ontslagbrief verwerken</h2>
      <p style="color:#666; margin-bottom:20px;">Bestand: <strong>${escapeHtml(fileName)}</strong></p>

      <div class="progress-steps" style="margin-bottom:20px;">
        <div class="progress-step completed" id="step1" style="display:flex; align-items:center; padding:8px 0; color:#10b981;">
          <span style="margin-right:10px;">✓</span> Document geüpload
        </div>
        <div class="progress-step active" id="step2" style="display:flex; align-items:center; padding:8px 0; color:#3b82f6; font-weight:600;">
          <span style="margin-right:10px;">⏳</span> Verzenden naar OnePatient...
        </div>
        <div class="progress-step" id="step3" style="display:flex; align-items:center; padding:8px 0; color:#666;">
          <span style="margin-right:10px;">○</span> Medische gegevens extraheren
        </div>
        <div class="progress-step" id="step4" style="display:flex; align-items:center; padding:8px 0; color:#666;">
          <span style="margin-right:10px;">○</span> Probleemgebieden detecteren
        </div>
        <div class="progress-step" id="step5" style="display:flex; align-items:center; padding:8px 0; color:#666;">
          <span style="margin-right:10px;">○</span> Zorgplan genereren
        </div>
      </div>

      <div style="width:100%; height:8px; background:#e5e7eb; border-radius:4px; margin-bottom:15px;">
        <div id="progressFill" style="height:100%; width:20%; background:linear-gradient(90deg,#3b82f6,#10b981); border-radius:4px; transition:width 0.3s;"></div>
      </div>

      <p id="statusText" style="text-align:center; color:#3b82f6; margin:0;">Verbinden met OnePatient...</p>
    `);

    simulateWorkflowSteps(file, fileName);
  }

  function simulateWorkflowSteps(file, fileName) {
    const steps = [
      { id: "step2", progress: 35, text: "Document wordt geanalyseerd door OnePatient...", delay: 900 },
      { id: "step3", progress: 55, text: "Medische gegevens worden geëxtraheerd...", delay: 900 },
      { id: "step4", progress: 75, text: "Probleemgebieden worden gedetecteerd...", delay: 900 },
      { id: "step5", progress: 95, text: "Zorgplan wordt gegenereerd...", delay: 900 },
    ];

    let current = 0;

    function next() {
      if (current < steps.length) {
        const step = steps[current];
        setTimeout(() => {
          updateStepUI(step.id, step.progress, step.text);
          current++;
          next();
        }, step.delay);
      } else {
        setTimeout(() => finishWorkflow(file, fileName), 700);
      }
    }

    next();
  }

  function updateStepUI(stepId, progress, text) {
    // bottom progress bar
    updateProgressBar(progress, text);

    // modal progress bar
    const progressFill = document.getElementById("progressFill");
    if (progressFill) progressFill.style.width = progress + "%";

    const statusText = document.getElementById("statusText");
    if (statusText) statusText.textContent = text;

    // step list icons
    const allSteps = document.querySelectorAll(".progress-step");
    let foundCurrent = false;

    allSteps.forEach((step) => {
      const icon = step.querySelector("span");
      if (step.id === stepId) {
        foundCurrent = true;
        step.style.color = "#3b82f6";
        step.style.fontWeight = "600";
        if (icon) icon.textContent = "⏳";
      } else if (!foundCurrent) {
        step.style.color = "#10b981";
        step.style.fontWeight = "normal";
        if (icon) icon.textContent = "✓";
      }
    });
  }

  function finishWorkflow(file, fileName) {
    // In productie: echte extractie-tekst uit OnePatient
    const simulatedText = generateSimulatedDocumentText(fileName);

    const detectedBundels = detectProbleemgebieden(simulatedText);

    const patientData = generatePatientData(fileName, detectedBundels);

    showResults(patientData, detectedBundels);

    hideProgressBar();
  }

  function generateSimulatedDocumentText(fileName) {
    const conditions = [
      "diabetes mellitus type 2, hypoglycemie, polyfarmacie",
      "COPD GOLD III, dyspnoe bij inspanning, zuurstoftherapie",
      "hartfalen NYHA III, oedeem, diuretica, valrisico",
      "CVA, cognitieve stoornissen, ADL-hulp nodig, slikproblemen",
      "diabetes, hypertensie, polyfarmacie, valrisico, ondervoeding",
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  // ============================================================
  // DETECTIE PROBLEEMGEBIEDEN (lexicon)
  // score per bundel = aantal gematchte termen
  // ============================================================
  function detectProbleemgebieden(documentText) {
    const detected = [];
    const textLower = (documentText || "").toLowerCase();

    zorgbundels.forEach((bundel) => {
      const matchedTerms = [];

      bundel.medischLexicon.forEach((term) => {
        if (textLower.indexOf(String(term).toLowerCase()) !== -1) {
          matchedTerms.push(term);
        }
      });

      if (matchedTerms.length > 0) {
        detected.push({
          bundel: bundel,
          matchedTerms: matchedTerms,
          score: matchedTerms.length,
        });
      }
    });

    detected.sort((a, b) => b.score - a.score);
    return detected;
  }

  // ============================================================
  // PATIËNT DATA
  // ============================================================
  function generatePatientData(fileName, detectedBundels) {
    const randomNames = ["Janssens, Maria", "Peeters, Jan", "Maes, Anna", "Willems, Karel", "Claes, Elisabeth"];
    const randomDepartments = ["Cardiologie", "Geriatrie", "Interne", "Neurologie", "Pneumologie"];
    const randomDoctors = ["Dr. Vermeersch", "Dr. De Smedt", "Dr. Jacobs", "Dr. Hendrickx", "Dr. Wouters"];

    const today = new Date();
    const birthYear = 1940 + Math.floor(Math.random() * 30);
    const birthDate = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    const zki = calculateZKI(detectedBundels);
    const meta = zkiMeta(zki);

    return {
      id: "PAT-" + Date.now(),
      nr: patientCounter++,
      naam: randomNames[Math.floor(Math.random() * randomNames.length)],
      afdeling: randomDepartments[Math.floor(Math.random() * randomDepartments.length)],
      geboortedatum: formatDate(birthDate),
      ontslagdatum: formatDate(today),
      specialist: randomDoctors[Math.floor(Math.random() * randomDoctors.length)],
      probleemgebieden: detectedBundels,
      bestandsnaam: fileName,

      // ✅ nieuwe “kwetsbaarheid”
      zkiScore: zki,
      zkiLabel: meta.label,
    };
  }

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // ============================================================
  // RESULTS MODAL
  // ============================================================
  function showResults(patientData, detectedBundels) {
    let probleemHTML = "";
    const zorgverlenersSet = new Set();

    detectedBundels.forEach((item) => {
      probleemHTML += `
        <span style="display:inline-block; background:#dcfce7; color:#166534; padding:4px 12px; border-radius:20px; font-size:14px; margin:4px;">
          ${escapeHtml(item.bundel.naam)}
        </span>`;

      item.bundel.zorgverleners.forEach((zv) => zorgverlenersSet.add(zv));
    });

    if (detectedBundels.length === 0) {
      probleemHTML = `<span style="color:#666;">Geen specifieke probleemgebieden gedetecteerd</span>`;
    }

    let zorgverlenersHTML = "";
    zorgverlenersSet.forEach((zv) => {
      zorgverlenersHTML += `
        <span style="display:inline-block; background:#dbeafe; color:#1e40af; padding:4px 12px; border-radius:20px; font-size:14px; margin:4px;">
          ${escapeHtml(zv)}
        </span>`;
    });

    showModal(`
      <h2 style="margin-top:0; color:#10b981;">✅ Zorgplan gegenereerd!</h2>

      <div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:20px;">
        <p style="margin:0 0 5px 0;"><strong>Patiënt:</strong> ${escapeHtml(patientData.naam)}</p>
        <p style="margin:0 0 5px 0;"><strong>Geboortedatum:</strong> ${escapeHtml(patientData.geboortedatum)}</p>
        <p style="margin:0 0 5px 0;"><strong>Afdeling:</strong> ${escapeHtml(patientData.afdeling)}</p>
        <p style="margin:0 0 5px 0;"><strong>Ontslagdatum:</strong> ${escapeHtml(patientData.ontslagdatum)}</p>
        <p style="margin:0;"><strong>Kwetsbaarheid (ZKI):</strong> ${renderZKIBadge(patientData.zkiScore)}</p>
      </div>

      <h3 style="margin:15px 0 10px; color:#1e40af;">Gedetecteerde probleemgebieden:</h3>
      <div style="margin-bottom:15px;">${probleemHTML}</div>

      <h3 style="margin:15px 0 10px; color:#1e40af;">Aanbevolen zorgverleners:</h3>
      <div style="margin-bottom:20px;">${zorgverlenersHTML || '<span style="color:#666;">Geen aanbevelingen</span>'}</div>

      <div style="display:flex; gap:10px; justify-content:center;">
        <button id="closeModalBtn" style="padding:10px 20px; background:#e5e7eb; border:none; border-radius:6px; cursor:pointer;">Sluiten</button>
        <button id="addPatientBtn" style="padding:10px 20px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">Toevoegen aan patiënten</button>
      </div>
    `);

    // listeners (modal content is just injected)
    setTimeout(() => {
      const addBtn = document.getElementById("addPatientBtn");
      const closeBtn = document.getElementById("closeModalBtn");

      if (closeBtn) closeBtn.addEventListener("click", hideModal);

      if (addBtn) {
        addBtn.addEventListener("click", function () {
          addPatientToTable(patientData, detectedBundels);
          hideModal();
        });
      }
    }, 0);
  }

  // ============================================================
  // TABLE: add patient
  // Assumptie: je table heeft kolommen incl. “Kwetsbaarheid”.
  // Als die kolom niet bestaat, proberen we hem dynamisch toe te voegen.
  // ============================================================
  function ensureKwetsbaarheidColumn() {
    const table = document.querySelector("table.patients-table");
    if (!table) return;

    const theadRow = table.querySelector("thead tr");
    if (!theadRow) return;

    const headers = Array.from(theadRow.querySelectorAll("th")).map((th) => th.textContent.trim().toLowerCase());
    const hasKwets = headers.includes("kwetsbaarheid") || headers.includes("zki") || headers.includes("kwetsbaarheid (zki)");

    if (!hasKwets) {
      // insert after Specialist if possible
      const ths = theadRow.querySelectorAll("th");
      let insertIndex = -1;
      ths.forEach((th, idx) => {
        if (th.textContent.trim().toLowerCase() === "specialist") insertIndex = idx + 1;
      });

      const newTh = document.createElement("th");
      newTh.textContent = "Kwetsbaarheid";

      if (insertIndex >= 0 && insertIndex < ths.length) {
        theadRow.insertBefore(newTh, ths[insertIndex]);
      } else {
        theadRow.appendChild(newTh);
      }
    }
  }

  function addPatientToTable(patientData, detectedBundels) {
    ensureKwetsbaarheidColumn();

    const tbody = document.querySelector("table.patients-table tbody") || document.querySelector("table tbody");
    if (!tbody) return;

    const zorgplanId = "zorgplan-" + Date.now();

    // check if kwetsbaarheid kolom bestaat
    const headerCount = (document.querySelectorAll("table.patients-table thead th").length || 0);

    // basic cells
    const baseCells = [
      `<td>${escapeHtml(String(patientData.nr))}</td>`,
      `<td>${escapeHtml(patientData.naam)}</td>`,
      `<td>${escapeHtml(patientData.afdeling)}</td>`,
      `<td>${escapeHtml(patientData.geboortedatum)}</td>`,
      `<td>${escapeHtml(patientData.ontslagdatum)}</td>`,
      `<td>${escapeHtml(patientData.specialist)}</td>`,
    ];

    // kwetsbaarheid cell
    const kwetsCell = `<td>${renderZKIBadge(patientData.zkiScore)}</td>`;

    // zorgplan + communicatie
    const tailCells = [
      `<td><button class="zorgplan-btn" data-id="${escapeHtml(zorgplanId)}" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Zorgplan</button></td>`,
      `<td>Siilo</td>`,
    ];

    const newRow = document.createElement("tr");

    // If headerCount suggests kwetsbaarheid is present, include it between specialist and zorgplan.
    // If not sure, still include it: better visible than missing.
    newRow.innerHTML = baseCells.join("") + kwetsCell + tailCells.join("");

    tbody.appendChild(newRow);

    // Save
    patientData.detectedBundels = detectedBundels;
    patienten.push(patientData);
    savePatients();

    // zorgplan button
    const zorgplanBtn = newRow.querySelector(".zorgplan-btn");
    if (zorgplanBtn) {
      zorgplanBtn.addEventListener("click", function () {
        showZorgplanForPatient(patientData, detectedBundels);
      });
    }
  }

  // ============================================================
  // ZORGPLAN MODAL (professional + patient)
  // ============================================================
  function showZorgplanForPatient(patientData, detectedBundels) {
    if (!zorgplanModal || !zorgplanContent) return;

    const professionalHTML = generateProfessionalZorgplan(patientData, detectedBundels);
    const patientHTML = generatePatientZorgplan(patientData, detectedBundels);

    showZorgplanModal(professionalHTML, patientHTML);

    // tab switching (re-bind every time)
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.onclick = function () {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.getAttribute("data-tab");
        const pro = document.getElementById("professionalContent");
        const pat = document.getElementById("patientContent");
        if (!pro || !pat) return;

        pro.style.display = tab === "professional" ? "block" : "none";
        pat.style.display = tab === "patient" ? "block" : "none";
      };
    });
  }

  function generateProfessionalZorgplan(patientData, detectedBundels) {
    let html = `<h2 style="color:#1e40af; margin-top:0;">Zorgplan - ${escapeHtml(patientData.naam)}</h2>`;
    html += `<p><strong>Geboortedatum:</strong> ${escapeHtml(patientData.geboortedatum)} | <strong>Ontslagdatum:</strong> ${escapeHtml(patientData.ontslagdatum)}</p>`;
    html += `<p><strong>Kwetsbaarheid (ZKI):</strong> ${renderZKIBadge(patientData.zkiScore)}</p>`;
    html += `<hr style="margin:15px 0;">`;

    if (!detectedBundels || detectedBundels.length === 0) {
      html += `<p style="color:#666;">Geen probleemgebieden gedetecteerd.</p>`;
      return html;
    }

    detectedBundels.forEach((item) => {
      html += `
        <div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:15px; border-left:4px solid #3b82f6;">
          <h3 style="margin:0 0 10px; color:#1e40af;">${escapeHtml(item.bundel.naam)}</h3>
          <p><strong>Klinische opvolging:</strong> ${escapeHtml(item.bundel.klinisch)}</p>
          <p><strong>Educatie:</strong> ${escapeHtml(item.bundel.educatie)}</p>
          <p><strong>Monitoring:</strong> ${escapeHtml(item.bundel.monitoring)}</p>
          <p><strong>Zorgverleners:</strong> ${escapeHtml(item.bundel.zorgverleners.join(", "))}</p>
        </div>`;
    });

    return html;
  }

  function generatePatientZorgplan(patientData, detectedBundels) {
    let html = `<div style="font-size:1.1rem; line-height:1.8;">`;
    html += `<h2 style="color:#059669;">Hallo! Dit is jouw zorgplan</h2>`;
    html += `<p>Je bent net uit het ziekenhuis gekomen. Hier staat wat er nu gaat gebeuren en wie je kan helpen.</p>`;
    html += `<p><strong>Kwetsbaarheid:</strong> ${renderZKIBadge(patientData.zkiScore)}</p>`;

    html += `<h3 style="color:#059669;">Waar gaat dit over?</h3>`;

    if (!detectedBundels || detectedBundels.length === 0) {
      html += `<p>Er werden geen specifieke problemen herkend in de ontslagbrief. Als je klachten hebt, bel je huisarts.</p>`;
    } else {
      detectedBundels.forEach((item) => {
        html += `
          <div style="background:#f0fdf4; padding:15px; border-radius:8px; margin-bottom:15px;">
            <h4 style="margin:0 0 10px;">${escapeHtml(item.bundel.naam)}</h4>
            <p>Dit betekent dat we extra goed op je letten voor dit probleem.</p>
          </div>`;
      });
    }

    html += `<h3 style="color:#059669;">Wie kan je helpen?</h3>`;
    html += `<p>Deze mensen kunnen je helpen:</p><ul>`;

    const allZorgverleners = new Set();
    (detectedBundels || []).forEach((item) => item.bundel.zorgverleners.forEach((zv) => allZorgverleners.add(zv)));
    if (allZorgverleners.size === 0) {
      html += `<li>Je huisarts</li>`;
    } else {
      allZorgverleners.forEach((zv) => {
        html += `<li>${escapeHtml(zv)}</li>`;
      });
    }

    html += `</ul>`;
    html += `<h3 style="color:#059669;">Wanneer moet je bellen?</h3>`;
    html += `<p>Bel <strong>je huisarts</strong> als je je niet goed voelt of vragen hebt.</p>`;
    html += `<p>Bel <strong>112</strong> als het echt heel erg is (pijn op de borst, niet kunnen ademen, ...).</p>`;
    html += `</div>`;
    return html;
  }

  // ============================================================
  // LOAD EXISTING PATIENTS
  // ============================================================
  function loadExistingPatients() {
    if (!patienten || patienten.length === 0) return;

    // We reconstrueren tabelregels met huidige structuur
    patienten.forEach((patient) => {
      // skip if already present (simple guard by nr + naam)
      const tbody = document.querySelector("table.patients-table tbody") || document.querySelector("table tbody");
      if (!tbody) return;

      const exists = Array.from(tbody.querySelectorAll("tr")).some((tr) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length < 2) return false;
        return tds[0].textContent.trim() === String(patient.nr) && tds[1].textContent.trim() === String(patient.naam);
      });

      if (exists) return;

      const detected = patient.detectedBundels || patient.probleemgebieden || [];
      // Ensure ZKI exists for legacy entries
      if (typeof patient.zkiScore !== "number") {
        patient.zkiScore = calculateZKI(detected);
        patient.zkiLabel = zkiMeta(patient.zkiScore).label;
        savePatients();
      }
      addPatientToTable(patient, detected);
    });
  }

  loadExistingPatients();

  // ============================================================
  // SECURITY: escape HTML for injected content
  // ============================================================
  function escapeHtml(str) {
    const s = String(str ?? "");
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
