// ============================================================
// ZIEKENHUIS ONTSLAGMANAGEMENT - VOLLEDIGE WORKFLOW MET UI
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  // === ZORGBUNDELS DATA ===
  const zorgbundels = [
    { nr: 1, naam: "Diabetes met verhoogd thuisrisico", medischLexicon: ["diabetes","DM2","insuline","hypoglycemie","hyperglycemie","HbA1c","diabetische","glucosecontrole","suikerziekte"], zorgverleners: ["Huisarts","POH/diabetesverpleegkundige","Thuisverpleging","Diëtist","Apotheker"] },
    { nr: 2, naam: "Polyfarmacie & medicatieveiligheid", medischLexicon: ["polyfarmacie","medicatie","medicijn","bijwerkingen","therapietrouw","STOPP","START","pillen"], zorgverleners: ["Huisarts","Huisapotheker","Thuisverpleging"] },
    { nr: 3, naam: "Cardiovasculair hoog risico", medischLexicon: ["hypertensie","bloeddruk","cholesterol","CVRM","hartinfarct","CVA","TIA","coronair"], zorgverleners: ["Huisarts","POH (CVRM)","Cardioloog","Diëtist"] },
    { nr: 4, naam: "Cardiovasculaire instabiliteit", medischLexicon: ["atriumfibrilleren","AF","ritmestoornis","syncope","collaps","pacemaker","hypotensie"], zorgverleners: ["Huisarts","Cardioloog","Thuisverpleging"] },
    { nr: 5, naam: "COPD/Astma", medischLexicon: ["COPD","astma","longaanval","dyspnoe","kortademig","inhalatie","puffer","zuurstof","emfyseem"], zorgverleners: ["Huisarts","Longarts","Fysiotherapeut"] },
    { nr: 6, naam: "CNI/Hartfalen", medischLexicon: ["nierinsufficiëntie","CNI","eGFR","hartfalen","decompensatie","oedeem","diuretica"], zorgverleners: ["Huisarts","Nefroloog","Cardioloog","Diëtist"] },
    { nr: 7, naam: "Valrisico & functionele achteruitgang", medischLexicon: ["valrisico","gevallen","mobiliteit","loopstoornis","frailty","kwetsbaar","ADL","sarcopenie"], zorgverleners: ["Huisarts","Kinesitherapeut","Ergotherapeut","Thuisverpleging"] },
    { nr: 8, naam: "Ondervoeding", medischLexicon: ["ondervoeding","malnutritie","gewichtsverlies","eetlust","BMI","cachexie","dysfagie"], zorgverleners: ["Diëtist","Huisarts","Logopedist"] },
    { nr: 9, naam: "Cognitieve kwetsbaarheid", medischLexicon: ["dementie","Alzheimer","cognitief","geheugen","verwardheid","delirium","MMSE"], zorgverleners: ["Huisarts","Geriater","Thuisverpleging","Casemanager"] },
    { nr: 10, naam: "Psychosociaal lijden", medischLexicon: ["depressie","angst","somber","eenzaam","slaapproblemen","suïcide","rouw"], zorgverleners: ["Huisarts","POH-GGZ","Psycholoog","Maatschappelijk werker"] }
  ];

  // === PATIËNTEN DATA OPSLAG ===
  let patienten = JSON.parse(localStorage.getItem('zorgstart_patienten') || '[]');
  let patientCounter = patienten.length + 1;

  // === DOM ELEMENTEN ===
  const uploadBtn = document.querySelector('.btn-card:first-of-type') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('uploaden'));
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pdf,.doc,.docx,.txt';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // === MODAL FUNCTIES ===
  function showModal(content) {
    let modal = document.getElementById('uploadModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'uploadModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <span class="modal-close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
          <div id="modalBody"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    document.getElementById('modalBody').innerHTML = content;
    modal.style.display = 'flex';
  }

  function hideModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.style.display = 'none';
  }

  // === UPLOAD WORKFLOW ===
  if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileName = file.name;
    
    // Toon voortgangsmodal
    showModal(`
      <h2>📄 Ontslagbrief verwerken</h2>
      <p style="color:#666;">Bestand: ${fileName}</p>
      
      <div class="progress-steps">
        <div class="progress-step completed" id="step1">
          <span class="icon">✓</span> Document geüpload
        </div>
        <div class="progress-step active" id="step2">
          <span class="icon">⏳</span> Verzenden naar OnePatient...
        </div>
        <div class="progress-step" id="step3">
          <span class="icon">○</span> Medische gegevens extraheren
        </div>
        <div class="progress-step" id="step4">
          <span class="icon">○</span> Probleemgebieden detecteren
        </div>
        <div class="progress-step" id="step5">
          <span class="icon">○</span> Zorgplan genereren
        </div>
      </div>
      
      <div class="progress-bar">
        <div class="progress-bar-fill" id="progressFill" style="width: 20%"></div>
      </div>
      
      <p id="statusText" style="text-align:center; color:#3b82f6;">Verbinden met OnePatient...</p>
    `);

    // Simuleer de workflow stappen
    await simulateWorkflow(file, fileName);
    
    fileInput.value = '';
  });

  async function simulateWorkflow(file, fileName) {
    const steps = [
      { id: 'step2', progress: 35, text: 'Document wordt geanalyseerd door OnePatient...' },
      { id: 'step3', progress: 55, text: 'Medische gegevens worden geëxtraheerd...' },
      { id: 'step4', progress: 75, text: 'Probleemgebieden worden gedetecteerd...' },
      { id: 'step5', progress: 95, text: 'Zorgplan wordt gegenereerd...' }
    ];

    for (let i = 0; i < steps.length; i++) {
      await delay(1200);
      updateStep(steps[i].id, steps[i].progress, steps[i].text);
    }

    await delay(800);
    
    // Lees bestand en detecteer probleemgebieden
    const documentText = await readFileContent(file);
    const detectedBundels = detectProbleemgebieden(documentText);
    
    // Genereer patiëntgegevens (in productie uit OnePatient)
    const patientData = generatePatientData(fileName, detectedBundels);
    
    // Toon resultaat
    showResults(patientData, detectedBundels);
  }

  function updateStep(stepId, progress, text) {
    // Markeer vorige stap als completed
    const allSteps = document.querySelectorAll('.progress-step');
    allSteps.forEach(step => {
      if (step.classList.contains('active')) {
        step.classList.remove('active');
        step.classList.add('completed');
        step.querySelector('.icon').textContent = '✓';
      }
    });
    
    // Markeer huidige stap als active
    const currentStep = document.getElementById(stepId);
    if (currentStep) {
      currentStep.classList.add('active');
      currentStep.querySelector('.icon').textContent = '⏳';
    }
    
    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = progress + '%';
    
    // Update status text
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = text;
  }

  async function readFileContent(file) {
    // Voor demo: simuleer tekst extractie
    // In productie: gebruik PDF.js of server-side OCR
    return

