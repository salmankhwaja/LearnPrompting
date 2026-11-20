/* Applies the saved theme before first paint (loaded in <head>; the CSP allows no inline scripts). Refs #7 */
(function () {
  try {
    var t = localStorage.getItem("lp.theme");
    // themes from the first version map onto the shared set
    var old = { night: "dark", dusk: "bluegray", dawn: "light", day: "light" };
    if (old[t]) { t = old[t]; localStorage.setItem("lp.theme", t); }
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
