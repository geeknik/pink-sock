/**
 * Pink Sock - Popup Script
 * Handles the popup UI and interaction with the background service
 */

document.addEventListener('DOMContentLoaded', init);

function init() {
  // Set up event listeners
  document.getElementById('scan-btn').addEventListener('click', startScan);
  document.getElementById('details-btn').addEventListener('click', openDetailedReport);
  document.getElementById('bug-report-btn').addEventListener('click', generateBugReport);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('about-link').addEventListener('click', openAboutPage);
  document.getElementById('copy-report-btn').addEventListener('click', copyBugReport);
  
  // Set up modal close buttons
  document.querySelector('.close-modal').addEventListener('click', closeDetailModal);
  document.querySelector('.close-bug-modal').addEventListener('click', closeBugReportModal);
  
  // Close modals when clicking outside the modal content
  const detailModal = document.getElementById('detail-modal');
  const bugReportModal = document.getElementById('bug-report-modal');
  
  window.addEventListener('click', (event) => {
    if (event.target === detailModal) {
      closeDetailModal();
    } else if (event.target === bugReportModal) {
      closeBugReportModal();
    }
  });
  
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
  // Display finding details in the modal
  const detailContent = document.getElementById('detail-content');
  
  // Create detailed finding view
  const detailHTML = `
    <div class="finding-detail">
      <div class="finding-header">
        <div class="finding-title">${formatTitle(finding.code)}</div>
        <span class="finding-severity ${finding.severity}">${finding.severity.toUpperCase()}</span>
      </div>
      <div class="finding-desc">${finding.description || finding.details}</div>
      
      ${finding.elementHtml ? `
        <div class="element-section">
          <div class="section-title">Affected Element:</div>
          <div class="code-sample">${escapeHtml(finding.elementHtml)}</div>
        </div>
      ` : ''}
      
      ${finding.remediation ? `
        <div class="remediation">
          <div class="remediation-title">Recommended Fix:</div>
          <div class="remediation-content">${finding.remediation}</div>
        </div>
      ` : ''}
      
      ${finding.references ? `
        <div class="references">
          <div class="section-title">References:</div>
          <ul>
            ${finding.references.map(ref => `<li><a href="${ref.url}" target="_blank">${ref.title}</a></li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  
  detailContent.innerHTML = detailHTML;
  openDetailModal();
}

function openDetailedReport() {
  // Get the current tab ID
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;
    const tabUrl = tabs[0].url;
    
    // Request detailed results from the background service
    chrome.runtime.sendMessage({ type: 'GET_RESULTS', tabId })
      .then(response => {
        const findings = response.results && response.results.findings 
          ? response.results.findings 
          : [];
        
        const headers = response.results && response.results.headers
          ? response.results.headers
          : {};
        
        displayDetailedReport(findings, headers, tabUrl);
      })
      .catch(error => {
        console.error("Failed to load detailed results:", error);
        showError("Could not load detailed results. Please try again.");
      });
  });
}

function displayDetailedReport(findings, headers, url) {
  const detailContent = document.getElementById('detail-content');
  
  // Clear existing content
  detailContent.innerHTML = '';
  
  if (findings.length === 0) {
    detailContent.innerHTML = '<div class="no-findings">No security issues found</div>';
    openDetailModal();
    return;
  }

  // Sort findings by severity (critical -> info)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  // Calculate security score
  const securityScore = calculateSecurityScore(findings);
  
  // Get domain from URL
  const domain = new URL(url).hostname;
  
  // Generate summary of findings by severity
  const severityCounts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length
  };
  
  // Build report header
  const reportHeader = `
    <div class="report-header">
      <div class="report-title">Security Analysis for ${domain}</div>
      <div class="report-url">${url}</div>
      <div class="report-date">Generated on ${new Date().toLocaleString()}</div>
      
      <div class="security-score-container">
        <div class="security-score ${getScoreClass(securityScore)}">
          <div class="score-value">${securityScore}</div>
          <div class="score-label">Security<br>Score</div>
        </div>
        <div class="score-explanation">
          <div class="score-range">
            <span class="score-range-item">0</span>
            <span class="score-range-item">25</span>
            <span class="score-range-item">50</span>
            <span class="score-range-item">75</span>
            <span class="score-range-item">100</span>
          </div>
          <div class="score-meter">
            <div class="score-meter-fill" style="width: ${securityScore}%"></div>
          </div>
          <div class="score-description">${getScoreDescription(securityScore)}</div>
        </div>
      </div>
      
      <div class="findings-summary">
        <div class="summary-item">
          <div class="summary-count critical">${severityCounts.critical}</div>
          <div class="summary-label">Critical</div>
        </div>
        <div class="summary-item">
          <div class="summary-count high">${severityCounts.high}</div>
          <div class="summary-label">High</div>
        </div>
        <div class="summary-item">
          <div class="summary-count medium">${severityCounts.medium}</div>
          <div class="summary-label">Medium</div>
        </div>
        <div class="summary-item">
          <div class="summary-count low">${severityCounts.low}</div>
          <div class="summary-label">Low</div>
        </div>
        <div class="summary-item">
          <div class="summary-count info">${severityCounts.info}</div>
          <div class="summary-label">Info</div>
        </div>
      </div>
    </div>
  `;
  
  // Build headers analysis section
  const headersAnalysis = generateHeadersAnalysis(headers, url);
  
  // Build detailed findings section
  let findingsHTML = '';
  findings.forEach((finding, index) => {
    const vulnDescription = getVulnerabilityDescription(finding.code);
    const vulnImpact = getVulnerabilityImpact(finding.code, finding.severity);
    const vulnExamples = getVulnerabilityExamples(finding.code);
    const remediationSteps = getDetailedRemediation(finding.code);
    
    findingsHTML += `
      <div class="finding-detail">
        <div class="finding-header">
          <div class="finding-title">${formatTitle(finding.code)}</div>
          <span class="finding-severity ${finding.severity}">${finding.severity.toUpperCase()}</span>
        </div>
        
        <div class="finding-metadata">
          <div class="finding-id">ID: ${finding.code.toUpperCase()}</div>
          <div class="finding-location">Location: ${finding.url || url}</div>
        </div>
        
        <div class="finding-tabs">
          <div class="tab-headers">
            <div class="tab-header active" data-tab="overview-${index}">Overview</div>
            <div class="tab-header" data-tab="technical-${index}">Technical Details</div>
            <div class="tab-header" data-tab="impact-${index}">Impact</div>
            <div class="tab-header" data-tab="remediation-${index}">Remediation</div>
          </div>
          
          <div class="tab-content">
            <div class="tab-panel active" id="overview-${index}">
              <div class="finding-desc">${finding.description || finding.details}</div>
              <div class="vulnerability-desc">${vulnDescription}</div>
            </div>
            
            <div class="tab-panel" id="technical-${index}">
              ${finding.elementHtml ? `
                <div class="element-section">
                  <div class="section-title">Affected Element:</div>
                  <div class="code-sample">${escapeHtml(finding.elementHtml)}</div>
                </div>
              ` : ''}
              
              ${finding.element ? `
                <div class="element-section">
                  <div class="section-title">Element Details:</div>
                  <div class="element-details">
                    <div><strong>Tag:</strong> ${finding.element.tagName}</div>
                    <div><strong>Path:</strong> ${finding.element.path}</div>
                    ${Object.entries(finding.element.attributes || {}).map(([key, value]) => 
                      `<div><strong>Attribute ${key}:</strong> ${value}</div>`
                    ).join('')}
                  </div>
                </div>
              ` : ''}
              
              <div class="examples-section">
                <div class="section-title">Examples:</div>
                <div class="examples-content">${vulnExamples}</div>
              </div>
            </div>
            
            <div class="tab-panel" id="impact-${index}">
              <div class="impact-section">
                <div class="impact-content">${vulnImpact}</div>
              </div>
            </div>
            
            <div class="tab-panel" id="remediation-${index}">
              <div class="remediation">
                <div class="remediation-content">
                  <p>${finding.remediation || 'No specific remediation available for this issue.'}</p>
                  ${remediationSteps}
                </div>
              </div>
              
              ${finding.references ? `
                <div class="references">
                  <div class="section-title">References:</div>
                  <ul>
                    ${finding.references.map(ref => `<li><a href="${ref.url}" target="_blank">${ref.title}</a></li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  // Build overall recommendations section
  const recommendations = generateRecommendations(findings);
  
  // Assemble complete report
  detailContent.innerHTML = reportHeader + headersAnalysis + '<div class="findings-section"><h3>Detailed Findings</h3>' + findingsHTML + '</div>' + recommendations;
  
  // Add tab functionality
  setupTabs();
  
  openDetailModal();
}

function setupTabs() {
  const tabHeaders = document.querySelectorAll('.tab-header');
  
  tabHeaders.forEach(header => {
    header.addEventListener('click', () => {
      // Get parent tab container
      const tabContainer = header.closest('.finding-tabs');
      
      // Remove active class from all headers in this container
      tabContainer.querySelectorAll('.tab-header').forEach(h => {
        h.classList.remove('active');
      });
      
      // Add active class to clicked header
      header.classList.add('active');
      
      // Get the tab ID
      const tabId = header.dataset.tab;
      
      // Hide all tab panels in this container
      tabContainer.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      
      // Show the selected tab panel
      document.getElementById(tabId).classList.add('active');
    });
  });
}

function calculateSecurityScore(findings) {
  // Base score starts at 100
  let score = 100;
  
  // Deduct points based on severity
  findings.forEach(finding => {
    switch(finding.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
      case 'info':
        score -= 1;
        break;
    }
  });
  
  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

function getScoreClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 30) return 'poor';
  return 'critical';
}

function getScoreDescription(score) {
  if (score >= 90) return 'Excellent - Your iframe implementation is highly secure';
  if (score >= 70) return 'Good - Minor security improvements recommended';
  if (score >= 50) return 'Fair - Several security issues need attention';
  if (score >= 30) return 'Poor - Serious security vulnerabilities detected';
  return 'Critical - Immediate action required to address vulnerabilities';
}

function generateHeadersAnalysis(headers, url) {
  // If no headers, return empty section
  if (!headers || Object.keys(headers).length === 0) {
    return '<div class="headers-analysis"><h3>Security Headers Analysis</h3><p>No security headers data available.</p></div>';
  }
  
  // Get headers for this URL if available, otherwise use first available headers
  const urlHeaders = headers[url] || headers[Object.keys(headers)[0]];
  
  if (!urlHeaders || Object.keys(urlHeaders).length === 0) {
    return '<div class="headers-analysis"><h3>Security Headers Analysis</h3><p>No security headers found for this page.</p></div>';
  }
  
  // Analyze headers
  const headerChecks = [
    {
      name: 'Content-Security-Policy',
      key: 'content-security-policy',
      present: !!urlHeaders['content-security-policy'],
      value: urlHeaders['content-security-policy'] || 'Not set',
      recommendation: 'Implement a strong Content-Security-Policy header to prevent XSS and code injection attacks.'
    },
    {
      name: 'X-Frame-Options',
      key: 'x-frame-options',
      present: !!urlHeaders['x-frame-options'],
      value: urlHeaders['x-frame-options'] || 'Not set',
      recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN to prevent clickjacking attacks.'
    },
    {
      name: 'X-Content-Type-Options',
      key: 'x-content-type-options',
      present: !!urlHeaders['x-content-type-options'],
      value: urlHeaders['x-content-type-options'] || 'Not set',
      recommendation: 'Set X-Content-Type-Options to nosniff to prevent MIME type sniffing.'
    },
    {
      name: 'Permissions-Policy',
      key: 'permissions-policy',
      present: !!urlHeaders['permissions-policy'],
      value: urlHeaders['permissions-policy'] || 'Not set',
      recommendation: 'Configure a Permissions-Policy to control which features and APIs can be used.'
    },
    {
      name: 'Cross-Origin-Embedder-Policy',
      key: 'cross-origin-embedder-policy',
      present: !!urlHeaders['cross-origin-embedder-policy'],
      value: urlHeaders['cross-origin-embedder-policy'] || 'Not set',
      recommendation: 'Implement COEP to prevent loading resources that don\'t grant permission.'
    },
    {
      name: 'Cross-Origin-Opener-Policy',
      key: 'cross-origin-opener-policy',
      present: !!urlHeaders['cross-origin-opener-policy'],
      value: urlHeaders['cross-origin-opener-policy'] || 'Not set',
      recommendation: 'Set COOP to same-origin to isolate your origin from others.'
    },
    {
      name: 'Cross-Origin-Resource-Policy',
      key: 'cross-origin-resource-policy',
      present: !!urlHeaders['cross-origin-resource-policy'],
      value: urlHeaders['cross-origin-resource-policy'] || 'Not set',
      recommendation: 'Implement CORP to prevent resources from being loaded by external sites.'
    }
  ];
  
  let headersHTML = `
    <div class="headers-analysis">
      <h3>Security Headers Analysis</h3>
      <table class="headers-table">
        <thead>
          <tr>
            <th>Header</th>
            <th>Status</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  headerChecks.forEach(header => {
    headersHTML += `
      <tr>
        <td>${header.name}</td>
        <td class="${header.present ? 'header-present' : 'header-missing'}">${header.present ? '✓ Present' : '✗ Missing'}</td>
        <td class="header-value">${header.value}</td>
      </tr>
    `;
  });
  
  headersHTML += `
        </tbody>
      </table>
      
      <div class="headers-recommendations">
        <h4>Recommended Header Configurations:</h4>
        <ul>
  `;
  
  headerChecks.filter(header => !header.present).forEach(header => {
    headersHTML += `<li><strong>${header.name}:</strong> ${header.recommendation}</li>`;
  });
  
  headersHTML += `
        </ul>
      </div>
    </div>
  `;
  
  return headersHTML;
}

function generateRecommendations(findings) {
  let recommendationsHTML = `
    <div class="recommendations-section">
      <h3>Security Recommendations</h3>
      <div class="priority-recommendations">
        <h4>Priority Actions:</h4>
        <ol>
  `;
  
  // Get critical and high severity issues for priority actions
  const priorityIssues = findings.filter(f => f.severity === 'critical' || f.severity === 'high');
  
  if (priorityIssues.length > 0) {
    priorityIssues.slice(0, 3).forEach(finding => {
      recommendationsHTML += `
        <li>
          <strong>${formatTitle(finding.code)}:</strong> 
          ${finding.remediation || 'Address this security issue immediately.'}
        </li>
      `;
    });
  } else {
    recommendationsHTML += `<li>No critical or high severity issues found.</li>`;
  }
  
  recommendationsHTML += `
        </ol>
      </div>
      
      <div class="best-practices">
        <h4>Security Best Practices for iFrames:</h4>
        <ul>
          <li>Always use the <code>sandbox</code> attribute with appropriate restrictions</li>
          <li>Implement a strong Content Security Policy (CSP) with frame-ancestors directive</li>
          <li>Use HTTPS for all embedded content</li>
          <li>Specify <code>allow</code> attribute to control feature permissions</li>
          <li>Consider using rel="noreferrer" for links that open in a new tab</li>
          <li>Regularly audit and update security headers</li>
        </ul>
      </div>
    </div>
  `;
  
  return recommendationsHTML;
}

function getVulnerabilityDescription(code) {
  // Provide detailed descriptions based on vulnerability code
  const descriptions = {
    'iframe_missing_sandbox': 'The sandbox attribute restricts the capabilities of an iframe, including preventing script execution, form submission, plugins, and navigation. Without this attribute, iframes have full privileges which could allow malicious code to execute in the context of your site.',
    
    'csp_missing_frame_ancestors': 'The frame-ancestors directive in CSP specifies which sites are allowed to embed your content in iframes, frames, etc. Without this directive, your site may be vulnerable to clickjacking attacks where attackers overlay invisible iframes over legitimate UI elements.',
    
    'iframe_sandbox_too_permissive': 'While the sandbox attribute is present, it includes too many permissions that undermine its security benefits. Overly permissive sandbox attributes can still allow dangerous capabilities.',
    
    'iframe_insecure_src': 'The iframe is loading content over an insecure HTTP connection. This can lead to man-in-the-middle attacks where content could be modified in transit or sensitive information leaked.',
    
    'missing_x_frame_options': 'The X-Frame-Options header indicates whether a browser should be allowed to render a page in a frame or iframe. Without this header, your site could be vulnerable to clickjacking attacks.',
    
    'iframe_allow_all_permissions': 'The allow attribute grants broad permissions to the iframe content, potentially allowing access to sensitive features like camera, microphone, geolocation, or payment APIs without user knowledge.'
  };
  
  return descriptions[code] || 'This vulnerability relates to iframe security issues that could potentially compromise your website\'s security posture.';
}

function getVulnerabilityImpact(code, severity) {
  // Provide detailed impact descriptions based on vulnerability code and severity
  const impactBySeverity = {
    'critical': 'This vulnerability presents an immediate and severe security risk that could lead to complete compromise of your website or user data.',
    'high': 'This vulnerability represents a significant security risk that could lead to data exposure, script execution, or sensitive information leakage.',
    'medium': 'This security issue could potentially be exploited as part of a larger attack chain or under specific circumstances.',
    'low': 'This issue represents a minor security concern that follows best practice recommendations.',
    'info': 'This is an informational finding that highlights areas for improvement in your security posture.'
  };
  
  const specificImpacts = {
    'iframe_missing_sandbox': 'Attackers could execute malicious JavaScript, steal cookies or authentication tokens, conduct phishing attacks, or pivot to attack your users through the embedded iframe content.',
    
    'csp_missing_frame_ancestors': 'Attackers could embed your site in a malicious context, potentially tricking users into clicking on things they didn\'t intend to (clickjacking), or harvesting sensitive input like passwords through invisible overlays.',
    
    'iframe_sandbox_too_permissive': 'Depending on the permissions granted, attackers might execute scripts, submit forms with user data, or navigate the parent page to a malicious URL.',
    
    'iframe_insecure_src': 'Content loaded over HTTP can be intercepted and modified by attackers on the network path. This could lead to injection of malicious scripts or content that appears to come from a trusted source.',
    
    'missing_x_frame_options': 'Without X-Frame-Options, attackers can embed your page in hidden iframes on malicious sites, potentially leading to clickjacking attacks where users interact with your site unknowingly.',
    
    'iframe_allow_all_permissions': 'Embedded content could access sensitive device features without appropriate user consent, potentially leading to privacy violations or unexpected behavior.'
  };
  
  return `
    <p><strong>Severity Level:</strong> ${capitalizeFirst(severity)}</p>
    <p>${impactBySeverity[severity] || ''}</p>
    <p><strong>Specific Impact:</strong> ${specificImpacts[code] || 'This vulnerability could compromise the security of your website and potentially impact your users.'}</p>
  `;
}

function getVulnerabilityExamples(code) {
  // Provide code examples based on vulnerability type
  const examples = {
    'iframe_missing_sandbox': `
<p>Vulnerable code:</p>
<pre><code>&lt;iframe src="https://external-site.com/content.html"&gt;&lt;/iframe&gt;</code></pre>

<p>Secure code:</p>
<pre><code>&lt;iframe src="https://external-site.com/content.html" 
    sandbox="allow-scripts allow-same-origin"&gt;&lt;/iframe&gt;</code></pre>`,
    
    'csp_missing_frame_ancestors': `
<p>Vulnerable header:</p>
<pre><code>Content-Security-Policy: default-src 'self'; script-src 'self'</code></pre>

<p>Secure header:</p>
<pre><code>Content-Security-Policy: default-src 'self'; script-src 'self'; frame-ancestors 'self'</code></pre>`,
    
    'iframe_sandbox_too_permissive': `
<p>Overly permissive:</p>
<pre><code>&lt;iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-top-navigation"&gt;&lt;/iframe&gt;</code></pre>

<p>More secure:</p>
<pre><code>&lt;iframe sandbox="allow-scripts"&gt;&lt;/iframe&gt;</code></pre>`,
    
    'iframe_insecure_src': `
<p>Insecure:</p>
<pre><code>&lt;iframe src="http://example.com/content.html"&gt;&lt;/iframe&gt;</code></pre>

<p>Secure:</p>
<pre><code>&lt;iframe src="https://example.com/content.html"&gt;&lt;/iframe&gt;</code></pre>`,
    
    'missing_x_frame_options': `
<p>Required HTTP header:</p>
<pre><code>X-Frame-Options: DENY</code></pre>

<p>Or for allowing only your own site:</p>
<pre><code>X-Frame-Options: SAMEORIGIN</code></pre>`
  };
  
  return examples[code] || '<p>No specific examples available for this vulnerability type.</p>';
}

function getDetailedRemediation(code) {
  // Provide detailed remediation steps
  const remediationSteps = {
    'iframe_missing_sandbox': `
      <ol>
        <li>Add the <code>sandbox</code> attribute to all iframe elements</li>
        <li>Only include necessary permissions in the sandbox value</li>
        <li>Consider which of these permissions are required:
          <ul>
            <li><code>allow-forms</code>: Allows form submission</li>
            <li><code>allow-scripts</code>: Allows JavaScript execution</li>
            <li><code>allow-same-origin</code>: Allows the iframe to maintain its origin</li>
            <li><code>allow-top-navigation</code>: Allows navigation of the top-level browsing context</li>
          </ul>
        </li>
        <li>Test functionality after implementing the sandbox to ensure it doesn't break intended behavior</li>
      </ol>
    `,
    
    'csp_missing_frame_ancestors': `
      <ol>
        <li>Add the <code>frame-ancestors</code> directive to your Content-Security-Policy header</li>
        <li>To completely prevent framing, use: <code>frame-ancestors 'none'</code></li>
        <li>To allow only your own site to frame the content, use: <code>frame-ancestors 'self'</code></li>
        <li>To allow specific domains, use: <code>frame-ancestors example.com trusted-site.com</code></li>
        <li>Implement this header server-side in your web server configuration or application code</li>
      </ol>
    `,
    
    'iframe_sandbox_too_permissive': `
      <ol>
        <li>Review the current sandbox permissions on your iframe</li>
        <li>Remove any unnecessary permissions</li>
        <li>Follow the principle of least privilege: only grant permissions that are absolutely required</li>
        <li>Consider separating functionality into multiple iframes with different sandbox restrictions</li>
        <li>Test thoroughly after making changes to ensure functionality is preserved</li>
      </ol>
    `,
    
    'iframe_insecure_src': `
      <ol>
        <li>Update all iframe <code>src</code> attributes to use HTTPS instead of HTTP</li>
        <li>Ensure the sites you're embedding support HTTPS</li>
        <li>Consider implementing a Content Security Policy that requires HTTPS for all resources</li>
        <li>If you control the embedded content, redirect HTTP to HTTPS on the server side</li>
      </ol>
    `,
    
    'missing_x_frame_options': `
      <ol>
        <li>Add the X-Frame-Options header to your HTTP responses</li>
        <li>For maximum security, use <code>X-Frame-Options: DENY</code></li>
        <li>If you need to allow your own site to frame the content, use <code>X-Frame-Options: SAMEORIGIN</code></li>
        <li>For older browsers not supporting CSP frame-ancestors, implement this alongside your CSP header</li>
        <li>Configure this at the web server level (Apache, Nginx) or in your application code</li>
      </ol>
    `,
    
    'iframe_allow_all_permissions': `
      <ol>
        <li>Remove or restrict the <code>allow</code> attribute on your iframes</li>
        <li>Only grant specific permissions that are absolutely required</li>
        <li>For each permission, consider the security implications of granting it</li>
        <li>Test iframe functionality after updating permissions</li>
        <li>Consider implementing a user consent mechanism before enabling sensitive permissions</li>
      </ol>
    `
  };
  
  return remediationSteps[code] || '';
}

function escapeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

function openDetailModal() {
  const modal = document.getElementById('detail-modal');
  modal.style.display = 'block';
  // Prevent scrolling of body when modal is open
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  modal.style.display = 'none';
  // Restore scrolling of body
  document.body.style.overflow = 'auto';
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
  console.error(message);
  // Display error message to user (could add a toast/notification UI component)
}

function generateBugReport() {
  // Get the current tab ID and URL
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;
    const tabUrl = tabs[0].url;
    const tabDomain = new URL(tabUrl).hostname;
    
    // Request results from the background service
    chrome.runtime.sendMessage({ type: 'GET_RESULTS', tabId })
      .then(response => {
        const findings = response.results && response.results.findings 
          ? response.results.findings 
          : [];
        
        if (findings.length === 0) {
          showBugReportModal('No security issues found to report.');
          return;
        }
        
        // Generate the bug report from findings
        const report = generateBugReportTemplate(findings, tabUrl, tabDomain);
        showBugReportModal(report);
      })
      .catch(error => {
        console.error("Failed to load results for bug report:", error);
        showError("Could not generate bug report. Please try again.");
      });
  });
}

function generateBugReportTemplate(findings, url, domain) {
  // Sort findings by severity (critical -> info)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  // Get the highest severity finding
  const highestSeverity = findings[0].severity;
  
  // Format issue title based on highest severity finding
  const mainIssue = findings[0];
  const issueTitle = `${capitalizeFirst(highestSeverity)} - ${formatTitle(mainIssue.code)} on ${domain}`;
  
  // Create summary based on findings
  let summary = `Found ${findings.length} security issue(s) related to iframes on ${domain}:\n`;
  const topIssues = findings.slice(0, 3);
  topIssues.forEach(finding => {
    summary += `- ${formatTitle(finding.code)} (${finding.severity})\n`;
  });
  
  if (findings.length > 3) {
    summary += `- And ${findings.length - 3} more issue(s)\n`;
  }
  
  // Create reproduction steps
  let stepsToReproduce = `1. Navigate to ${url}\n`;
  stepsToReproduce += `2. Use Pink Sock browser extension to scan for iframe security vulnerabilities\n`;
  stepsToReproduce += `3. Observe the following issues:\n`;
  
  findings.forEach((finding, index) => {
    stepsToReproduce += `   ${index + 1}. ${formatTitle(finding.code)} - ${finding.details}\n`;
    if (finding.elementHtml) {
      stepsToReproduce += `      Affected element: \`${finding.elementHtml.replace(/\n/g, ' ').substring(0, 100)}${finding.elementHtml.length > 100 ? '...' : ''}\`\n`;
    }
  });
  
  // Create impact section
  let impact = `The identified issues could lead to:`;
  
  // Map findings to potential impacts by severity
  if (findings.some(f => f.severity === 'critical' || f.severity === 'high')) {
    impact += `\n- Potential for XSS attacks through unsandboxed iframes`;
  }
  if (findings.some(f => f.code.includes('clickjacking') || f.code.includes('frame_ancestors'))) {
    impact += `\n- Clickjacking vulnerabilities allowing attackers to trick users`;
  }
  if (findings.some(f => f.code.includes('sandbox') && f.severity !== 'low')) {
    impact += `\n- Improper iframe restrictions leading to script execution in unintended contexts`;
  }
  if (findings.some(f => f.code.includes('csp'))) {
    impact += `\n- Missing or improperly configured Content Security Policy`;
  }
  
  // Assemble the full report
  const template = `## Summary:
${summary}

## Steps To Reproduce:
${stepsToReproduce}

## Supporting Material/References:
* Generated using Pink Sock IFrame Security Analyzer extension
* URL: ${url}
* Scan Date: ${new Date().toISOString().split('T')[0]}

## Impact
${impact}

## Recommended Fixes:
${findings.map((finding, index) => `${index + 1}. ${finding.remediation || 'No specific remediation available for this issue.'}`).join('\n')}
`;

  return template;
}

function showBugReportModal(report) {
  const bugReportContent = document.getElementById('bug-report-content');
  bugReportContent.textContent = report;
  
  const modal = document.getElementById('bug-report-modal');
  modal.style.display = 'block';
  
  // Prevent scrolling of body when modal is open
  document.body.style.overflow = 'hidden';
}

function closeBugReportModal() {
  const modal = document.getElementById('bug-report-modal');
  modal.style.display = 'none';
  
  // Restore scrolling of body
  document.body.style.overflow = 'auto';
  
  // Reset copy button text
  const copyButton = document.getElementById('copy-report-btn');
  copyButton.textContent = 'Copy Report';
  copyButton.classList.remove('copied');
}

function copyBugReport() {
  const bugReportContent = document.getElementById('bug-report-content');
  const text = bugReportContent.textContent;
  
  // Use navigator clipboard API if available
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showCopiedMessage();
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        fallbackCopyText(text);
      });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  // Create textarea element to copy from
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // Make the textarea out of viewport
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  
  // Select and copy
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showCopiedMessage();
    } else {
      console.error('Failed to copy text');
    }
  } catch (err) {
    console.error('Error during copy', err);
  }
  
  // Clean up
  document.body.removeChild(textArea);
}

function showCopiedMessage() {
  const copyButton = document.getElementById('copy-report-btn');
  copyButton.textContent = 'Copied!';
  copyButton.classList.add('copied');
  
  // Reset button text after 2 seconds
  setTimeout(() => {
    copyButton.textContent = 'Copy Report';
    copyButton.classList.remove('copied');
  }, 2000);
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
