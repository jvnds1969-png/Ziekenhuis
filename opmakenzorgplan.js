// ============================================================
// ZORGSTART - OPMAKEN ZORGPLAN
// Versie: 1.0 - 2 februari 2026
// Multi-tenant systeem met lokale opslag (IndexedDB)
// ============================================================

// ============================================================
// DATABASE CONFIGURATIE (IndexedDB)
// ============================================================

const DB_NAME = 'ZorgstartDB';
const DB_VERSION = 1;
let db = null;

// Database initialisatie
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // Ziekenhuizen store
            if (!database.objectStoreNames.contains('hospitals')) {
                const hospitalsStore = database.createObjectStore('hospitals', { keyPath: 'code' });
                hospitalsStore.createIndex('name', 'name', { unique: false });
            }
            
            // Gebruikers store
            if (!database.objectStoreNames.contains('users')) {
                const usersStore = database.createObjectStore('users', { keyPath: 'email' });
                usersStore.createIndex('hospitalCode', 'hospitalCode', { unique: false });
            }
            
            // Patienten store - uniek per ziekenhuis + INSZ
            if (!database.objectStoreNames.contains('patients')) {
                const patientsStore = database.createObjectStore('patients', { keyPath: 'uniqueId' });
                patientsStore.createIndex('hospitalCode', 'hospitalCode', { unique: false });
                patientsStore.createIndex('insz', 'insz', { unique: false });
                patientsStore.createIndex('hospital_insz', ['hospitalCode', 'insz'], { unique: true });
            }
            
            // Documenten store
            if (!database.objectStoreNames.contains('documents')) {
                const docsStore = database.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                docsStore.createIndex('patientId', 'patientId', { unique: false });
            }
        };
    });
}

// ============================================================
// ZORGBUNDELS DATA (16 probleemgebieden)
// ============================================================

const ZORGBUNDELS = [
    {
        nr: 1,
        naam: "Diabetes met verhoogd thuisrisico",
        medischLexicon: ["diabetes", "DM2", "DM1", "insuline", "hypoglycemie", "hyperglycemie", "HbA1c", "diabetische", "glucosecontrole", "suikerziekte", "metformine", "glycemie"],
        zorgverleners: ["Huisarts", "POH/diabetesverpleegkundige", "Thuisverpleging", "Dietist", "Podotherapeut", "Apotheker"],
        klinisch: "Glycemies (nuchter/postprandiaal), symptomen hypo/hyper, voetstatus, gewicht.",
        educatie: "Hypo-/hyperherkenning + actieplan, correcte glucosemeting, medicatieschema.",
        monitoring: "Herhaalde hypo's, glycemie >20 mmol/L -> huisarts; levensbedreiging -> 112."
    },
    {
        nr: 2,
        naam: "Polyfarmacie & medicatieveiligheid",
        medischLexicon: ["polyfarmacie", "medicatie", "medicijn", "geneesmiddel", "bijwerkingen", "therapietrouw", "STOPP", "START", "pillen", "tablet", "interactie"],
        zorgverleners: ["Huisarts", "Huisapotheker", "Thuisverpleging", "POH/ouderen", "Geriater"],
        klinisch: "Bijwerkingen (sufheid, verwardheid, vallen), therapietrouw, aantal medicaties.",
        educatie: "Nieuw schema uitleggen, gevaar dubbelgebruik, teach-back methode.",
        monitoring: "Geen medicatieoverdracht, dubbelgebruik, ernstige bijwerkingen -> huisarts + apotheker."
    },
    {
        nr: 3,
        naam: "Cardiovasculair hoog risico",
        medischLexicon: ["hypertensie", "bloeddruk", "cholesterol", "CVRM", "hartinfarct", "myocardinfarct", "CVA", "TIA", "coronair", "angina", "statine"],
        zorgverleners: ["Huisarts", "POH (CVRM)", "Cardioloog", "Dietist", "Fysiotherapeut", "Apotheker"],
        klinisch: "Bloeddruk, lipiden, gewicht, rookstatus, CVRM-profiel.",
        educatie: "Persoonlijk risico uitleggen, belang leefstijl en medicatie.",
        monitoring: "Zeer hoge bloeddruk, nieuwe angina/TIA -> huisarts; pijn op de borst -> 112."
    },
    {
        nr: 4,
        naam: "Functionele achteruitgang & valrisico",
        medischLexicon: ["valrisico", "gevallen", "val", "mobiliteit", "loopstoornis", "frailty", "kwetsbaar", "ADL", "sarcopenie", "rollator", "loophulpmiddel"],
        zorgverleners: ["Huisarts", "Kinesitherapeut", "Ergotherapeut", "Dietist", "Thuisverpleging", "Maatschappelijk werker"],
        klinisch: "Mobiliteit (TUG-test), ADL/iADL, spierkracht, valincidenten, visus.",
        educatie: "Valrisico uitleggen, veilig bewegen, gebruik hulpmiddelen.",
        monitoring: ">=2 vallen/jaar, snel ADL-verlies -> huisarts/kine; ernstige val met letsel -> SEH."
    },
    {
        nr: 5,
        naam: "Ondervoeding & verminderde voedselinname",
        medischLexicon: ["ondervoeding", "malnutritie", "gewichtsverlies", "afgevallen", "eetlust", "anorexie", "BMI", "cachexie", "dysfagie", "slikproblemen", "sondevoeding"],
        zorgverleners: ["Dietist", "Huisarts", "Thuisverpleging", "Logopedist", "Maatschappelijk werker"],
        klinisch: "Gewicht, MUST/SNAQ65+ screening, eetlust, intake, kauw-/slikproblemen.",
        educatie: "Belang eiwit/energie, kleine frequente maaltijden, verrijking.",
        monitoring: ">5kg verlies in 3 maanden, <50% intake, slikproblemen -> huisarts + dietist/logopedist."
    },
    {
        nr: 6,
        naam: "Cognitieve kwetsbaarheid",
        medischLexicon: ["dementie", "Alzheimer", "cognitief", "geheugen", "vergeetachtig", "verwardheid", "delirium", "desorientatie", "MMSE", "MCI"],
        zorgverleners: ["Huisarts", "Geriater", "Thuisverpleging", "Casemanager/dementiecoach", "Ergotherapeut", "Maatschappelijk werker"],
        klinisch: "Orientatie, geheugen, uitvoerende functies, ADL-zelfstandigheid.",
        educatie: "Uitleg geheugenproblemen, structuur en compensaties, veilig gedrag.",
        monitoring: "Acuut delier, wegloopgedrag, ernstige verwaarlozing -> huisarts/spoed."
    },
    {
        nr: 7,
        naam: "COPD/Astma respiratoir",
        medischLexicon: ["COPD", "astma", "longaanval", "exacerbatie", "dyspnoe", "kortademig", "ademhalingsmoeilijkheden", "inhalatie", "puffer", "zuurstof"],
        zorgverleners: ["Huisarts", "Longarts", "Thuisverpleging", "Fysiotherapeut", "Dietist"],
        klinisch: "Saturatie, ademfrequentie, hoesten, sputum.",
        educatie: "Inhalatietechniek, actieplan bij exacerbatie.",
        monitoring: "Ernstige dyspnoe -> huisarts; cyanose/verwardheid -> 112."
    },
    {
        nr: 8,
        naam: "Hartfalen",
        medischLexicon: ["hartfalen", "decompensatie", "oedeem", "vocht", "diuretica", "lasix", "furosemide", "NYHA"],
        zorgverleners: ["Huisarts", "Cardioloog", "Thuisverpleging", "Dietist", "Fysiotherapeut"],
        klinisch: "Gewicht (dagelijks), oedeem, dyspnoe, bloeddruk.",
        educatie: "Vocht- en zoutbeperking, dagelijks wegen, tekenen verslechtering.",
        monitoring: "+2kg in 3 dagen, toenemende dyspnoe -> huisarts; ernstig -> 112."
    }
];

// ============================================================
// SESSIE BEHEER
// ============================================================

let currentUser = null;
let currentHospital = null;
let currentPatientData = null;
let uploadedFile = null;

// ============================================================
// AUTHENTICATIE FUNCTIES
// ============================================================

async function login(hospitalCode, email, password) {
    const transaction = db.transaction(['users', 'hospitals'], 'readonly');
    const usersStore = transaction.objectStore('users');
    const hospitalsStore = transaction.objectStore('hospitals');
    
    return new Promise((resolve, reject) => {
        const userRequest = usersStore.get(email);
        userRequest.onsuccess = () => {
            const user = userRequest.result;
            if (user && user.hospitalCode === hospitalCode.toUpperCase() && user.password === password) {
                const hospitalRequest = hospitalsStore.get(hospitalCode.toUpperCase());
                hospitalRequest.onsuccess = () => {
                    currentUser = user;
                    currentHospital = hospitalRequest.result;
                    resolve({ user, hospital: hospitalRequest.result });
                };
            } else {
                reject(new Error('Ongeldige inloggegevens'));
            }
        };
    });
}

async function register(hospitalCode, hospitalName, userName, email, password) {
    const transaction = db.transaction(['users', 'hospitals'], 'readwrite');
    const usersStore = transaction.objectStore('users');
    const hospitalsStore = transaction.objectStore('hospitals');
    
    const code = hospitalCode.toUpperCase();
    
    // Controleer of ziekenhuis al bestaat
    return new Promise((resolve, reject) => {
        const hospitalRequest = hospitalsStore.get(code);
        hospitalRequest.onsuccess = () => {
            let hospital = hospitalRequest.result;
            if (!hospital) {
                // Nieuw ziekenhuis aanmaken
                hospital = { code, name: hospitalName, createdAt: new Date().toISOString() };
                hospitalsStore.add(hospital);
            }
            
            // Nieuwe gebruiker aanmaken
            const user = {
                email,
                name: userName,
                hospitalCode: code,
                password,
                role: 'medewerker',
                createdAt: new Date().toISOString()
            };
            
            const userRequest = usersStore.add(user);
            userRequest.onsuccess = () => {
                currentUser = user;
                currentHospital = hospital;
                resolve({ user, hospital });
            };
            userRequest.onerror = () => reject(new Error('E-mail bestaat al'));
        };
    });
}

function logout() {
    currentUser = null;
    currentHospital = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('authModal').style.display = 'flex';
}

// ============================================================
// PATIENT FUNCTIES - UNIEKE IDENTIFICATIE
// ============================================================

function generateUniquePatientId(hospitalCode, insz) {
    return `${hospitalCode}-${insz.replace(/[^0-9]/g, '')}`;
}

function validateINSZ(insz) {
    // Belgisch rijksregisternummer validatie
    const cleaned = insz.replace(/[^0-9]/g, '');
    if (cleaned.length !== 11) return false;
    
    // Checksum validatie (97 - modulo)
    const birthPart = cleaned.substring(0, 9);
    const checksum = parseInt(cleaned.substring(9, 11));
    
    // Voor personen geboren na 2000
    let calculated = 97 - (parseInt(birthPart) % 97);
    if (calculated === checksum) return true;
    
    // Voor personen geboren na 2000 (prefix 2)
    calculated = 97 - (parseInt('2' + birthPart) % 97);
    return calculated === checksum;
}

async function findExistingPatient(hospitalCode, insz) {
    const transaction = db.transaction(['patients'], 'readonly');
    const store = transaction.objectStore('patients');
    const index = store.index('hospital_insz');
    
    return new Promise((resolve) => {
        const request = index.get([hospitalCode, insz.replace(/[^0-9]/g, '')]);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });
}

async function savePatient(patientData) {
    const uniqueId = generateUniquePatientId(patientData.hospitalCode, patientData.insz);
    const patient = { ...patientData, uniqueId, insz: patientData.insz.replace(/[^0-9]/g, '') };
    
    const transaction = db.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    
    return new Promise((resolve, reject) => {
        const request = store.put(patient);
        request.onsuccess = () => resolve(patient);
        request.onerror = () => reject(request.error);
    });
}

async function getPatientsByHospital(hospitalCode) {
    const transaction = db.transaction(['patients'], 'readonly');
    const store = transaction.objectStore('patients');
    const index = store.index('hospitalCode');
    
    return new Promise((resolve) => {
        const request = index.getAll(hospitalCode);
        request.onsuccess = () => resolve(request.result || []);
    });
}

// ============================================================
// DOCUMENT VERWERKING
// ============================================================

function detectProbleemgebieden(documentText) {
    const detected = [];
    const textLower = documentText.toLowerCase();
    
    ZORGBUNDELS.forEach(bundel => {
        const matchedTerms = [];
        bundel.medischLexicon.forEach(term => {
            if (textLower.includes(term.toLowerCase())) {
                matchedTerms.push(term);
            }
        });
        
        if (matchedTerms.length > 0) {
            detected.push({
                bundel,
                matchedTerms,
                score: matchedTerms.length
            });
        }
    });
    
    detected.sort((a, b) => b.score - a.score);
    return detected;
}

function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            // Voor TXT bestanden
            if (file.type === 'text/plain') {
                resolve(e.target.result);
            } else {
                // Voor PDF/DOC - simulatie (in productie: PDF.js of server-side)
                resolve(simulateDocumentText(file.name));
            }
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

function simulateDocumentText(fileName) {
    // Simuleer document inhoud voor demo
    const conditions = [
        'Patient met diabetes mellitus type 2, hypoglycemie klachten, polyfarmacie (12 medicaties)',
        'COPD GOLD III, frequente exacerbaties, dyspnoe bij inspanning, zuurstoftherapie thuis',
        'Hartfalen NYHA III, oedeem onderbenen, diuretica, valrisico door duizeligheid',
        'CVA links, cognitieve stoornissen, geheugenprobleem, ADL-hulp nodig, slikproblemen',
        'Diabetes, hypertensie, polyfarmacie, valrisico, ondervoeding, BMI 17'
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
}

// ============================================================
// ZORGPLAN GENERATIE
// ============================================================

function generateProfessionalZorgplan(patientData, detectedBundels) {
    let html = `<h2 style="color:#1e40af;">Zorgplan - ${patientData.naam}</h2>`;
    html += `<p><strong>INSZ:</strong> ${formatINSZ(patientData.insz)} | <strong>Geboortedatum:</strong> ${patientData.geboortedatum} | <strong>Ontslagdatum:</strong> ${patientData.ontslagdatum || 'N/B'}</p>`;
    html += '<hr style="margin:15px 0;">';
    
    detectedBundels.forEach(item => {
        html += `<div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:15px; border-left:4px solid #3b82f6;">`;
        html += `<h3 style="margin:0 0 10px; color:#1e40af;">${item.bundel.naam}</h3>`;
        html += `<p><strong>Klinische opvolging:</strong> ${item.bundel.klinisch}</p>`;
        html += `<p><strong>Educatie:</strong> ${item.bundel.educatie}</p>`;
        html += `<p><strong>Monitoring:</strong> ${item.bundel.monitoring}</p>`;
        html += `<p><strong>Zorgverleners:</strong> ${item.bundel.zorgverleners.join(', ')}</p>`;
        html += '</div>';
    });
    
    return html;
}

function generatePatientZorgplan(patientData, detectedBundels) {
    let html = '<div style="font-size:1.1rem; line-height:1.8;">';
    html += '<h2 style="color:#059669;">Hallo! Dit is jouw zorgplan</h2>';
    html += '<p>Je bent net uit het ziekenhuis gekomen. Hier staat wat er nu gaat gebeuren en wie je kan helpen.</p>';
    
    html += '<h3 style="color:#059669;">Waar gaat dit over?</h3>';
    detectedBundels.forEach(item => {
        html += `<div style="background:#f0fdf4; padding:15px; border-radius:8px; margin-bottom:15px;">`;
        html += `<h4 style="margin:0 0 10px;">${item.bundel.naam}</h4>`;
        html += '<p>Dit betekent dat we extra goed op je letten voor dit probleem.</p>';
        html += '</div>';
    });
    
    html += '<h3 style="color:#059669;">Wie kan je helpen?</h3>';
    html += '<ul>';
    const allZorgverleners = new Set();
    detectedBundels.forEach(item => {
        item.bundel.zorgverleners.forEach(zv => allZorgverleners.add(zv));
    });
    allZorgverleners.forEach(zv => { html += `<li>${zv}</li>`; });
    html += '</ul>';
    
    html += '<h3 style="color:#059669;">Wanneer moet je bellen?</h3>';
    html += '<p>Bel <strong>je huisarts</strong> als je je niet goed voelt of vragen hebt.</p>';
    html += '<p>Bel <strong>112</strong> als het echt heel erg is.</p>';
    html += '</div>';
    
    return html;
}

function formatINSZ(insz) {
    const clean = insz.replace(/[^0-9]/g, '');
    if (clean.length === 11) {
        return `${clean.slice(0,2)}.${clean.slice(2,4)}.${clean.slice(4,6)}-${clean.slice(6,9)}.${clean.slice(9,11)}`;
    }
    return insz;
}

function generatePatientAccessToken(patientId) {
    return btoa(patientId + ':' + Date.now()).replace(/=/g, '');
}

// ============================================================
// UI UPDATE FUNCTIES
// ============================================================

function showApp() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('hospitalName').textContent = currentHospital.name;
    document.getElementById('userName').textContent = currentUser.name;
    loadPatientsList();
}

function updateProgress(percent, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressText) progressText.textContent = text;
}

function showResults(detectedBundels) {
    const problemsDiv = document.getElementById('detectedProblems');
    const providersDiv = document.getElementById('recommendedProviders');
    
    problemsDiv.innerHTML = '';
    providersDiv.innerHTML = '';
    
    const allProviders = new Set();
    
    detectedBundels.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'problem-tag';
        tag.textContent = item.bundel.naam;
        problemsDiv.appendChild(tag);
        
        item.bundel.zorgverleners.forEach(zv => allProviders.add(zv));
    });
    
    allProviders.forEach(provider => {
        const tag = document.createElement('span');
        tag.className = 'provider-tag';
        tag.textContent = provider;
        providersDiv.appendChild(tag);
    });
    
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
}

async function loadPatientsList() {
    const patients = await getPatientsByHospital(currentHospital.code);
    const tbody = document.getElementById('patientsBody');
    tbody.innerHTML = '';
    
    patients.forEach((patient, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatINSZ(patient.insz)}</td>
            <td>${patient.naam}</td>
            <td>${patient.afdeling || '-'}</td>
            <td>${patient.geboortedatum || '-'}</td>
            <td>${patient.ontslagdatum || '-'}</td>
            <td><button class="btn-primary" onclick="showZorgplan('${patient.uniqueId}')">Bekijk</button></td>
            <td><button class="btn-secondary" onclick="sharePatientLink('${patient.uniqueId}')">Deel</button></td>
        `;
        tbody.appendChild(row);
    });
}

function showZorgplan(patientId) {
    // Implementatie voor zorgplan tonen
    alert('Zorgplan voor patient: ' + patientId);
}

function sharePatientLink(patientId) {
    const token = generatePatientAccessToken(patientId);
    const link = window.location.origin + window.location.pathname + '?patient=' + token;
    
    document.getElementById('patientLink').value = link;
    document.getElementById('patientLinkModal').style.display = 'flex';
}

// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Zorgstart Opmaken Zorgplan - Versie 1.0');
    
    // Database initialiseren
    await initDatabase();
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const isLogin = tab.dataset.tab === 'login';
            document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
            document.getElementById('registerForm').style.display = isLogin ? 'none' : 'block';
        });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await login(
                document.getElementById('loginHospital').value,
                document.getElementById('loginEmail').value,
                document.getElementById('loginPassword').value
            );
            showApp();
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await register(
                document.getElementById('regHospital').value,
                document.getElementById('regHospitalName').value,
                document.getElementById('regName').value,
                document.getElementById('regEmail').value,
                document.getElementById('regPassword').value
            );
            showApp();
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // File upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileUpload(e.dataTransfer.files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Process document button
    document.getElementById('processDocBtn').addEventListener('click', processDocument);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
    
    // Copy link button
    document.getElementById('copyLink')?.addEventListener('click', () => {
        document.getElementById('patientLink').select();
        document.execCommand('copy');
        alert('Link gekopieerd!');
    });
});

// ============================================================
// UPLOAD WORKFLOW
// ============================================================

function handleFileUpload(file) {
    uploadedFile = file;
    document.getElementById('patientInfoForm').style.display = 'block';
    document.getElementById('dischargeDate').valueAsDate = new Date();
}

async function processDocument() {
    if (!uploadedFile) return;
    
    const insz = document.getElementById('patientINSZ').value;
    
    // Valideer INSZ
    if (!validateINSZ(insz)) {
        alert('Ongeldig rijksregisternummer. Controleer het nummer.');
        return;
    }
    
    // Check voor bestaande patient
    const existingPatient = await findExistingPatient(currentHospital.code, insz);
    if (existingPatient) {
        if (!confirm(`Patient ${existingPatient.naam} bestaat al. Document toevoegen aan bestaand dossier?`)) {
            return;
        }
    }
    
    // Toon progress
    document.getElementById('patientInfoForm').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    
    // Simuleer verwerking
    updateProgress(20, 'Document wordt geupload...');
    await sleep(1000);
    
    updateProgress(40, 'Tekst wordt geextraheerd...');
    const text = await extractTextFromFile(uploadedFile);
    await sleep(1000);
    
    updateProgress(60, 'Probleemgebieden worden gedetecteerd...');
    const detected = detectProbleemgebieden(text);
    await sleep(1000);
    
    updateProgress(80, 'Zorgplan wordt gegenereerd...');
    await sleep(1000);
    
    // Patient data opslaan
    currentPatientData = {
        hospitalCode: currentHospital.code,
        insz: insz,
        naam: document.getElementById('patientName').value,
        geboortedatum: document.getElementById('patientDOB').value,
        afdeling: document.getElementById('patientDepartment').value,
        ontslagdatum: document.getElementById('dischargeDate').value,
        specialist: document.getElementById('specialist').value,
        probleemgebieden: detected,
        zorgplanProfessional: generateProfessionalZorgplan({ naam: document.getElementById('patientName').value, insz, geboortedatum: document.getElementById('patientDOB').value, ontslagdatum: document.getElementById('dischargeDate').value }, detected),
        zorgplanPatient: generatePatientZorgplan({ naam: document.getElementById('patientName').value }, detected),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email
    };
    
    updateProgress(100, 'Voltooid!');
    await sleep(500);
    
    // Toon resultaten
    showResults(detected);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Add to patients button
document.getElementById('addToPatients')?.addEventListener('click', async () => {
    if (currentPatientData) {
        await savePatient(currentPatientData);
        alert('Patient toegevoegd!');
        loadPatientsList();
        
        // Reset form
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('fileInput').value = '';
        uploadedFile = null;
        currentPatientData = null;
    }
});
