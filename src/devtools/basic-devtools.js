/**
 * Pink Sock - Simple DevTools Panel Registration
 */

console.log("Pink Sock basic DevTools script loading");

// Create a simple panel in DevTools
chrome.devtools.panels.create(
  "Pink Sock",                   // Panel name
  null,                          // No icon to avoid icon errors
  "basic-panel.html",            // Simple panel page
  function(panel) {
    console.log("Pink Sock basic DevTools panel created");
  }
);
