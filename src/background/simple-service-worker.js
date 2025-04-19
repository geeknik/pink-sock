/**
 * Pink Sock - Simple Background Service Worker
 * A minimal implementation to avoid binding issues
 */

console.log("Pink Sock simple service worker starting...");

// Global storage for scan results
const scanResults = new Map();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message.type);
  
  if (message.type === 'SCAN_RESULTS') {
    // Store the scan results for the tab
    const tabId = sender.tab.id;
    if (!scanResults.has(tabId)) {
      scanResults.set(tabId, { headers: {}, findings: [] });
    }
    
    const tabData = scanResults.get(tabId);
    tabData.findings = message.data;
    
    // Update badge with results count
    updateBadge(tabId, message.data);
    
    sendResponse({ status: 'success' });
  }
  else if (message.type === 'GET_RESULTS') {
    // Return results for the requested tab
    const tabId = message.tabId;
    sendResponse({ 
      results: scanResults.has(tabId) 
        ? scanResults.get(tabId) 
        : { headers: {}, findings: [] } 
    });
  }
  else if (message.type === 'PING') {
    // Simple ping-pong for testing
    sendResponse({ status: 'PONG', time: new Date().toISOString() });
  }
  else {
    sendResponse({ status: 'error', message: 'Unknown message type' });
  }
  
  return true; // Keep the message channel open for async responses
});

// Listen for tab updates to trigger scans
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const isHttpProtocol = tab.url.startsWith('http://') || tab.url.startsWith('https://');
    if (isHttpProtocol) {
      // Send message to content script to start scanning
      chrome.tabs.sendMessage(tabId, { type: 'START_SCAN' })
        .catch(error => {
          console.error("Failed to send START_SCAN message:", error);
        });
    }
  }
});

// Update badge based on findings
function updateBadge(tabId, findings) {
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  // Count issues by severity
  findings.forEach(finding => {
    if (severityCounts[finding.severity] !== undefined) {
      severityCounts[finding.severity]++;
    }
  });
  
  // Determine badge text and color
  let badgeText = '';
  let badgeColor = '#888'; // Default gray
  
  if (severityCounts.critical > 0) {
    badgeText = severityCounts.critical.toString();
    badgeColor = '#FF0000'; // Red
  } else if (severityCounts.high > 0) {
    badgeText = severityCounts.high.toString();
    badgeColor = '#FF8800'; // Orange
  } else if (severityCounts.medium > 0) {
    badgeText = severityCounts.medium.toString();
    badgeColor = '#FFCC00'; // Yellow
  } else if (severityCounts.low > 0 || severityCounts.info > 0) {
    badgeText = (severityCounts.low + severityCounts.info).toString();
    badgeColor = '#00CC00'; // Green
  }
  
  // Update the badge
  chrome.action.setBadgeText({ text: badgeText, tabId });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
}

console.log("Pink Sock simple service worker initialized");
