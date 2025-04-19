/**
 * Pink Sock - DevTools Panel Registration
 */

// Create a panel in DevTools
chrome.devtools.panels.create(
  "Pink Sock",                                  // Panel name
  chrome.runtime.getURL("assets/icons/icon16.png"), // Panel icon with correct URL
  chrome.runtime.getURL("src/devtools/panel.html"), // Panel page with absolute path
  (panel) => {
    // Panel created callback
    console.log("Pink Sock DevTools panel created");
    
    // Add error handling for panel initialization
    panel.onShown.addListener((panelWindow) => {
      console.log("Pink Sock panel shown");
      if (!panelWindow || !panelWindow.document) {
        console.error("Pink Sock panel document not loaded properly");
      }
    });
  }
);
