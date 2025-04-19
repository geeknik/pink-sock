/**
 * Pink Sock - Popup Script
 * Handles the popup UI and interaction with the background service
 */

document.addEventListener('DOMContentLoaded', init);

function init() {
  // Set up event listeners
  document.getElementById('scan-btn').addEventListener('click', startScan);
  document.getElementById('details-btn').addEventListener('click', openDetailedReport);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('about-link').addEventListener('click', openAboutPage);
  
  // Set up filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to the clicked button
      button.classList.add('active');
      // Apply the filter
      const severity = button.dataset.severity;
      filterFindings(severity);
    });
  });
  
  // Load results for the current tab
  loadResults();
}

function startScan() {
  // Get the current tab ID
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;
    
    // Send a message to content script to start scanning
    chrome.tabs.sendMessage(tabId, { type: 'START_SCAN' })
      .then(() => {
        // Show a loading indicator
        showLoading(true);
        
        // Wait a moment and then reload the results
        setTimeout(() => {
          loadResults();
          showLoading(false);
        }, 1000);
      })
      .catch(error => {
        console.error("Failed to start scan:", error);
        showError("Could not start scan. Please refresh the page and try again.");
        showLoading(false);
      });
  });
}

function loadResults() {
  // Get the current tab ID
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;
    
    // Request results from the background service
    chrome.runtime.sendMessage({ type: 'GET_RESULTS', tabId })
      .then(response => {
        const findings = response.results && response.results.findings 
          ? response.results.findings 
          : [];
        
        // Update the UI with the findings
        updateSummary(findings);
        populateFindings(findings);
      })
      .catch(error => {
        console.error("Failed to load results:", error);
        showError("Could not load results. Please try again.");
      });
  });
}

function updateSummary(findings) {
  // Count findings by severity
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  findings.forEach(finding => {
    counts[finding.severity]++;
  });
  
  // Update the count elements
  document.getElementById('critical-count').textContent = counts.critical;
  document.getElementById('high-count').textContent = counts.high;
  document.getElementById('medium-count').textContent = counts.medium;
  document.getElementById('low-count').textContent = counts.low;
  document.getElementById('info-count').textContent = counts.info;
}

function populateFindings(findings) {
  const findingsList = document.getElementById('findings-list');
  
  // Clear existing content
  findingsList.innerHTML = '';
  
  if (findings.length === 0) {
    findingsList.innerHTML = '<div class="no-findings">No security issues found</div>';
    return;
  }
  
  // Sort findings by severity (critical -> info)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  // Create a finding element for each issue
  findings.forEach(finding => {
    const findingElement = createFindingElement(finding);
    findingsList.appendChild(findingElement);
  });
}

function createFindingElement(finding) {
  const element = document.createElement('div');
  element.className = `finding-item ${finding.severity}`;
  element.dataset.severity = finding.severity;
  
  const title = formatTitle(finding.code);
  
  element.innerHTML = `
    <span class="severity ${finding.severity}">${finding.severity}</span>
    <div class="code">${title}</div>
    <div class="details">${finding.details}</div>
  `;
  
  // Make the finding clickable to show more details
  element.addEventListener('click', () => {
    showFindingDetails(finding);
  });
  
  return element;
}

function formatTitle(code) {
  // Convert snake_case to Title Case
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function filterFindings(severity) {
  const findingItems = document.querySelectorAll('.finding-item');
  
  findingItems.forEach(item => {
    if (severity === 'all' || item.dataset.severity === severity) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function showFindingDetails(finding) {
  // This would show a modal or expanded view with more details
  // For this implementation, we'll open the detailed report in devtools
  openDetailedReport();
}

function openDetailedReport() {
  // Open the devtools panel for detailed analysis
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.runtime.sendMessage({ 
      type: 'OPEN_DEVTOOLS_PANEL',
      tabId: tabs[0].id
    });
    
    // Inform user to check devtools panel
    alert('Please open DevTools (F12) and navigate to the "Pink Sock" panel for detailed reports.');
  });
}

function openSettings() {
  // Open the settings page
  chrome.runtime.openOptionsPage();
}

function openAboutPage() {
  // Open about page in a new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('about.html') });
}

function showLoading(isLoading) {
  // Update UI to show loading state
  const scanButton = document.getElementById('scan-btn');
  
  if (isLoading) {
    scanButton.textContent = 'Scanning...';
    scanButton.disabled = true;
  } else {
    scanButton.textContent = 'Scan Again';
    scanButton.disabled = false;
  }
}

function showError(message) {
  // Show error message in the UI
  const findingsList = document.getElementById('findings-list');
  findingsList.innerHTML = `<div class="error-message">${message}</div>`;
}
