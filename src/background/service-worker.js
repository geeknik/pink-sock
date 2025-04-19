/**
 * Pink Sock - Background Service Worker
 * Manages the extension's core functionality and coordinates between UI and content scripts
 */

class BackgroundWorker {
  constructor() {
    this.scanResults = new Map();
    this.setupListeners();
    this.loadConfiguration();
  }
  
  setupListeners() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    chrome.webRequest.onHeadersReceived.addListener(
      this.handleResponseHeaders.bind(this),
      { urls: ["<all_urls>"] },
      ["responseHeaders"]
    );
  }
  
  handleMessage(message, sender, sendResponse) {
    console.log("Message received:", message);
    
    switch (message.type) {
      case 'SCAN_RESULTS':
        this.processScanResults(message.data, sender.tab.id);
        sendResponse({ status: 'success' });
        break;
      
      case 'GET_RESULTS':
        sendResponse({ 
          results: this.scanResults.has(message.tabId) 
            ? this.scanResults.get(message.tabId) 
            : [] 
        });
        break;
      
      case 'CLEAR_RESULTS':
        if (this.scanResults.has(message.tabId)) {
          this.scanResults.delete(message.tabId);
        }
        sendResponse({ status: 'success' });
        break;
      
      default:
        sendResponse({ status: 'error', message: 'Unknown message type' });
    }
    
    return true; // Keep the channel open for the async response
  }
  
  handleTabUpdate(tabId, changeInfo, tab) {
    // When the tab is fully loaded, we'll start scanning
    if (changeInfo.status === 'complete') {
      // Clear previous results for this tab
      if (this.scanResults.has(tabId)) {
        this.scanResults.delete(tabId);
      }
      
      // Update the extension icon based on the URL protocol
      this.updateExtensionIcon(tabId, tab.url);
      
      // Send message to content script to start scanning
      chrome.tabs.sendMessage(tabId, { type: 'START_SCAN' })
        .catch(error => {
          console.error("Failed to send START_SCAN message:", error);
        });
    }
  }
  
  handleResponseHeaders(details) {
    // Extract security headers for later analysis
    const securityHeaders = this.extractSecurityHeaders(details.responseHeaders);
    
    // Store headers for analysis
    const tabId = details.tabId;
    if (!this.scanResults.has(tabId)) {
      this.scanResults.set(tabId, { headers: {}, findings: [] });
    }
    
    const tabData = this.scanResults.get(tabId);
    tabData.headers[details.url] = securityHeaders;
    
    return { responseHeaders: details.responseHeaders };
  }
  
  extractSecurityHeaders(headers) {
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
  
  processScanResults(findings, tabId) {
    if (!this.scanResults.has(tabId)) {
      this.scanResults.set(tabId, { headers: {}, findings: [] });
    }
    
    const tabData = this.scanResults.get(tabId);
    tabData.findings = findings;
    
    // Calculate severity counts
    const severityCounts = this.calculateSeverityCounts(findings);
    
    // Update badge and icon based on findings
    this.updateBadge(tabId, severityCounts);
  }
  
  calculateSeverityCounts(findings) {
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
    
    return counts;
  }
  
  updateBadge(tabId, severityCounts) {
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
    
    chrome.action.setBadgeText({ text: badgeText, tabId });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
  }
  
  updateExtensionIcon(tabId, url) {
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
  }
  
  loadConfiguration() {
    chrome.storage.sync.get('config', (result) => {
      this.config = result.config || this.getDefaultConfig();
    });
  }
  
  getDefaultConfig() {
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
      autoScanOnPageLoad: true
    };
  }
}

// Initialize the background worker
const worker = new BackgroundWorker();

console.log("Pink Sock background service worker initialized");
