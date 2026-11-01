/* Lernstand-Kompass · Druckübersicht v19
 * Der Heftstand wird aus den tatsächlichen Heftfortschrittsdaten ermittelt,
 * nicht aus dem zeitlich letzten beliebigen Eintrag eines Fachs.
 */
(() => {
  function ts(entry) {
    const value = entry?.updatedAt || entry?.datumUhrzeit || entry?.createdAt || 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function isWorkbookProgress(entry, subject) {
    if (!entry || entry.fach !== subject || !entry.materialName) return false;
    return Boolean(
      entry.workbookCatalogId
      || entry.workbookPart
      || Array.isArray(entry.completedPages)
      || (entry.pageStatuses && typeof entry.pageStatuses === 'object')
    );
  }

  function groupKey(entry) {
    return [entry.materialName || '', entry.workbookPart || '', entry.bookType || ''].join('|||');
  }

  function completedPagesFromEntry(entry) {
    const pages = new Set((entry?.completedPages || []).map(Number).filter((page) => Number.isFinite(page) && page > 0));
    Object.entries(entry?.pageStatuses || {}).forEach(([page, status]) => {
      if (typeof normalizeSimpleWorkStatus === 'function' && normalizeSimpleWorkStatus(status) === 'fertig') {
        const number = Number(page);
        if (Number.isFinite(number) && number > 0) pages.add(number);
      }
    });
    if (!pages.size && typeof normalizeSimpleWorkStatus === 'function' && normalizeSimpleWorkStatus(entry?.workStatus || entry?.status) === 'fertig') {
      const page = Number(entry?.seite || entry?.seiteBis || 0);
      if (page > 0) pages.add(page);
    }
    return [...pages];
  }

  function workbookStand(animal, subject, entries) {
    const candidates = (entries || [])
      .filter((entry) => entry.tierID === animal.id && isWorkbookProgress(entry, subject));
    if (!candidates.length) {
      const fallback = (entries || [])
        .filter((entry) => entry.tierID === animal.id && entry.fach === subject && Number(entry.seite) > 0 && !isExtraMaterialName(entry.materialName))
        .sort((a, b) => ts(b) - ts(a) || Number(b.seite || 0) - Number(a.seite || 0))[0];
      return fallback ? { label: entryStandLabel(fallback), updatedAt: fallback.updatedAt || fallback.datumUhrzeit || fallback.createdAt || '' } : null;
    }

    const groups = new Map();
    candidates.forEach((entry) => {
      const key = groupKey(entry);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });

    const ranked = [...groups.values()].map((groupEntries) => {
      const latest = [...groupEntries].sort((a, b) => ts(b) - ts(a) || Number(b.seite || 0) - Number(a.seite || 0))[0];
      const completed = groupEntries.flatMap(completedPagesFromEntry);
      const maxCompleted = completed.length ? Math.max(...completed) : Number(latest?.seite || latest?.seiteBis || 0);
      const part = latest?.workbookPart ? ` · ${latest.workbookPart}` : '';
      const pageText = maxCompleted > 0 ? `bis S. ${maxCompleted}` : entryWorkLabel(latest);
      return {
        label: `${latest?.materialName || subject}${part} · ${pageText}`,
        updatedAt: latest?.updatedAt || latest?.datumUhrzeit || latest?.createdAt || '',
        time: ts(latest),
        page: maxCompleted
      };
    });

    return ranked.sort((a, b) => b.time - a.time || b.page - a.page)[0] || null;
  }

  window.lkWorkbookPrintStand = workbookStand;

  if (typeof buildBeautifulOverviewRows === 'function') {
    buildBeautifulOverviewRows = function buildBeautifulOverviewRowsV19(animals, entries) {
      return animals
        .map((animal) => {
          const animalEntries = (entries || []).filter((entry) => entry.tierID === animal.id).sort(sortNewest);
          const deutschStand = workbookStand(animal, 'Deutsch', entries);
          const matheStand = workbookStand(animal, 'Mathe', entries);
          const latest = animalEntries[0] || null;
          const open = animalEntries.find((entry) => !entry.erledigt && (entry.status === 'brauche Hilfe' || entry.status === 'bitte kontrollieren')) || null;
          const stale = latest && daysSince(latest.datumUhrzeit || latest.updatedAt || latest.createdAt) >= (state.progressSettings || DEFAULT_PROGRESS_SETTINGS).staleDays;
          return {
            animal,
            klasse: getClassNameById(animal.classId),
            deutsch: deutschStand?.label || '–',
            mathe: matheStand?.label || '–',
            latestActivity: latest ? relativeActivity(latest.datumUhrzeit || latest.updatedAt || latest.createdAt) : '–',
            status: open?.status || '–',
            hint: open?.status === 'brauche Hilfe'
              ? 'Hilfewunsch offen'
              : open?.status === 'bitte kontrollieren'
                ? 'Kontrolle offen'
                : stale
                  ? 'länger kein Eintrag'
                  : latest
                    ? 'im Plan'
                    : 'kein Eintrag'
          };
        })
        .sort((a, b) => a.klasse.localeCompare(b.klasse, 'de') || a.animal.tierName.localeCompare(b.animal.tierName, 'de'));
    };
  }

  if (typeof buildPrintRows === 'function') {
    buildPrintRows = function buildPrintRowsV19(animals, entries) {
      return animals
        .map((animal) => {
          const animalEntries = (entries || []).filter((entry) => entry.tierID === animal.id).sort(sortNewest);
          const deutschStand = workbookStand(animal, 'Deutsch', entries);
          const matheStand = workbookStand(animal, 'Mathe', entries);
          const open = animalEntries.find((entry) => !entry.erledigt && (entry.status === 'brauche Hilfe' || entry.status === 'bitte kontrollieren')) || null;
          return {
            tier: animal.exportLabel || `${animal.tierEmoji} ${animal.tierName}`,
            deutsch: deutschStand?.label || '–',
            mathe: matheStand?.label || '–',
            latestActivity: animalEntries[0] ? relativeActivity(animalEntries[0].datumUhrzeit || animalEntries[0].updatedAt || animalEntries[0].createdAt) : '–',
            open: open ? open.status : '–',
            note: ''
          };
        })
        .sort((a, b) => a.tier.localeCompare(b.tier, 'de'));
    };
  }
})();
