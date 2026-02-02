// ============================================================
// ZIEKENHUIS ONTSLAGMANAGEMENT - VOLLEDIGE WORKFLOW
// Versie: 1.0 - 2 februari 2026
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  // ============================================================
  // CONFIGURATIE
  // ============================================================
  const CONFIG = {
    onePatientUrl: 'https://test.onepatient.bingli.be',
    zorgverlenersUrl: 'https://jvnds1969-png.github.io/Zorgverleners/providers.json'
  };

  // ============================================================
  // ZORGBUNDELS DATA (alle 16 probleemgebieden)
  // ============================================================
  const zorgbundels = [
    {
      nr: 1,
      naam: "Diabetes met verhoogd thuisrisico",
      medischLexicon: ["diabetes", "DM2", "DM1", "insuline", "hypoglycemie", "hyperglycemie", "HbA1c", "diabetische", "glucosecontrole", "suikerziekte", "metformine", "glycemie"],
      zorgverleners: ["Huisarts", "POH/diabetesverpleegkundige", "Thuisverpleging", "Diëtist", "Podotherapeut", "Apotheker"],
      klinisch: "Glycemies (nuchter/postprandiaal), symptomen hypo/hyper, voetstatus, gewicht.",
      educatie: "Hypo-/hyperherkenning + actieplan, correcte glucosemeting, medicatieschema.",
      monitoring: "Herhaalde hypo's, glycemie >20 mmol/L → huisarts; levensbedreiging → 112."
    },
    {
      nr: 2,
      naam: "Polyfarmacie & medicatieveiligheid",
      medischLexicon: ["polyfarmacie", "medicatie", "medicijn", "geneesmiddel", "bijwerkingen", "therapietrouw", "STOPP", "START", "pillen", "tablet", "interactie"],
      zorgverleners: ["Huisarts", "Huisapotheker", "Thuisverpleging", "POH/ouderen", "Geriater"],
      klinisch: "Bijwerkingen (sufheid, verwardheid, vallen), therapietrouw, aantal medicaties.",
      educatie: "Nieuw schema uitleggen, gevaar dubbelgebruik, teach-back methode.",
      monitoring: "Geen medicatieoverdracht, dubbelgebruik, ernstige bijwerkingen → huisarts + apotheker."
    },
    {
      nr: 3,
      naam: "Cardiovasculair hoog risico",
      medischLexicon: ["hypertensie", "bloeddruk", "cholesterol", "CVRM", "hartinfarct", "myocardinfarct", "CVA", "TIA", "coronair", "angina", "statine"],
      zorgverleners: ["Huisarts", "POH (CVRM)", "Cardioloog", "Diëtist", "Fysiotherapeut", "Apotheker"],
      klinisch: "Bloeddruk, lipiden, gewicht, rookstatus, CVRM-profiel.",
      educatie: "Persoonlijk risico uitleggen, belang leefstijl en medicatie.",
      monitoring: "Zeer hoge bloeddruk, nieuwe angina/TIA → huisarts; pijn op de borst → 112."
    },
    {
      nr: 4,
      naam: "Cardiovasculaire instabiliteit / collapsrisico",
      medischLexicon: ["atriumfibrilleren", "AF", "boezemfibrilleren", "ritmestoornis", "syncope", "collaps", "flauwvallen", "pacemaker", "ICD", "hypotensie", "bradycardie", "tachycardie"],
      zorgverleners: ["Huisarts", "Cardioloog", "Thuisverpleging", "Kinesitherapeut", "Ergotherapeut", "Alarmcentrale"],
      klinisch: "Bloeddruk (ook orthostatisch), pols/ritme, syncope-episodes.",
      educatie: "Herkenning pijn op borst, dyspnoe, syncope; veilig opstaan.",
      monitoring: "Syncope, ernstige hypotensie, ritmestoornis → huisarts; pijn op borst/dyspnoe → 112."
    },
    {
      nr: 5,
      naam: "Chronische respiratoire kwetsbaarheid (COPD/astma)",
      medischLexicon: ["COPD", "astma", "longaanval", "exacerbatie", "dyspnoe", "kortademig", "ademhalingsmoeilijkheden", "inhalatie", "puffer", "zuurstof", "emfyseem", "bronchitis", "saturatie"],
      zorgverleners: ["Huisarts", "POH/longverpleegkundige", "Longarts", "Fysiotherapeut", "Diëtist", "Apotheker"],
      klinisch: "Ademfrequentie, dyspnoe-score, saturatie, hoest/sputum.",
      educatie: "Actieplan, vroege exacerbatiesignalen, correcte inhalatietechniek, rookstop.",
      monitoring: "Ernstige dyspnoe, cyanose, verwardheid → 112; toenemende benauwdheid → huisarts."
    },
    {
      nr: 6,
      naam: "Metabool-renale kwetsbaarheid (CNI, hartfalen)",
      medischLexicon: ["nierinsufficiëntie", "CNI", "nierfalen", "eGFR", "creatinine", "hartfalen", "decompensatie", "oedeem", "vocht", "diuretica", "lasix", "furosemide"],
      zorgverleners: ["Huisarts", "Nefroloog", "Cardioloog", "POH", "Diëtist", "Apotheker", "Thuisverpleging"],
      klinisch: "eGFR, elektrolyten, bloeddruk, gewicht (dagelijks bij HF), oedeem, dyspnoe.",
      educatie: "Vocht- en zoutbeperking, tekenen decompensatie herkennen.",
      monitoring: "Hartfalen: +2kg in 3 dagen, ernstige dyspnoe → huisarts; snelle eGFR-daling → nefroloog."
    },
    {
      nr: 7,
      naam: "Functionele achteruitgang & valrisico",
      medischLexicon: ["valrisico", "gevallen", "val", "mobiliteit", "loopstoornis", "frailty", "kwetsbaar", "ADL", "sarcopenie", "rollator", "loophulpmiddel"],
      zorgverleners: ["Huisarts", "Kinesitherapeut", "Ergotherapeut", "Diëtist", "Thuisverpleging", "Maatschappelijk werker"],
      klinisch: "Mobiliteit (TUG-test), ADL/iADL, spierkracht, valincidenten, visus.",
      educatie: "Valrisico uitleggen, veilig bewegen, gebruik hulpmiddelen.",
      monitoring: "≥2 vallen/jaar, snel ADL-verlies → huisarts/kine; ernstige val met letsel → SEH."
    },
    {
      nr: 8,
      naam: "Ondervoeding & verminderde voedselinname",
      medischLexicon: ["ondervoeding", "malnutritie", "gewichtsverlies", "afgevallen", "eetlust", "anorexie", "BMI", "cachexie", "dysfagie", "slikproblemen", "sondevoeding"],
      zorgverleners: ["Diëtist", "Huisarts", "Thuisverpleging", "Logopedist", "Maatschappelijk werker"],
      klinisch: "Gewicht, MUST/SNAQ65+ screening, eetlust, intake, kauw-/slikproblemen.",
      educatie: "Belang eiwit/energie, kleine frequente maaltijden, verrijking.",
      monitoring: ">5kg verlies in 3 maanden, <50% intake, slikproblemen → huisarts + diëtist/logopedist."
    },
    {
      nr: 9,
      naam: "Cognitieve kwetsbaarheid",
      medischLexicon: ["dementie", "Alzheimer", "cognitief", "geheugen", "vergeetachtig", "verwardheid", "delirium", "desoriëntatie", "MMSE", "MCI"],
      zorgverleners: ["Huisarts", "Geriater", "Thuisverpleging", "Casemanager/dementiecoach", "Ergotherapeut", "Maatschappelijk werker"],
      klinisch: "Oriëntatie, geheugen, uitvoerende functies, ADL-zelfstandigheid.",
      educatie: "Uitleg geheugenproblemen, structuur en compensaties, veilig gedrag.",
      monitoring: "Acuut delier, wegloopgedrag, ernstige verwaarlozing → huisarts/spoed."
    },
    {
      nr: 10,
      naam: "Psychosociaal lijden & eenzaamheid",
      medischLexicon: ["depressie", "depressief", "somber", "angst", "angstig", "eenzaam", "isolement", "slaapproblemen", "insomnia", "suïcide", "suïcidaal", "rouw"],
      zorgverleners: ["Huisarts", "POH-GGZ", "Eerstelijnspsycholoog", "Maatschappelijk werker", "Welzijnsorganisatie"],
      klinisch: "Depressie-/angstscreening, suïcidaliteit, slaap, sociaal functioneren.",
      educatie: "Psycho-educatie over depressie/angst, coping, info over hulp.",
      monitoring: "Suïcidegedachten, ernstige depressie → huisarts/GGZ-crisis; acuut gevaar → 112."
    },
    {
      nr: 11,
      naam: "Mantelzorger-overbelasting",
      medischLexicon: ["mantelzorg", "mantelzorger", "overbelast", "caregiver", "zorglast", "respijtzorg", "uitputting"],
      zorgverleners: ["Huisarts", "Thuisverpleging", "Mantelzorgsteunpunt", "Maatschappelijk werker", "Psycholoog"],
      klinisch: "Belasting, draagkracht, eigen gezondheid mantelzorger.",
      educatie: "Risico's overbelasting, grenzen stellen, beschikbare ondersteuning.",
      monitoring: "Ernstige uitputting, agressie, verwaarlozing → huisarts/maatschappelijk werker."
    },
    {
      nr: 12,
      naam: "Veiligheid & angst om alleen te zijn",
      medischLexicon: ["valangst", "alleenwonend", "alleen", "onveilig", "nachtelijke onrust", "personenalarm", "valdetectie"],
      zorgverleners: ["Thuisverpleging", "Ergotherapeut", "Huisarts", "Alarmcentrale", "Maatschappelijk werker"],
      klinisch: "Valrisico, nachtelijke onrust, feitelijk gebruik alarm, angstniveau.",
      educatie: "Werking alarm, noodnummers, stappenplan bij incident.",
      monitoring: "Herhaalde vallen, paniekaanvallen → huisarts/ergotherapeut; ernstig letsel → 112."
    },
    {
      nr: 13,
      naam: "Palliatieve zorgnoden",
      medischLexicon: ["palliatief", "palliatie", "terminaal", "levenseinde", "comfort", "DNR", "wilsverklaring", "pijnbestrijding", "morfine"],
      zorgverleners: ["Huisarts", "Palliatief team", "Thuisverpleging", "Apotheker", "Diëtist", "Psycholoog", "Geestelijk verzorger"],
      klinisch: "Symptomen (pijn, dyspnoe, misselijkheid, angst), functionele status.",
      educatie: "Ziekteverloop, symptoomcontrole, wat te doen bij verslechtering.",
      monitoring: "Onvoldoende symptoomcontrole, refractaire onrust → huisarts/palliatief team."
    },
    {
      nr: 14,
      naam: "Incontinentie & delirium-risico",
      medischLexicon: ["incontinentie", "urineverlies", "plasmoeilijkheden", "katheter", "blaas", "delirium", "nachtelijke onrust", "verward"],
      zorgverleners: ["Huisarts", "Thuisverpleging", "Continentieverpleegkundige", "Kinesitherapeut", "Ergotherapeut"],
      klinisch: "Mictiepatroon, nachtelijke toiletgang, episodes delier/onrust.",
      educatie: "Gebruik incontinentiemateriaal, toiletgedrag, vroege deliersignalen.",
      monitoring: "Acute verwardheid, urineretentie, UWI met delier → huisarts/spoed."
    },
    {
      nr: 15,
      naam: "Ernstige zintuiglijke beperkingen",
      medischLexicon: ["slechtziend", "blind", "visus", "gehoorverlies", "slechthorend", "doof", "hoortoestel", "bril", "glaucoom", "cataract", "maculadegeneratie"],
      zorgverleners: ["Huisarts", "Oogarts", "Audioloog", "Thuisverpleging", "Ergotherapeut", "Maatschappelijk werker"],
      klinisch: "Functioneren met bril/hoortoestel, impact op ADL/veiligheid.",
      educatie: "Belang hulpmiddelen, onderhoud, aangepaste communicatie.",
      monitoring: "Plots visusverlies, onveilige situaties → oogarts/audioloog/huisarts."
    },
    {
      nr: 16,
      naam: "Verslaving / psychosociaal ontwrichtend gedrag",
      medischLexicon: ["alcohol", "alcoholmisbruik", "verslaving", "drugs", "intoxicatie", "ontwenning", "agressie", "huiselijk geweld"],
            zorgverleners: ["Huisarts", "CGG/verslavingszorg", "Maatschappelijk werker", "Thuisverpleging", "GGZ-crisisdienst"],
      klinisch: "Gebruikspatroon, intoxicaties, onthouding, veiligheid gezin.",
      educatie: "Motiverende gespreksvoering, risico's, behandelopties.",
      monitoring: "Agressie, suïcidaliteit, ernstige intoxicatie → spoed/politie/GGZ-crisis."
    }
  ];

  // ============================================================
  // PATIËNTEN DATA OPSLAG (localStorage)
  // ============================================================
  let patienten = JSON.parse(localStorage.getItem('zorgstart_patienten') || '[]');
  let patientCounter = patienten.length + 1;

  // ============================================================
  // DOM ELEMENTEN VINDEN
  // ============================================================
  
  // Zoek het bestaande file input element
  const fileInput = document.getElementById('dischargeDoc');
  
  // Zoek de upload button (meerdere manieren om robuust te zijn)
  const uploadBtn = document.querySelector('button.btn-primary') ||
                    document.querySelector('.btn-card') ||
                    Array.from(document.querySelectorAll('button')).find(function(btn) {
                      return btn.textContent.toLowerCase().includes('uploaden') ||
                             btn.textContent.toLowerCase().includes('document');
                    });

  // Zoek de patiënten tabel
  const patientenTabel = document.querySelector('.patients-table tbody') ||
                         document.querySelector('table tbody');

  // ============================================================
  // MODAL FUNCTIES
  // ============================================================
  
  function showModal(content) {
    var modal = document.getElementById('uploadModal');
    var modalBody = document.getElementById('modalBody');
    
    if (modal && modalBody) {
      modalBody.innerHTML = content;
      modal.style.display = 'flex';
    }
  }

  function hideModal() {
    var modal = document.getElementById('uploadModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function showZorgplanModal(zorgplanProfessional, zorgplanPatient) {
    var modal = document.getElementById('zorgplanModal');
    var content = document.getElementById('zorgplanContent');
    
    if (modal && content) {
      content.innerHTML = '<div id="professionalContent">' + zorgplanProfessional + '</div>' +
                          '<div id="patientContent" style="display:none;">' + zorgplanPatient + '</div>';
      modal.style.display = 'flex';
    }
  }

  // ============================================================
  // UPLOAD BUTTON EVENT LISTENER
  // ============================================================
  
  if (uploadBtn) {
    uploadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (fileInput) {
        fileInput.click();
      }
    });
  }

  // ============================================================
  // FILE INPUT CHANGE EVENT - HOOFDWORKFLOW
  // ============================================================
  
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      if (e.target.files.length === 0) return;
      
      var file = e.target.files[0];
      var fileName = file.name;
      
      // Start de workflow
      startUploadWorkflow(file, fileName);
      
      // Reset input voor volgende upload
      e.target.value = '';
    });
  }

  // ============================================================
  // UPLOAD WORKFLOW - STAP VOOR STAP
  // ============================================================
  
  function startUploadWorkflow(file, fileName) {
    
    // STAP 1: Toon voortgangsmodal
    showModal(
      '<h2 style="margin-top:0;">📄 Ontslagbrief verwerken</h2>' +
      '<p style="color:#666; margin-bottom:20px;">Bestand: <strong>' + fileName + '</strong></p>' +
      
      '<div class="progress-steps" style="margin-bottom:20px;">' +
        '<div class="progress-step completed" id="step1" style="display:flex; align-items:center; padding:8px 0; color:#10b981;">' +
          '<span style="margin-right:10px;">✓</span> Document geüpload' +
        '</div>' +
        '<div class="progress-step active" id="step2" style="display:flex; align-items:center; padding:8px 0; color:#3b82f6; font-weight:600;">' +
          '<span style="margin-right:10px;">⏳</span> Verzenden naar OnePatient...' +
        '</div>' +
        '<div class="progress-step" id="step3" style="display:flex; align-items:center; padding:8px 0; color:#666;">' +
          '<span style="margin-right:10px;">○</span> Medische gegevens extraheren' +
        '</div>' +
        '<div class="progress-step" id="step4" style="display:flex; align-items:center; padding:8px 0; color:#666;">' +
          '<span style="margin-right:10px;">○</span> Probleemgebieden detecteren' +
        '</div>' +
        '<div class="progress-step" id="step5" style="display:flex; align-items:center; padding:8px 0; color:#666;">' +
          '<span style="margin-right:10px;">○</span> Zorgplan genereren' +
        '</div>' +
      '</div>' +
      
      '<div style="width:100%; height:8px; background:#e5e7eb; border-radius:4px; margin-bottom:15px;">' +
        '<div id="progressFill" style="height:100%; width:20%; background:linear-gradient(90deg,#3b82f6,#10b981); border-radius:4px; transition:width 0.3s;"></div>' +
      '</div>' +
      
      '<p id="statusText" style="text-align:center; color:#3b82f6; margin:0;">Verbinden met OnePatient...</p>'
    );

    // STAP 2-5: Simuleer de workflow (in productie: echte API calls)
    simulateWorkflowSteps(file, fileName);
  }

  // ============================================================
  // WORKFLOW SIMULATIE (vervang door echte API calls in productie)
  // ============================================================
  
  function simulateWorkflowSteps(file, fileName) {
    var steps = [
      { id: 'step2', progress: 35, text: 'Document wordt geanalyseerd door OnePatient...', delay: 1500 },
      { id: 'step3', progress: 55, text: 'Medische gegevens worden geëxtraheerd...', delay: 1500 },
      { id: 'step4', progress: 75, text: 'Probleemgebieden worden gedetecteerd...', delay: 1500 },
      { id: 'step5', progress: 95, text: 'Zorgplan wordt gegenereerd...', delay: 1500 }
    ];

    var currentStep = 0;

    function processNextStep() {
      if (currentStep < steps.length) {
        var step = steps[currentStep];
        
        setTimeout(function() {
          updateStepUI(step.id, step.progress, step.text);
          currentStep++;
          processNextStep();
        }, step.delay);
        
      } else {
        // Alle stappen voltooid - verwerk resultaten
        setTimeout(function() {
          finishWorkflow(file, fileName);
        }, 1000);
      }
    }

    processNextStep();
  }

  function updateStepUI(stepId, progress, text) {
    // Update progress bar
    var progressFill = document.getElementById('progressFill');
    if (progressFill) {
      progressFill.style.width = progress + '%';
    }

    // Update status text
    var statusText = document.getElementById('statusText');
    if (statusText) {
      statusText.textContent = text;
    }

    // Mark previous steps as completed
    var allSteps = document.querySelectorAll('.progress-step');
    var foundCurrent = false;
    
    allSteps.forEach(function(step) {
      if (step.id === stepId) {
        foundCurrent = true;
        step.style.color = '#3b82f6';
        step.style.fontWeight = '600';
        step.querySelector('span').textContent = '⏳';
      } else if (!foundCurrent) {
        step.style.color = '#10b981';
        step.style.fontWeight = 'normal';
        step.querySelector('span').textContent = '✓';
      }
    });
  }

  // ============================================================
  // WORKFLOW VOLTOOIEN - RESULTATEN TONEN
  // ============================================================
  
  function finishWorkflow(file, fileName) {
    
    // Simuleer document tekst (in productie: uit OnePatient PHR)
    var simulatedText = generateSimulatedDocumentText(fileName);
    
    // Detecteer probleemgebieden op basis van lexicon
    var detectedBundels = detectProbleemgebieden(simulatedText);
    
    // Genereer patiëntgegevens
    var patientData = generatePatientData(fileName, detectedBundels);
    
    // Toon resultaten
    showResults(patientData, detectedBundels);
  }

  function generateSimulatedDocumentText(fileName) {
    // Simuleer tekst gebaseerd op bestandsnaam of random
    var conditions = [
      'diabetes mellitus type 2, hypoglycemie, polyfarmacie',
      'COPD GOLD III, dyspnoe bij inspanning, zuurstoftherapie',
      'hartfalen NYHA III, oedeem, diuretica, valrisico',
      'CVA, cognitieve stoornissen, ADL-hulp nodig, slikproblemen',
      'diabetes, hypertensie, polyfarmacie, valrisico, ondervoeding'
    ];
    
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  // ============================================================
  // PROBLEEMGEBIEDEN DETECTIE
  // ============================================================
  
  function detectProbleemgebieden(documentText) {
    var detected = [];
    var textLower = documentText.toLowerCase();

    zorgbundels.forEach(function(bundel) {
      var matchedTerms = [];
      
      bundel.medischLexicon.forEach(function(term) {
        if (textLower.indexOf(term.toLowerCase()) !== -1) {
          matchedTerms.push(term);
        }
      });

      if (matchedTerms.length > 0) {
        detected.push({
          bundel: bundel,
          matchedTerms: matchedTerms,
          score: matchedTerms.length
        });
      }
    });

    // Sorteer op score (meeste matches eerst)
    detected.sort(function(a, b) {
      return b.score - a.score;
    });

    return detected;
  }

  // ============================================================
  // PATIËNTGEGEVENS GENEREREN
  // ============================================================
  
  function generatePatientData(fileName, detectedBundels) {
    var randomNames = ['Janssens, Maria', 'Peeters, Jan', 'Maes, Anna', 'Willems, Karel', 'Claes, Elisabeth'];
    var randomDepartments = ['Cardiologie', 'Geriatrie', 'Interne', 'Neurologie', 'Pneumologie'];
    var randomDoctors = ['Dr. Vermeersch', 'Dr. De Smedt', 'Dr. Jacobs', 'Dr. Hendrickx', 'Dr. Wouters'];

    var today = new Date();
    var birthYear = 1940 + Math.floor(Math.random() * 30);
    var birthDate = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    return {
      id: 'PAT-' + Date.now(),
      nr: patientCounter++,
      naam: randomNames[Math.floor(Math.random() * randomNames.length)],
      afdeling: randomDepartments[Math.floor(Math.random() * randomDepartments.length)],
      geboortedatum: formatDate(birthDate),
      ontslagdatum: formatDate(today),
      specialist: randomDoctors[Math.floor(Math.random() * randomDoctors.length)],
      probleemgebieden: detectedBundels,
      bestandsnaam: fileName
    };
  }

  function formatDate(date) {
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
  }

  // ============================================================
  // RESULTATEN TONEN
  // ============================================================
  
  function showResults(patientData, detectedBundels) {
    
    var probleemHTML = '';
    var zorgverlenersSet = new Set();

    detectedBundels.forEach(function(item) {
      probleemHTML += '<span style="display:inline-block; background:#dcfce7; color:#166534; padding:4px 12px; border-radius:20px; font-size:14px; margin:4px;">' + 
                      item.bundel.naam + '</span>';
      
      item.bundel.zorgverleners.forEach(function(zv) {
        zorgverlenersSet.add(zv);
      });
    });

    if (detectedBundels.length === 0) {
      probleemHTML = '<span style="color:#666;">Geen specifieke probleemgebieden gedetecteerd</span>';
    }

    var zorgverlenersHTML = '';
    zorgverlenersSet.forEach(function(zv) {
      zorgverlenersHTML += '<span style="display:inline-block; background:#dbeafe; color:#1e40af; padding:4px 12px; border-radius:20px; font-size:14px; margin:4px;">' + zv + '</span>';
    });

    showModal(
      '<h2 style="margin-top:0; color:#10b981;">✅ Zorgplan gegenereerd!</h2>' +
      
      '<div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:20px;">' +
        '<p style="margin:0 0 5px 0;"><strong>Patiënt:</strong> ' + patientData.naam + '</p>' +
        '<p style="margin:0 0 5px 0;"><strong>Geboortedatum:</strong> ' + patientData.geboortedatum + '</p>' +
        '<p style="margin:0 0 5px 0;"><strong>Afdeling:</strong> ' + patientData.afdeling + '</p>' +
        '<p style="margin:0;">


