/**
 * Pink Sock - DevTools Panel Script
 * Handles the detailed analysis view in the DevTools panel
 */

document.addEventListener('DOMContentLoaded', init);

// Store the current findings and selected finding
let currentFindings = [];
let selectedFinding = null;

function init() {
  // Set up event listeners
  document.getElementById('refresh-btn').addEventListener('click', refreshData);
  document.getElementById('export-btn').addEventListener('click', exportReport);
  document.getElementById('severity-filter').addEventListener('change', applyFilters);
  document.getElementById('type-filter').addEventListener('change', applyFilters);
  
  // Load data
  loadData();
}

function loadData() {
  // Get the current tab ID using DevTools APIs
  chrome.devtools.inspectedWindow.eval(
    "window.location.href",
    (result, isException) => {
      if (isException) {
        showError("Could not access the page URL.");
        return;
      }
      
      // Get findings from the background service
      chrome.runtime.sendMessage({
        type: 'GET_RESULTS',
        tabId: chrome.devtools.inspectedWindow.tabId
      })
      .then(response => {
        const findings = response.results && response.results.findings 
          ? response.results.findings 
          : [];
        
        const headers = response.results && response.results.headers
          ? response.results.headers
          : {};
        
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
        showError("Could not load results. Please try again.");
      });
    }
  );
}

function updateSummary(findings) {
  // Count findings by severity
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: findings.length
  };
  
  findings.forEach(finding => {
    counts[finding.severity]++;
  });
  
  // Update the count elements
  document.getElementById('total-count').textContent = counts.total;
  document.getElementById('critical-count').textContent = counts.critical;
  document.getElementById('high-count').textContent = counts.high;
  document.getElementById('medium-count').textContent = counts.medium;
  document.getElementById('low-count').textContent = counts.low;
  document.getElementById('info-count').textContent = counts.info;
}

function populateHeadersAnalysis(headers) {
  const headersContainer = document.getElementById('headers-summary');
  headersContainer.innerHTML = '';
  
  // Get headers for the main page
  const pageUrl = Object.keys(headers)[0] || '';
  const pageHeaders = headers[pageUrl] || {};
  
  if (Object.keys(pageHeaders).length === 0) {
    headersContainer.innerHTML = '<div class="no-data">No security headers data available</div>';
    return;
  }
  
  // Create a table for headers
  const headerTable = document.createElement('table');
  headerTable.className = 'headers-table';
  
  // Add header row
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Header</th>
    <th>Status</th>
    <th>Value</th>
  `;
  headerTable.appendChild(headerRow);
  
  // Define expected security headers
  const expectedHeaders = [
    {
      name: 'content-security-policy',
      importance: 'high',
      description: 'Controls resources the browser is allowed to load'
    },
    {
      name: 'x-frame-options',
      importance: 'high',
      description: 'Prevents clickjacking attacks'
    },
    {
      name: 'x-content-type-options',
      importance: 'medium',
      description: 'Prevents MIME sniffing attacks'
    },
    {
      name: 'permissions-policy',
      importance: 'medium',
      description: 'Controls browser features in this document and child frames'
    },
    {
      name: 'cross-origin-embedder-policy',
      importance: 'medium',
      description: 'Controls embedding cross-origin resources'
    },
    {
      name: 'cross-origin-opener-policy',
      importance: 'medium',
      description: 'Controls opener relationship with cross-origin popups'
    },
    {
      name: 'cross-origin-resource-policy',
      importance: 'medium',
      description: 'Controls how resources can be embedded in other origins'
    }
  ];
  
  // Add rows for each expected header
  expectedHeaders.forEach(header => {
    const headerValue = pageHeaders[header.name];
    const hasHeader = !!headerValue;
    
    const row = document.createElement('tr');
    
    // Determine status based on presence
    let statusClass = hasHeader ? 'status-good' : 'status-missing';
    let statusText = hasHeader ? 'Present' : 'Missing';
    
    row.innerHTML = `
      <td>
        <div class="header-name">${header.name}</div>
        <div class="header-description">${header.description}</div>
      </td>
      <td>
        <span class="header-status ${statusClass}">${statusText}</span>
      </td>
      <td>
        <div class="header-value">${hasHeader ? truncateText(headerValue, 40) : 'N/A'}</div>
      </td>
    `;
    
    headerTable.appendChild(row);
  });
  
  headersContainer.appendChild(headerTable);
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
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
  findings.forEach((finding, index) => {
    const findingElement = createFindingElement(finding, index);
    findingsList.appendChild(findingElement);
  });
}

function createFindingElement(finding, index) {
  const element = document.createElement('div');
  element.className = `finding-item ${finding.severity}`;
  element.dataset.index = index;
  element.dataset.severity = finding.severity;
  element.dataset.type = getCategoryFromCode(finding.code);
  
  const title = formatTitle(finding.code);
  
  element.innerHTML = `
    <div class="finding-header">
      <div class="finding-title">${title}</div>
      <span class="finding-severity ${finding.severity}">${finding.severity}</span>
    </div>
    <div class="finding-description">${finding.details}</div>
    <div class="finding-meta">
      Element: ${finding.element ? finding.element.tagName : 'N/A'}
      ${finding.element && finding.element.id ? ` #${finding.element.id}` : ''}
    </div>
  `;
  
  // Make the finding selectable
  element.addEventListener('click', () => {
    // Deselect any previously selected finding
    const selected = document.querySelector('.finding-item.selected');
    if (selected) {
      selected.classList.remove('selected');
    }
    
    // Select this finding
    element.classList.add('selected');
    
    // Show details for this finding
    selectedFinding = finding;
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

function getCategoryFromCode(code) {
  if (code.startsWith('iframe_')) {
    return 'iframe';
  } else if (code.startsWith('csp_')) {
    return 'csp';
  } else if (code.startsWith('header_')) {
    return 'header';
  } else if (code.startsWith('link_')) {
    return 'link';
  }
  return 'other';
}

function showFindingDetails(finding) {
  const detailsPanel = document.getElementById('details-panel');
  
  // Clear previous content
  detailsPanel.innerHTML = '<h2>Issue Details</h2>';
  
  // Create details content
  const detailsContent = document.createElement('div');
  detailsContent.className = 'details-content';
  
  // Basic details section
  const basicSection = document.createElement('div');
  basicSection.className = 'detail-section';
  basicSection.innerHTML = `
    <h3>Basic Information</h3>
    
    <div class="detail-item">
      <div class="detail-label">Issue Type</div>
      <div class="detail-value">${formatTitle(finding.code)}</div>
    </div>
    
    <div class="detail-item">
      <div class="detail-label">Severity</div>
      <div class="detail-value">
        <span class="finding-severity ${finding.severity}">${finding.severity}</span>
      </div>
    </div>
    
    <div class="detail-item">
      <div class="detail-label">Description</div>
      <div class="detail-value">${finding.details}</div>
    </div>
    
    <div class="detail-item">
      <div class="detail-label">URL</div>
      <div class="detail-value">${finding.url}</div>
    </div>
  `;
  
  // Element details section (if applicable)
  if (finding.element) {
    const elementSection = document.createElement('div');
    elementSection.className = 'detail-section';
    
    let attributesHtml = '';
    Object.entries(finding.element.attributes || {}).forEach(([name, value]) => {
      attributesHtml += `<div>${name}="${value}"</div>`;
    });
    
    elementSection.innerHTML = `
      <h3>Element Information</h3>
      
      <div class="detail-item">
        <div class="detail-label">Tag</div>
        <div class="detail-value">${finding.element.tagName}</div>
      </div>
      
      ${finding.element.id ? `
      <div class="detail-item">
        <div class="detail-label">ID</div>
        <div class="detail-value">${finding.element.id}</div>
      </div>
      ` : ''}
      
      <div class="detail-item">
        <div class="detail-label">DOM Path</div>
        <div class="detail-value">
          <pre>${finding.element.path}</pre>
        </div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Attributes</div>
        <div class="element-attributes">${attributesHtml}</div>
      </div>
    `;
    
    detailsContent.appendChild(elementSection);
  }
  
  // Remediation section
  if (finding.remediation) {
    const remediationSection = document.createElement('div');
    remediationSection.className = 'remediation';
    remediationSection.innerHTML = `
      <h4>How to Fix This Issue</h4>
      <p>${finding.remediation}</p>
    `;
    
    detailsContent.appendChild(remediationSection);
  }
  
  detailsPanel.appendChild(basicSection);
  detailsPanel.appendChild(detailsContent);
  
  // Add highlight button if element exists
  if (finding.element) {
    const highlightBtn = document.createElement('button');
    highlightBtn.textContent = 'Highlight Element';
    highlightBtn.className = 'highlight-btn';
    highlightBtn.addEventListener('click', () => {
      highlightElementInPage(finding.element.path);
    });
    
    detailsPanel.appendChild(highlightBtn);
  }
}

function highlightElementInPage(path) {
  // Use DevTools API to highlight the element
  const highlightScript = `
    (function() {
      try {
        const element = document.querySelector(\`${path}\`);
        if (!element) return false;
        
        // Create a highlight effect
        const originalOutline = element.style.outline;
        const originalZIndex = element.style.zIndex;
        const originalPosition = element.style.position;
        
        element.style.outline = '2px solid #FF69B4';
        element.style.zIndex = '9999';
        element.style.position = element.style.position === 'static' ? 'relative' : element.style.position;
        
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight after a few seconds
        setTimeout(() => {
          element.style.outline = originalOutline;
          element.style.zIndex = originalZIndex;
          element.style.position = originalPosition;
        }, 3000);
        
        return true;
      } catch (e) {
        console.error('Error highlighting element:', e);
        return false;
      }
    })();
  `;
  
  chrome.devtools.inspectedWindow.eval(highlightScript, (result, isException) => {
    if (isException || result === false) {
      console.error('Could not highlight element');
    }
  });
}

function applyFilters() {
  const severityFilter = document.getElementById('severity-filter').value;
  const typeFilter = document.getElementById('type-filter').value;
  
  const findings = document.querySelectorAll('.finding-item');
  
  findings.forEach(item => {
    const matchesSeverity = severityFilter === 'all' || item.dataset.severity === severityFilter;
    const matchesType = typeFilter === 'all' || item.dataset.type === typeFilter;
    
    if (matchesSeverity && matchesType) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function refreshData() {
  // Reset selected finding
  selectedFinding = null;
  
  // Clear details panel
  const detailsPanel = document.getElementById('details-panel');
  detailsPanel.innerHTML = '<h2>Issue Details</h2><div class="no-selection">Select an issue to view details</div>';
  
  // Show loading indicator
  const findingsList = document.getElementById('findings-list');
  findingsList.innerHTML = '<div class="loading">Loading findings...</div>';
  
  // Send message to content script to start a new scan
  chrome.tabs.sendMessage(
    chrome.devtools.inspectedWindow.tabId,
    { type: 'START_SCAN' }
  )
  .then(() => {
    // Wait a moment and then reload the data
    setTimeout(loadData, 1000);
  })
  .catch(error => {
    console.error("Failed to start scan:", error);
    showError("Could not start scan. Please refresh the page and try again.");
  });
}

function exportReport() {
  // Create a report object with all findings and metadata
  const report = {
    url: currentFindings.length > 0 ? currentFindings[0].url : window.location.href,
    timestamp: new Date().toISOString(),
    findings: currentFindings,
    summary: {
      total: currentFindings.length,
      critical: currentFindings.filter(f => f.severity === 'critical').length,
      high: currentFindings.filter(f => f.severity === 'high').length,
      medium: currentFindings.filter(f => f.severity === 'medium').length,
      low: currentFindings.filter(f => f.severity === 'low').length,
      info: currentFindings.filter(f => f.severity === 'info').length
    }
  };
  
  // Convert to JSON and create a blob
  const reportJson = JSON.stringify(report, null, 2);
  const blob = new Blob([reportJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create a date string for the filename
  const date = new Date().toISOString().split('T')[0];
  const filename = `pink-sock-security-report-${date}.json`;
  
  // Create a temporary link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function drawSeverityChart(findings) {
  // This is a placeholder for chart drawing
  // In a real implementation, we'd use a library like Chart.js
  
  const chartContainer = document.getElementById('severity-chart');
  chartContainer.innerHTML = '';
  
  // Count findings by severity
  const counts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length
  };
  
  // Create a simple bar chart
  const chart = document.createElement('div');
  chart.className = 'simple-chart';
  
  // Define colors and labels
  const severities = [
    { key: 'critical', color: 'var(--color-critical)', label: 'Critical' },
    { key: 'high', color: 'var(--color-high)', label: 'High' },
    { key: 'medium', color: 'var(--color-medium)', label: 'Medium' },
    { key: 'low', color: 'var(--color-low)', label: 'Low' },
    { key: 'info', color: 'var(--color-info)', label: 'Info' }
  ];
  
  // Get the maximum count for scaling
  const maxCount = Math.max(...Object.values(counts));
  
  // Create chart content
  chart.innerHTML = `
    <style>
      .simple-chart {
        display: flex;
        height: 150px;
        padding-bottom: 20px;
        align-items: flex-end;
        position: relative;
      }
      
      .chart-bar {
        flex: 1;
        margin: 0 5px;
        position: relative;
        text-align: center;
      }
      
      .bar {
        width: 100%;
        transition: height 0.3s;
        border-radius: 3px 3px 0 0;
      }
      
      .bar-label {
        position: absolute;
        bottom: -20px;
        left: 0;
        right: 0;
        font-size: 10px;
        text-align: center;
      }
      
      .bar-value {
        position: absolute;
        top: -18px;
        left: 0;
        right: 0;
        font-size: 11px;
        text-align: center;
      }
    </style>
    
    ${severities.map(sev => {
      const count = counts[sev.key];
      const height = maxCount > 0 ? (count / maxCount * 100) : 0;
      
      return `
        <div class="chart-bar">
          <div class="bar-value">${count}</div>
          <div class="bar" style="height: ${height}%; background-color: ${sev.color};"></div>
          <div class="bar-label">${sev.label}</div>
        </div>
      `;
    }).join('')}
  `;
  
  chartContainer.appendChild(chart);
}

function showError(message) {
  // Show error message in the UI
  const findingsList = document.getElementById('findings-list');
  findingsList.innerHTML = `<div class="error-message">${message}</div>`;
}
