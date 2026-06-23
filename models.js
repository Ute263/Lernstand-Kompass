const APP_VERSION = 1;
const STORE_KEY = "arbeitsheftKompass_v1";
const LEGACY_STORE_KEYS = ["arbeitsheft-kompass-state-v2"];
const APP_NAME = "Lernstand-Kompass";
const APP_SUBTITLE = "Arbeitshefte, Trainingszeit und Lernzielkontrollen im Blick";
const CHILD_AREA_NAME = "Meine Lernreise";
const TEACHER_AREA_NAME = "Lernstand-Übersicht";

const SUBJECTS = ["Deutsch", "Mathe"];
const STATUSES = ["fertig", "brauche Hilfe", "bitte kontrollieren"];
const ASSESSMENT_SUBJECTS = ["Deutsch", "Mathe", "Sachunterricht", "Englisch", "Sonstiges"];
const ASSESSMENT_TYPES = ["Test", "Lernzielkontrolle", "Diagnose", "Beobachtung", "Sonstiges"];
const ASSESSMENT_GRADING_TYPES = ["Punkte", "Note", "Symbol", "Punkte und Note", "Punkte und Symbol"];
const ASSESSMENT_SYMBOLS = ["++", "+", "o", "-", "--"];
const ASSESSMENT_RESULT_STATUSES = ["eingetragen", "fehlt", "nachschreiben", "nicht teilgenommen"];

const STATUS_META = {
  fertig: { label: "fertig", childLabel: "fertig", icon: "✅", className: "done" },
  "brauche Hilfe": { label: "brauche Hilfe", childLabel: "ich brauche Hilfe", icon: "🟡", className: "help" },
  "bitte kontrollieren": { label: "bitte kontrollieren", childLabel: "bitte kontrollieren", icon: "🔵", className: "check" }
};

const DEFAULT_ANIMALS = [
  ["Fuchs", "🦊"], ["Schildkröte", "🐢"], ["Eule", "🦉"], ["Frosch", "🐸"], ["Bär", "🐻"],
  ["Igel", "🦔"], ["Hase", "🐰"], ["Pinguin", "🐧"], ["Tiger", "🐯"], ["Löwe", "🦁"],
  ["Koala", "🐨"], ["Panda", "🐼"], ["Affe", "🐵"], ["Schmetterling", "🦋"], ["Marienkäfer", "🐞"],
  ["Delfin", "🐬"], ["Wal", "🐳"], ["Giraffe", "🦒"], ["Zebra", "🦓"], ["Elefant", "🐘"],
  ["Eichhörnchen", "🐿️"], ["Waschbär", "🦝"], ["Faultier", "🦥"], ["Flamingo", "🦩"], ["Robbe", "🦭"],
  ["Krake", "🐙"], ["Krebs", "🦀"], ["Fisch", "🐠"], ["Ente", "🦆"], ["Adler", "🦅"]
];

const DEFAULT_MATERIALS = [
  ["Deutsch", "Arbeitsheft Blau"],
  ["Deutsch", "Arbeitsheft Rot"],
  ["Deutsch", "Schreibheft"],
  ["Deutsch", "Lesebuch"],
  ["Deutsch", "Meine Notizen"],
  ["Mathe", "Arbeitsheft"],
  ["Mathe", "Buch"],
  ["Mathe", "Rechenheft"],
  ["Mathe", "Zusatzaufgabe"]
];

const DEFAULT_PROGRESS_SETTINGS = {
  staleDays: 5,
  groupLookThreshold: 4,
  groupFarThreshold: 8,
  aheadThreshold: 5,
  showGroupComparison: true,
  showGoalComparison: true
};

const DEFAULT_SPRACHWELT_TASKS = [
  { id: "D-01", titel: "Wörter im Raum finden", auftrag: "Suche 12 Wörter im Raum und schreibe sie in dein Lerntagebuch." },
  { id: "D-02", titel: "Silbenbögen zeichnen", auftrag: "Wähle 8 Wörter und zeichne Silbenbögen dazu." },
  { id: "D-03", titel: "Nomen und Artikel", auftrag: "Suche 10 Nomen im Raum und schreibe den Artikel dazu." },
  { id: "D-04", titel: "Sätze zum Raum", auftrag: "Schreibe 5 Sätze über Dinge, die du gerade siehst." },
  { id: "D-05", titel: "Verben sammeln", auftrag: "Sammle 10 Verben: Was kann man im Raum tun?" },
  { id: "D-06", titel: "Wiewörter finden", auftrag: "Beschreibe 5 Dinge mit passenden Wiewörtern." },
  { id: "D-07", titel: "Wortfamilie", auftrag: "Wähle ein Wort und finde Wörter aus der Wortfamilie." },
  { id: "D-08", titel: "Reimpaare", auftrag: "Suche 6 Wörter, die sich reimen, und schreibe Paare." },
  { id: "D-09", titel: "Fragen stellen", auftrag: "Schreibe 5 Fragen zu einem Gegenstand im Raum." },
  { id: "D-10", titel: "Schöne Wörter", auftrag: "Wähle ein Buch und schreibe 5 schöne Wörter heraus." },
  { id: "D-11", titel: "Genau beschreiben", auftrag: "Beschreibe ein Bild, ein Buchcover oder eine Seite genau." },
  { id: "D-12", titel: "Sätze kontrollieren", auftrag: "Schreibe 5 Sätze und kontrolliere Satzanfang und Punkt." },
  { id: "D-13", titel: "Laute sortieren", auftrag: "Suche Wörter mit ie, ei, au oder eu und sortiere sie." },
  { id: "D-14", titel: "Gegensatzpaare", auftrag: "Finde 8 Gegensatzpaare aus dem Alltag." },
  { id: "D-15", titel: "Kleine Geschichte", auftrag: "Schreibe eine kleine Geschichte mit einem Ding aus dem Raum." }
];

const ANALOG_TRAINING_TASKS = [
  { code: "D-01", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Wörter im Raum finden", text: "Suche 12 Wörter im Raum und schreibe sie auf.", symbol: "🔍", steps: ["Schau dich langsam im Raum um.", "Suche 12 Wörter.", "Schreibe sie in dein Lerntagebuch.", "Kontrolliere, ob du 12 Wörter gefunden hast."] },
  { code: "D-02", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Silbenbögen", text: "Wähle 8 Wörter und zeichne Silbenbögen dazu.", symbol: "📖", steps: ["Wähle 8 Wörter.", "Sprich jedes Wort langsam.", "Schreibe die Wörter in dein Lerntagebuch.", "Zeichne Silbenbögen dazu."] },
  { code: "D-03", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Nomen und Artikel", text: "Suche 10 Nomen im Raum und schreibe den Artikel dazu.", symbol: "📄", steps: ["Suche 10 Nomen im Raum.", "Schreibe sie in dein Lerntagebuch.", "Schreibe der, die oder das dazu.", "Prüfe die Großschreibung."] },
  { code: "D-04", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Sätze schreiben", text: "Schreibe 5 Sätze über Dinge, die du gerade siehst.", symbol: "✏️", steps: ["Wähle Dinge aus, die du siehst.", "Schreibe 5 ganze Sätze.", "Achte auf Satzanfang und Punkt.", "Lies deine Sätze noch einmal."] },
  { code: "D-05", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Verben sammeln", text: "Sammle 10 Verben: Was kann man im Raum tun?", symbol: "🏃", steps: ["Überlege, was man im Raum tun kann.", "Sammle 10 Verben.", "Schreibe sie in dein Lerntagebuch.", "Lies deine Wörter noch einmal."] },
  { code: "D-06", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Wiewörter", text: "Beschreibe 5 Dinge mit passenden Wiewörtern.", symbol: "💭", steps: ["Suche 5 Dinge.", "Überlege: Wie ist das Ding?", "Schreibe passende Wiewörter dazu.", "Kontrolliere, ob die Wörter gut passen."] },
  { code: "D-07", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Wortfamilie", text: "Wähle ein Wort und finde Wörter aus der Wortfamilie.", symbol: "🌳", steps: ["Wähle ein Wort.", "Schreibe es in dein Lerntagebuch.", "Finde Wörter aus derselben Wortfamilie.", "Markiere, was ähnlich ist."] },
  { code: "D-08", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Reimpaare", text: "Finde 6 Reimwörter und schreibe passende Paare auf.", symbol: "💬", steps: ["Finde Wörter, die sich reimen.", "Bilde passende Paare.", "Schreibe 6 Paare in dein Lerntagebuch.", "Sprich die Paare leise vor."] },
  { code: "D-09", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Fragen", text: "Schreibe 5 Fragen zu einem Gegenstand im Raum.", symbol: "❓", steps: ["Wähle einen Gegenstand.", "Überlege 5 Fragen dazu.", "Schreibe die Fragen in dein Lerntagebuch.", "Setze Fragezeichen."] },
  { code: "D-10", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Schöne Wörter", text: "Wähle ein Buch und schreibe 5 schöne Wörter heraus.", symbol: "📘", steps: ["Wähle ein Buch.", "Lies eine Seite oder einen Abschnitt.", "Suche 5 schöne Wörter.", "Schreibe sie in dein Lerntagebuch."] },
  { code: "D-11", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Genau beschreiben", text: "Beschreibe ein Bild, ein Buchcover oder eine Seite genau.", symbol: "🖼️", steps: ["Wähle ein Bild, Cover oder eine Seite.", "Schau genau hin.", "Schreibe auf, was du siehst.", "Nutze passende Nomen, Verben und Wiewörter."] },
  { code: "D-12", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Sätze kontrollieren", text: "Schreibe 5 Sätze und kontrolliere Satzanfang und Punkt.", symbol: "📋", steps: ["Schreibe 5 Sätze.", "Prüfe jeden Satzanfang.", "Prüfe jeden Punkt.", "Verbessere deine Sätze."] },
  { code: "D-13", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Wörter sortieren", text: "Suche Wörter mit ie, ei, au oder eu und sortiere sie.", symbol: "🔤", steps: ["Suche Wörter mit ie, ei, au oder eu.", "Lege vier Spalten an.", "Sortiere die Wörter.", "Lies die Wörter noch einmal."] },
  { code: "D-14", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Gegensatzpaare", text: "Finde 8 Gegensatzpaare aus dem Alltag.", symbol: "↔️", steps: ["Denke an Wörter aus dem Alltag.", "Finde das Gegenteil.", "Schreibe 8 Paare auf.", "Prüfe, ob die Paare zusammenpassen."] },
  { code: "D-15", subject: "Deutsch", subcategory: "Deutsch-Entdecker", title: "Kleine Geschichte", text: "Schreibe eine kleine Geschichte mit einem Ding aus dem Raum.", symbol: "📝", steps: ["Wähle ein Ding aus dem Raum.", "Überlege, was passieren könnte.", "Schreibe eine kleine Geschichte.", "Lies sie noch einmal."] },
  { code: "M-01", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Zahlen ordnen", text: "Suche Zahlen im Raum und ordne sie von klein nach groß.", symbol: "🔢", steps: ["Suche Zahlen im Raum.", "Schreibe sie in dein Lerntagebuch.", "Ordne sie von klein nach groß.", "Kontrolliere deine Reihenfolge."] },
  { code: "M-02", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Plusaufgaben", text: "Erfinde 6 Plusaufgaben mit Dingen, die du siehst.", symbol: "➕", steps: ["Suche Dinge, die du zählen kannst.", "Erfinde 6 Plusaufgaben.", "Schreibe Aufgabe und Ergebnis auf.", "Kontrolliere durch Nachzählen."] },
  { code: "M-03", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Minusaufgaben", text: "Erfinde 6 Minusaufgaben mit Dingen, die du siehst.", symbol: "➖", steps: ["Suche Dinge, die du zählen kannst.", "Erfinde 6 Minusaufgaben.", "Schreibe Aufgabe und Ergebnis auf.", "Kontrolliere durch Nachzählen."] },
  { code: "M-04", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Zahlenrätsel", text: "Denke dir eine Zahl aus und beschreibe sie mit 4 Hinweisen.", symbol: "💡", steps: ["Denke dir eine Zahl aus.", "Schreibe 4 Hinweise.", "Notiere die Lösung.", "Prüfe, ob man die Zahl finden kann."] },
  { code: "M-05", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Formen finden", text: "Suche Formen im Raum und zeichne 6 Beispiele.", symbol: "🔺", steps: ["Suche Formen im Raum.", "Zeichne 6 Beispiele.", "Schreibe die Formnamen dazu.", "Kontrolliere deine Zeichnungen."] },
  { code: "M-06", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Muster", text: "Zeichne ein Muster und setze es mindestens 10 Schritte fort.", symbol: "🔴", steps: ["Beginne mit einem Muster.", "Zeichne es in dein Lerntagebuch.", "Setze es mindestens 10 Schritte fort.", "Kontrolliere die Regel."] },
  { code: "M-07", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Zahlenmuster", text: "Erfinde ein eigenes Zahlenmuster und schreibe es weiter.", symbol: "2️⃣", steps: ["Wähle eine Startzahl.", "Erfinde eine Regel.", "Schreibe das Zahlenmuster weiter.", "Erkläre die Regel."] },
  { code: "M-08", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Zählen und Aufgaben", text: "Zähle Dinge im Raum und schreibe passende Aufgaben dazu.", symbol: "||||", steps: ["Zähle Dinge im Raum.", "Schreibe die Anzahl auf.", "Erfinde passende Aufgaben.", "Kontrolliere durch Nachzählen."] },
  { code: "M-09", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Schätzen", text: "Schätze eine Anzahl und zähle danach genau nach.", symbol: "📏", steps: ["Wähle eine Menge.", "Schätze zuerst.", "Zähle genau nach.", "Vergleiche Schätzung und Ergebnis."] },
  { code: "M-10", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Mengen vergleichen", text: "Suche Dinge und vergleiche: mehr, weniger oder gleich viele.", symbol: "🍎", steps: ["Suche zwei Mengen.", "Vergleiche sie.", "Schreibe mehr, weniger oder gleich viele.", "Zeichne oder notiere dein Beispiel."] },
  { code: "M-11", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Längen ordnen", text: "Finde Dinge, die länger oder kürzer sind, und ordne sie.", symbol: "✏️", steps: ["Finde mehrere Dinge.", "Vergleiche die Länge.", "Ordne sie.", "Schreibe deine Ordnung in dein Lerntagebuch."] },
  { code: "M-12", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Zahlzerlegungen", text: "Wähle eine Zahl und finde passende Zahlzerlegungen.", symbol: "🔢", steps: ["Wähle eine Zahl.", "Finde passende Zerlegungen.", "Schreibe sie auf.", "Kontrolliere deine Ergebnisse."] },
  { code: "M-13", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Rechengeschichten", text: "Erfinde 4 kleine Rechengeschichten aus dem Alltag.", symbol: "💬", steps: ["Denke an Alltagssituationen.", "Erfinde 4 Rechengeschichten.", "Schreibe Aufgabe und Ergebnis auf.", "Prüfe, ob die Geschichte passt."] },
  { code: "M-14", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Symmetrie", text: "Suche symmetrische Formen oder Bilder und zeichne sie.", symbol: "🦋", steps: ["Suche symmetrische Formen oder Bilder.", "Schau auf die Spiegelachse.", "Zeichne Beispiele.", "Markiere die Mitte."] },
  { code: "M-15", subject: "Mathe", subcategory: "Mathe-Entdecker", title: "Verdoppeln und Halbieren", text: "Finde Beispiele zum Verdoppeln und Halbieren.", symbol: "🍏", steps: ["Finde passende Beispiele.", "Verdopple eine Menge.", "Halbiere eine Menge.", "Schreibe oder zeichne dein Ergebnis."] },
  { code: "F-01", subject: "Forscher", subcategory: "Forscher", title: "Dinge genau betrachten", text: "Wähle einen Gegenstand, zeichne ihn und notiere 5 Beobachtungen.", symbol: "🔍", researchQuestion: "Was kann ich entdecken, wenn ich ganz genau hinschaue?", steps: ["Wähle einen Gegenstand.", "Betrachte ihn genau.", "Zeichne ihn in dein Lerntagebuch.", "Notiere 5 Beobachtungen."] },
  { code: "F-02", subject: "Forscher", subcategory: "Forscher", title: "Materialforscher", text: "Suche 8 Gegenstände und ordne sie nach Material.", symbol: "🧱", researchQuestion: "Woraus bestehen Dinge?", steps: ["Suche 8 Gegenstände.", "Schau auf das Material.", "Ordne sie nach Material.", "Notiere deine Ordnung."] },
  { code: "F-03", subject: "Forscher", subcategory: "Forscher", title: "Schwimmt oder sinkt?", text: "Vermute und teste: Was schwimmt? Was sinkt?", symbol: "💧", researchQuestion: "Welche Dinge schwimmen?", steps: ["Wähle kleine Gegenstände.", "Vermute zuerst.", "Teste vorsichtig.", "Notiere schwimmt oder sinkt."], material: ["Lerntagebuch", "Stift", "Schüssel mit Wasser", "kleine Gegenstände"] },
  { code: "F-04", subject: "Forscher", subcategory: "Forscher", title: "Magnetforscher", text: "Prüfe mit dem Magneten: Was ist magnetisch?", symbol: "🧲", researchQuestion: "Was ist magnetisch?", steps: ["Sammle Gegenstände.", "Teste sie mit dem Magneten.", "Sortiere magnetisch und nicht magnetisch.", "Notiere dein Ergebnis."], material: ["Lerntagebuch", "Stift", "Magnet", "verschiedene Gegenstände"] },
  { code: "F-05", subject: "Forscher", subcategory: "Forscher", title: "Geräusche entdecken", text: "Lausche 3 Minuten und notiere oder male die Geräusche.", symbol: "👂", researchQuestion: "Welche Geräusche gibt es um uns herum?", steps: ["Setze dich ruhig hin.", "Lausche 3 Minuten.", "Notiere oder male Geräusche.", "Ordne, wenn du möchtest: laut, leise, angenehm, störend."] },
  { code: "F-06", subject: "Forscher", subcategory: "Forscher", title: "Pflanzenforscher", text: "Zeichne eine Pflanze, beschrifte ihre Teile und schreibe, was sie braucht.", symbol: "🌱", researchQuestion: "Was braucht eine Pflanze zum Leben?", steps: ["Zeichne eine Pflanze.", "Beschrifte wichtige Teile.", "Schreibe auf, was sie braucht.", "Kontrolliere deine Beschriftung."] },
  { code: "F-07", subject: "Forscher", subcategory: "Forscher", title: "Blätter vergleichen", text: "Vergleiche 3 Blätter: Form, Rand und Farbe.", symbol: "🍃", researchQuestion: "Sind alle Blätter gleich?", steps: ["Wähle 3 Blätter oder Bilder.", "Vergleiche Form, Rand und Farbe.", "Zeichne oder notiere deine Beobachtungen.", "Schreibe Gemeinsamkeiten und Unterschiede auf."], material: ["Lerntagebuch", "Stift", "Blätter oder Blattbilder"] },
  { code: "F-08", subject: "Forscher", subcategory: "Forscher", title: "Tierforscher", text: "Wähle ein Tier und sammle Infos zu Lebensraum, Nahrung und Aussehen.", symbol: "🦊", researchQuestion: "Woran erkennt man Tiere?", steps: ["Wähle ein Tier.", "Sammle Infos zu Lebensraum, Nahrung und Aussehen.", "Schreibe sie in dein Lerntagebuch.", "Zeichne das Tier, wenn du möchtest."] },
  { code: "F-09", subject: "Forscher", subcategory: "Forscher", title: "Lebensräume", text: "Ordne Tiere oder Pflanzen ihrem Lebensraum zu.", symbol: "🌳", researchQuestion: "Wo leben Tiere und Pflanzen?", steps: ["Wähle Tiere oder Pflanzen.", "Überlege den Lebensraum.", "Ordne sie zu.", "Begründe einige Beispiele."] },
  { code: "F-10", subject: "Forscher", subcategory: "Forscher", title: "Jahreszeiten", text: "Wähle eine Jahreszeit und sammle Merkmale dazu.", symbol: "🍂", researchQuestion: "Was verändert sich im Jahr?", steps: ["Wähle eine Jahreszeit.", "Sammle Merkmale.", "Schreibe oder male sie in dein Lerntagebuch.", "Denke an Wetter, Kleidung, Pflanzen und Tiere."] },
  { code: "F-11", subject: "Forscher", subcategory: "Forscher", title: "Wetterbeobachter", text: "Beobachte das Wetter und male ein Wettersymbol.", symbol: "🌧️", researchQuestion: "Wie ist das Wetter heute?", steps: ["Schau nach draußen.", "Beobachte Wolken, Wind und Niederschlag.", "Male ein Wettersymbol.", "Notiere kurz, was du beobachtest."], material: ["Lerntagebuch", "Stift", "Blick nach draußen"] },
  { code: "F-12", subject: "Forscher", subcategory: "Forscher", title: "Schattenforscher", text: "Beobachte einen Schatten und zeichne Licht, Gegenstand und Schatten.", symbol: "🔦", researchQuestion: "Wann entsteht ein Schatten?", steps: ["Stelle einen Gegenstand ins Licht.", "Beobachte den Schatten.", "Zeichne Licht, Gegenstand und Schatten.", "Schreibe eine kurze Beobachtung."], material: ["Lerntagebuch", "Stift", "Lichtquelle oder Sonnenlicht"] },
  { code: "F-13", subject: "Forscher", subcategory: "Forscher", title: "Zeitforscher", text: "Finde Beispiele, woran du merkst, dass Zeit vergeht.", symbol: "⌛", researchQuestion: "Woran merke ich, dass Zeit vergeht?", steps: ["Sammle Beispiele für Zeit.", "Schreibe oder male sie.", "Denke an Uhr, Kalender, Tagesablauf und Jahreszeiten.", "Ordne einige Beispiele."] },
  { code: "F-14", subject: "Forscher", subcategory: "Forscher", title: "Körperforscher", text: "Zeichne einen Körperumriss und beschrifte wichtige Körperteile.", symbol: "🧍", researchQuestion: "Was kann mein Körper alles?", steps: ["Zeichne einen Körperumriss.", "Beschrifte wichtige Körperteile.", "Schreibe auf, wofür du sie brauchst.", "Kontrolliere deine Beschriftung."] },
  { code: "F-15", subject: "Forscher", subcategory: "Forscher", title: "Sinne entdecken", text: "Schreibe zu jedem Sinn ein passendes Beispiel.", symbol: "👁️", researchQuestion: "Wie erforsche ich die Welt?", steps: ["Schreibe die fünf Sinne auf.", "Finde zu jedem Sinn ein Beispiel.", "Notiere oder male dein Beispiel.", "Überlege, welcher Sinn heute besonders wichtig ist."] }
];

const DEFAULT_DEUTSCH_ENTDECKER_TASKS = analogTasksFor("Deutsch-Entdecker");
const DEFAULT_MATHE_ENTDECKER_TASKS = analogTasksFor("Mathe-Entdecker");
const DEFAULT_FORSCHER_TASKS = analogTasksFor("Forscher");

function analogTasksFor(subcategory) {
  return ANALOG_TRAINING_TASKS
    .filter((task) => task.subcategory === subcategory)
    .map(trainingTaskFromTemplate);
}

function trainingTaskFromTemplate(template) {
  const base = trainingTask(
    template.code,
    template.subject,
    template.subcategory,
    template.title,
    template.text,
    template.steps,
    template.tips || [],
    template.material || ["Lerntagebuch", "Stift"],
    { symbol: template.symbol }
  );
  return {
    ...base,
    researchQuestion: template.researchQuestion || "",
    analogText: template.text
  };
}

const DEFAULT_TRAINING_TASKS = [
  trainingTask("S-01", "Schule", "Schule", "Schule", "Hier kommen später Trainingsaufgaben für die Schule hinzu.", ["Dieser Bereich ist vorbereitet.", "Hier können später Aufgaben für die Schule ergänzt werden."], ["Noch keine Schul-Trainingsaufgaben vorhanden."], ["Lerntagebuch", "Stift"], { area: "Schule", symbol: "🏫", active: false }),
  ...DEFAULT_DEUTSCH_ENTDECKER_TASKS,
  ...DEFAULT_MATHE_ENTDECKER_TASKS,
  ...DEFAULT_FORSCHER_TASKS
];

function trainingTask(code, subject, subcategory, title, text, steps, tips = [], material = ["Lerntagebuch", "Stift"], overrides = {}) {
  return {
    id: `training-${code}`,
    area: overrides.area || "OGS/Zuhause",
    trainingArea: overrides.area || "OGS/Zuhause",
    subcategory,
    subject,
    code,
    taskCode: code,
    title,
    shortText: text,
    text,
    instruction: text,
    instructions: steps,
    steps,
    tips,
    tip: tips[0] || "",
    material,
    symbol: overrides.symbol || (subject === "Deutsch" ? "📘" : subject === "Mathe" ? "🔢" : "🔎"),
    active: overrides.active !== false
  };
}

function researcherTask(code, title, researchQuestion, text, steps, tips = [], material = ["Lerntagebuch", "Stift"]) {
  return {
    ...trainingTask(code, "Forscher", "Forscher", title, text, steps, tips, material, { symbol: "🔎" }),
    researchQuestion
  };
}

function makeId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeQrToken(usedTokens = new Set()) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    const token = `ak-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
    if (!usedTokens.has(token)) return token;
  }
  return `ak-${Date.now().toString(36).toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyState() {
  return {
    version: APP_VERSION,
    setupComplete: false,
    pinHash: "",
    recoveryKeyHash: "",
    activeClassId: null,
    classes: [],
    animals: [],
    materials: [],
    entries: [],
    goals: [],
    assessments: [],
    assessmentTasks: [],
    assessmentResults: [],
    sprachweltTasks: DEFAULT_SPRACHWELT_TASKS.map((task) => ({ ...task, aktiv: true })),
    trainingTasks: DEFAULT_TRAINING_TASKS.map((task) => ({ ...task })),
    trainingCompletions: [],
    trainingHistory: [],
    progressSettings: { ...DEFAULT_PROGRESS_SETTINGS },
    teacherShowFirstNames: false,
    qrScannerEnabled: true,
    multiDeviceReminderEnabled: true,
    multiDeviceReminderTime: "13:00",
    multiDeviceReminderLastDismissedDate: "",
    lastSavedAt: null
  };
}

function createClassItem(name, beschreibung = "") {
  return {
    id: makeId(),
    name: name.trim(),
    beschreibung: beschreibung.trim(),
    erstelltAm: nowIso(),
    aktiv: true
  };
}

function createDefaultAnimals(classId) {
  const usedTokens = new Set();
  return DEFAULT_ANIMALS.map(([tierName, tierEmoji]) => {
    const qrToken = makeQrToken(usedTokens);
    usedTokens.add(qrToken);
    return {
      id: makeId(),
      classId,
      tierName,
      tierEmoji,
      aktiv: true,
      firstName: "",
      qrToken
    };
  });
}

function createDefaultMaterials(classId) {
  return DEFAULT_MATERIALS.map(([fach, materialName]) => ({
    id: makeId(),
    classId,
    fach,
    materialName,
    aktiv: true
  }));
}

function createInitialState({ pinHash, recoveryKeyHash, className, description }) {
  const firstClass = createClassItem(className, description);
  return {
    version: APP_VERSION,
    setupComplete: true,
    pinHash,
    recoveryKeyHash,
    activeClassId: firstClass.id,
    classes: [firstClass],
    animals: createDefaultAnimals(firstClass.id),
    materials: createDefaultMaterials(firstClass.id),
    entries: [],
    goals: [],
    assessments: [],
    assessmentTasks: [],
    assessmentResults: [],
    sprachweltTasks: DEFAULT_SPRACHWELT_TASKS.map((task) => ({ ...task, aktiv: true })),
    trainingTasks: DEFAULT_TRAINING_TASKS.map((task) => ({ ...task })),
    trainingCompletions: [],
    trainingHistory: [],
    progressSettings: { ...DEFAULT_PROGRESS_SETTINGS },
    teacherShowFirstNames: false,
    qrScannerEnabled: true,
    multiDeviceReminderEnabled: true,
    multiDeviceReminderTime: "13:00",
    multiDeviceReminderLastDismissedDate: "",
    lastSavedAt: null
  };
}

function normalizeState(candidate) {
  if (!candidate || typeof candidate !== "object") return emptyState();
  const state = {
    ...emptyState(),
    ...candidate,
    version: APP_VERSION,
    pinHash: candidate.pinHash || "",
    recoveryKeyHash: candidate.recoveryKeyHash || "",
    classes: Array.isArray(candidate.classes) ? candidate.classes : [],
    animals: Array.isArray(candidate.animals) ? candidate.animals : [],
    materials: Array.isArray(candidate.materials) ? candidate.materials : [],
    entries: Array.isArray(candidate.entries) ? candidate.entries : [],
    goals: Array.isArray(candidate.goals) ? candidate.goals : [],
    assessments: Array.isArray(candidate.assessments) ? candidate.assessments : [],
    assessmentTasks: Array.isArray(candidate.assessmentTasks) ? candidate.assessmentTasks : [],
    assessmentResults: Array.isArray(candidate.assessmentResults) ? candidate.assessmentResults : [],
    sprachweltTasks: Array.isArray(candidate.sprachweltTasks) && candidate.sprachweltTasks.length
      ? candidate.sprachweltTasks
      : DEFAULT_SPRACHWELT_TASKS.map((task) => ({ ...task, aktiv: true })),
    trainingTasks: Array.isArray(candidate.trainingTasks) && candidate.trainingTasks.length
      ? mergeDefaultTrainingTasks(candidate.trainingTasks)
      : DEFAULT_TRAINING_TASKS.map((task) => ({ ...task })),
    trainingCompletions: Array.isArray(candidate.trainingCompletions) ? candidate.trainingCompletions : [],
    trainingHistory: Array.isArray(candidate.trainingHistory) ? candidate.trainingHistory : [],
    progressSettings: {
      ...DEFAULT_PROGRESS_SETTINGS,
      ...(candidate.progressSettings && typeof candidate.progressSettings === "object" ? candidate.progressSettings : {})
    },
    teacherShowFirstNames: candidate.teacherShowFirstNames === true,
    qrScannerEnabled: candidate.qrScannerEnabled !== false,
    multiDeviceReminderEnabled: candidate.multiDeviceReminderEnabled !== false,
    multiDeviceReminderTime: candidate.multiDeviceReminderTime || "13:00",
    multiDeviceReminderLastDismissedDate: candidate.multiDeviceReminderLastDismissedDate || ""
  };

  state.classes = state.classes.map((item) => ({ ...item, id: item.id || makeId() }));
  state.animals = state.animals.map((item) => ({ ...item, id: item.id || makeId(), classId: item.classId || state.activeClassId, firstName: item.firstName || item.vorname || "" }));
  state.materials = state.materials.map((item) => ({ ...item, id: item.id || makeId(), classId: item.classId || state.activeClassId }));
  state.entries = state.entries.map((item) => ({ ...item, id: item.id || item.entryId || makeId(), classId: item.classId || state.activeClassId }));
  state.goals = state.goals.map((item) => ({ ...item, id: item.id || makeId(), classId: item.classId || state.activeClassId }));
  state.assessments = state.assessments.map((item) => normalizeAssessment(item, state.activeClassId));
  state.assessmentTasks = state.assessmentTasks.map((item) => normalizeAssessmentTask(item, state.activeClassId));
  state.assessmentResults = state.assessmentResults.map((item) => normalizeAssessmentResult(item, state.activeClassId));
  state.sprachweltTasks = state.sprachweltTasks.map((item) => ({ ...item, id: item.id || makeId(), aktiv: item.aktiv !== false }));
  state.trainingTasks = state.trainingTasks.map((item) => normalizeTrainingTask(item));
  state.trainingCompletions = state.trainingCompletions.map((item) => normalizeTrainingCompletion(item, state.activeClassId));
  state.trainingHistory = state.trainingHistory.map((item) => normalizeTrainingHistory(item, state.activeClassId));

  const usedTokens = new Set();
  state.animals = state.animals.map((animal) => ({
    ...animal,
    qrToken: normalizeQrToken(animal.qrToken, usedTokens)
  }));

  if (!state.classes.some((item) => item.id === state.activeClassId)) {
    state.activeClassId = state.classes[0]?.id || null;
  }
  state.setupComplete = Boolean(state.setupComplete && state.activeClassId);
  return state;
}

function mergeDefaultTrainingTasks(tasks) {
  const defaultKeys = new Set(DEFAULT_TRAINING_TASKS.map((task) => task.code || task.id));
  const byCode = new Map(tasks.map((task) => [task.code || task.taskCode || task.id, task]));
  const merged = DEFAULT_TRAINING_TASKS.map((task) => {
    const key = task.code || task.id;
    const existing = byCode.get(key);
    if (!existing) return task;
    return {
      ...existing,
      ...task,
      active: existing.active !== false,
      id: existing.id || task.id
    };
  });
  tasks.forEach((task) => {
    const key = task.code || task.taskCode || task.id;
    if (!defaultKeys.has(key)) {
      merged.push({ ...task, active: false, deprecated: true });
    }
  });
  return merged;
}

function normalizeTrainingTask(item) {
  const code = item.code || item.taskCode || item.id || makeId();
  const title = item.title || item.titel || code || "Trainingsaufgabe";
  const text = item.text || item.shortText || item.taskText || item.auftrag || "";
  const subject = item.subject || item.fach || defaultTrainingSubject(code);
  const tips = normalizeStringList(item.tips || item.tip, defaultTrainingTip(code));
  const material = normalizeStringList(item.material || item.materialNeeded, defaultTrainingMaterial(code));
  return {
    ...item,
    id: item.id || `training-${code}`,
    area: item.area || item.trainingArea || "OGS/Zuhause",
    trainingArea: item.trainingArea || item.area || "OGS/Zuhause",
    subcategory: item.subcategory || item.unterbereich || defaultTrainingSubcategory(code),
    subject,
    code,
    taskCode: item.taskCode || code,
    title,
    shortText: item.shortText || text,
    text,
    instruction: item.instruction || text,
    instructions: Array.isArray(item.instructions) && item.instructions.length
      ? item.instructions
      : Array.isArray(item.steps) && item.steps.length
        ? item.steps
        : defaultTrainingSteps(code, text),
    steps: Array.isArray(item.steps) && item.steps.length
      ? item.steps
      : Array.isArray(item.instructions) && item.instructions.length
        ? item.instructions
        : defaultTrainingSteps(code, text),
    tips,
    tip: tips[0] || "",
    material,
    researchQuestion: item.researchQuestion || item.forscherfrage || "",
    symbol: item.symbol || (subject === "Deutsch" ? "📘" : subject === "Mathe" ? "🔢" : subject === "Forscher" ? "🔎" : "⭐"),
    active: item.active !== false
  };
}

function normalizeTrainingCompletion(item, fallbackClassId) {
  return {
    ...item,
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    animalId: item.animalId || item.tierID || "",
    tierNameSnapshot: item.tierNameSnapshot || "",
    tierEmojiSnapshot: item.tierEmojiSnapshot || "",
    taskCode: item.taskCode || item.code || "",
    trainingArea: item.trainingArea || item.area || "OGS/Zuhause",
    subcategory: item.subcategory || item.unterbereich || defaultTrainingSubcategory(item.taskCode || item.code || ""),
    subject: item.subject || item.fach || "",
    taskTitle: item.taskTitle || item.title || "",
    taskText: item.taskText || item.text || "",
    completedAt: item.completedAt || item.datumUhrzeit || nowIso(),
    updatedAt: item.updatedAt || item.completedAt || item.datumUhrzeit || nowIso(),
    status: item.status || "bearbeitet"
  };
}

function normalizeTrainingHistory(item, fallbackClassId) {
  return {
    ...item,
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    animalId: item.animalId || item.tierID || "",
    taskCode: item.taskCode || item.code || "",
    subcategory: item.subcategory || item.unterbereich || defaultTrainingSubcategory(item.taskCode || item.code || ""),
    oldStatus: item.oldStatus || item.urspruenglicherStatus || "",
    newStatus: item.newStatus || item.neuerStatus || "",
    changedAt: item.changedAt || item.resetAt || item.datumUhrzeit || nowIso(),
    note: item.note || item.hinweis || "durch Lehrkraft zurückgesetzt"
  };
}

function normalizeAssessment(item, fallbackClassId) {
  const now = nowIso();
  return {
    ...item,
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    klasseId: undefined,
    titel: item.titel || item.title || "Lernzielkontrolle",
    fach: ASSESSMENT_SUBJECTS.includes(item.fach) ? item.fach : "Deutsch",
    bereich: item.bereich || "",
    datum: item.datum || item.date || formatInputDate(new Date()),
    typ: ASSESSMENT_TYPES.includes(item.typ) ? item.typ : "Lernzielkontrolle",
    bewertungsart: ASSESSMENT_GRADING_TYPES.includes(item.bewertungsart) ? item.bewertungsart : "Punkte",
    maxPunkte: Number(item.maxPunkte) > 0 ? Number(item.maxPunkte) : "",
    notizKurz: item.notizKurz || "",
    createdAt: item.createdAt || item.erstelltAm || now,
    updatedAt: item.updatedAt || item.createdAt || item.erstelltAm || now
  };
}

function normalizeAssessmentTask(item, fallbackClassId) {
  const maxPoints = Number(item.maxPoints ?? item.maxPunkte ?? item.punkteMax);
  return {
    ...item,
    id: item.id || makeId(),
    assessmentId: item.assessmentId || item.lernzielkontrolleId || "",
    classId: item.classId || item.klasseId || fallbackClassId,
    number: String(item.number || item.aufgabenNummer || item.nr || "").trim() || "1",
    title: item.title || item.name || item.inhalt || "Aufgabe",
    maxPoints: Number.isFinite(maxPoints) && maxPoints > 0 ? maxPoints : 0,
    competency: item.competency || item.kompetenz || "",
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || item.createdAt || nowIso()
  };
}

function normalizeAssessmentResult(item, fallbackClassId) {
  const now = nowIso();
  const taskPoints = item.taskPoints && typeof item.taskPoints === "object" ? item.taskPoints : {};
  return {
    ...item,
    id: item.id || makeId(),
    assessmentId: item.assessmentId || "",
    classId: item.classId || item.klasseId || fallbackClassId,
    klasseId: undefined,
    animalId: item.animalId || item.tierID || "",
    tierNameSnapshot: item.tierNameSnapshot || "",
    tierEmojiSnapshot: item.tierEmojiSnapshot || "",
    punkte: item.punkte ?? "",
    maxPunkteSnapshot: Number(item.maxPunkteSnapshot) > 0 ? Number(item.maxPunkteSnapshot) : "",
    taskPoints,
    totalPoints: item.totalPoints ?? item.punkte ?? "",
    percentage: item.percentage ?? "",
    suggestedRating: item.suggestedRating || "",
    finalRating: item.finalRating || item.endgueltigeBewertung || "",
    suggestedNote: item.suggestedNote || "",
    finalNote: item.finalNote || item.endgueltigeNote || "",
    percentileRank: item.percentileRank ?? "",
    remark: item.remark || item.bemerkung || "",
    note: item.note || "",
    symbol: ASSESSMENT_SYMBOLS.includes(item.symbol) ? item.symbol : "",
    status: ASSESSMENT_RESULT_STATUSES.includes(item.status) ? item.status : "eingetragen",
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || item.createdAt || now
  };
}

function defaultTrainingSteps(code, text) {
  if (String(code).startsWith("D-")) {
    return [
      "Lies die Aufgabe langsam durch.",
      "Bereite dein Lerntagebuch und einen Stift vor.",
      "Bearbeite die Aufgabe sorgfältig.",
      "Kontrolliere zum Schluss, ob alles vollständig ist."
    ];
  }
  if (String(code).startsWith("M-")) {
    return [
      "Lies die Aufgabe langsam durch.",
      "Lege dir dein Lerntagebuch und einen Stift bereit.",
      "Rechne, zeichne oder ordne deine Ergebnisse.",
      "Kontrolliere zum Schluss noch einmal."
    ];
  }
  return text ? ["Lies die Aufgabe.", "Arbeite in deinem Lerntagebuch.", "Kontrolliere dein Ergebnis."] : [];
}

function defaultTrainingTip(code) {
  if (String(code).startsWith("D-")) return "Sprich Wörter leise mit und achte auf sauberes Schreiben.";
  if (String(code).startsWith("M-")) return "Nutze Material, eine Zeichnung oder eine Probe, wenn du unsicher bist.";
  return "Arbeite ruhig und Schritt für Schritt.";
}

function defaultTrainingMaterial(code) {
  if (String(code).startsWith("D-")) return ["Lerntagebuch", "Stift"];
  if (String(code).startsWith("M-")) return ["Lerntagebuch", "Stift"];
  if (String(code).startsWith("F-")) return ["Lerntagebuch", "Stift"];
  return ["Lerntagebuch", "Stift"];
}

function normalizeStringList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return Array.isArray(fallback) ? [...fallback] : [String(fallback)].filter(Boolean);
}

function defaultTrainingSubject(code) {
  if (String(code).startsWith("M-")) return "Mathe";
  if (String(code).startsWith("F-")) return "Forscher";
  if (String(code).startsWith("S-")) return "Schule";
  return "Deutsch";
}

function defaultTrainingSubcategory(code) {
  if (String(code).startsWith("M-")) return "Mathe-Entdecker";
  if (String(code).startsWith("F-")) return "Forscher";
  if (String(code).startsWith("S-")) return "Schule";
  return "Deutsch-Entdecker";
}

function formatInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeQrToken(token, usedTokens) {
  if (token && !usedTokens.has(token)) {
    usedTokens.add(token);
    return token;
  }
  const nextToken = makeQrToken(usedTokens);
  usedTokens.add(nextToken);
  return nextToken;
}

function makeRecoveryKey() {
  const words = ["HEFT", "KIND", "LERN", "TAFEL", "STIFT", "BUCH", "KLASSE", "KOMPASS"];
  const numberA = String(randomInt(1000, 9999));
  const numberB = String(randomInt(10, 99));
  return `AK-${numberA}-${words[randomInt(0, words.length - 1)]}-${numberB}`;
}

function randomInt(min, max) {
  const range = max - min + 1;
  const bytes = new Uint32Array(1);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return min + (bytes[0] % range);
  }
  return min + Math.floor(Math.random() * range);
}

function normalizeSecret(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

async function hashSecret(value, purpose = "pin") {
  const input = `arbeitsheft-kompass:${purpose}:${normalizeSecret(value)}`;
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return fallbackHash(input);
}

function fallbackHash(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}
