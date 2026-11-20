/* Sets the saved colour theme before the page is drawn (avoids a flash of the wrong theme).
 * External file because the Content-Security-Policy forbids inline scripts. Refs #7 */
(function () {
  try {
    var t = localStorage.getItem("lp.theme");
    var ok = ["auto", "night", "midnight", "dusk", "dawn", "day"];
    document.documentElement.setAttribute("data-theme", ok.indexOf(t) >= 0 ? t : "auto");
  } catch (e) { /* storage blocked: keep the default */ }
})();
