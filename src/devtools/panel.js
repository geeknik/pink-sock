/**
 * Pink Sock - DevTools Panel Script
 * Handles the detailed analysis view in the DevTools panel
 */

// Add console logging to help with debugging
console.log("Pink Sock Panel script loaded");

document.addEventListener('DOMContentLoaded', init);

// Store the current findings and selected finding
let currentFindings = [];
let selectedFinding = null;

function init() {
  console.log("Pink Sock Panel initialized");
  
  // Set up event listeners
  document.getElementById('refresh-btn').addEventListener('click', refreshData);
  document.getElementById('export-btn').addEventListener('click', exportReport);
  document.getElementById('severity-filter').addEventListener('change', applyFilters);
  document.getElementById('type-filter').addEventListener('change', applyFilters);
  
  // Load data
  loadData();
}

function loadData() {
  console.log("Loading data for Pink Sock panel");
  
  // Get the current tab ID using DevTools APIs
  chrome.devtools.inspectedWindow.eval(
    "window.location.href",
    (result, isException) => {
      if (isException) {
        console.error("Could not access the page URL:", isException);
        showError("Could not access the page URL.");
        return;
      }
      
      console.log("Page URL:", result);
      console.log("Tab ID:", chrome.devtools.inspectedWindow.tabId);
      
      // Get findings from the background service
      chrome.runtime.sendMessage({
        type: 'GET_RESULTS',
        tabId: chrome.devtools.inspectedWindow.tabId
      })
      .then(response => {
        console.log("Received response:", response);
        
        const findings = response && response.results && response.results.findings 
          ? response.results.findings 
          : [];
        
        const headers = response && response.results && response.results.headers
          ? response.results.headers
          : {};
        
        console.log("Processed findings:", findings.length);
        console.log("Processed headers:", Object.keys(headers).length);
        
        // Store findings for filtering
        currentFindings = findings;
        
        // Update the UI
        updateSummary(findings);
        populateHeadersAnalysis(headers);
        populateFindings(findings);
        
        // Draw charts
        drawSeverityChart(findings);
      })
      .catch(error => {
        console.error("Failed to load results:", error);
        showError("Could not load results. Please try again. Error: " + (error.message || "Unknown error"));
        
        // Show a more detailed error with fallback content
        const findingsList = document.getElementById('findings-list');
        findingsList.innerHTML = `
          <div class="error-message">
            <p>Could not load results. This could be due to:</p>
            <ul>
              <li>The background service worker is not running</li>
              <li>Communication between devtools and background is failing</li>
              <li>No scan has been performed yet</li>
            </ul>
            <p>Try clicking the "Refresh" button to scan the page, or try reloading the extension.</p>
          </div>
        `;
      });
    }
  );
}

// Rest of the functions remain the same as in the original file
// ... [code truncated for brevity]

// Showing error with more context
function showError(message) {
  console.error("Pink Sock error:", message);
  
  // Show error message in the UI
  const findingsList = document.getElementById('findings-list');
  findingsList.innerHTML = `
    <div class="error-message">
      ${message}
      <p>To resolve this issue, try:</p>
      <ul>
        <li>Refreshing the current page</li>
        <li>Reloading the extension</li>
        <li>Checking if the extension has the necessary permissions</li>
      </ul>
    </div>
  `;
}

// The rest of the original code remains the same
// This is just truncated for brevity in this fix
