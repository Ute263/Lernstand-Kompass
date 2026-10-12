const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Funktion fehlt: ${name}`);
  const parenStart = source.indexOf('(', start);
  let parenDepth = 0;
  let brace = -1;
  for (let i = parenStart; i < source.length; i += 1) {
    if (source[i] === '(') parenDepth += 1;
    else if (source[i] === ')') {
      parenDepth -= 1;
      if (parenDepth === 0) {
        brace = source.indexOf('{', i + 1);
        break;
      }
    }
  }
  if (brace < 0) throw new Error(`Funktionsrumpf fehlt: ${name}`);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Funktion konnte nicht gelesen werden: ${name}`);
}

const context = {
  console,
  formatFileDate: () => '2026-09-20',
  state: { activeClassId: 'c1', teacherShowFirstNames: false, animalGroups: [] },
  animalsForActiveClass: () => [
    { id: 'child-1', tierName: 'A', aktiv: true },
    { id: 'child-2', tierName: 'B', aktiv: true },
    { id: 'child-3', tierName: 'C', aktiv: true },
    { id: 'child-4', tierName: 'D', aktiv: true },
    { id: 'child-5', tierName: 'E', aktiv: true }
  ]
};
vm.createContext(context);
[
  'weeklyPlanDateKey',
  'weeklyPlanAudiencePriority',
  'selectRelevantWeeklyPlan',
  'weeklyPlanIsCurrent',
  'weeklyPlanAudienceAutoTitle',
  'weeklyPlanAudienceAnimalIds',
  'weeklyPlanTitleLooksAutoManaged'
].forEach((name) => vm.runInContext(extractFunction(name), context, { filename: `app.js:${name}` }));

const undatedOld = { id: 'old', active: true, updatedAt: '2026-09-19T20:00:00Z' };
const lastWeek = { id: 'last', active: true, validFrom: '2026-09-14', validTo: '2026-09-18', updatedAt: '2026-09-18T12:00:00Z' };
const nextWeek = { id: 'next', active: true, validFrom: '2026-09-21', validTo: '2026-09-25', updatedAt: '2026-09-19T12:00:00Z' };
assert(context.weeklyPlanIsCurrent(undatedOld) === false, 'Undatierter Plan wird fälschlich als aktuell behandelt.');
assert(context.selectRelevantWeeklyPlan([undatedOld, lastWeek, nextWeek], '2026-09-20')?.id === 'last', 'Am Wochenende muss der zuletzt begonnene datierte Plan gelten.');
assert(context.selectRelevantWeeklyPlan([undatedOld, lastWeek, nextWeek], '2026-09-22')?.id === 'next', 'Während des nächsten Zeitraums muss der neue datierte Plan gelten.');
assert(context.selectRelevantWeeklyPlan([undatedOld], '2026-09-20')?.id === 'old', 'Undatierter Plan muss als Fallback erhalten bleiben.');

const classPlan = { id: 'class', active: true, assignmentMode: 'all', validFrom: '2026-09-21', validTo: '2026-09-25', updatedAt: '2026-09-25T18:00:00Z' };
const groupPlan = { id: 'group', active: true, assignmentMode: 'selected', animalIds: ['child-1','child-2','child-3','child-4'], validFrom: '2026-09-21', validTo: '2026-09-25', updatedAt: '2026-09-21T08:00:00Z' };
assert(context.selectRelevantWeeklyPlan([classPlan, groupPlan], '2026-09-22', 'child-1')?.id === 'group', 'Individueller/Gruppenplan muss fuer das Kind Vorrang vor dem Klassenplan haben.');
assert(context.selectRelevantWeeklyPlan([classPlan, groupPlan], '2026-09-22', 'other-child')?.id === 'class', 'Klassenplan muss fuer nicht ausgewaehlte Kinder gelten.');

context.lkWeekWindow = () => ({ startKey: '2026-09-21', endKey: '2026-09-27' });
context.weeklyPlansForAnimal = (animalId) => [classPlan, groupPlan].filter((plan) => plan.assignmentMode === 'all' || plan.animalIds?.includes(animalId));
vm.runInContext(extractFunction('lkPlanForAnimalInWeek'), context, { filename: 'app.js:lkPlanForAnimalInWeek' });
assert(context.lkPlanForAnimalInWeek('child-1', 0)?.id === 'group', 'Lernstands-/Wochenstatus-Auswahl nimmt fuer Gruppenkind noch den Klassenplan.');
assert(context.lkPlanForAnimalInWeek('other-child', 0)?.id === 'class', 'Lernstands-/Wochenstatus-Auswahl nimmt fuer normales Kind nicht den Klassenplan.');
const deleted = { ...lastWeek, id: 'deleted', active: false, deletedAt: '2026-09-20T10:00:00Z' };
assert(context.selectRelevantWeeklyPlan([deleted, undatedOld], '2026-09-20')?.id === 'old', 'Gelöschter Plan darf nicht als relevanter Plan zurückkehren.');


assert(context.weeklyPlanAudienceAutoTitle('selected', ['child-1','child-2','child-3','child-4']) === 'Auswahl – 4 Kinder', 'Automatischer Gruppentitel fuer vier Kinder ist falsch.');
assert(context.weeklyPlanAudienceAutoTitle('selected', ['child-1','child-2','child-3','child-4','child-5']) === 'Auswahl – 5 Kinder', 'Automatischer Gruppentitel aktualisiert die Kinderzahl nicht.');
assert(context.weeklyPlanTitleLooksAutoManaged({ title: 'Auswahl – 4 Kinder', assignmentMode: 'selected', animalIds: ['child-1','child-2','child-3','child-4'] }) === true, 'Bestehender automatischer Gruppentitel wird nicht erkannt.');

console.log('Wochenplan-Auswahlprüfung erfolgreich.');
