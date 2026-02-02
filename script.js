/// ============================================================
// ZIEKENHUIS ONTSLAGMANAGEMENT - VOLLEDIGE WORKFLOW
// Upload → OnePatient → Detectie → Zorgplan → Nieuwe patiëntrij
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  // =============================================
  // CONFIGURATIE
  // =============================================
  const CONFIG = {
    onePatientUrl: 'https://test.onepatient.bingli.be',
    zorgverlenersUrl: 'https://jvnds1969-png.github.io/Zorgverleners/providers.json'
  };

  // =============================================
  // ZORGBUNDELS DATA (alle 16 bundels)
  // =============================================
  const zorgbundels = [
    {
      nr: 1, naam: "Diabetes met verhoogd thuisrisico",
      medischLexicon: ["diabetes mellitus","DM2","insulinedependent","insulinetherapie","orale antidiabetica","hypoglycemie","hyperglycemie","labiele glycemie","ontregelde glycemie","verhoogd HbA1c","diabetische neuropathie","diabetische nefropathie","diabetische voet","glucosecontrole","suikerziekte"],
      patientLexicon: ["suikerziekte","suiker schommelt","suiker te hoog","suiker te laag","bang voor hypo"],
      klinisch: "Glycemies, symptomen hypo/hyper, voetstatus, gewicht.",
      educatie: "Hypo-/hyperherkenning, glucosemeting, medicatieschema.",
      functioneel: "Glucosemeter, strips, weekdoos, hulp bij voeding.",
      coordinatie: "Afstemming huisarts–POH–diëtist–thuisverpleging.",
      monitoring: "Herhaalde hypo's, glycemie >20 → huisarts; levensbedreiging → 112.",
      zorgverleners: ["Huisarts","POH/diabetesverpleegkundige","Thuisverpleging","Diëtist","Podotherapeut","Apotheker"]
    },
    {
      nr: 2, naam: "Polyfarmacie & medicatieveiligheid",
      medischLexicon: ["polyfarmacie","multimedicatie","≥5 medicaties","medicatielijst","therapiewijziging","bijwerkingen","medicatiefouten","medicatie-ontrouw","non-compliance","interacties","STOPP/START","hoogrisico-medicatie"],
      patientLexicon: ["veel pillen","weet niet waarvoor","medicijnen veranderd","suf van medicatie"],
      klinisch: "Bijwerkingen, therapietrouw, aantal medicaties.",
      educatie: "Nieuw schema, gevaar dubbelgebruik, teach-back.",
      functioneel: "Weekdoos, visueel schema, alarmen.",
      coordinatie: "Warme overdracht AMO; medicatiereview huisarts–apotheker.",
      monitoring: "Geen AMO, dubbelgebruik → huisarts + apotheker.",
      zorgverleners: ["Huisarts","Huisapotheker","Thuisverpleging","POH/ouderen","Geriater"]
    },
    {
      nr: 3, naam: "Cardiovasculair hoog risico",
      medischLexicon: ["hypertensie","hoge bloeddruk","dyslipidemie","hypercholesterolemie","CVRM","coronair lijden","ischemische hartziekte","myocardinfarct","CVA","TIA","perifere vaatlijden","obesitas","BMI >30","roker"],
      patientLexicon: ["bloeddruk te hoog","hoge cholesterol","rook nog","beweeg niet","TIA gehad"],
      klinisch: "Bloeddruk, lipiden, gewicht, rookstatus.",
      educatie: "Persoonlijk risico, leefstijl, medicatie.",
      functioneel: "GLI/beweegprogramma, rookstop.",
      coordinatie: "CVRM-spreekuur met huisarts, diëtist.",
      monitoring: "Zeer hoge bloeddruk → huisarts; pijn op borst → 112.",
      zorgverleners: ["Huisarts","POH (CVRM)","Diëtist","Fysiotherapeut","Apotheker","Cardioloog"]
    },
    {
      nr: 4, naam: "Cardiovasculaire instabiliteit / collapsrisico",
      medischLexicon: ["atriumfibrilleren","AF","hartritmestoornis","tachycardie","bradycardie","syncope","presyncope","collaps","hypotensie","orthostatische hypotensie","pacemaker","ICD"],
      patientLexicon: ["plots duizelig","hart slaat raar","flauwgevallen","bang alleen door hart"],
      klinisch: "Bloeddruk orthostatisch, pols/ritme, syncope.",
      educatie: "Herkenning pijn op borst, veilig opstaan.",
      functioneel: "Mobiliteitshulpmiddelen, personenalarm.",
      coordinatie: "Afstemming huisarts–cardioloog–thuisverpleging.",
      monitoring: "Syncope, ernstige hypotensie → huisarts; pijn borst → 112.",
      zorgverleners: ["Huisarts","Cardioloog","Thuisverpleging","Kinesitherapeut","Ergotherapeut","Alarmcentrale"]
    },
    {
      nr: 5, naam: "Chronische respiratoire kwetsbaarheid (COPD/astma)",
      medischLexicon: ["COPD","chronische bronchitis","emfyseem","GOLD","astma","exacerbaties","longaanval","dyspnoe","kortademigheid","inspanningsdyspnoe","inhalatietherapie","puffer","zuurstoftherapie"],
      patientLexicon: ["snel buiten adem","durf niet inspannen","vaak longontsteking","puffers helpen niet"],
      klinisch: "Ademfrequentie, dyspnoe-score, saturatie.",
      educatie: "Actieplan, exacerbatiesignalen, inhalatietechniek.",
      functioneel: "Beweegprogramma, energiemanagement.",
      coordinatie: "Afstemming huisarts–longverpleegkundige–longarts.",
      monitoring: "Ernstige dyspnoe, cyanose → 112.",
      zorgverleners: ["Huisarts","POH/longverpleegkundige","Longarts","Fysiotherapeut","Diëtist","Apotheker"]
    },
    {
      nr: 6, naam: "Metabool-renale kwetsbaarheid (CNI, hartfalen)",
      medischLexicon: ["chronische nierinsufficiëntie","CNI","eGFR verlaagd","nierfunctiestoornis","diuretica","hartfalen","decompensatio cordis","vochtretentie","oedeem","elektrolytenstoornissen","hyperkaliëmie"],
      patientLexicon: ["veel vocht vast","benen dik","snel moe","nieren niet goed"],
      klinisch: "eGFR, elektrolyten, bloeddruk, gewicht, oedeem.",
      educatie: "Vocht- en zoutbeperking, tekenen decompensatie.",
      functioneel: "Weegschaal, maatbeker, aangepast dieet.",
      coordinatie: "Plan huisarts–nefroloog–cardioloog–diëtist.",
      monitoring: "HF: +2kg in 3 dagen → huisarts.",
      zorgverleners: ["Huisarts","Nefroloog","Cardioloog","POH","Diëtist","Apotheker","Thuisverpleging"]
    },
    {
      nr: 7, naam: "Functionele achteruitgang & valrisico",
      medischLexicon: ["mobiliteitsbeperking","loopstoornis","valincident","herhaald vallen","frailty","kwetsbare oudere","ADL-hulp nodig","spierzwakte","sarcopenie","instabiel stappen","valneiging"],
      patientLexicon: ["paar keer gevallen","stap niet meer zeker","opstaan moeilijk","schrik om te vallen"],
      klinisch: "Mobiliteit, ADL/iADL, spierkracht, valincidenten.",
      educatie: "Valrisico, veilig bewegen, hulpmiddelen.",
      functioneel: "Kracht-/balansprogramma, woningaanpassingen, rollator.",
      coordinatie: "Multidisciplinair zorgplan (huisarts, kine, ergo).",
      monitoring: "≥2 vallen/jaar → huisarts; ernstige val → SEH.",
      zorgverleners: ["Huisarts","Kinesitherapeut","Ergotherapeut","Diëtist","Thuisverpleging","Maatschappelijk werker"]
    },
    {
      nr: 8, naam: "Ondervoeding & verminderde voedselinname",
      medischLexicon: ["ondervoeding","malnutritie","gewichtsverlies","verminderde intake","anorexie","cachexie","laag BMI","sarcopenie","slikproblemen","dysfagie","sondevoeding"],
      patientLexicon: ["geen eetlust","sla maaltijden over","eten lukt niet","veel vermagerd"],
      klinisch: "Gewicht, MUST/SNAQ65+, eetlust, slikproblemen.",
      educatie: "Belang eiwit/energie, kleine maaltijden.",
      functioneel: "Maaltijdservice, hulp koken, drinkvoeding.",
      coordinatie: "Diëtist als spil, afstemming huisarts.",
      monitoring: ">5kg verlies in 3 maanden → huisarts + diëtist.",
      zorgverleners: ["Diëtist","Huisarts","Thuisverpleging","Logopedist","Maatschappelijk werker"]
    },
    {
      nr: 9, naam: "Cognitieve kwetsbaarheid",
      medischLexicon: ["dementieel beeld","dementie","Alzheimer","cognitieve stoornissen","geheugenstoornissen","MCI","delirium","acute verwardheid","desoriëntatie","MMSE verlaagd"],
      patientLexicon: ["vergeet veel","alles te ingewikkeld","kluts kwijt","snel in de war"],
      klinisch: "Oriëntatie, geheugen, ADL-zelfstandigheid.",
      educatie: "Uitleg geheugenproblemen, structuur, compensaties.",
      functioneel: "Dag-/weekschema's, herinneringshulpmiddelen, toezicht.",
      coordinatie: "Huisarts + geriater; casemanagement; mantelzorg.",
      monitoring: "Acuut delier, wegloopgedrag → huisarts/spoed.",
      zorgverleners: ["Huisarts","Geriater","Thuisverpleging","Casemanager/dementiecoach","Ergotherapeut","Maatschappelijk werker"]
    },
    {
      nr: 10, naam: "Psychosociaal lijden & eenzaamheid",
      medischLexicon: ["depressieve klachten","depressie","somberheid","angst","angststoornis","rouw","suïcidale gedachten","stressklachten","slaapproblemen","eenzaamheid","sociaal isolement"],
      patientLexicon: ["voel me alleen","allemaal te veel","slaap slecht","nergens zin in","zie het niet meer zitten"],
      klinisch: "Depressie-/angstscreening, suïcidaliteit, slaap.",
      educatie: "Psycho-educatie, coping, info zelfhulp.",
      functioneel: "Toeleiding sociale activiteiten, lotgenotengroepen.",
      coordinatie: "Afstemming huisarts–POH-GGZ–psycholoog.",
      monitoring: "Suïcidegedachten → GGZ-crisis; acuut gevaar → 112.",
      zorgverleners: ["Huisarts","POH-GGZ","Eerstelijnspsycholoog","Maatschappelijk werker","Welzijnsorganisatie"]
    },
    {
      nr: 11, naam: "Mantelzorger-overbelasting",
      medischLexicon: ["mantelzorger overbelast","mantelzorgbelasting","caregiver burden","beperkte sociale ondersteuning","intensieve mantelzorg","nood aan respijtzorg","uitputting mantelzorger"],
      patientLexicon: ["kan dit niet meer alleen","wordt mij te zwaar","altijd moe van de zorg","weet niet hoe lang volhoud"],
      klinisch: "Belasting, draagkracht, eigen gezondheid mantelzorger.",
      educatie: "Risico's overbelasting, grenzen stellen, ondersteuning.",
      functioneel: "Respijtzorg, extra thuiszorg, hulpmiddelen.",
      coordinatie: "Huisarts, thuiszorg en mantelzorgsteunpunt.",
      monitoring: "Ernstige uitputting, agressie → huisarts/maatschappelijk werker.",
      zorgverleners: ["Huisarts","Thuisverpleging","Mantelzorgsteunpunt","Maatschappelijk werker","Psycholoog"]
    },
    {
      nr: 12, naam: "Veiligheid & angst om alleen te zijn",
      medischLexicon: ["valrisico","verhoogd valrisico","valangst","alleenwonend","onveiligheidsgevoel","nachtelijke onrust","personenalarm","valdetectie"],
      patientLexicon: ["bang dat ik val","wat als er iets gebeurt","durf niet alleen te zijn","'s nachts onveilig"],
      klinisch: "Valrisico, nachtelijke onrust, angstniveau.",
      educatie: "Werking alarm, noodnummers, stappenplan bij incident.",
      functioneel: "Personenalarm/valdetectie, verlichting, nachtzorg.",
      coordinatie: "Afstemming huisarts–alarmcentrale–thuiszorg.",
      monitoring: "Herhaalde v
