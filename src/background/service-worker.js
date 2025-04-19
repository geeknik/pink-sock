/**
 * Pink Sock - Background Service Worker
 * Manages the extension's core functionality and coordinates between UI and content scripts
 */

// Initialize directly without using a class to avoid binding issues
console.log("Pink Sock background service worker initializing...");

// Store scan results
const scanResults = new Map();

// Create dummy data for testing
const dummyData = createDummyData();

// Load configuration
let config = getDefaultConfig();
loadConfiguration();

// Set up listeners
setupListeners();

/**
 * Creates test data for debugging
 */
function createDummyData() {
  const dummyFindings = [
    {
      severity: 'high',
      code: 'iframe_missing_sandbox',
      details: 'Iframe does not have sandbox attribute, allowing full privileges.',
      url: 'https://example.com',
      element: {
        tagName: 'iframe',
        path: 'body > div > iframe',
        attributes: {
          src: 'https://example.com/frame.html',
          width: '100%',
          height: '300'
        }
      },
      remediation: 'Add a sandbox attribute to restrict iframe capabilities.'
    },
    {
      severity: 'medium',
      code: 'csp_missing_frame_ancestors',
      details: 'CSP is missing frame-ancestors directive to prevent clickjacking.',
      url: 'https://example.com',
      remediation: 'Add frame-ancestors directive to your Content Security Policy.'
    }
  ];
  
  const dummyHeaders = {
    'https://example.com': {
      'content-security-policy': 'default-src \'self\'; script-src \'self\';',
      'x-frame-options': 'SAMEORIGIN'
    }
  };
  
  return { findings: dummyFindings, headers: dummyHeaders };
}

/**
 * Set up all event listeners
 */
function setupListeners() {
  // Handle messages from content scripts and popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message.type);
    
    switch (message.type) {
      case 'PING':
        console.log("PING received from:", sender.url || "Unknown");
        sendResponse({ status: 'PONG', time: new Date().toISOString() });
        break;
        
      case 'SCAN_RESULTS':
        processScanResults(message.data, sender.tab.id);
        sendResponse({ status: 'success' });
        break;
      
      case 'GET_RESULTS':
        handleGetResults(message.tabId, sendResponse);
        break;
      
      case 'CLEAR_RESULTS':
        if (scanResults.has(message.tabId)) {
          scanResults.delete(message.tabId);
        }
        sendResponse({ status: 'success' });
        break;
      
      case 'OPEN_DEVTOOLS_PANEL':
        console.log("Request to open devtools panel for tab", message.tabId);
        sendResponse({ status: 'success', message: 'Request received. Please open DevTools manually.' });
        break;
      
      default:
        console.log("Unknown message type:", message.type);
        sendResponse({ status: 'error', message: 'Unknown message type' });
    }
    
    return true; // Keep the channel open for the async response
  });

  // Listen for tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      handleTabComplete(tabId, tab);
    }
  });

  // Listen for HTTP response headers
  chrome.webRequest.onHeadersReceived.addListener(
    handleResponseHeaders,
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );
}

/**
 * Handle tab complete events
 */
function handleTabComplete(tabId, tab) {
  console.log("Tab", tabId, "loaded completely");
  
  // Clear previous results for this tab
  if (scanResults.has(tabId)) {
    scanResults.delete(tabId);
  }
  
  // Update the extension icon based on the URL protocol
  updateExtensionIcon(tabId, tab.url);
  
  // Only send scan message for HTTP/HTTPS pages
  const isHttpProtocol = tab.url.startsWith('http://') || tab.url.startsWith('https://');
  if (isHttpProtocol) {
    // Send message to content script to start scanning
    chrome.tabs.sendMessage(tabId, { type: 'START_SCAN' })
      .catch(error => {
        console.error("Failed to send START_SCAN message:", error);
      });
  }
}

/**
 * Handle GET_RESULTS message
 */
function handleGetResults(tabId, sendResponse) {
  // For DevTools panel, we need to respond even if no scan has been done
  if (scanResults.has(tabId)) {
    console.log("Returning real scan results for tab", tabId);
    sendResponse({ results: scanResults.get(tabId) });
  } else {
    console.log("No scan results available for tab", tabId, "returning empty or dummy data");
    // Return empty structured data or dummy data for testing
    sendResponse({ 
      results: config?.useDummyData 
        ? dummyData 
        : { headers: {}, findings: [] } 
    });
  }
}

/**
 * Handle response headers
 */
function handleResponseHeaders(details) {
  // Extract security headers for later analysis
  const securityHeaders = extractSecurityHeaders(details.responseHeaders);
  
  // Store headers for analysis
  const tabId = details.tabId;
  if (!scanResults.has(tabId)) {
    scanResults.set(tabId, { headers: {}, findings: [] });
  }
  
  const tabData = scanResults.get(tabId);
  tabData.headers[details.url] = securityHeaders;
  
  return { responseHeaders: details.responseHeaders };
}

/**
 * Extract security headers from response
 */
function extractSecurityHeaders(headers) {
  const securityHeaders = {};
  const relevantHeaders = [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'permissions-policy',
    'cross-origin-embedder-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy'
  ];
  
  headers.forEach(header => {
    const headerName = header.name.toLowerCase();
    if (relevantHeaders.includes(headerName)) {
      securityHeaders[headerName] = header.value;
    }
  });
  
  return securityHeaders;
}

/**
 * Process scan results from content script
 */
function processScanResults(findings, tabId) {
  if (!scanResults.has(tabId)) {
    scanResults.set(tabId, { headers: {}, findings: [] });
  }
  
  const tabData = scanResults.get(tabId);
  tabData.findings = findings;
  
  // Calculate severity counts
  const severityCounts = calculateSeverityCounts(findings);
  
  // Update badge and icon based on findings
  updateBadge(tabId, severityCounts);
}

/**
 * Calculate severity counts
 */
function calculateSeverityCounts(findings) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  findings.forEach(finding => {
    if (counts[finding.severity] !== undefined) {
      counts[finding.severity]++;
    }
  });
  
  return counts;
}

/**
 * Update badge based on findings
 */
function updateBadge(tabId, severityCounts) {
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
  
  try {
    chrome.action.setBadgeText({ text: badgeText, tabId });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
  } catch (error) {
    console.error("Error updating badge:", error);
  }
}

/**
 * Update extension icon
 */
function updateExtensionIcon(tabId, url) {
  try {
    // Only run the extension on HTTP/HTTPS pages
    const isHttpProtocol = url.startsWith('http://') || url.startsWith('https://');
    if (!isHttpProtocol) {
      chrome.action.setIcon({
        path: {
          16: "/assets/icons/icon16-disabled.png",
          48: "/assets/icons/icon48-disabled.png",
          128: "/assets/icons/icon128-disabled.png"
        },
        tabId
      });
    } else {
      chrome.action.setIcon({
        path: {
          16: "/assets/icons/icon16.png",
          48: "/assets/icons/icon48.png",
          128: "/assets/icons/icon128.png"
        },
        tabId
      });
    }
  } catch (error) {
    console.error("Error updating icon:", error);
  }
}

/**
 * Load configuration from storage
 */
function loadConfiguration() {
  chrome.storage.sync.get('config', (result) => {
    config = result.config || getDefaultConfig();
    console.log("Configuration loaded:", config);
  });
}

/**
 * Get default configuration
 */
function getDefaultConfig() {
  return {
    enabledChecks: {
      iframeSandbox: true,
      securityHeaders: true,
      cspAnalysis: true,
      crossOriginChecks: true
    },
    notificationSettings: {
      showCritical: true,
      showHigh: true,
      showMedium: false,
      showLow: false,
      showInfo: false
    },
    autoScanOnPageLoad: true,
    useDummyData: true // Enable dummy data for testing
  };
}

console.log("Pink Sock background service worker initialized successfully");
