/* Schritt 3f: Dialog-Absicherung. Keine Daten- oder Drucklogik geändert. */
(function () {
  "use strict";
  var closing = false;
  function activePicker() { return document.querySelector(".lk-weekly-picker-overlay"); }
  function finishPicker() {
    if (closing || !activePicker()) return;
    closing = true;
    try {
      if (typeof window.closeWeeklyCatalogPicker === "function") window.closeWeeklyCatalogPicker();
      // ältere Render-Erweiterungen können das Dialogelement stehen lassen
      var remaining = document.querySelectorAll(".lk-weekly-picker-overlay");
      for (var i = 0; i < remaining.length; i++) remaining[i].remove();
    } catch (error) {
      console.error("Heftauswahl schließen:", error);
      var overlays = document.querySelectorAll(".lk-weekly-picker-overlay");
      for (var j = 0; j < overlays.length; j++) overlays[j].remove();
    } finally { closing = false; }
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && activePicker()) {
      event.preventDefault(); event.stopPropagation(); finishPicker();
    }
  }, true);
  document.addEventListener("click", function (event) {
    var overlay = event.target && event.target.closest ? event.target.closest(".lk-weekly-picker-overlay") : null;
    if (!overlay) return;
    var closeButton = event.target.closest(".lk-picker-done,.modal-close,[data-lk-close-picker]");
    if (event.target === overlay || closeButton) {
      event.preventDefault(); event.stopImmediatePropagation(); finishPicker();
    }
  }, true);
  // Schutz gegen versehentlich mehrfach gerenderte Heftfenster
  var observer = new MutationObserver(function () {
    var overlays = document.querySelectorAll(".lk-weekly-picker-overlay");
    for (var i = 1; i < overlays.length; i++) overlays[i].remove();
  });
  var app = document.getElementById("app");
  if (app) observer.observe(app, {childList:true,subtree:true});
})();
