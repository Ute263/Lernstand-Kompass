/* Schritt 3d – neuer sichtbarer Editoraufbau mit Original-Daten- und Drucklogik.
   Transformiert nur das erzeugte HTML; keine Aenderung an gespeicherten Wochenplaenen.
*/
(function () {
  "use strict";
  if (typeof renderWeeklyPlanEditor !== "function") return;
  var originalRenderWeeklyPlanEditor = renderWeeklyPlanEditor;
  renderWeeklyPlanEditor = function lkRenderModernWeeklyEditor(plan, focusAnimal) {
    var original = originalRenderWeeklyPlanEditor.apply(this, arguments);
    try {
      var container = document.createElement("div");
      container.innerHTML = original;
      var root = container.querySelector(".weekly-editor-clean");
      if (!root) return original;
      var head = root.querySelector(".weekly-clean-head");
      var statusline = root.querySelector(".weekly-clean-statusline");
      var form = root.querySelector("form.weekly-plan-form");
      if (!head || !form) return original;
      var settings = form.querySelector(".weekly-clean-settings");
      var audience = form.querySelector(".weekly-audience-editor");
      var hiddenId = form.querySelector("#weeklyPlanId");
      var extra = form.querySelector(".weekly-clean-more");
      var actions = form.querySelector(".weekly-clean-actions");
      if (!settings || !audience || !actions) return original;

      // Header is compact and retains the actual plan switch and print-status action.
      var top = document.createElement("header");
      top.className = "lk-v08-top";
      var intro = document.createElement("div");
      intro.innerHTML = '<h2>Wochenplan bearbeiten</h2><p>Plan auswählen, Aufgaben eintragen und individuell anpassen</p>';
      var picker = document.createElement("div");
      picker.className = "lk-v08-plan-picker";
      var originalHeadActions = head.querySelector(".weekly-clean-head-actions");
      if (originalHeadActions) picker.appendChild(originalHeadActions);
      top.appendChild(intro);
      top.appendChild(picker);
      root.insertBefore(top, head);
      head.remove();
      if (statusline) statusline.classList.add("lk-v08-statusline");
      root.classList.add("lk-editor-redesigned");
      form.classList.add("lk-v08-form");

      var controls = document.createElement("div");
      controls.className = "lk-v08-controls";
      var audienceControl = document.createElement("section");
      audienceControl.className = "lk-v08-control lk-v08-audience";
      audienceControl.innerHTML = '<div class="lk-v08-control-head"><span class="lk-v08-step">1</span> Für wen planst du?</div>';
      audienceControl.appendChild(audience);
      var animalChooser = audienceControl.querySelector(".lk-audience-chooser");
      if (animalChooser) animalChooser.open = false;
      var timeControl = document.createElement("section");
      timeControl.className = "lk-v08-control lk-v08-period";
      timeControl.innerHTML = '<div class="lk-v08-control-head"><span class="lk-v08-step">2</span> Zeitraum und Planungsansicht</div>';
      timeControl.appendChild(settings);
      controls.appendChild(audienceControl);
      controls.appendChild(timeControl);
      if (hiddenId) hiddenId.insertAdjacentElement("afterend", controls);
      else form.prepend(controls);

      // Move the unchanged original editor into a visibly separate workspace.
      var workspace = document.createElement("section");
      workspace.className = "lk-v08-tasks";
      workspace.innerHTML = '<div class="lk-v08-tasks-head"><h3>3 · Aufgaben bearbeiten</h3><small>Arbeitsheft → Seite → Aufgabennummer</small></div>';
      var originalTasks = form.querySelector(".weekly-day-editor-list, .lk-whole-week-editor, .lk-weekly-day-accordion");
      if (!originalTasks) originalTasks = form.querySelector(".weekly-clean-section-title + div");
      if (originalTasks) {
        var originalSectionTitle = form.querySelector(":scope > .weekly-clean-section-title");
        if (originalSectionTitle) originalSectionTitle.remove();
        workspace.appendChild(originalTasks);
        if (extra) form.insertBefore(workspace, extra);
        else form.insertBefore(workspace, actions);
      }
      // Keep the original hidden fields, individual overrides and optional settings.
      return root.outerHTML;
    } catch (error) {
      console.warn("Editor-Neugestaltung nicht moeglich; Originalansicht bleibt erhalten", error);
      return original;
    }
  };
})();
