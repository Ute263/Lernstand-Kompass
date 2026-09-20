const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Funktion fehlt: ${name}`);
  const brace = source.indexOf('{', start);
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
  formatFileDate: () => '2026-09-20'
};
vm.createContext(context);
[
  'weeklyPlanDateKey',
  'selectRelevantWeeklyPlan',
  'weeklyPlanIsCurrent'
].forEach((name) => vm.runInContext(extractFunction(name), context, { filename: `app.js:${name}` }));

const undatedOld = { id: 'old', active: true, updatedAt: '2026-09-19T20:00:00Z' };
const lastWeek = { id: 'last', active: true, validFrom: '2026-09-14', validTo: '2026-09-18', updatedAt: '2026-09-18T12:00:00Z' };
const nextWeek = { id: 'next', active: true, validFrom: '2026-09-21', validTo: '2026-09-25', updatedAt: '2026-09-19T12:00:00Z' };
assert(context.weeklyPlanIsCurrent(undatedOld) === false, 'Undatierter Plan wird fälschlich als aktuell behandelt.');
assert(context.selectRelevantWeeklyPlan([undatedOld, lastWeek, nextWeek], '2026-09-20')?.id === 'last', 'Am Wochenende muss der zuletzt begonnene datierte Plan gelten.');
assert(context.selectRelevantWeeklyPlan([undatedOld, lastWeek, nextWeek], '2026-09-22')?.id === 'next', 'Während des nächsten Zeitraums muss der neue datierte Plan gelten.');
assert(context.selectRelevantWeeklyPlan([undatedOld], '2026-09-20')?.id === 'old', 'Undatierter Plan muss als Fallback erhalten bleiben.');
const deleted = { ...lastWeek, id: 'deleted', active: false, deletedAt: '2026-09-20T10:00:00Z' };
assert(context.selectRelevantWeeklyPlan([deleted, undatedOld], '2026-09-20')?.id === 'old', 'Gelöschter Plan darf nicht als relevanter Plan zurückkehren.');

console.log('Wochenplan-Auswahlprüfung erfolgreich.');
