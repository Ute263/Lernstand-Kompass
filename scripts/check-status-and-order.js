const fs = require('fs');
const assert = require('assert');
const app = fs.readFileSync('app.js', 'utf8');
const picker = fs.readFileSync('weekly-minimax-pages.js', 'utf8');
assert(app.includes('workedPagesDataIndex = null;\n\n  // Fertige Seiten verlassen'), 'Index muss beim Seitenstatus zurückgesetzt werden');
assert(app.includes('const previousScrollY = typeof window !== "undefined" ? window.scrollY : 0;\n  render();'), 'Statuswechsel muss Übersicht statt isoliertem DOM-Knoten aktualisieren');
assert(!app.includes('if (nextStatus === "offen") {\n      const group = button.closest'), 'Offene Seite darf nicht direkt aus dem DOM entfernt werden');
assert(app.includes('Object.prototype.hasOwnProperty.call(explicitStatuses, String(page))'), 'Explizit zurückgesetzte Seiten müssen im historischen Status erhalten bleiben');
assert(app.includes('stamp > previous.stamp'), 'Neuester Status muss vor älterem Abschluss stehen');
assert(picker.includes('const parts = mmUnique(workbookItems.map((item) => item.part || "")).sort(mmCompareParts);'), 'MiniMax Teile müssen bewusst sortiert werden');
assert(!picker.includes('<span class="weekly-editor-badge">${escapeHtml(weeklyPickRequest.day)}</span>'), 'Wochentags-Badge im Heftdialog wurde nicht entfernt');
// Die Sortierfunktion wird gegen die erwartete Reihenfolge ausgeführt.
const miniSort = picker.match(/  function mmPartRank\(part\) \{[\s\S]*?\n  \}\n\n  function mmCompareParts\(a, b\) \{[\s\S]*?\n  \}/);
assert(miniSort, 'Heftsortierfunktion fehlt');
const fn = new Function('mmCompareText', miniSort[0] + '\nreturn mmCompareParts;')((a,b)=>String(a).localeCompare(String(b),'de',{numeric:true}));
const values = ['Geometrie','Zahlen und Rechnen Teil B','Größen und Sachrechnen','Teste dich','Zahlen und Rechnen Teil A'];
assert.deepStrictEqual(values.sort(fn),['Zahlen und Rechnen Teil A','Zahlen und Rechnen Teil B','Größen und Sachrechnen','Geometrie','Teste dich']);
console.log('Regressionstest erfolgreich: Status-Rückkehr, neuerer Status, Dialog-Tag und MiniMax A/B/Sachrechnen/Geometrie/Teste dich.');
