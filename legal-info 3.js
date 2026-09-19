(function installLegalFooter() {
  const FOOTER_ID = "lkLegalFooter";
  const MODAL_ID = "lkLegalModal";

  const legalSections = {
    copyright: {
      title: "Urheberrecht & Nutzung",
      html: `
        <p><strong>© 2026 Ute Holzschneider-Riedl. Alle Rechte vorbehalten.</strong></p>
        <p>Der <strong>Lernstand-Kompass</strong> wurde von Ute Holzschneider-Riedl konzipiert und entwickelt.</p>
        <h4>Kostenlose Nutzung</h4>
        <p>Die bereitgestellte App darf in ihrer veröffentlichten Form unentgeltlich genutzt werden.</p>
        <h4>Nicht erlaubt ohne vorherige ausdrückliche Zustimmung</h4>
        <ul>
          <li>den Quellcode oder wesentliche Teile der App zu vervielfältigen, weiterzugeben oder erneut zu veröffentlichen,</li>
          <li>veränderte oder abgeleitete Fassungen als eigenes Produkt zu veröffentlichen,</li>
          <li>die Urheberkennzeichnung zu entfernen, zu verändern oder die App als eigene Entwicklung auszugeben,</li>
          <li>die App oder wesentliche Bestandteile davon kommerziell zu verwerten.</li>
        </ul>
        <p>Gesetzlich zwingend erlaubte Nutzungen bleiben unberührt. Für eingebundene Fremdbibliotheken und sonstige Komponenten gelten zusätzlich deren jeweilige Lizenzbedingungen.</p>
      `
    },
    privacy: {
      title: "Datenschutz",
      html: `
        <p>Der Lernstand-Kompass ist so aufgebaut, dass Lern- und Arbeitsdaten grundsätzlich <strong>lokal auf dem verwendeten Gerät bzw. im verwendeten Browser</strong> gespeichert werden.</p>
        <h4>Welche Daten in der App vorkommen können</h4>
        <ul>
          <li>Tier-Pseudonyme und optionale Zuordnungen zu Vornamen im geschützten Lehrkraftbereich,</li>
          <li>Lernstände, Wochenplan-Aufgaben und Bearbeitungsstände,</li>
          <li>Trainingsaufgaben, Lernzielkontrollen, Notizen und weitere schulische Arbeitsdaten.</li>
        </ul>
        <h4>Lokale Speicherung</h4>
        <p>Die App verwendet für die lokale Speicherung Browsertechniken wie IndexedDB bzw. localStorage. Ein zentraler Server der App ist für diese Lernstandsdaten nicht erforderlich.</p>
        <h4>Optionale Synchronisation / Sicherung</h4>
        <p>Soweit in einer Installation eine optionale Microsoft-/OneDrive-Funktion eingerichtet und bewusst aktiviert wird, können ausgewählte Sicherungs- oder Synchronisationsdaten an das verwendete Microsoft-Konto übertragen werden. Maßgeblich sind dann zusätzlich die Datenschutz- und Kontoeinstellungen der jeweiligen Schule bzw. Organisation und von Microsoft.</p>
        <h4>Hosting über Cloudflare</h4>
        <p>Beim Aufruf der veröffentlichten Web-App wird die Seite über Cloudflare ausgeliefert. Dabei können technisch notwendige Verbindungsdaten, insbesondere IP-Adresse, Zeitpunkt und aufgerufene Ressource, durch den Hosting-Dienst verarbeitet werden. Die App selbst enthält keine Werbetracker und keine eigene Analysefunktion.</p>
        <h4>Verantwortlicher Umgang</h4>
        <p>Wer die App mit personenbezogenen Daten von Kindern oder anderen Personen nutzt, muss die jeweils geltenden schulischen und datenschutzrechtlichen Vorgaben beachten. Insbesondere sollten Exporte und Backups geschützt gespeichert und nicht unkontrolliert weitergegeben werden.</p>
        <p class="legal-note">Diese Hinweise beschreiben die technische Arbeitsweise der App. Für einen schulischen Regelbetrieb können je nach Trägerschaft, Schule und eingesetzten Konten ergänzende Datenschutzinformationen erforderlich sein.</p>
      `
    },
    imprint: {
      title: "Impressum / Anbieterhinweis",
      html: `
        <p><strong>Lernstand-Kompass</strong></p>
        <p><strong>Konzeption und Entwicklung:</strong><br>Ute Holzschneider-Riedl<br>Kerken, Deutschland</p>
        <p><strong>Bereitstellung:</strong><br>unentgeltliche Web-App für schulische und pädagogische Nutzung</p>
        <p><strong>Kontakt:</strong><br>über den von der Anbieterin mitgeteilten Kontaktweg</p>
        <p class="legal-note"><strong>Hinweis:</strong> Sollte für eine konkrete öffentliche oder geschäftsmäßige Bereitstellung eine vollständige gesetzliche Anbieterkennzeichnung erforderlich sein, müssen vor einer entsprechenden Nutzung insbesondere eine ladungsfähige Anschrift und eine direkte elektronische Kontaktmöglichkeit ergänzt werden.</p>
      `
    },
    about: {
      title: "Über den Lernstand-Kompass",
      html: `
        <p>Der Lernstand-Kompass unterstützt die Planung, Dokumentation und Übersicht von Lernwegen im schulischen Alltag.</p>
        <p><strong>Entwicklung und Konzeption:</strong> Ute Holzschneider-Riedl</p>
        <p><strong>Version:</strong> laufend weiterentwickelte Web-App</p>
        <p>Die App wird unentgeltlich bereitgestellt. Urheberrecht und Nutzungsbedingungen bleiben davon unberührt.</p>
      `
    }
  };

  function modalMarkup() {
    return `
      <div class="legal-modal" id="${MODAL_ID}" hidden>
        <button class="legal-modal-backdrop" type="button" aria-label="Fenster schließen" data-legal-close></button>
        <section class="legal-dialog" role="dialog" aria-modal="true" aria-labelledby="lkLegalTitle">
          <div class="legal-dialog-head">
            <h3 id="lkLegalTitle">Information</h3>
            <button class="secondary legal-close" type="button" data-legal-close>Schließen</button>
          </div>
          <div class="legal-dialog-content" id="lkLegalContent"></div>
        </section>
      </div>
    `;
  }

  function footerMarkup() {
    return `
      <footer class="legal-footer" id="${FOOTER_ID}">
        <div class="legal-footer-inner">
          <span class="legal-copyright">© 2026 Ute Holzschneider-Riedl · Lernstand-Kompass</span>
          <nav class="legal-footer-links" aria-label="Rechtliche Informationen">
            <button type="button" data-legal-section="copyright">Urheberrecht & Nutzung</button>
            <button type="button" data-legal-section="privacy">Datenschutz</button>
            <button type="button" data-legal-section="imprint">Impressum</button>
            <button type="button" data-legal-section="about">Über die App</button>
          </nav>
        </div>
      </footer>
    `;
  }

  function ensureLegalUi() {
    if (!document.getElementById(MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", modalMarkup());
    }

    const appRoot = document.querySelector("#app");
    if (!appRoot) return;

    const printMode = document.body.classList.contains("print-doc-mode");
    const existing = document.getElementById(FOOTER_ID);
    if (printMode) {
      if (existing) existing.remove();
      return;
    }

    if (!existing) {
      appRoot.insertAdjacentHTML("beforeend", footerMarkup());
    }
  }

  function openLegalSection(sectionKey) {
    const section = legalSections[sectionKey];
    if (!section) return;
    ensureLegalUi();
    const modal = document.getElementById(MODAL_ID);
    const title = document.getElementById("lkLegalTitle");
    const content = document.getElementById("lkLegalContent");
    if (!modal || !title || !content) return;
    title.textContent = section.title;
    content.innerHTML = section.html;
    modal.hidden = false;
    document.body.classList.add("legal-modal-open");
  }

  function closeLegalModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.hidden = true;
    document.body.classList.remove("legal-modal-open");
  }

  document.addEventListener("click", (event) => {
    const sectionButton = event.target.closest("[data-legal-section]");
    if (sectionButton) {
      openLegalSection(sectionButton.dataset.legalSection);
      return;
    }
    if (event.target.closest("[data-legal-close]")) closeLegalModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLegalModal();
  });

  const appRoot = document.querySelector("#app");
  if (appRoot) {
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(ensureLegalUi);
    });
    observer.observe(appRoot, { childList: true });
  }

  ensureLegalUi();
  window.openLegalSection = openLegalSection;
  window.closeLegalModal = closeLegalModal;
})();
