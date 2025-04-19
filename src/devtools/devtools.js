/**
 * Pink Sock - DevTools Panel Registration
 */

// Create a panel in DevTools
chrome.devtools.panels.create(
  "Pink Sock",           // Panel name
  "../assets/icons/icon16.png", // Panel icon
  "panel.html",          // Panel page
  (panel) => {
    // Panel created callback
    console.log("Pink Sock DevTools panel created");
  }
);
