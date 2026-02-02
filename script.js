// script.js - Ziekenhuis Ontslagmanagement
// Volledige workflow: Upload → OnePatient → Detectie → Zorgplan → Nieuwe patiëntrij

document.addEventListener('DOMContentLoaded', function() {
  
  // =============================================
  // CONFIGURATIE
  // =============================================
  const CONFIG = {
    onePatientUrl: 'https://test.onepatient.bingli.be',
    zorgbundelsUrl: 'https://jvnds1969-png.github.io/Zorgbundels-en-probleemgebieden/',
    zorgverlenersUrl: 'https://jvnds1969-png.github.io/Zorgverleners/providers.json'
  };

  // =============================================
  // ZORGBUNDELS DATA (uit je repository)
  // =============================================
  const zorgbundels = [
    {
      nr: 1,
      naam: "Diabetes met verhoogd thuisrisico",
      medischLexicon: ["diabetes mellitus", "DM2", "insulinedependent", "insulinetherapie", "orale antidiabetica", "hypoglycemie", "hyperglycemie", "labiele glycemie", "ontregelde glycemie", "verhoogd HbA1c", "diabetische neuropathie", "diabetische nefropathie", "diabetische voet", "glucosecontrole", "suikerziekte"],
      patientLexicon: ["suikerziekte", "suiker schommelt", "suiker te hoog", "suiker te laag", "bang voor hypo", "insuline niet goed"],
      klinisch: "Glycemies (nuchter/postprandiaal), symptomen hypo/hyper, voetstatus, gewicht.",
      educatie: "Hypo-/hyperherkenning + actieplan, correcte glucosemeting, medicatieschema.",
      functioneel: "Glucosemeter, strips, weekdoos, hulp bij voeding.",
      coordinatie: "Afstemming huisarts–POH–diëtist–thuisverpleging.",
      monitoring: "Herhaalde hypo's, glycemie >20, koorts + hoge glycemie → huisarts; levensbedreiging → 112.",
      zorgverleners: ["Huisarts", "POH/diabetesverpleegkundige", "Thuisverpleging", "Diëtist", "Podotherapeut", "Apotheker"]
    },
    {
      nr: 2,
      naam: "Polyfarmacie & medicatieveiligheid",
      medischLexicon: ["polyfarmacie", "multimedicatie", "≥5 medicaties", "medicatielijst", "therapiewijziging", "bijwerkingen", "nevenwerkingen", "medicatiefouten", "medicatie-ontrouw", "non-compliance", "interacties", "STOPP/START", "hoogrisico-medicatie"],
      patientLexicon: ["veel pillen", "weet niet waarvoor", "medicijnen veranderd", "suf van medicatie"],
      klinisch: "Bijwerkingen (sufheid, verwardheid, vallen), therapietrouw.",
      educatie: "Uitleg nieuw schema, gevaar dubbelgebruik, teach-back.",
      functioneel: "Weekdoos, visueel schema, alarmen, medicatierol.",
      coordinatie: "Warme overdracht AMO; medicatiereview huisarts–apotheker.",
      monitoring: "Geen AMO, dubbelgebruik, ernstige bijwerkingen → huisarts + apotheker.",
      zorgverleners: ["Huisarts", "Huisapotheker", "Thuisverpleging", "POH/ouderen", "Geriater"]
    },
    {
      nr: 3,
      naam: "Cardiovasculair hoog risico",
      medischLexicon: ["hypertensie", "hoge bloeddruk", "dyslipidemie", "hypercholesterolemie", "CVRM", "coronair lijden", "ischemische hartziekte", "myocardinfarct", "CVA", "TIA", "perifere vaatlijden", "obesitas", "BMI >30", "roker"],
      patientLexicon: ["bloeddruk te hoog", "hoge cholesterol", "rook nog", "beweeg niet", "TIA gehad"],
      klinisch: "Bloeddruk, lipiden, gewicht, rookstatus, CVRM-profiel.",
      educatie: "Uitleg persoonlijk risico, leefstijl, medicatie.",
      functioneel: "GLI/beweegprogramma, rookstop, gezonde voeding.",
      coordinatie: "CVRM-spreekuur met huisarts, diëtist, fysiotherapeut.",
      monitoring: "Zeer hoge bloeddruk, nieuwe angina/TIA → huisarts; pijn op borst → 112.",
      zorgverleners: ["Huisarts", "POH (CVRM)", "Diëtist", "Fysiotherapeut", "Apotheker", "Cardioloog"]
    },
    {
      nr: 4,
      naam: "Cardiovasculaire instabiliteit / collapsrisico",
      medischLexicon: ["atriumfibrilleren", "AF", "hartritmestoornis", "tachycardie", "bradycardie", "syncope", "presyncope", "collaps", "hypotensie", "orthostatische hypotensie", "ECG-afwijkingen", "pacemaker", "ICD"],
      patientLexicon: ["plots duizelig", "hart slaat raar", "flauwgevallen", "helemaal slap", "bang alleen te zijn door hart"],
      klinisch: "Bloeddruk orthostatisch, pols/ritme, syncope-episodes.",
      educatie: "Herkenning pijn op borst, dyspnoe, syncope; veilig opstaan.",
      functioneel: "Mobiliteitshulpmiddelen, veilige omgeving, personenalarm.",
      coordinatie: "Afstemming huisarts–cardioloog–thuisverpleging.",
      monitoring: "Syncope, ernstige hypotensie, val met letsel → huisarts; pijn op borst → 112.",
      zorgverleners: ["Huisarts", "Cardioloog", "Thuisverpleging", "Kinesitherapeut", "Ergotherapeut", "Alarmcentrale"]
    },
    {
      nr: 5,
      naam: "Chronische respiratoire kwetsbaarheid (COPD/astma)",
      medischLexicon: ["COPD", "chronische bronchitis", "emfyseem", "GOLD", "astma", "exacerbaties", "longaanval", "dyspnoe", "kortademigheid", "inspanningsdyspnoe", "inhalatietherapie", "puffer", "zuurstoftherapie"],
      patientLexicon: ["snel buiten adem", "durf niet inspannen", "vaak longontsteking", "puffers helpen niet", "bang geen lucht"],
      klinisch: "Ademfrequentie, dyspnoe-score, saturatie, hoest/sputum.",
      educatie: "Actieplan, vroege exacerbatiesignalen, inhalatietechniek, rookstop.",
      functioneel: "Beweegprogramma, energiemanagement, hulpmiddelen.",
      coordinatie: "Afstemming huisarts–longverpleegkundige–longarts.",
      monitoring: "Ernstige dyspnoe, cyanose, verwardheid → 112; toenemende benauwdheid → huisarts.",
      zorgverleners: ["Huisarts", "POH/longverpleegkundige", "Longarts", "Fysiotherapeut", "Diëtist", "Apotheker"]
    },
    {
      nr: 6,
      naam: "Metabool-renale kwetsbaarheid (CNI, hartfalen)",
      medischLexicon: ["chronische nierinsufficiëntie", "CNI", "eGFR verlaagd", "nierfunctiestoornis", "diuretica", "hartfalen", "decompensatio cordis", "vochtretentie", "oedeem", "elektrolytenstoornissen", "hyperkaliëmie"],
      patientLexicon: ["veel vocht vast", "benen dik", "snel moe", "nieren niet goed", "niet veel drinken"],
      klinisch: "eGFR, elektrolyten, bloeddruk, gewicht, oedeem, dyspnoe.",
      educatie: "Vocht- en zoutbeperking, tekenen decompensatie.",
      functioneel: "Weegschaal, maatbeker, aangepast dieet.",
      coordinatie: "Gezamenlijk plan huisarts–nefroloog–cardioloog–diëtist.",
      monitoring: "HF: +2kg in 3 dagen, ernstige dyspnoe → huisarts; snelle eGFR-daling → nefroloog.",
      zorgverleners: ["Huisarts", "Nefroloog", "Cardioloog", "POH", "Diëtist", "Apotheker", "Thuisverpleging"]
    },
    {
      nr: 7,
      naam: "Functionele achteruitgang & valrisico",
      medischLexicon: ["mobiliteitsbeperking", "loopstoornis", "valincident", "herhaald vallen", "frailty", "kwetsbare oudere", "ADL-hulp nodig", "spierzwakte", "sarcopenie", "instabiel stappen", "valneiging"],
      patientLexicon: ["paar keer gevallen", "stap niet meer zeker", "opstaan moeilijk", "durf niet naar buiten", "zwakker dan vroeger", "schrik om te vallen"],
      klinisch: "Mobiliteit (TUG), ADL/iADL, spierkracht, valincidenten.",
      educatie: "Valrisico, veilig bewegen, hulpmiddelen, valangst.",
      functioneel: "Kracht- en balansprogramma, woningaanpassingen, rollator.",
      coordinatie: "Multidisciplinair zorgplan (huisarts, kine, ergo, thuiszorg).",
      monitoring: "≥2 vallen/jaar, snel ADL-verlies → huisarts; ernstige val → SEH.",
      zorgverleners: ["Huisarts", "Kinesitherapeut", "Ergotherapeut", "Diëtist", "Thuisverpleging", "Maatschappelijk werker"]
    },
    {
      nr: 8,
      naam: "Ondervoeding & verminderde voedselinname",
      medischLexicon: ["ondervoeding", "malnutritie", "gewichtsverlies", "verminderde intake", "anorexie", "cachexie", "laag BMI", "sarcopenie", "slikproblemen", "dysfagie", "sondevoeding"],
      patientLexicon: ["geen eetlust", "sla maaltijden over", "eten lukt niet", "veel vermagerd", "alleen eten lastig"],
      klinisch: "Gewicht, MUST/SNAQ65+, eetlust, intake, slikproblemen.",
      educatie: "Belang eiwit/energie, kleine maaltijden, verrijking.",
      functioneel: "Maaltijdservice, hulp koken, drinkvoeding.",
      coordinatie: "Diëtist als spil, afstemming huisarts.",
      monitoring: ">5kg verlies in 3 maanden, slikproblemen → huisarts + logopedist.",
      zorgverleners: ["Diëtist", "Huisarts", "Thuisverpleging", "Logopedist", "Maatschappelijk werker"]
    },
    {
      nr: 9,
      naam: "Cognitieve kwetsbaarheid",
      medischLexicon: ["dementieel beeld", "dementie", "Alzheimer", "cognitieve stoornissen", "geheugenstoornissen", "MCI", "delirium", "acute verwardheid", "desoriëntatie", "MMSE verlaagd", "cognitieve achteruitgang"],
      patientLexicon: ["vergeet veel", "alles te ingewikkeld", "kluts kwijt", "weet niet of pillen genomen", "niet meer zoals vroeger", "snel in de war"],
      klinisch: "Oriëntatie, geheugen, uitvoerende functies, ADL-zelfstandigheid.",
      educatie: "Uitleg geheugenproblemen, structuur, compensaties.",
      functioneel: "Dag-/
