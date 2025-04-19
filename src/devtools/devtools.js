/**
 * Pink Sock - DevTools Panel Registration
 */

console.log("Pink Sock DevTools script loading");

// Try to load the main panel, with fallback
try {
  // Try the standard path first
  chrome.devtools.panels.create(
    "Pink Sock",                          // Panel name
    "/assets/icons/icon16.png",           // Panel icon
    "/src/devtools/panel.html",           // Main panel path
    function(panel) {
      console.log("Pink Sock DevTools panel created");
      
      // Add panel show listener
      if (panel && panel.onShown) {
        panel.onShown.addListener(function(panelWindow) {
          console.log("Pink Sock panel shown");
          
          // Check if panel loaded properly
          if (!panelWindow || !panelWindow.document) {
            console.error("Pink Sock panel document not loaded properly");
            // Try to recreate with fallback panel
            createFallbackPanel();
          }
        });
      }
    }
  );
  console.log("Panel creation initiated");
} catch (error) {
  console.error("Error creating Pink Sock panel:", error);
  createFallbackPanel();
}

// Fallback panel creation
function createFallbackPanel() {
  console.log("Attempting to create fallback panel");
  try {
    chrome.devtools.panels.create(
      "Pink Sock (Fallback)",
      "/assets/icons/icon16.png",
      "/src/devtools/fallback-panel.html",
      function(fallbackPanel) {
        console.log("Created fallback panel");
      }
    );
  } catch (fallbackError) {
    console.error("Failed to create fallback panel:", fallbackError);
  }
}
