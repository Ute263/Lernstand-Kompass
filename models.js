const APP_VERSION = 4;
const DATA_VERSION = "1.2";
const STORE_KEY = "arbeitsheftKompass_v1";
const LEGACY_STORE_KEYS = ["arbeitsheft-kompass-state-v2"];
const APP_NAME = "Lernstand-Kompass";
const APP_SUBTITLE = "Arbeitshefte, Trainingszeit und Lernzielkontrollen im Blick";
const CHILD_AREA_NAME = "Meine Lernreise";
const TEACHER_AREA_NAME = "Lernstand-Übersicht";

const SUBJECTS = ["Deutsch", "Mathe"];
const SCHOOL_YEAR_OPTIONS = [
  ["1", "Schuljahr 1"],
  ["2", "Schuljahr 2"],
  ["3", "Schuljahr 3"],
  ["4", "Schuljahr 4"],
  ["cross", "schuljahrübergreifend"],
  ["none", "ohne Zuordnung"]
];
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

const WEEK_DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const WEEKLY_PLAN_FIELDS = [
  { key: "deutsch", label: "Deutsch", subject: "Deutsch" },
  { key: "mathe", label: "Mathe", subject: "Mathe" },
  { key: "freeText", label: "Freie Aufgabe", subject: "" }
];

const WEEKLY_PLAN_STATUSES = ["offen", "teilweise", "fertig"];

const DEFAULT_WORKBOOK_CATALOG = completeWorkbookCatalogPageRanges([
  ...abc1WorkbookCatalog("Arbeitsheft Teil A", [
    ["8-11", "Mimi", "Mi mi", "4/5"],
    ["24-27", "A, E, I, O, U", "A, E, I, O, U", "12/13"],
    ["32-35", "Toto und Tila", "Ta ta ...", "16/17"],
    ["56-59", "Wir essen in der Schule", "Sch sch, ü", "28/29"]
  ]),
  ...abc1WorkbookCatalog("Arbeitsheft Teil B", [
    ["16-19", "Der Hase und der Igel", "H h, ß", "46/47"]
  ]),
  ...abc1WritingCatalog("Schreiblehrgang Teil A", [
    ["3", "Die Symbole bedeuten", "", ""],
    ["4", "Richtige Sitz- und Schreibhaltung", "", ""],
    ["5-9", "Grafomotorische Vorübungen", "", ""],
    ["10", "u", "Uhu", "2, 3"],
    ["11", "i", "Igel", "4, 5"],
    ["12-14", "M m", "Maus", "4, 5"],
    ["15, 16", "o", "Orang-Utan", "6, 7"],
    ["17-19", "a", "Ameise", "8, 9"],
    ["20-22", "e", "Elefant", "10, 11"],
    ["23", "A, E", "Ameise, Elefant", "12, 13"],
    ["24", "I, O", "Igel, Orang-Utan", "12, 13"],
    ["25", "U", "Uhu", "12, 13"],
    ["26-28", "L l", "Löwe", "14, 15"],
    ["29-31", "T t", "Tiger", "16, 17"],
    ["32-34", "R r", "Reh", "18, 19"],
    ["35-37", "S s", "Seepferdchen", "20, 21"],
    ["38-40", "W w", "Wal", "22, 23"],
    ["41-43", "D d", "Delfin", "24, 25"],
    ["44-46", "N n", "Nashorn", "26, 27"],
    ["47-50", "Sch sch", "Schildkröte", "28-31"],
    ["51-53", "Ei ei", "Eichhörnchen", "32, 33"],
    ["54, 55", "K k", "Kakadu", "34, 35"],
    ["56, 57", "ck", "", "34, 35"],
    ["58-60", "B b", "Bär", "36, 37"],
    ["61, 62", "F f", "Fisch", "38, 39"],
    ["63, 64", "Au au", "Auerhahn", "38, 39"]
  ]),
  ...abc1WritingCatalog("Schreiblehrgang Teil B", [
    ["3", "Die Symbole bedeuten", "", ""],
    ["4", "Richtige Sitz- und Schreibhaltung", "", ""],
    ["5-7", "G g", "Gans", "40, 41"],
    ["8, 9, 11", "ie", "", "42, 43"],
    ["10", "Ö ö", "Kröte", "42, 43"],
    ["12, 14", "P p", "Papagei", "44, 45"],
    ["13, 14", "Pf pf", "Pfau", "44, 45"],
    ["15, 17", "H h", "Hase", "46, 47"],
    ["16, 17", "ß", "", "46, 47"],
    ["18-20", "ch", "Buch", "48, 49"],
    ["21-23", "Ä ä", "Känguru", "50, 51"],
    ["24, 26", "St st", "Storch", "52, 53"],
    ["25, 26", "Sp sp", "Specht", "52, 53"],
    ["27, 28, 31", "Z z", "Zebra", "54, 55"],
    ["29-31", "tz", "", "54, 55"],
    ["32, 33", "ai", "", "56, 57"],
    ["34", "nk", "Anker", "58, 59"],
    ["35", "ng", "Schlange", "58, 59"],
    ["36, 37", "Ü ü", "Kühe", "58, 59"],
    ["38, 39", "J j", "Jaguar", "60, 61"],
    ["40-42", "Eu eu", "Eule", "62, 63"],
    ["43-45", "V v", "Vogel", "64, 65"],
    ["46-48", "Äu äu", "", "66, 67"],
    ["49-52", "Qu qu", "Qualle", "68, 69"],
    ["53, 54, 56", "Y y", "Pony", "70, 71"],
    ["55, 56", "C c", "Clown", "70, 71"],
    ["57, 58", "X x", "Boxer", "72, 73"],
    ["59", "chs", "", "72, 73"],
    ["60", "Mein tolles Wintererlebnis", "", ""],
    ["61", "Winterelfchen", "", ""],
    ["62", "Sommerelfchen", "", ""],
    ["63", "Meine Reise", "", ""],
    ["64", "Einladung", "", ""]
  ]),
  ...abcCatalog("Teil A", "Wir sind in Klasse 2", [
    ["4", "Wir sind in Klasse 2"], ["6", "Nomen"],["7", "Nomen"], ["8", "Nomen"], ["9", "Nomen"], ["10", "Silbenhaus A und Silbenhaus B"], ["11", "Bestimmter Artikel: der, die, das"], ["12", "Unbestimmter Artikel: ein, eine"], ["13", "Einzahl – Mehrzahl"], ["14", "Nomen-Probe"], ["15", "Eine Infotafel gestalten"], ["3-6", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil A", "Rund um das Abc", [
    ["16", "Rund um das Abc"], ["18", "Abc"], ["20", "Selbstlaute – Mitlaute"], ["21", "Erste Silbe: offen oder geschlossen?"], ["22", "Nach dem Abc ordnen"], ["23", "Im Wörterbuch nachschlagen"], ["24", "Lang oder kurz? – Doppelter Mitlaut"], ["26", "Verben"], ["28", "Nomen oder Verb?"], ["30", "Lang oder kurz? – Sprechprobe"], ["31", "Lang oder kurz?"], ["32", "Aussagesatz"], ["33", "Richtig abschreiben – Würfeldiktat"], ["7-11", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil A", "Im Wald und auf dem Feld", [
    ["34", "Im Wald und auf dem Feld"], ["36", "Verben auf -en: Wortstamm"], ["37", "Die er-Form"], ["39", "Die er-Form mit doppeltem Mitlaut"], ["40", "Verbformen"], ["41", "Verb-Probe"], ["42", "Umlaute A/ä und Au/äu – Wir leiten ab"], ["43", "Umlaute in der er-Form – Wir leiten ab"], ["44", "Aussagesatz"], ["45", "Schleichdiktat"], ["46", "Eine Bildergeschichte schreiben"], ["12-14", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil A", "Bei uns und anderswo", [
    ["48", "Bei uns und anderswo"], ["50", "-en, -el, -er in der zweiten Silbe"], ["51", "nk oder ng – Höre den Unterschied"], ["52", "Wörter mit ck"], ["53", "Lang oder kurz?"], ["54", "Einen Wunschzettel schreiben"], ["55", "Zusammengesetzte Nomen"], ["56", "Zusammengesetzte Nomen: Verbindungs-s"], ["57", "Eine Backanleitung schreiben"], ["60", "Sprachen vergleichen: Begrüßungen"], ["61", "Szenisch spielen"], ["15-18", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil A", "Durch das Jahr", [
    ["62", "Durch das Jahr"], ["64", "Die Monate"], ["66", "Fragesatz"], ["68", "b–p, d–t, g–k: Wir verlängern"], ["70", "Wochentage und andere Tage"], ["72", "Eine Wochenendgeschichte schreiben"], ["73", "Dosendiktat"], ["74", "Eine Bildergeschichte schreiben"], ["19-21", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil A", "Wir – Du – Ich", [
    ["80", "Wir – Du – Ich: Kennst du mich?"], ["82", "Adjektive"], ["84", "Adjektive – Gefühle"], ["86", "Aussagesatz – Streit"], ["87", "Adjektive – Einen Streit klären"], ["88", "Aussagesatz – Bei uns zu Hause"], ["90", "r nach Selbstlaut"], ["91", "Lang oder kurz?"], ["92", "Wörter mit ß"], ["94", "Partnerdiktat"], ["22-27", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil B", "Märchenhafte Welten", [
    ["4", "Märchenhafte Welten"], ["6", "Adjektive"], ["8", "Adjektiv-Probe"], ["9", "Sätze umstellen"], ["10", "Satztreppen"], ["11", "Großschreibung und Satzschlusszeichen"], ["12", "Nachsilbe -chen"], ["13", "Nachsilbe -chen – Umlaute"], ["14", "Wörter mit Ei/ei"], ["15", "äu oder eu?"], ["29-32", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil B", "Natur erleben und entdecken", [
    ["16", "Natur erleben und entdecken"], ["18", "Ein Elfchen schreiben"], ["20", "Zusammengesetzte Nomen"], ["22", "Eine Bastelanleitung schreiben"], ["26", "Genau beschreiben"], ["27", "Sätze umstellen"], ["28", "Aufforderungssatz"], ["29", "Beobachtungen beschreiben"], ["30", "i oder ie?"], ["32", "Lang oder kurz?"], ["33", "Wörter mit ch"], ["34", "Stichwörter schreiben"], ["35", "Einen Vorgang beschreiben"], ["36", "Nomen"], ["37", "Einfache Sätze bilden"], ["38", "Wörter mit chs"], ["39", "Aufnahme-Diktat"], ["33-36", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil B", "Rund um Bücher und Medien", [
    ["40", "Rund um Bücher und Medien"], ["42", "Medientagebuch"], ["43", "Wörter mit V/v"], ["44", "Vorsilben"], ["45", "Vorsilben ver- und vor-"], ["46", "Buchvorstellung"], ["48", "Einen Text überarbeiten: Satzanfänge"], ["49", "Einen Text überarbeiten: Wortfeld „sehen“"], ["50", "Computer und Tablet als Schreibhilfe"], ["51", "Wörter mit Besonderheiten"], ["52", "Wörter mit Sp, St und Sch"], ["54", "Lang oder kurz?"], ["55", "Eine Bildergeschichte schreiben"], ["37-40", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil B", "Tiere als Freunde", [
    ["60", "Tiere als Freunde"], ["62", "Informationen sammeln, festhalten und ordnen"], ["64", "Ein Plakat gestalten"], ["65", "Einen Vortrag halten"], ["66", "Bei einem Vortrag zuhören"], ["67", "Einfache Aussagesätze"], ["68", "Wörter mit Pf/pf"], ["70", "Zusammengesetzte Nomen"], ["71", "Einen Text anhören"], ["72", "Wörter mit tz"], ["74", "Lang oder kurz?"], ["75", "Wortarten erkennen – Richtig schreiben"], ["76", "Eine Bildergeschichte schreiben"], ["81", "Eine spannende Tiergeschichte schreiben"], ["41-43", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...abcCatalog("Teil B", "Fantasie und Wirklichkeit", [
    ["82", "Fantasie und Wirklichkeit"], ["84", "Eine Einladung schreiben"], ["85", "Einen Vorgang beschreiben"], ["86", "Einen Text überarbeiten: Wortfeld „gehen“"], ["87", "Einen Text überarbeiten: Wortfeld „sagen“"], ["88", "Wörter mit h vor l, m, n, r"], ["90", "Einen Text überarbeiten: ihm, ihnen, ihn"], ["91", "Wegbeschreibung"], ["92", "Zusammengesetzte Nomen"], ["44-48", "Das kann ich schon – Lernstandsheft", "Lernstandsheft"]
  ]),
  ...miniMaxCatalog("Teil 1", [
    ["Wiederholung", "", "2-5", "", "", ""],
    ["Zahlen bis 100", "", "6-7", "8", "9", "1"],
    ["Orientierung im Zahlenraum bis 100", "Hunderterfeld, Geheimschrift, Hundertertafel", "10-13", "14", "15", ""],
    ["Vom Zahlenstrahl zum Rechenstrich", "", "16-17", "18", "", "2"],
    ["Addition ohne Zehnerübergang", "Ergänzen", "19-22", "23", "24", ""],
    ["Subtraktion ohne Zehnerübergang", "Ergänzen", "25-28", "29", "30", ""],
    ["Addition und Subtraktion üben", "Zahlenmauern", "31-32", "33", "", "3"],
    ["Addition mit Zehnerübergang", "Zuerst bis zum Zehner", "34-38", "39", "40", "4"],
    ["Subtraktion mit Zehnerübergang", "Zuerst zurück bis zum Zehner, Umkehraufgaben", "41-44", "45", "46", "5"],
    ["Addition und Subtraktion üben", "", "47-48", "49", "50", "6"],
    ["Sachrechnen", "", "51-52", "53", "", "7"],
    ["Multiplikation", "Tauschaufgaben", "54-57", "", "", ""],
    ["Multiplikation mit 2, 5 und 10", "Einmaleins mit 2, Einmaleins mit 10, Einmaleins mit 5, Einmaleins mit 2, 5 und 10", "58-61", "62", "63", "8"]
  ]),
  ...miniMaxCatalog("Teil 2", [
    ["Königsaufgaben nutzen", "", "2-3", "4", "", ""],
    ["Multiplikation", "Einmaleins mit 4, 8, 4 und 8, 3, 6, 9, 3/6/9, 7, 1 und 0", "5-13", "14", "15", "9"],
    ["Multiplikation üben", "", "16-17", "18", "19", "10"],
    ["Einmaleins-Tafel", "", "20-21", "22", "", ""],
    ["Division", "Verteilen, Aufteilen", "23-24", "25", "26", "11"],
    ["Multiplikation und Division üben", "Umkehraufgaben, Aufgabenfamilien, Kontrolle mit der Umkehraufgabe, Gleichungen und Ungleichungen", "27-31", "32", "33", "12"],
    ["Sachrechnen", "", "34-36", "", "", ""],
    ["Addition mit Zehnerübergang", "Zuerst die Zehner zusammen, dann die Einer; zuerst die Zehner dazu, dann die Einer; Zehnertrick", "37-42", "43", "44", "13"],
    ["Subtraktion mit Zehnerübergang", "Zuerst die Zehner weg, dann die Einer; Zehnertrick; Ergänzen", "45-50", "51", "52", "14"],
    ["Addition und Subtraktion üben", "Gerade und ungerade Zahlen, geschicktes Rechnen, Gleichungen und Ungleichungen", "53-57", "58", "59", "15"],
    ["Sachrechnen", "", "60-61", "", "", ""],
    ["Division mit Rest", "", "62-63", "", "", "16"]
  ]),
  ...miniMax3Catalog("Teil 1", [
    ["Wiederholung", "Addition und Subtraktion; Multiplikation und Division", "2-9"],
    ["Zahlen bis 1 000", "Geheimschrift; Hundertertafeln; Zerlegen", "10-17"],
    ["Vom Zahlenstrahl zum Rechenstrich", "", "18-24"],
    ["Rechnen ohne Hunderterübergang", "Addition; Subtraktion", "25-35"],
    ["Sachrechnen", "", "36-38"],
    ["Addition mit Hunderterübergang", "Halbschriftliche Addition; Hundertertrick", "39-45"],
    ["Subtraktion mit Hunderterübergang", "Halbschriftliche Subtraktion; Hundertertrick; Ergänzen", "46-52"],
    ["Addition und Subtraktion üben", "Im Kopf oder halbschriftlich", "53-59"],
    ["Sachrechnen", "Fermi-Aufgaben", "60-64"]
  ]),
  ...miniMax4Catalog("Teil 1", [
    ["Wiederholung", "Addition und Subtraktion; Multiplikation und Division", "2-13"],
    ["Zahlen bis 10 000", "", "14-19"],
    ["Vom Zahlenstrahl zum Rechenstrich", "Zahlen bis 10 000", "20-27"],
    ["Zahlen bis 100 000", "", "28-33"],
    ["Addition und Subtraktion bis 100 000", "Quersumme", "34-41"],
    ["Zahlen bis 1 000 000", "", "42-45"],
    ["Vom Zahlenstrahl zum Rechenstrich", "Zahlen bis 1 000 000", "46-51"],
    ["Große Zahlen runden", "", "52-55"],
    ["Addition und Subtraktion bis 1 000 000", "Schriftliche Addition; Schriftliche Subtraktion; Im Kopf oder schriftlich", "56-63"],
    ["Sachrechnen", "", "64-69"],
    ["Multiplikation und Division bis 1 000 000", "Vielfache und Teiler; Primzahlen", "70-78"],
    ["Rechenregeln", "", "79-80"]
  ])
]);

function abcCatalog(part, area, rows) {
  return rows.map(([pageSpec, title, category = ""]) => {
    const isLernstandsheft = category === "Lernstandsheft";
    return catalogItem(
      "Deutsch",
      isLernstandsheft ? "ABC der Tiere 2 - Lernstandsheft" : "ABC der Tiere 2",
      isLernstandsheft ? "Teil C" : part,
      area,
      category,
      pageSpec,
      title,
      "Deutsch",
      ""
    );
  });
}

function abc1WorkbookCatalog(part, rows) {
  return rows.map(([pageSpec, topicTitle, focus, fibelPages]) => abc1CatalogItem({
    bookType: "Arbeitsheft",
    part,
    pageSpec,
    topicTitle,
    focus,
    fibelPages
  }));
}

function abc1WritingCatalog(part, rows) {
  return rows.map(([pageSpec, title, anchorImage, fibelPages]) => abc1CatalogItem({
    bookType: "Schreiblehrgang",
    part,
    pageSpec,
    topicTitle: title,
    focus: title,
    anchorImage,
    fibelPages
  }));
}

function abc1CatalogItem({ bookType, part, pageSpec, topicTitle, focus = "", anchorImage = "", fibelPages = "" }) {
  const displayTitle = bookType === "Schreiblehrgang"
    ? [focus || topicTitle, anchorImage].filter(Boolean).join(" – ")
    : focus && focus !== topicTitle ? `${topicTitle} – ${focus}` : topicTitle;
  const details = [
    bookType === "Schreiblehrgang" && anchorImage ? `Ankerbild: ${anchorImage}` : "",
    fibelPages ? `zu Fibelseite: ${fibelPages}` : ""
  ].filter(Boolean).join(" · ");
  return catalogItem("Deutsch", "ABC der Tiere 1", part, bookType, bookType, pageSpec, topicTitle, details, "", {
    bookType,
    topicTitle,
    focus: focus || topicTitle,
    anchorImage,
    fibelPages,
    displayTitle
  });
}

function miniMaxCatalog(part, rows) {
  return rows
    .map(([theme, subtheme, basis, training, extra, test]) => {
      const visibleRanges = [basis, training, extra].filter(Boolean);
      const pageSpec = mergePageSpecs(visibleRanges);
      return pageSpec ? catalogItem("Mathe", "MiniMax 2", part, theme, "Thema", pageSpec, theme, subtheme ? `Unterthemen: ${subtheme}` : "", test ? `Test ${test}` : "") : null;
    })
    .filter(Boolean);
}

function miniMax3Catalog(part, rows) {
  return rows.map(([theme, subtheme, pages]) => catalogItem("Mathe", "MiniMax 3", part, theme, "Thema", pages, theme, subtheme ? `Unterthemen: ${subtheme}` : "", ""));
}

function miniMax4Catalog(part, rows) {
  return rows.map(([theme, subtheme, pages]) => catalogItem("Mathe", "MiniMax 4", part, theme, "Thema", pages, theme, subtheme ? `Unterthemen: ${subtheme}` : "", ""));
}

const RETIRED_WRONG_MINIMAX3_SIGNATURES = new Set([
  "Zahlen bis 20|2-11",
  "Orientierung im Zahlenraum bis 20|12-19",
  "Plusaufgaben|20-23",
  "Minusaufgaben|24-28",
  "Verdoppeln und halbieren|29-33",
  "Zehnerübergang: Plusaufgaben|34-41",
  "1 + 1 Tafel|42-46",
  "Zehnerübergang: Minusaufgaben|47-53",
  "1 - 1 Tafel|54-58",
  "Plus- und Minusaufgaben üben|59-65",
  "Sachrechnen|66-69",
  "Plus- und Minusaufgaben üben|70-77",
  "Zehnerzahlen bis 100|78-79",
  "Unsere Fachsprache|80",
  "Wiederholung|2-5",
  "Zahlen bis 100|6-9",
  "Orientierung im Zahlenraum bis 100|10-15",
  "Vom Zahlenstrahl zum Rechenstrich|16-18",
  "Addition ohne Zehnerübergang|19-24",
  "Subtraktion ohne Zehnerübergang|25-30",
  "Addition und Subtraktion üben|31-33",
  "Addition mit Zehnerübergang|34-40",
  "Subtraktion mit Zehnerübergang|41-46",
  "Addition und Subtraktion üben|47-50",
  "Sachrechnen|51-53",
  "Multiplikation|54-57",
  "Multiplikation mit 2, 5 und 10|58-63",
  "Königsaufgaben nutzen|2-4",
  "Multiplikation|5-15",
  "Multiplikation üben|16-19",
  "Einmaleins-Tafel|20-22",
  "Division|23-26",
  "Multiplikation und Division üben|27-33",
  "Sachrechnen|34-36",
  "Addition mit Zehnerübergang|37-44",
  "Subtraktion mit Zehnerübergang|45-52",
  "Addition und Subtraktion üben|53-59",
  "Sachrechnen|60-61",
  "Division mit Rest|62-63"
]);

function catalogItem(subject, workbook, part, area, category, pageSpec, title, competence, note, extra = {}) {
  const [page, pageEnd, pageLabel] = parsePageSpec(pageSpec);
  const pageRangeMode = hasExplicitPageRange(pageSpec, page, pageEnd) ? "explicit" : "auto";
  const item = {
    subject,
    schoolYear: inferSchoolYearFromWorkbook(workbook),
    workbook,
    part,
    area,
    category,
    page,
    startPage: page,
    pageEnd,
    endPage: Number(pageEnd || page || 0),
    pageLabel,
    displayPages: formatCatalogDisplayPages(pageLabel),
    pageRangeMode,
    title,
    competence,
    note,
    ...extra
  };
  return { ...item, catalogKey: makeWorkbookCatalogKey(item) };
}

function parsePageSpec(value) {
  const normalized = String(value || "").trim().replace(/–/g, "-");
  const numbers = normalized.match(/\d+/g)?.map(Number) || [];
  return [numbers[0] || 0, numbers.length > 1 ? numbers[numbers.length - 1] : "", normalized];
}

function mergePageSpecs(values) {
  const numbers = values.flatMap((value) => String(value || "").match(/\d+/g)?.map(Number) || []);
  if (!numbers.length) return "";
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? String(first) : `${first}-${last}`;
}

function hasExplicitPageRange(value, startPage, endPage) {
  const normalized = String(value || "").trim().replace(/–/g, "-");
  return Number(endPage || 0) > Number(startPage || 0) || /[-,]/.test(normalized);
}

function normalizeCatalogPageLabel(value) {
  return String(value || "")
    .trim()
    .replace(/^S\.?\s*/i, "")
    .replace(/–/g, "-");
}

function formatCatalogPageLabel(startPage, endPage) {
  const start = Number(startPage || 0);
  const end = Number(endPage || start || 0);
  if (!start) return "";
  return end > start ? `${start}-${end}` : String(start);
}

function formatCatalogDisplayPages(pageLabel) {
  const normalized = normalizeCatalogPageLabel(pageLabel);
  return normalized ? `S. ${normalized.replace(/-/g, "–")}` : "";
}

function makeWorkbookCatalogKey(item) {
  return [
    item.subject || item.fach || "",
    item.workbook || item.lehrwerk || item.material || "",
    item.part || item.teil || "",
    item.area || item.bereich || "",
    item.category || item.kategorie || item.typ || "",
    item.title || item.thema || item.inhalt || "",
    Number(item.startPage || item.page || item.seite || 0)
  ].join("|").toLowerCase();
}

function workbookCatalogRangeGroup(item) {
  return [
    item.classId || "",
    normalizeSchoolYear(item.schoolYear || ""),
    item.subject || "",
    item.workbook || "",
    item.part || "",
    item.category || ""
  ].join("|").toLowerCase();
}

function completeWorkbookCatalogPageRanges(items) {
  const prepared = (items || []).map((item, index) => {
    const startPage = Number(item.startPage || item.page || item.seite || 0);
    const storedEndPage = Number(item.endPage || item.pageEnd || item.seiteBis || 0);
    const rawPageLabel = normalizeCatalogPageLabel(item.pageLabel || item.displayPages || item.seitenLabel || "");
    const pageRangeMode = item.pageRangeMode
      || (hasExplicitPageRange(rawPageLabel, startPage, storedEndPage) ? "explicit" : "auto");
    const endPage = storedEndPage >= startPage ? storedEndPage : startPage;
    const pageLabel = rawPageLabel || formatCatalogPageLabel(startPage, endPage);
    return {
      ...item,
      page: startPage,
      startPage,
      pageEnd: endPage > startPage ? endPage : "",
      endPage,
      pageLabel,
      displayPages: formatCatalogDisplayPages(pageLabel),
      pageRangeMode,
      catalogKey: item.catalogKey || makeWorkbookCatalogKey({ ...item, startPage }),
      __catalogOrder: index
    };
  });

  const groups = new Map();
  prepared.forEach((item) => {
    const key = workbookCatalogRangeGroup(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  groups.forEach((groupItems) => {
    const ordered = [...groupItems].sort((a, b) => (
      Number(a.startPage || 0) - Number(b.startPage || 0)
      || a.__catalogOrder - b.__catalogOrder
    ));
    ordered.forEach((item) => {
      if (item.pageRangeMode !== "auto" || !item.startPage) return;
      const next = ordered.find((candidate) => Number(candidate.startPage || 0) > Number(item.startPage || 0));
      const inferredEndPage = next ? Number(next.startPage) - 1 : Number(item.endPage || item.startPage);
      item.endPage = Math.max(Number(item.startPage), inferredEndPage);
      item.pageEnd = item.endPage > item.startPage ? item.endPage : "";
      item.pageLabel = formatCatalogPageLabel(item.startPage, item.endPage);
      item.displayPages = formatCatalogDisplayPages(item.pageLabel);
    });
  });

  return prepared.map(({ __catalogOrder, ...item }) => item);
}

const DEFAULT_PROGRESS_SETTINGS = {
  staleDays: 5,
  groupLookThreshold: 4,
  groupFarThreshold: 8,
  aheadThreshold: 5,
  showGroupComparison: true,
  showGoalComparison: true
};

const DEFAULT_CHILD_VIEW_SETTINGS = {
  showWeek: true,
  abcVisibility: "assigned",
  minimaxVisibility: "assigned",
  showSelfReports: false,
  showTraining: true,
  showLearningGames: true,
  allowSelfReports: false,
  allowedSelfReportMaterials: {
    abc: true,
    minimax: true,
    other: false
  }
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
  { code: "E-01", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Geräusche-Detektiv", text: "Setze dich 5 Minuten ruhig hin. Höre genau zu und sammle 5 verschiedene Geräusche.", symbol: "👂", steps: ["Setze dich ruhig hin.", "Höre 5 Minuten genau zu.", "Sammle 5 verschiedene Geräusche.", "Schreibe oder male deine Geräusche auf."] },
  { code: "E-02", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Mein Frühstück", text: "Beobachte dein Frühstück. Was hast du gegessen und getrunken?", symbol: "🍽️", steps: ["Denke an dein Frühstück.", "Schreibe oder male, was du gegessen hast.", "Schreibe oder male, was du getrunken hast.", "Überlege, was daran gesund war."] },
  { code: "E-03", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Buchstaben sammeln", text: "Suche den Anfangsbuchstaben deines Namens. Finde ihn 5-mal in deiner Umgebung.", symbol: "🔤", steps: ["Schreibe den Anfangsbuchstaben deines Namens auf.", "Suche ihn in deiner Umgebung.", "Finde ihn 5-mal.", "Notiere oder male deine Fundstellen."] },
  { code: "E-04", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Zahlenjagd", text: "Suche Zahlen in deiner Umgebung. Finde mindestens 10 Zahlen.", symbol: "🔢", steps: ["Schau dich genau um.", "Suche Zahlen in deiner Umgebung.", "Finde mindestens 10 Zahlen.", "Schreibe sie auf."] },
  { code: "E-05", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Wörter im Raum", text: "Suche 12 Wörter im Raum und schreibe sie auf.", symbol: "✏️", steps: ["Schau dich im Raum um.", "Suche Wörter, die du lesen kannst.", "Schreibe 12 Wörter auf.", "Kontrolliere, ob du 12 Wörter gefunden hast."] },
  { code: "E-06", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Formenjäger", text: "Suche Rechtecke, Kreise und Dreiecke. Finde mindestens 3 von jeder Form.", symbol: "🔺", steps: ["Suche Rechtecke.", "Suche Kreise.", "Suche Dreiecke.", "Finde von jeder Form mindestens 3 Beispiele."] },
  { code: "E-07", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Farbenforscher", text: "Suche Dinge in Rot, Blau, Gelb und Grün. Sammle jeweils 3 Beispiele.", symbol: "🎨", steps: ["Suche rote Dinge.", "Suche blaue, gelbe und grüne Dinge.", "Sammle zu jeder Farbe 3 Beispiele.", "Schreibe oder male deine Beispiele auf."] },
  { code: "E-08", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Treppen zählen", text: "Zähle eine Treppe. Wie viele Stufen hat sie?", symbol: "🔢", steps: ["Suche eine Treppe.", "Zähle die Stufen langsam.", "Schreibe die Anzahl auf.", "Kontrolliere noch einmal."] },
  { code: "E-09", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Münzen entdecken", text: "Suche Euro-Münzen. Ordne sie von klein nach groß.", symbol: "🪙", steps: ["Suche verschiedene Euro-Münzen.", "Schau dir die Werte genau an.", "Ordne sie von klein nach groß.", "Schreibe oder zeichne deine Reihenfolge auf."] },
  { code: "E-10", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Meine Hände", text: "Betrachte deine Hände. Wofür hast du sie heute benutzt?", symbol: "✋", steps: ["Betrachte deine Hände genau.", "Überlege, wofür du sie heute benutzt hast.", "Sammle mehrere Beispiele.", "Schreibe oder male deine Ideen auf."] },
  { code: "E-11", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Wetterbericht", text: "Schau aus dem Fenster. Beschreibe das Wetter.", symbol: "🌦️", steps: ["Schau aus dem Fenster.", "Beobachte Himmel, Wolken, Wind und Regen.", "Beschreibe das Wetter.", "Male ein passendes Wettersymbol."] },
  { code: "E-12", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Tierbeobachter", text: "Beobachte ein Tier. Was macht es?", symbol: "🔎", steps: ["Suche ein Tier oder ein Bild von einem Tier.", "Beobachte genau.", "Beschreibe, was es macht.", "Schreibe oder male deine Beobachtung auf."] },
  { code: "E-13", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Pflanzenforscher", text: "Suche eine Pflanze. Beschreibe Blatt, Farbe und Größe.", symbol: "🌱", steps: ["Suche eine Pflanze.", "Betrachte Blätter, Farbe und Größe.", "Beschreibe die Pflanze.", "Zeichne sie, wenn du möchtest."] },
  { code: "E-14", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Blätter vergleichen", text: "Suche 3 Blätter und vergleiche sie. Beschreibe jedes Blatt.", symbol: "🍃", steps: ["Suche 3 Blätter.", "Vergleiche Form, Farbe und Größe.", "Beschreibe jedes Blatt.", "Schreibe Gemeinsamkeiten und Unterschiede auf."] },
  { code: "E-15", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Wasser sparen", text: "Finde 5 Ideen, wie man Wasser sparen kann.", symbol: "💧", steps: ["Überlege, wann du Wasser benutzt.", "Finde 5 Ideen zum Wassersparen.", "Schreibe die Ideen auf.", "Markiere deine beste Idee."] },
  { code: "E-16", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Strom im Alltag", text: "Suche Dinge, die Strom brauchen, und ordne sie.", symbol: "⚡", steps: ["Suche Dinge, die Strom brauchen.", "Schreibe oder male sie auf.", "Ordne sie nach Ort oder Nutzung.", "Überlege, welche Dinge oft gebraucht werden."] },
  { code: "E-17", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Helfer im Alltag", text: "Finde 5 Dinge, die Menschen im Alltag helfen.", symbol: "🧰", steps: ["Schau dich genau um.", "Finde Dinge, die Menschen helfen.", "Wähle 5 Dinge aus.", "Schreibe auf, wobei sie helfen."] },
  { code: "E-18", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Wasserforscher", text: "Teste verschiedene Gegenstände. Was schwimmt? Was sinkt?", symbol: "💧", steps: ["Sammle verschiedene Gegenstände.", "Vermute: Was schwimmt? Was sinkt?", "Teste vorsichtig im Wasser.", "Notiere deine Ergebnisse."], material: ["Lerntagebuch", "Stift", "Schüssel mit Wasser", "verschiedene Gegenstände"] },
  { code: "E-19", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Verpackungs-Leser", text: "Lies eine Verpackung. Welche Wörter kannst du erkennen?", symbol: "📦", steps: ["Suche eine Verpackung.", "Lies die Wörter darauf.", "Schreibe Wörter auf, die du erkennst.", "Markiere ein besonders wichtiges Wort."] },
  { code: "E-20", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Nomen finden", text: "Suche 10 Nomen im Raum und schreibe den Artikel dazu.", symbol: "📄", steps: ["Suche 10 Nomen im Raum.", "Schreibe sie auf.", "Schreibe der, die oder das dazu.", "Prüfe die Großschreibung."] },
  { code: "E-21", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Adjektive sammeln", text: "Suche 5 Dinge im Raum und beschreibe sie mit passenden Adjektiven.", symbol: "💭", steps: ["Suche 5 Dinge im Raum.", "Überlege: Wie ist jedes Ding?", "Schreibe passende Adjektive dazu.", "Kontrolliere, ob die Wörter gut passen."] },
  { code: "E-22", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Genau betrachten", text: "Betrachte einen Gegenstand genau. Zeichne oder beschreibe ihn.", symbol: "🔍", steps: ["Wähle einen Gegenstand.", "Betrachte ihn ganz genau.", "Zeichne oder beschreibe ihn.", "Notiere besondere Details."] },
  { code: "E-23", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Rollen, biegen, stapeln", text: "Suche je ein Ding: biegt sich, rollt, stapelt oder kippt. Zeichne oder beschreibe deine Fundstücke.", symbol: "🧱", steps: ["Suche ein Ding, das sich biegt.", "Suche ein Ding, das rollt.", "Suche ein Ding, das man stapeln kann oder das kippt.", "Zeichne oder beschreibe deine Fundstücke."] },
  { code: "E-24", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Symmetrie suchen", text: "Suche Dinge, die auf beiden Seiten ähnlich aussehen.", symbol: "↔️", steps: ["Suche Dinge, die links und rechts ähnlich aussehen.", "Betrachte die Mitte.", "Zeichne oder beschreibe Beispiele.", "Markiere, wenn du möchtest, die Spiegelachse."] },
  { code: "E-25", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Etwas helfen", text: "Hilf bei einer kleinen Aufgabe. Beschreibe, was du gemacht hast.", symbol: "🤝", steps: ["Suche eine kleine Aufgabe, bei der du helfen kannst.", "Hilf sorgfältig.", "Beschreibe, was du gemacht hast.", "Überlege, wem es geholfen hat."] },
  { code: "E-26", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Ein Kompliment schenken", text: "Mache einer Person ein ehrliches Kompliment. Beobachte die Reaktion.", symbol: "💬", steps: ["Überlege dir ein ehrliches Kompliment.", "Sage es freundlich.", "Beobachte die Reaktion.", "Schreibe oder erzähle, was passiert ist."] },
  { code: "E-27", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Interview: Guter Freund", text: "Interviewe eine Person: Was ist ein guter Freund oder eine gute Freundin?", symbol: "🎤", steps: ["Suche eine Person für dein Interview.", "Frage: Was ist ein guter Freund oder eine gute Freundin?", "Höre genau zu.", "Schreibe oder erzähle die Antwort."] },
  { code: "E-28", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Was ist Glück?", text: "Frage eine Person: Was ist Glück? Schreibe oder erzähle die Antwort.", symbol: "☀️", steps: ["Suche eine Person.", "Frage: Was ist Glück?", "Höre genau zu.", "Schreibe oder erzähle die Antwort."] },
  { code: "E-29", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Gefühle erkennen", text: "Denke an deinen Tag. Welche Gefühle hattest du?", symbol: "💭", steps: ["Denke an deinen Tag.", "Sammle Gefühle, die du hattest.", "Schreibe oder male sie auf.", "Überlege, wann du welches Gefühl hattest."] },
  { code: "E-30", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Mein Lieblingsplatz", text: "Suche deinen Lieblingsplatz zu Hause oder auf dem Schulhof. Beschreibe ihn mit mindestens 5 Wörtern.", symbol: "📍", steps: ["Denke an deinen Lieblingsplatz.", "Schau ihn dir genau an oder stelle ihn dir vor.", "Beschreibe ihn mit mindestens 5 Wörtern.", "Male ihn, wenn du möchtest."] },
  { code: "E-31", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Satzdetektiv", text: "Schreibe einen Satz ab. Zähle die Wörter und die Buchstaben.", symbol: "🕵️", steps: ["Wähle einen Satz.", "Schreibe ihn sorgfältig ab.", "Zähle die Wörter.", "Zähle die Buchstaben."] },
  { code: "E-32", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Reimfinder", text: "Finde Reimwörter. Sammle 5 Reimpaare.", symbol: "🎵", steps: ["Suche Wörter, die sich reimen.", "Bilde passende Paare.", "Sammle 5 Reimpaare.", "Sprich die Paare leise vor."] },
  { code: "E-33", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Sätze über den Raum", text: "Schreibe 5 Sätze über Dinge, die du gerade siehst.", symbol: "✏️", steps: ["Schau dich im Raum um.", "Wähle Dinge aus, die du siehst.", "Schreibe 5 ganze Sätze.", "Achte auf Satzanfang und Punkt."] },
  { code: "E-34", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Bild oder Buchcover", text: "Wähle ein Bild oder Buchcover und schreibe 5 Sätze dazu.", symbol: "🖼️", steps: ["Wähle ein Bild oder Buchcover.", "Schau genau hin.", "Schreibe 5 Sätze dazu.", "Lies deine Sätze noch einmal."] },
  { code: "E-35", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Rätsel schreiben", text: "Schreibe ein Rätsel zu einem Gegenstand im Raum.", symbol: "❓", steps: ["Wähle einen Gegenstand im Raum.", "Sammle Hinweise dazu.", "Schreibe ein Rätsel.", "Prüfe, ob jemand die Lösung finden kann."] },
  { code: "E-36", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Ding-Geschichte", text: "Wähle ein Ding im Raum und schreibe eine Geschichte mit 5 Sätzen.", symbol: "📝", steps: ["Wähle ein Ding im Raum.", "Überlege, was passieren könnte.", "Schreibe eine Geschichte mit 5 Sätzen.", "Lies deine Geschichte noch einmal."] },
  { code: "E-37", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Geschichtenstarter", text: "Beginne mit: „Heute habe ich etwas Überraschendes entdeckt ...“", symbol: "✨", steps: ["Schreibe den Geschichtenstarter ab.", "Überlege, was entdeckt wurde.", "Schreibe deine Geschichte weiter.", "Lies sie noch einmal."] },
  { code: "E-38", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Mein Wochenglanz", text: "Denke an die Woche zurück. Was war dein schönstes Erlebnis?", symbol: "🌟", steps: ["Denke an deine Woche.", "Wähle dein schönstes Erlebnis.", "Schreibe oder male es auf.", "Erkläre, warum es schön war."] },
  { code: "E-39", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Gesunde Einkaufsliste", text: "Schreibe eine Einkaufsliste für ein gesundes Brötchen in der Klasse.", symbol: "🥪", steps: ["Überlege, was auf ein gesundes Brötchen passt.", "Schreibe eine Einkaufsliste.", "Prüfe, ob alles zusammenpasst.", "Ergänze Getränke oder Obst, wenn du möchtest."] },
  { code: "E-40", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Zahlen-Hinweise", text: "Denke dir eine Zahl aus und schreibe 3 Hinweise dazu.", symbol: "💡", steps: ["Denke dir eine Zahl aus.", "Schreibe 3 Hinweise dazu.", "Notiere die Lösung.", "Prüfe, ob man deine Zahl finden kann."] },
  { code: "E-41", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Muster fortsetzen", text: "Zeichne ein Muster und setze es mindestens 10 Schritte fort.", symbol: "🔴", steps: ["Beginne mit einem Muster.", "Zeichne es auf.", "Setze es mindestens 10 Schritte fort.", "Kontrolliere die Regel."] },
  { code: "E-42", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Strichliste erstellen", text: "Wähle 3 Dinge aus, zum Beispiel Bücher, Stifte oder Spiele. Zähle sie und erstelle eine Strichliste.", symbol: "||||", steps: ["Wähle 3 Dinge aus.", "Zähle jedes Ding.", "Erstelle eine Strichliste.", "Kontrolliere deine Zählung."] },
  { code: "E-43", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Größen vergleichen", text: "Suche Dinge, die länger, kürzer, höher oder niedriger sind. Schreibe 4 Sätze. Beispiel: Die Vase ist höher als die Tasse.", symbol: "📏", steps: ["Suche Dinge zum Vergleichen.", "Vergleiche länger, kürzer, höher oder niedriger.", "Schreibe 4 Sätze.", "Nutze das Beispiel als Hilfe."] },
  { code: "E-44", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Bewegungsaufgabe", text: "Überlege dir eine Bewegungsaufgabe für die Klasse und schreibe sie auf.", symbol: "🏃", steps: ["Überlege dir eine Bewegung.", "Formuliere eine Aufgabe für die Klasse.", "Schreibe sie auf.", "Prüfe, ob andere sie gut verstehen."] },
  { code: "E-45", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Zukunfts-Gegenstand", text: "Wähle einen Gegenstand. Wie könnte er in Zukunft aussehen?", symbol: "🚀", steps: ["Wähle einen Gegenstand.", "Überlege, wie er in Zukunft aussehen könnte.", "Zeichne oder beschreibe ihn.", "Erkläre eine besondere neue Funktion."] },
  { code: "E-46", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Geheimschrift", text: "Erfinde eine Geheimschrift und schreibe deinen Namen damit.", symbol: "🔐", steps: ["Erfinde Zeichen für Buchstaben.", "Schreibe deinen Namen in Geheimschrift.", "Notiere den Schlüssel.", "Prüfe, ob jemand ihn lesen kann."] },
  { code: "E-47", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Eigene Entdeckeraufgabe", text: "Erfinde eine eigene Entdeckeraufgabe für ein anderes Kind.", symbol: "⭐", steps: ["Überlege dir eine neue Aufgabe.", "Schreibe sie verständlich auf.", "Denke an Material und Schritte.", "Prüfe, ob ein anderes Kind sie lösen kann."] },
  { code: "E-48", subject: "Entdecker", subcategory: "Entdeckeraufgaben", title: "Joker-Aufgabe", text: "Wähle eine Aufgabe von Seite 1 oder 2 noch einmal und verändere sie.", symbol: "🃏", steps: ["Wähle eine Entdeckeraufgabe aus.", "Verändere eine Regel oder einen Auftrag.", "Bearbeite deine neue Version.", "Schreibe auf, was du verändert hast."] }
];

const ENTDECKER_SUBCATEGORY = "Entdeckeraufgaben";
const DEFAULT_ENTDECKER_TASKS = ANALOG_TRAINING_TASKS.map(trainingTaskFromTemplate);

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
  trainingTask("TS-01", "Schule", "Schule", "Lernwörter", "Übe deine Lernwörter.", ["Nimm deine Lernwörter.", "Lies jedes Wort genau.", "Übe die Wörter so, wie es vereinbart ist.", "Hake ab, wenn du fertig bist."], ["Sprich schwierige Stellen leise mit."], ["Lernwörter", "Stift"], { area: "Schule", symbol: "🔤" }),
  trainingTask("TS-02", "Schule", "Schule", "Kopfrechnen", "Übe Kopfrechnen.", ["Wähle passende Kopfrechenaufgaben.", "Rechne leise im Kopf.", "Kontrolliere deine Ergebnisse.", "Hake ab, wenn du fertig bist."], ["Nutze erst den Kopf, dann die Kontrolle."], ["Kopfrechenaufgaben", "Stift"], { area: "Schule", symbol: "🧠" }),
  trainingTask("TS-03", "Schule", "Schule", "AntonApp", "Arbeite in der AntonApp.", ["Öffne die AntonApp.", "Wähle die vereinbarten Aufgaben.", "Arbeite ruhig und konzentriert.", "Hake ab, wenn du fertig bist."], ["Bleibe bei den freigegebenen Aufgaben."], ["iPad oder Tablet", "AntonApp"], { area: "Schule", symbol: "📱" }),
  trainingTask("TS-04", "Schule", "Schule", "Schön-Schreib-Heft", "Arbeite im Schön-Schreib-Heft.", ["Nimm dein Schön-Schreib-Heft.", "Schreibe langsam und sorgfältig.", "Achte auf Linien und Buchstabenformen.", "Hake ab, wenn du fertig bist."], ["Langsam und sauber ist wichtiger als schnell."], ["Schön-Schreib-Heft", "Stift"], { area: "Schule", symbol: "✍️" }),
  trainingTask("TS-05", "Schule", "Schule", "Mathe-Kartei", "Arbeite mit der Mathe-Kartei.", ["Wähle eine passende Karte.", "Bearbeite die Aufgabe.", "Kontrolliere dein Ergebnis.", "Hake ab, wenn du fertig bist."], ["Nimm eine Karte, die zu deinem Lernstand passt."], ["Mathe-Kartei", "Stift"], { area: "Schule", symbol: "🔢" }),
  trainingTask("TS-06", "Schule", "Schule", "Deutsch-Kartei", "Arbeite mit der Deutsch-Kartei.", ["Wähle eine passende Karte.", "Bearbeite die Aufgabe.", "Kontrolliere deine Arbeit.", "Hake ab, wenn du fertig bist."], ["Lies die Aufgabe genau, bevor du beginnst."], ["Deutsch-Kartei", "Stift"], { area: "Schule", symbol: "📚" }),
  ...DEFAULT_ENTDECKER_TASKS
];

function trainingTask(code, subject, subcategory, title, text, steps, tips = [], material = ["Lerntagebuch", "Stift"], overrides = {}) {
  return {
    id: `training-${code}`,
    area: overrides.area || "OGS/Zuhause",
    trainingArea: overrides.area || "OGS/Zuhause",
    subcategory: normalizeTrainingSubcategory(subcategory, code),
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
    symbol: overrides.symbol || (subject === "Deutsch" ? "📘" : subject === "Mathe" ? "🔢" : subject === "Entdecker" ? "⭐" : "🔎"),
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
    dataVersion: DATA_VERSION,
    savedAt: null,
    setupComplete: false,
    pinHash: "",
    recoveryKeyHash: "",
    activeClassId: null,
    classes: [],
    animals: [],
    animalGroups: [],
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
    workbookCatalog: [],
    workbookAssignments: [],
    workbookAssignmentStatuses: [],
    childWorkbookReports: [],
    activeWorkbookMaterials: [],
    weeklyPlans: [],
    weeklyPlanStatuses: [],
    learningGameSessions: [],
    microsoftSync: { clientId: "", authority: "consumers", redirectUri: "", autoBackup: false, connectedAccount: "", connectedName: "", lastSyncAt: "", lastSyncStatus: "" },
    classSync: { enabled: false, endpoint: "", syncCode: "", lastPushAt: "", lastPullAt: "", lastError: "" },
    progressSettings: { ...DEFAULT_PROGRESS_SETTINGS },
    childViewSettings: { ...DEFAULT_CHILD_VIEW_SETTINGS },
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
    activeSchoolYear: inferSchoolYearFromClassName(name),
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

function createDefaultWorkbookCatalog(classId) {
  return DEFAULT_WORKBOOK_CATALOG.map((item) => ({
    id: makeId(),
    classId,
    catalogKey: item.catalogKey,
    subject: item.subject,
    schoolYear: item.schoolYear || inferSchoolYearFromWorkbook(item.workbook),
    workbook: item.workbook,
    part: item.part || "",
    area: item.area || "",
    category: item.category || "",
    page: item.page,
    startPage: item.startPage || item.page,
    pageEnd: item.pageEnd || "",
    endPage: item.endPage || item.pageEnd || item.page,
    pageLabel: item.pageLabel || "",
    displayPages: item.displayPages || formatCatalogDisplayPages(item.pageLabel),
    pageRangeMode: item.pageRangeMode || "explicit",
    title: item.title,
    bookType: item.bookType || "",
    topicTitle: item.topicTitle || item.title || "",
    focus: item.focus || "",
    anchorImage: item.anchorImage || "",
    fibelPages: item.fibelPages || "",
    displayTitle: item.displayTitle || item.title || "",
    competence: item.competence,
    note: item.note,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }));
}

function createInitialState({ pinHash, recoveryKeyHash, className, description }) {
  const firstClass = createClassItem(className, description);
  return {
    version: APP_VERSION,
    dataVersion: DATA_VERSION,
    savedAt: null,
    setupComplete: true,
    pinHash,
    recoveryKeyHash,
    activeClassId: firstClass.id,
    classes: [firstClass],
    animals: createDefaultAnimals(firstClass.id),
    animalGroups: [],
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
    workbookCatalog: createDefaultWorkbookCatalog(firstClass.id),
    workbookAssignments: [],
    workbookAssignmentStatuses: [],
    childWorkbookReports: [],
    activeWorkbookMaterials: [],
    weeklyPlans: [],
    weeklyPlanStatuses: [],
    learningGameSessions: [],
    microsoftSync: { clientId: "", authority: "consumers", redirectUri: "", autoBackup: false, connectedAccount: "", connectedName: "", lastSyncAt: "", lastSyncStatus: "" },
    classSync: { enabled: false, endpoint: "", syncCode: "", lastPushAt: "", lastPullAt: "", lastError: "" },
    progressSettings: { ...DEFAULT_PROGRESS_SETTINGS },
    childViewSettings: { ...DEFAULT_CHILD_VIEW_SETTINGS },
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
    dataVersion: candidate.dataVersion || DATA_VERSION,
    savedAt: candidate.savedAt || candidate.lastSavedAt || null,
    lastSavedAt: candidate.lastSavedAt || candidate.savedAt || null,
    pinHash: candidate.pinHash || "",
    recoveryKeyHash: candidate.recoveryKeyHash || "",
    classes: Array.isArray(candidate.classes) ? candidate.classes : [],
    animals: Array.isArray(candidate.animals) ? candidate.animals : [],
    animalGroups: Array.isArray(candidate.animalGroups) ? candidate.animalGroups : [],
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
    workbookCatalog: Array.isArray(candidate.workbookCatalog) ? candidate.workbookCatalog : [],
    workbookAssignments: Array.isArray(candidate.workbookAssignments) ? candidate.workbookAssignments : [],
    workbookAssignmentStatuses: Array.isArray(candidate.workbookAssignmentStatuses) ? candidate.workbookAssignmentStatuses : [],
    childWorkbookReports: Array.isArray(candidate.childWorkbookReports) ? candidate.childWorkbookReports : [],
    activeWorkbookMaterials: Array.isArray(candidate.activeWorkbookMaterials) ? candidate.activeWorkbookMaterials : [],
    weeklyPlans: Array.isArray(candidate.weeklyPlans) ? candidate.weeklyPlans : [],
    weeklyPlanStatuses: Array.isArray(candidate.weeklyPlanStatuses) ? candidate.weeklyPlanStatuses : [],
    learningGameSessions: Array.isArray(candidate.learningGameSessions) ? candidate.learningGameSessions : [],
    microsoftSync: {
      clientId: candidate.microsoftSync?.clientId || "",
      authority: candidate.microsoftSync?.authority || "consumers",
      redirectUri: candidate.microsoftSync?.redirectUri || "",
      autoBackup: candidate.microsoftSync?.autoBackup === true,
      connectedAccount: candidate.microsoftSync?.connectedAccount || "",
      connectedName: candidate.microsoftSync?.connectedName || "",
      lastSyncAt: candidate.microsoftSync?.lastSyncAt || "",
      lastSyncStatus: candidate.microsoftSync?.lastSyncStatus || ""
    },
    classSync: {
      enabled: candidate.classSync?.enabled === true,
      endpoint: candidate.classSync?.endpoint || "",
      syncCode: candidate.classSync?.syncCode || "",
      lastPushAt: candidate.classSync?.lastPushAt || "",
      lastPullAt: candidate.classSync?.lastPullAt || "",
      lastError: candidate.classSync?.lastError || ""
    },
    progressSettings: {
      ...DEFAULT_PROGRESS_SETTINGS,
      ...(candidate.progressSettings && typeof candidate.progressSettings === "object" ? candidate.progressSettings : {})
    },
    childViewSettings: normalizeChildViewSettings(candidate.childViewSettings),
    teacherShowFirstNames: candidate.teacherShowFirstNames === true,
    qrScannerEnabled: candidate.qrScannerEnabled !== false,
    multiDeviceReminderEnabled: candidate.multiDeviceReminderEnabled !== false,
    multiDeviceReminderTime: candidate.multiDeviceReminderTime || "13:00",
    multiDeviceReminderLastDismissedDate: candidate.multiDeviceReminderLastDismissedDate || ""
  };

  state.classes = state.classes.map((item) => ({ ...item, id: item.id || makeId(), activeSchoolYear: normalizeSchoolYear(item.activeSchoolYear || item.schoolYear || item.schuljahr || inferSchoolYearFromClassName(item.name)) }));
  state.animals = state.animals.map((item) => ({ ...item, id: item.id || makeId(), classId: item.classId || state.activeClassId, firstName: item.firstName || item.vorname || "" }));
  state.animalGroups = state.animalGroups.map((item) => ({
    ...item,
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || state.activeClassId,
    name: item.name || item.titel || "Gruppe",
    animalIds: Array.isArray(item.animalIds) ? item.animalIds : [],
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || nowIso()
  }));
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
  state.workbookCatalog = completeWorkbookCatalogPageRanges(
    state.workbookCatalog
      .map((item) => normalizeWorkbookCatalogItem(item, state.activeClassId))
      .map(normalizeWorkbookMaterialName)
      .filter((item) => !isRetiredDefaultWorkbookCatalogItem(item))
  );
  state.classes.forEach((classItem) => {
    state.workbookCatalog = mergeDefaultWorkbookCatalogForClass(state.workbookCatalog, classItem.id);
  });
  state.workbookCatalog = completeWorkbookCatalogPageRanges(state.workbookCatalog);
  state.entries = state.entries.map((item) => normalizeProgressEntry(item, state.workbookCatalog));
  state.workbookAssignments = state.workbookAssignments.map((item) => normalizeWorkbookAssignment(item, state.activeClassId));
  state.workbookAssignmentStatuses = state.workbookAssignmentStatuses.map((item) => normalizeWorkbookAssignmentStatus(item, state.activeClassId));
  state.childWorkbookReports = state.childWorkbookReports.map((item) => normalizeChildWorkbookReport(item, state.activeClassId));
  state.activeWorkbookMaterials = state.activeWorkbookMaterials.map((item) => normalizeActiveWorkbookMaterial(item, state.activeClassId, state.workbookCatalog));
  state.weeklyPlans = state.weeklyPlans.map((item) => normalizeWeeklyPlan(item, state.activeClassId));
  state.weeklyPlanStatuses = state.weeklyPlanStatuses.map((item) => normalizeWeeklyPlanStatus(item, state.activeClassId));
  state.learningGameSessions = state.learningGameSessions.map((item) => ({
    ...item,
    id: item.id || makeId(),
    classId: item.classId || state.activeClassId,
    animalId: item.animalId || item.tierID || "",
    gameId: item.gameId || "",
    mode: item.mode === "test" ? "test" : "practice",
    items: Array.isArray(item.items) ? item.items : [],
    summary: item.summary && typeof item.summary === "object" ? item.summary : {},
    startedAt: item.startedAt || item.createdAt || nowIso(),
    finishedAt: item.finishedAt || item.updatedAt || ""
  }));

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

function normalizeWorkbookCatalogItem(item, fallbackClassId) {
  const timestamp = nowIso();
  const page = Number(item.startPage || item.page || item.seite || 0);
  const pageEnd = Number(item.endPage || item.pageEnd || item.seiteBis || 0);
  const pageLabel = normalizeCatalogPageLabel(item.pageLabel || item.displayPages || item.seitenLabel || "");
  const derivedAbc1 = deriveAbc1CatalogDetails(item);
  const normalizedItem = {
    subject: item.subject || item.fach || "Deutsch",
    schoolYear: normalizeSchoolYear(item.schoolYear || item.schuljahr || item.gradeLevel || inferSchoolYearFromWorkbook(item.workbook || item.lehrwerk || item.material || "")),
    workbook: item.workbook || item.lehrwerk || item.material || "",
    part: item.part || item.teil || "",
    area: item.area || item.bereich || "",
    category: item.category || item.kategorie || item.typ || derivedAbc1.bookType || "",
    title: item.title || item.thema || item.inhalt || derivedAbc1.topicTitle || "",
    startPage: page
  };
  return {
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    catalogKey: item.catalogKey || makeWorkbookCatalogKey(normalizedItem),
    subject: normalizedItem.subject,
    schoolYear: normalizedItem.schoolYear,
    workbook: normalizedItem.workbook,
    part: normalizedItem.part,
    area: normalizedItem.area,
    category: normalizedItem.category,
    page,
    startPage: page,
    pageEnd: pageEnd > page ? pageEnd : "",
    endPage: pageEnd >= page ? pageEnd : page,
    pageLabel: pageLabel || formatCatalogPageLabel(page, pageEnd || page),
    displayPages: item.displayPages || formatCatalogDisplayPages(pageLabel || formatCatalogPageLabel(page, pageEnd || page)),
    pageRangeMode: item.pageRangeMode || (hasExplicitPageRange(pageLabel, page, pageEnd) ? "explicit" : "auto"),
    title: normalizedItem.title,
    bookType: item.bookType || item.heftbereich || derivedAbc1.bookType || "",
    topicTitle: item.topicTitle || item.themaTitel || derivedAbc1.topicTitle || normalizedItem.title,
    focus: item.focus || item.einfuehrung || derivedAbc1.focus || "",
    anchorImage: item.anchorImage || item.ankerbild || derivedAbc1.anchorImage || "",
    fibelPages: item.fibelPages || item.fibelseiten || derivedAbc1.fibelPages || "",
    displayTitle: item.displayTitle || derivedAbc1.displayTitle || normalizedItem.title,
    competence: item.competence || item.kompetenz || "",
    note: item.note || item.bemerkung || "",
    active: item.active !== false && item.aktiv !== false,
    createdAt: item.createdAt || item.erstelltAm || timestamp,
    updatedAt: item.updatedAt || item.geaendertAm || timestamp
  };
}

function deriveAbc1CatalogDetails(item) {
  if ((item.workbook || item.lehrwerk || item.material) !== "ABC der Tiere 1") return {};
  const part = String(item.part || item.teil || "");
  const rawArea = String(item.area || item.bereich || "");
  const rawCategory = String(item.category || item.kategorie || item.typ || "");
  const title = String(item.title || item.thema || item.inhalt || "");
  const competence = String(item.competence || item.kompetenz || "");
  const bookType = item.bookType
    || item.heftbereich
    || (part.includes("Schreiblehrgang") || rawArea.includes("Schreiblehrgang") || rawCategory.includes("Schreiblehrgang") ? "Schreiblehrgang" : "")
    || (part.includes("Arbeitsheft") || rawArea.includes("Arbeitsheft") || rawCategory.includes("Arbeitsheft") ? "Arbeitsheft" : "");
  const anchorImage = item.anchorImage || item.ankerbild || extractLabeledValue(competence, "Ankerbild");
  const fibelPages = item.fibelPages || item.fibelseiten || extractLabeledValue(competence, "zu Fibelseite");
  const topicTitle = item.topicTitle || item.themaTitel || title;
  const focus = item.focus || item.einfuehrung || (bookType === "Schreiblehrgang" ? title : "");
  const displayTitle = item.displayTitle
    || (bookType === "Schreiblehrgang"
      ? [focus || topicTitle, anchorImage].filter(Boolean).join(" – ")
      : focus && focus !== topicTitle ? `${topicTitle} – ${focus}` : topicTitle);
  return { bookType, topicTitle, focus, anchorImage, fibelPages, displayTitle };
}

function extractLabeledValue(text, label) {
  const source = String(text || "");
  if (!source || !label) return "";
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escaped}:\\s*([^·]+)`, "i"));
  return match ? match[1].trim() : "";
}

function normalizeWorkbookMaterialName(item) {
  if (item.workbook === "ABC der Tiere") {
    const normalized = { ...item, workbook: "ABC der Tiere 2" };
    return { ...normalized, schoolYear: normalized.schoolYear || "2", catalogKey: makeWorkbookCatalogKey(normalized) };
  }
  if (item.workbook === "ABC der Tiere 2" && item.category === "Lernstandsheft") {
    const normalized = { ...item, workbook: "ABC der Tiere 2 - Lernstandsheft", part: "Teil C", schoolYear: item.schoolYear || "2" };
    return { ...normalized, catalogKey: makeWorkbookCatalogKey(normalized) };
  }
  if (item.workbook === "MiniMax") {
    const normalized = { ...item, workbook: "MiniMax 2" };
    return { ...normalized, schoolYear: normalized.schoolYear || "2", catalogKey: makeWorkbookCatalogKey(normalized) };
  }
  return item;
}

function isRetiredDefaultWorkbookCatalogItem(item) {
  if (item.workbook === "MiniMax 2" && ["Basis", "Training", "Extra", "Test"].includes(item.category)) return true;
  if (item.workbook === "MiniMax 3" && isWrongMiniMax3CatalogItem(item)) return true;
  return false;
}

function isWrongMiniMax3CatalogItem(item) {
  if (!item || item.subject !== "Mathe" || item.workbook !== "MiniMax 3") return false;
  const pageLabel = normalizeCatalogPageLabel(item.pageLabel || item.displayPages || formatCatalogPageLabel(item.startPage || item.page, item.endPage || item.pageEnd || item.page));
  const signature = `${item.title || item.area || ""}|${pageLabel}`;
  return RETIRED_WRONG_MINIMAX3_SIGNATURES.has(signature);
}

function normalizeChildViewSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  const legacyWorkbookVisibility = "assigned";
  return {
    ...DEFAULT_CHILD_VIEW_SETTINGS,
    ...source,
    abcVisibility: ["always", "assigned", "hidden"].includes(source.abcVisibility)
      ? source.abcVisibility
      : legacyWorkbookVisibility,
    minimaxVisibility: ["always", "assigned", "hidden"].includes(source.minimaxVisibility)
      ? source.minimaxVisibility
      : legacyWorkbookVisibility,
    showSelfReports: source.showSelfReports === true || source.allowSelfReports === true,
    showTraining: source.showTraining !== false,
    allowedSelfReportMaterials: {
      ...DEFAULT_CHILD_VIEW_SETTINGS.allowedSelfReportMaterials,
      ...(source.allowedSelfReportMaterials && typeof source.allowedSelfReportMaterials === "object" ? source.allowedSelfReportMaterials : {})
    }
  };
}

function normalizeWorkbookAssignment(item, fallbackClassId) {
  const timestamp = nowIso();
  return {
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    subject: item.subject || item.fach || "Deutsch",
    workbookCatalogId: item.workbookCatalogId || item.catalogId || "",
    assignmentMode: item.assignmentMode || item.zuordnung || "all",
    animalIds: Array.isArray(item.animalIds) ? item.animalIds : [],
    title: item.title || item.titel || "",
    note: item.note || item.bemerkung || "",
    autoConfirm: item.autoConfirm === true,
    active: item.active !== false && item.aktiv !== false,
    createdAt: item.createdAt || item.erstelltAm || timestamp,
    updatedAt: item.updatedAt || item.geaendertAm || timestamp
  };
}

function normalizeWorkbookAssignmentStatus(item, fallbackClassId) {
  const timestamp = nowIso();
  return {
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    assignmentId: item.assignmentId || "",
    animalId: item.animalId || item.tierID || "",
    workbookCatalogId: item.workbookCatalogId || item.catalogId || "",
    status: item.status || "offen",
    markedByChild: item.markedByChild === true,
    reviewStatus: item.reviewStatus || (item.progressLinked === true ? "bestätigt" : item.markedByChild === true ? "wartet" : "offen"),
    progressLinked: item.progressLinked === true,
    progressEntryId: item.progressEntryId || "",
    createdAt: item.createdAt || timestamp,
    updatedAt: item.updatedAt || timestamp,
    confirmedAt: item.confirmedAt || ""
  };
}

function normalizeProgressEntry(item, catalog) {
  const timestamp = item.updatedAt || item.datumUhrzeit || item.createdAt || nowIso();
  const rawMaterialName = item.materialName || item.material || "";
  const classId = item.classId || item.klasseId;
  const subject = item.fach || item.subject;
  const normalizedMaterialName = rawMaterialName;
  const catalogItem = catalog.find((entry) => entry.id === item.workbookCatalogId)
    || catalog.find((entry) => (
      entry.classId === classId
      && entry.subject === subject
      && entry.workbook === normalizedMaterialName
      && Number(entry.pageEnd || entry.page || 0) === Number(item.seiteBis || item.seite || 0)
      && (!item.workbookPart || entry.part === item.workbookPart)
    ));
  const source = item.source || item.weeklyPlanSource || "Direkteingabe";
  const workStatus = ["offen", "teilweise", "fertig"].includes(item.workStatus)
    ? item.workStatus
    : item.status === "begonnen" ? "teilweise" : item.status === "fertig" ? "fertig" : "offen";
  const pageStart = Number(item.seiteVon || catalogItem?.page || item.seite || 0);
  const pageEnd = Number(item.seiteBis || catalogItem?.pageEnd || item.seite || pageStart || 0);
  const catalogPages = item.catalogPages
    || catalogItem?.pageLabel
    || (pageStart && pageEnd > pageStart ? `${pageStart}-${pageEnd}` : pageStart ? String(pageStart) : "");
  const completedPages = normalizeIdList(item.completedPages || item.bearbeiteteSeiten);
  return {
    ...item,
    id: item.id || item.entryId || makeId(),
    classId: item.classId || item.klasseId,
    tierID: item.tierID || item.animalId || item.tierId || "",
    fach: item.fach || item.subject || catalogItem?.subject || "",
    materialName: catalogItem?.workbook || normalizedMaterialName || "",
    workbookCatalogId: item.workbookCatalogId || catalogItem?.id || "",
    workbookPart: item.workbookPart || item.materialArea || catalogItem?.part || "",
    workbookArea: item.workbookArea || item.area || catalogItem?.area || "",
    workbookCategory: item.workbookCategory || item.category || catalogItem?.category || "",
    bookType: item.bookType || item.heftbereich || catalogItem?.bookType || "",
    topicTitle: item.topicTitle || item.themaTitel || catalogItem?.topicTitle || catalogItem?.title || "",
    focus: item.focus || item.einfuehrung || catalogItem?.focus || "",
    anchorImage: item.anchorImage || item.ankerbild || catalogItem?.anchorImage || "",
    fibelPages: item.fibelPages || item.fibelseiten || catalogItem?.fibelPages || "",
    displayTitle: item.displayTitle || catalogItem?.displayTitle || catalogItem?.title || "",
    seite: Number(item.seite || pageEnd || pageStart || 0),
    seiteVon: pageStart,
    seiteBis: pageEnd,
    catalogStartPage: Number(item.catalogStartPage || catalogItem?.startPage || catalogItem?.page || pageStart || 0),
    catalogEndPage: Number(item.catalogEndPage || catalogItem?.endPage || catalogItem?.pageEnd || pageEnd || pageStart || 0),
    catalogPages,
    pages: item.pages || item.pageText || catalogPages,
    completedPages,
    openPages: normalizeIdList(item.openPages || item.offeneSeiten),
    topic: item.topic || item.zusatzText || catalogItem?.title || catalogItem?.area || "",
    workStatus,
    source,
    confirmationStatus: item.confirmationStatus || (source.includes("Kind gemeldet") ? "von Lehrkraft bestätigt" : "von Lehrkraft erfasst"),
    datumUhrzeit: item.datumUhrzeit || timestamp,
    createdAt: item.createdAt || timestamp,
    updatedAt: timestamp
  };
}

function normalizeChildWorkbookReport(item, fallbackClassId) {
  const timestamp = nowIso();
  return {
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    animalId: item.animalId || item.tierID || "",
    tierNameSnapshot: item.tierNameSnapshot || "",
    tierEmojiSnapshot: item.tierEmojiSnapshot || "",
    subject: item.subject || item.fach || "Deutsch",
    materialFamily: item.materialFamily || item.material || "",
    pageText: item.pageText || item.pages || item.seiten || "",
    status: item.status || "fertig",
    note: item.note || item.notiz || "",
    suggestedWorkbookCatalogId: item.suggestedWorkbookCatalogId || "",
    selectedWorkbookCatalogId: item.selectedWorkbookCatalogId || "",
    reviewStatus: item.reviewStatus || "wartet",
    source: item.source || "Kind gemeldet",
    createdAt: item.createdAt || item.datumUhrzeit || timestamp,
    updatedAt: item.updatedAt || timestamp,
    reviewedAt: item.reviewedAt || "",
    progressEntryId: item.progressEntryId || ""
  };
}

function normalizeActiveWorkbookMaterial(item, fallbackClassId, catalog = []) {
  const timestamp = nowIso();
  const scope = ["class", "group", "animal"].includes(item.scope) ? item.scope : item.animalId ? "animal" : item.groupId ? "group" : "class";
  const workbook = item.workbook || item.lehrwerk || item.material || "";
  const classId = item.classId || item.klasseId || fallbackClassId;
  const normalizedWorkbook = workbook;
  return {
    id: item.id || makeId(),
    classId,
    subject: item.subject || item.fach || "Deutsch",
    schoolYear: normalizedWorkbook === "MiniMax 3" ? "3" : normalizedWorkbook === "MiniMax 4" ? "4" : normalizeSchoolYear(item.schoolYear || item.schuljahr || item.gradeLevel || ""),
    scope,
    animalId: scope === "animal" ? item.animalId || item.tierID || "" : "",
    groupId: scope === "group" ? item.groupId || item.gruppeId || "" : "",
    workbook: normalizedWorkbook,
    section: item.section || item.bereichTeil || item.part || "",
    validFrom: item.validFrom || item.gueltigVon || "",
    validTo: item.validTo || item.gueltigBis || "",
    note: item.note || item.bemerkung || "",
    active: item.active !== false && item.aktiv !== false,
    createdAt: item.createdAt || item.erstelltAm || timestamp,
    updatedAt: item.updatedAt || item.geaendertAm || timestamp
  };
}

function normalizeSchoolYear(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (["1", "2", "3", "4"].includes(text)) return text;
  if (text.includes("1")) return "1";
  if (text.includes("2")) return "2";
  if (text.includes("3")) return "3";
  if (text.includes("4")) return "4";
  if (text.includes("übergreifend") || text.includes("uebergreifend") || text === "cross" || text === "all") return "cross";
  if (text.includes("ohne") || text === "none") return "none";
  return text;
}

function inferSchoolYearFromWorkbook(workbook) {
  const text = String(workbook || "");
  if (/ABC der Tiere\s*1\b/i.test(text)) return "1";
  if (/ABC der Tiere\s*2\b/i.test(text)) return "2";
  if (/MiniMax\s*1\b/i.test(text)) return "1";
  if (/MiniMax\s*2\b/i.test(text)) return "2";
  if (/MiniMax\s*3\b/i.test(text)) return "3";
  if (/MiniMax\s*4\b/i.test(text)) return "4";
  return "";
}

function inferSchoolYearFromClassName(name) {
  const text = String(name || "");
  const match = text.match(/\b([1-4])\s*[a-d]?\b/i) || text.match(/klasse\s*([1-4])/i);
  return match ? match[1] : "";
}

function workbookCatalogMergeKey(item) {
  return `${item.classId || ""}|${item.catalogKey || makeWorkbookCatalogKey(item)}`.toLowerCase();
}

function mergeDefaultWorkbookCatalogForClass(catalog, classId) {
  const existingKeys = new Set(catalog.filter((item) => item.classId === classId).map(workbookCatalogMergeKey));
  const additions = createDefaultWorkbookCatalog(classId).filter((item) => !existingKeys.has(workbookCatalogMergeKey(item)));
  return additions.length ? [...catalog, ...additions] : catalog;
}

function normalizeWeeklyPlan(item, fallbackClassId) {
  const timestamp = nowIso();
  const days = {};
  WEEK_DAYS.forEach((day) => {
    const source = item.days?.[day] || item.tage?.[day] || {};
    const deutschIds = normalizeIdList(source.deutschIds || source.deutschId || source.deutsch);
    const matheIds = normalizeIdList(source.matheIds || source.matheId || source.mathe);
    days[day] = {
      deutschId: deutschIds[0] || "",
      deutschIds,
      deutschTaskNumber: normalizeTaskNumberText(source.deutschTaskNumber || source.deutschNumbers || source.deutschNr || ""),
      matheId: matheIds[0] || "",
      matheIds,
      matheTaskNumber: normalizeTaskNumberText(source.matheTaskNumber || source.matheNumbers || source.matheNr || ""),
      freeText: source.freeText || source.frei || source.extra || ""
    };
  });
  return {
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    title: item.title || item.titel || "Wochenplan",
    weekLabel: item.weekLabel || item.kalenderwoche || "",
    validFrom: item.validFrom || item.gueltigVon || "",
    validTo: item.validTo || item.gueltigBis || "",
    note: item.note || item.bemerkung || "",
    assignmentMode: item.assignmentMode || item.zuordnung || "all",
    animalIds: Array.isArray(item.animalIds) ? item.animalIds : [],
    overrides: item.overrides && typeof item.overrides === "object" ? item.overrides : {},
    progressMode: item.progressMode || (item.autoCreateEntries === true ? "auto" : "confirm"),
    autoCreateEntries: item.autoCreateEntries === true || item.progressMode === "auto",
    days,
    active: item.active !== false && item.aktiv !== false,
    createdAt: item.createdAt || item.erstelltAm || timestamp,
    updatedAt: item.updatedAt || item.geaendertAm || timestamp
  };
}

function normalizeIdList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return value ? [String(value)] : [];
}

function normalizeTaskNumberText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*([+,;])\s*/g, " $1 ")
    .trim();
}

function normalizeWeeklyPlanStatus(item, fallbackClassId) {
  const timestamp = nowIso();
  const legacyStatus = item.status === "bearbeitet" || item.status === "von Lehrkraft bestätigt" ? "fertig" : item.status;
  const statusValue = legacyStatus === "begonnen" ? "teilweise" : legacyStatus;
  const status = WEEKLY_PLAN_STATUSES.includes(statusValue) ? statusValue : "offen";
  return {
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    planId: item.planId || item.wochenplanId || "",
    animalId: item.animalId || item.tierID || item.tierId || "",
    day: item.day || item.tag || "Montag",
    field: item.field || item.bereich || "Deutsch",
    workbookCatalogId: item.workbookCatalogId || item.catalogId || "",
    freeText: item.freeText || "",
    completedPages: normalizeIdList(item.completedPages || item.bearbeiteteSeiten),
    openPages: normalizeIdList(item.openPages || item.offeneSeiten),
    progressLinked: item.progressLinked === true,
    progressEntryId: item.progressEntryId || "",
    markedByChild: item.markedByChild === true,
    reviewStatus: item.reviewStatus || (item.progressLinked === true ? "bestätigt" : item.markedByChild === true ? "wartet" : "offen"),
    completedAt: item.completedAt || "",
    confirmedAt: item.confirmedAt || "",
    status,
    createdAt: item.createdAt || item.erstelltAm || timestamp,
    updatedAt: item.updatedAt || item.geaendertAm || timestamp
  };
}

function mergeDefaultTrainingTasks(tasks) {
  const defaultKeys = new Set(DEFAULT_TRAINING_TASKS.map((task) => task.code || task.id));
  const byCode = new Map(tasks.map((task) => [task.code || task.taskCode || task.id, task]));
  const merged = DEFAULT_TRAINING_TASKS.map((task) => {
    const key = task.code || task.id;
    const existing = byCode.get(key);
    if (!existing) return task;
    const isDefaultEntdecker = /^E-\d+$/i.test(String(key));
    const isDefaultSchoolTraining = /^TS-0[1-6]$/i.test(String(key));
    return {
      ...existing,
      ...task,
      active: isDefaultEntdecker || isDefaultSchoolTraining ? true : existing.active !== false,
      id: existing.id || task.id
    };
  });
  tasks.forEach((task) => {
    const key = task.code || task.taskCode || task.id;
    if (!defaultKeys.has(key) && !isRetiredEntdeckerTask(task)) {
      merged.push({ ...task, active: false, deprecated: true });
    }
  });
  return merged;
}

function isRetiredEntdeckerTask(task) {
  const key = String(task?.code || task?.taskCode || task?.id || "");
  const subcategory = String(task?.subcategory || task?.unterbereich || "");
  return /^(D|M|F)-\d+$/i.test(key) || ["Deutsch-Entdecker", "Mathe-Entdecker", "Forscher"].includes(subcategory);
}

function normalizeTrainingTask(item) {
  const code = item.code || item.taskCode || item.id || makeId();
  const isDefaultEntdecker = /^E-\d+$/i.test(String(code));
  const isDefaultSchoolTraining = /^TS-0[1-6]$/i.test(String(code));
  const title = item.title || item.titel || code || "Trainingsaufgabe";
  const text = item.text || item.shortText || item.taskText || item.auftrag || "";
  const subject = item.subject || item.fach || defaultTrainingSubject(code);
  const subcategory = normalizeTrainingSubcategory(item.subcategory || item.unterbereich, code);
  const tips = normalizeStringList(item.tips || item.tip, defaultTrainingTip(code));
  const material = normalizeStringList(item.material || item.materialNeeded, defaultTrainingMaterial(code));
  return {
    ...item,
    id: item.id || `training-${code}`,
    area: isDefaultSchoolTraining ? "Schule" : isDefaultEntdecker ? "OGS/Zuhause" : item.area || item.trainingArea || "OGS/Zuhause",
    trainingArea: isDefaultSchoolTraining ? "Schule" : isDefaultEntdecker ? "OGS/Zuhause" : item.trainingArea || item.area || "OGS/Zuhause",
    subcategory: isDefaultSchoolTraining ? "Schule" : subcategory,
    subject: isDefaultEntdecker ? "Entdecker" : isDefaultSchoolTraining ? "Schule" : subject,
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
    active: isDefaultEntdecker || isDefaultSchoolTraining ? true : item.active !== false
  };
}

function normalizeTrainingCompletion(item, fallbackClassId) {
  const taskCode = item.taskCode || item.code || "";
  return {
    ...item,
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    animalId: item.animalId || item.tierID || "",
    tierNameSnapshot: item.tierNameSnapshot || "",
    tierEmojiSnapshot: item.tierEmojiSnapshot || "",
    taskCode,
    trainingArea: item.trainingArea || item.area || "OGS/Zuhause",
    subcategory: normalizeTrainingSubcategory(item.subcategory || item.unterbereich, taskCode),
    subject: item.subject || item.fach || "",
    taskTitle: item.taskTitle || item.title || "",
    taskText: item.taskText || item.text || "",
    completedAt: item.completedAt || item.datumUhrzeit || nowIso(),
    updatedAt: item.updatedAt || item.completedAt || item.datumUhrzeit || nowIso(),
    status: item.status || "bearbeitet"
  };
}

function normalizeTrainingHistory(item, fallbackClassId) {
  const taskCode = item.taskCode || item.code || "";
  return {
    ...item,
    id: item.id || makeId(),
    classId: item.classId || item.klasseId || fallbackClassId,
    animalId: item.animalId || item.tierID || "",
    taskCode,
    subcategory: normalizeTrainingSubcategory(item.subcategory || item.unterbereich, taskCode),
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
  if (String(code).startsWith("E-")) return "Entdecker";
  if (String(code).startsWith("M-")) return "Mathe";
  if (String(code).startsWith("F-")) return "Forscher";
  if (String(code).startsWith("S-")) return "Schule";
  return "Deutsch";
}

function defaultTrainingSubcategory(code) {
  if (String(code).startsWith("S-")) return "Schule";
  return ENTDECKER_SUBCATEGORY;
}

function normalizeTrainingSubcategory(value, code = "") {
  if (String(code).startsWith("S-") || value === "Schule") return "Schule";
  if (String(code).startsWith("E-")) return ENTDECKER_SUBCATEGORY;
  if (["Deutsch-Entdecker", "Mathe-Entdecker", "Forscher", ENTDECKER_SUBCATEGORY].includes(value)) return ENTDECKER_SUBCATEGORY;
  return value || defaultTrainingSubcategory(code);
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
