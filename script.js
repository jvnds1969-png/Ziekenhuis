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
      

