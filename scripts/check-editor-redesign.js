// Schutz gegen versehentliches Entfernen der neuen Lehrer-Eingabemaske.
const fs = require('fs');
const assert = require('assert');
const root = require('path').resolve(__dirname, '..');
const html = fs.readFileSync(root + '/index.html','utf8');
const script = fs.readFileSync(root + '/teacher-editor-redesign.js','utf8');
const style = fs.readFileSync(root + '/teacher-editor-redesign.css','utf8');
assert(html.includes('teacher-editor-redesign.js') && html.includes('teacher-editor-redesign.css'));
assert(html.indexOf('weekly-autosave.js') < html.indexOf('teacher-editor-redesign.js'), 'Editor muss nach Wochenplanlogik laden');
for(const required of ['lk-v08-controls','lk-v08-tasks','weekly-clean-settings','weekly-audience-editor','weekly-day-editor-list','lk-whole-week-editor','originalRenderWeeklyPlanEditor']) assert(script.includes(required), 'Editor-Baustein fehlt: '+required);
assert(!/data\.weeklyPlans\s*=|persist\s*\(/.test(script), 'Designmodul darf keine Wochenplandaten speichern');
assert(style.includes('@media screen') && style.includes('.app-shell:not(.child)'), 'Gestaltung muss auf Lehrer-Bildschirm begrenzt bleiben');
console.log('Editor-Struktur: originale Formularfelder, Datenverarbeitung und Drucklogik bleiben erhalten.');
