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

const DEFAULT_DEUTSCH_ENTDECKER_TASKS = [
  trainingTask("D-01", "Deutsch", "Deutsch-Entdecker", "Wörter im Raum finden", "Suche 12 Wörter im Raum und schreibe sie auf.", ["Schau dich langsam im Raum um.", "Suche Dinge, die du benennen kannst.", "Schreibe 12 Wörter sauber in dein Lerntagebuch.", "Kontrolliere, ob du wirklich 12 Wörter gefunden hast."], ["Achte auf Gegenstände, Möbel, Materialien und Dinge an der Wand."]),
  trainingTask("D-02", "Deutsch", "Deutsch-Entdecker", "Silbenbögen zeichnen", "Wähle 8 Wörter und zeichne Silbenbögen dazu.", ["Wähle 8 Wörter aus deinem Raum.", "Sprich jedes Wort langsam in Silben.", "Schreibe die Wörter in dein Lerntagebuch.", "Zeichne unter jedes Wort passende Silbenbögen."], ["Klatsche leise mit, wenn dir das Zerlegen schwerfällt."]),
  trainingTask("D-03", "Deutsch", "Deutsch-Entdecker", "Nomen und Artikel", "Suche 10 Nomen im Raum und schreibe den Artikel dazu.", ["Suche Dinge, die du anfassen oder sehen kannst.", "Schreibe jedes Nomen groß in dein Lerntagebuch.", "Setze der, die oder das davor.", "Kontrolliere, ob alle Nomen großgeschrieben sind."], ["Probiere den Artikel laut aus: der Tisch, die Tür, das Buch."]),
  trainingTask("D-04", "Deutsch", "Deutsch-Entdecker", "Sätze zum Raum", "Schreibe 5 Sätze über Dinge, die du gerade siehst.", ["Wähle 5 Dinge im Raum aus.", "Schreibe zu jedem Ding einen ganzen Satz.", "Achte auf den großen Satzanfang.", "Setze am Ende jedes Satzes einen Punkt."], ["Ein Satz sagt immer etwas vollständig aus."]),
  trainingTask("D-05", "Deutsch", "Deutsch-Entdecker", "Verben sammeln", "Sammle 10 Verben: Was kann man im Raum tun?", ["Überlege, was man im Raum tun kann.", "Schreibe 10 Verben in dein Lerntagebuch.", "Wähle 3 Verben aus und schreibe damit Sätze.", "Kontrolliere, ob die Verben zu Tätigkeiten passen."], ["Verben sagen, was jemand tut: lesen, laufen, rechnen."]),
  trainingTask("D-06", "Deutsch", "Deutsch-Entdecker", "Wiewörter finden", "Beschreibe 5 Dinge mit passenden Wiewörtern.", ["Suche 5 Dinge im Raum.", "Überlege: Wie ist das Ding?", "Schreibe zu jedem Ding mindestens ein Wiewort.", "Lies deine Beschreibungen noch einmal."], ["Wiewörter beschreiben genauer: rund, weich, bunt, schwer."]),
  trainingTask("D-07", "Deutsch", "Deutsch-Entdecker", "Wortfamilie", "Wähle ein Wort und finde Wörter aus der Wortfamilie.", ["Wähle ein Wort, das du gut kennst.", "Schreibe das Wort in die Mitte deiner Seite.", "Finde passende Wörter aus derselben Wortfamilie.", "Markiere, was in den Wörtern gleich oder ähnlich ist."], ["Beispiel: fahren, Fahrrad, Fahrt, Fahrer."]),
  trainingTask("D-08", "Deutsch", "Deutsch-Entdecker", "Reimpaare", "Suche 6 Wörter, die sich reimen, und schreibe Paare.", ["Suche Wörter, die am Ende ähnlich klingen.", "Schreibe 6 Reimpaare in dein Lerntagebuch.", "Sprich die Paare leise vor.", "Unterstreiche die Reimstellen."], ["Reime müssen nicht gleich geschrieben werden, sie klingen ähnlich."]),
  trainingTask("D-09", "Deutsch", "Deutsch-Entdecker", "Fragen stellen", "Schreibe 5 Fragen zu einem Gegenstand im Raum.", ["Wähle einen Gegenstand im Raum.", "Überlege, was du über ihn wissen möchtest.", "Schreibe 5 Fragen in dein Lerntagebuch.", "Setze hinter jede Frage ein Fragezeichen."], ["Fragewörter helfen: Wer, Was, Wo, Warum, Wie."]),
  trainingTask("D-10", "Deutsch", "Deutsch-Entdecker", "Schöne Wörter", "Wähle ein Buch und schreibe 5 schöne Wörter heraus.", ["Wähle ein Buch oder eine Buchseite.", "Lies einen kurzen Abschnitt.", "Suche 5 Wörter, die dir gefallen.", "Schreibe sie sauber in dein Lerntagebuch."], ["Du darfst Wörter wählen, die spannend, lustig oder besonders klingen."]),
  trainingTask("D-11", "Deutsch", "Deutsch-Entdecker", "Genau beschreiben", "Beschreibe ein Bild, ein Buchcover oder eine Seite genau.", ["Wähle ein Bild, ein Buchcover oder eine Seite.", "Schau dir alles genau an.", "Schreibe in dein Lerntagebuch, was du siehst.", "Nutze passende Nomen, Verben und Wiewörter."], ["Beschreibe Farben, Formen, Personen, Dinge und Stimmung."]),
  trainingTask("D-12", "Deutsch", "Deutsch-Entdecker", "Sätze kontrollieren", "Schreibe 5 Sätze und kontrolliere Satzanfang und Punkt.", ["Schreibe 5 eigene Sätze in dein Lerntagebuch.", "Prüfe jeden Satzanfang.", "Prüfe das Satzende.", "Verbessere, was noch nicht stimmt."], ["Nutze eine kleine Kontrollliste: groß anfangen, Punkt setzen, Satz lesen."]),
  trainingTask("D-13", "Deutsch", "Deutsch-Entdecker", "Laute sortieren", "Suche Wörter mit ie, ei, au oder eu und sortiere sie.", ["Suche Wörter mit ie, ei, au oder eu.", "Lege in deinem Lerntagebuch vier Spalten an.", "Schreibe jedes Wort in die passende Spalte.", "Lies die Wörter am Ende noch einmal."], ["Höre genau hin und achte auf die Buchstaben im Wort."]),
  trainingTask("D-14", "Deutsch", "Deutsch-Entdecker", "Gegensatzpaare", "Finde 8 Gegensatzpaare aus dem Alltag.", ["Denke an Wörter aus dem Alltag.", "Finde jeweils das Gegenteil.", "Schreibe 8 Paare in dein Lerntagebuch.", "Male zu einem Paar ein kleines Beispiel."], ["Beispiele: groß - klein, hell - dunkel, warm - kalt."]),
  trainingTask("D-15", "Deutsch", "Deutsch-Entdecker", "Kleine Geschichte", "Schreibe eine kleine Geschichte mit einem Ding aus dem Raum.", ["Wähle ein Ding im Raum als Hauptfigur oder wichtigen Gegenstand.", "Überlege, was damit passieren könnte.", "Schreibe eine kleine Geschichte in dein Lerntagebuch.", "Lies die Geschichte und kontrolliere Satzanfänge und Punkte."], ["Eine Geschichte hat Anfang, Mitte und Ende."])
];

const DEFAULT_MATHE_ENTDECKER_TASKS = [
  trainingTask("M-01", "Mathe", "Mathe-Entdecker", "Zahlen ordnen", "Suche Zahlen im Raum und ordne sie von klein nach groß.", ["Suche Zahlen auf Büchern, Plänen, Uhren oder Dingen im Raum.", "Schreibe die Zahlen in dein Lerntagebuch.", "Ordne sie von klein nach groß.", "Kontrolliere die Reihenfolge."], ["Wenn zwei Zahlen ähnlich sind, vergleiche zuerst die Zehner."]),
  trainingTask("M-02", "Mathe", "Mathe-Entdecker", "Plusaufgaben erfinden", "Erfinde 6 Plusaufgaben mit Dingen, die du siehst.", ["Suche Dinge, die du zählen kannst.", "Erfinde daraus 6 Plusaufgaben.", "Schreibe Aufgabe und Ergebnis in dein Lerntagebuch.", "Kontrolliere mit einer Zeichnung oder durch Nachzählen."], ["Zum Beispiel: 4 Stifte + 3 Stifte = 7 Stifte."]),
  trainingTask("M-03", "Mathe", "Mathe-Entdecker", "Minusaufgaben erfinden", "Erfinde 6 Minusaufgaben mit Dingen, die du siehst.", ["Wähle Dinge, die du gut zählen kannst.", "Erfinde 6 Minusaufgaben.", "Schreibe Aufgabe und Ergebnis in dein Lerntagebuch.", "Prüfe, ob das Ergebnis kleiner ist als die Startzahl."], ["Streiche in deiner Zeichnung weg, was abgezogen wird."]),
  trainingTask("M-04", "Mathe", "Mathe-Entdecker", "Zahlenrätsel", "Denke dir eine Zahl aus und beschreibe sie mit 4 Hinweisen.", ["Denke dir eine Zahl aus.", "Schreibe 4 Hinweise zu deiner Zahl.", "Notiere die Lösung verdeckt oder darunter.", "Prüfe, ob man die Zahl mit deinen Hinweisen finden kann."], ["Hinweise können sein: gerade, ungerade, größer als, kleiner als, Zehner, Einer."]),
  trainingTask("M-05", "Mathe", "Mathe-Entdecker", "Formen finden", "Suche Formen im Raum und zeichne 6 Beispiele.", ["Suche Kreise, Dreiecke, Vierecke oder andere Formen.", "Zeichne 6 Beispiele in dein Lerntagebuch.", "Schreibe den Formnamen dazu.", "Markiere eine Form, die du besonders oft findest."], ["Fenster, Bücher, Uhren und Schilder können Formen zeigen."]),
  trainingTask("M-06", "Mathe", "Mathe-Entdecker", "Muster fortsetzen", "Zeichne ein Muster und setze es mindestens 10 Schritte fort.", ["Beginne mit einem einfachen Muster.", "Zeichne es in dein Lerntagebuch.", "Setze es mindestens 10 Schritte fort.", "Kontrolliere, ob sich die Regel immer wiederholt."], ["Nutze Farben, Formen oder Zahlen für dein Muster."]),
  trainingTask("M-07", "Mathe", "Mathe-Entdecker", "Zahlenmuster", "Erfinde ein eigenes Zahlenmuster.", ["Wähle eine Startzahl.", "Entscheide, wie dein Muster weitergeht.", "Schreibe mindestens 10 Zahlen in dein Lerntagebuch.", "Erkläre die Regel mit einem Satz."], ["Beispiel: Immer plus 2 oder immer minus 5."]),
  trainingTask("M-08", "Mathe", "Mathe-Entdecker", "Zählen und Aufgaben", "Zähle Dinge im Raum und schreibe passende Aufgaben dazu.", ["Suche Dinge, die mehrfach vorkommen.", "Zähle sie genau.", "Schreibe passende Plus- oder Minusaufgaben in dein Lerntagebuch.", "Kontrolliere durch Nachzählen."], ["Ordne die Dinge beim Zählen, damit du nichts doppelt zählst."]),
  trainingTask("M-09", "Mathe", "Mathe-Entdecker", "Schätzen und prüfen", "Schätze eine Anzahl und zähle danach genau nach.", ["Wähle eine Menge von Dingen im Raum.", "Schätze zuerst die Anzahl.", "Schreibe deine Schätzung in dein Lerntagebuch.", "Zähle genau nach und vergleiche."], ["Schätzen bedeutet: Du vermutest klug, ohne sofort zu zählen."])
];

const DEFAULT_FORSCHER_TASKS = [
  researcherTask("F-01", "Dinge genau betrachten", "Was kann ich entdecken, wenn ich ganz genau hinschaue?", "Wähle einen Gegenstand im Raum. Zeichne ihn genau. Schreibe 5 Dinge auf, die du bemerkst.", ["Suche dir einen Gegenstand im Raum aus.", "Betrachte ihn ganz genau.", "Zeichne ihn in dein Lerntagebuch.", "Schreibe 5 Dinge auf, die dir auffallen.", "Kontrolliere, ob du alles gut erkennen kannst."], ["Achte auf Form, Farbe, Größe und besondere Merkmale."]),
  researcherTask("F-02", "Materialforscher", "Woraus bestehen Dinge?", "Suche 8 Gegenstände. Ordne sie nach Material: Holz, Plastik, Metall, Papier, Stoff, Glas.", ["Suche 8 Gegenstände im Raum.", "Schreibe die Materialien als Überschriften in dein Lerntagebuch.", "Ordne jeden Gegenstand einem Material zu.", "Ergänze, wenn ein Gegenstand aus mehreren Materialien besteht."], ["Fühle vorsichtig und schau genau hin."]),
  researcherTask("F-03", "Schwimmt oder sinkt?", "Welche Dinge schwimmen?", "Vermute zuerst. Teste dann mit kleinen Gegenständen. Schreibe auf: schwimmt / sinkt.", ["Wähle kleine Gegenstände aus.", "Schreibe zuerst deine Vermutung in dein Lerntagebuch.", "Teste die Gegenstände vorsichtig im Wasser.", "Notiere dein Ergebnis: schwimmt oder sinkt."], ["Lege nasse Dinge danach wieder ordentlich ab."], ["Lerntagebuch", "Stift", "Schüssel mit Wasser", "kleine Gegenstände"]),
  researcherTask("F-04", "Magnetforscher", "Was ist magnetisch?", "Teste verschiedene Gegenstände mit einem Magneten. Erstelle eine Tabelle: magnetisch / nicht magnetisch.", ["Sammle verschiedene Gegenstände.", "Zeichne eine Tabelle in dein Lerntagebuch.", "Teste jeden Gegenstand mit einem Magneten.", "Trage ein, ob er magnetisch ist oder nicht."], ["Metall ist nicht immer magnetisch. Teste genau."], ["Lerntagebuch", "Stift", "Magnet", "verschiedene Gegenstände"]),
  researcherTask("F-05", "Geräusche entdecken", "Welche Geräusche gibt es um uns herum?", "Lausche 3 Minuten. Schreibe oder male alle Geräusche auf. Ordne sie: laut, leise, angenehm, störend.", ["Setze dich ruhig hin.", "Lausche 3 Minuten.", "Schreibe oder male Geräusche in dein Lerntagebuch.", "Ordne sie nach laut, leise, angenehm oder störend."], ["Schließe kurz die Augen, wenn dir das Lauschen hilft."]),
  researcherTask("F-06", "Pflanzenforscher", "Was braucht eine Pflanze zum Leben?", "Zeichne eine Pflanze. Beschrifte Wurzel, Stängel, Blatt und Blüte. Schreibe auf, was sie braucht.", ["Zeichne eine Pflanze in dein Lerntagebuch.", "Beschrifte wichtige Pflanzenteile.", "Schreibe auf, was eine Pflanze zum Leben braucht.", "Kontrolliere deine Beschriftung."], ["Denke an Wasser, Licht, Luft und Erde."]),
  researcherTask("F-07", "Blätter vergleichen", "Sind alle Blätter gleich?", "Vergleiche 3 Blätter oder Blattbilder. Zeichne sie und beschreibe Form, Rand und Farbe.", ["Wähle 3 Blätter oder Blattbilder.", "Zeichne sie in dein Lerntagebuch.", "Beschreibe Form, Rand und Farbe.", "Schreibe eine Gemeinsamkeit und einen Unterschied auf."], ["Schau besonders auf den Blattrand."], ["Lerntagebuch", "Stift", "Blätter oder Blattbilder"]),
  researcherTask("F-08", "Tier-Spuren", "Woran erkennt man Tiere?", "Wähle ein Tier. Sammle Informationen: Lebensraum, Nahrung, Aussehen, Besonderheit.", ["Wähle ein Tier.", "Lege in deinem Lerntagebuch vier Überschriften an.", "Sammle Informationen zu Lebensraum, Nahrung, Aussehen und Besonderheit.", "Zeichne das Tier oder eine Spur dazu."], ["Auch Fell, Federn, Fußspuren oder Geräusche können Hinweise sein."]),
  researcherTask("F-09", "Lebensräume", "Wo leben Tiere und Pflanzen?", "Ordne Tiere oder Pflanzen einem Lebensraum zu: Wald, Wiese, Wasser, Garten, Stadt.", ["Schreibe die Lebensräume in dein Lerntagebuch.", "Wähle Tiere oder Pflanzen aus.", "Ordne sie passenden Lebensräumen zu.", "Begründe bei 3 Beispielen deine Entscheidung."], ["Ein Tier kann manchmal in mehr als einem Lebensraum vorkommen."]),
  researcherTask("F-10", "Jahreszeitenforscher", "Was verändert sich im Jahr?", "Wähle eine Jahreszeit. Schreibe und male: Wetter, Kleidung, Pflanzen, Tiere, Feste.", ["Wähle eine Jahreszeit.", "Schreibe die Überschriften Wetter, Kleidung, Pflanzen, Tiere und Feste.", "Sammle passende Beispiele in deinem Lerntagebuch.", "Male ein kleines Bild zur Jahreszeit."], ["Denke an Dinge, die du selbst beobachtet hast."]),
  researcherTask("F-11", "Wetterbeobachter", "Wie ist das Wetter heute?", "Beobachte das Wetter. Notiere: Temperaturgefühl, Wolken, Wind, Niederschlag. Male ein Wettersymbol.", ["Schau nach draußen.", "Notiere das Temperaturgefühl.", "Beobachte Wolken, Wind und Niederschlag.", "Male ein Wettersymbol in dein Lerntagebuch."], ["Beschreibe, was du wirklich siehst oder fühlst."], ["Lerntagebuch", "Stift", "Blick nach draußen"]),
  researcherTask("F-12", "Schattenforscher", "Wann entsteht ein Schatten?", "Stelle einen Gegenstand ins Licht. Beobachte den Schatten. Zeichne, wo Lichtquelle, Gegenstand und Schatten sind.", ["Stelle einen Gegenstand ins Licht.", "Beobachte den Schatten.", "Zeichne Lichtquelle, Gegenstand und Schatten in dein Lerntagebuch.", "Schreibe einen Satz: Ein Schatten entsteht, wenn ..."], ["Bewege den Gegenstand vorsichtig und beobachte, was passiert."], ["Lerntagebuch", "Stift", "Lichtquelle oder Sonnenlicht"]),
  researcherTask("F-13", "Zeitforscher", "Woran merke ich, dass Zeit vergeht?", "Sammle Beispiele: Uhr, Kalender, Tagesablauf, Jahreszeiten, Wachstum. Gestalte eine kleine Zeit-Leiste.", ["Sammle Beispiele, woran du Zeit erkennst.", "Schreibe sie in dein Lerntagebuch.", "Gestalte eine kleine Zeit-Leiste.", "Ordne mindestens 5 Ereignisse passend ein."], ["Denke an deinen Tag, die Woche und das Jahr."]),
  researcherTask("F-14", "Körperforscher", "Was kann mein Körper alles?", "Zeichne einen Körperumriss. Beschrifte wichtige Körperteile und schreibe auf, wofür du sie brauchst.", ["Zeichne einen einfachen Körperumriss.", "Beschrifte wichtige Körperteile.", "Schreibe zu 5 Körperteilen, wofür du sie brauchst.", "Kontrolliere, ob die Beschriftung gut lesbar ist."], ["Denke an sehen, laufen, greifen, hören und sprechen."]),
  researcherTask("F-15", "Sinne entdecken", "Wie erforsche ich die Welt?", "Schreibe zu jedem Sinn ein Beispiel: sehen, hören, riechen, schmecken, fühlen.", ["Schreibe die fünf Sinne in dein Lerntagebuch.", "Finde zu jedem Sinn ein Beispiel.", "Male oder schreibe passend dazu.", "Überlege, welcher Sinn dir heute besonders hilft."], ["Forschen beginnt oft mit genauem Wahrnehmen."]),
  researcherTask("F-16", "Gesund bleiben", "Was tut meinem Körper gut?", "Sortiere Beispiele: gesund für mich / nicht so gut für mich. Begründe 3 Entscheidungen.", ["Zeichne zwei Spalten in dein Lerntagebuch.", "Sammle Beispiele für gesund und nicht so gut.", "Begründe 3 Entscheidungen mit einem Satz.", "Kontrolliere, ob deine Beispiele verständlich sind."], ["Denke an Bewegung, Schlaf, Essen, Trinken und Pausen."]),
  researcherTask("F-17", "Verkehrsdetektiv", "Welche Verkehrszeichen helfen uns?", "Zeichne 3 Verkehrszeichen. Schreibe dazu, was sie bedeuten und warum sie wichtig sind.", ["Wähle 3 Verkehrszeichen.", "Zeichne sie in dein Lerntagebuch.", "Schreibe die Bedeutung dazu.", "Erkläre, warum sie wichtig sind."], ["Nutze Zeichen, die du kennst oder auf Bildern sehen kannst."], ["Lerntagebuch", "Stift", "Bilder oder bekannte Verkehrszeichen"]),
  researcherTask("F-18", "Müllforscher", "Was passiert mit Müll?", "Sortiere Müll-Beispiele nach Papier, Plastik, Bio, Glas und Restmüll. Schreibe eine Müllspar-Idee auf.", ["Schreibe die Müllarten als Überschriften.", "Sammle Beispiele und ordne sie zu.", "Schreibe eine Idee auf, wie man Müll sparen kann.", "Male ein kleines Zeichen zu deiner besten Idee."], ["Manche Dinge bestehen aus mehreren Materialien."]),
  researcherTask("F-19", "Technik im Alltag", "Welche Technik hilft uns?", "Suche technische Dinge im Raum oder auf Bildern. Schreibe auf: Wobei helfen sie? Was wäre ohne sie anders?", ["Suche technische Dinge im Raum oder auf Bildern.", "Schreibe sie in dein Lerntagebuch.", "Notiere, wobei sie helfen.", "Überlege bei 2 Dingen, was ohne sie anders wäre."], ["Technik kann einfach oder kompliziert sein."]),
  researcherTask("F-20", "Forscherfrage der Woche", "Was möchte ich selbst herausfinden?", "Denke dir eine eigene Forscherfrage aus. Schreibe deine Vermutung, deine Beobachtung und dein Ergebnis auf.", ["Denke dir eine eigene Forscherfrage aus.", "Schreibe deine Vermutung in dein Lerntagebuch.", "Beobachte, teste oder sammle Informationen.", "Notiere dein Ergebnis."], ["Eine gute Forscherfrage beginnt oft mit Warum, Wie, Was oder Welche."])
];

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
  const byCode = new Map(tasks.map((task) => [task.code || task.id, task]));
  DEFAULT_TRAINING_TASKS.forEach((task) => {
    const key = task.code || task.id;
    const existing = byCode.get(key);
    if (!existing) {
      byCode.set(key, task);
      return;
    }
    byCode.set(key, {
      ...existing,
      ...task,
      active: existing.active !== false,
      id: existing.id || task.id
    });
  });
  return [...byCode.values()];
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
