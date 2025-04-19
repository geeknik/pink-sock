/**
 * Pink Sock - Options Page Script
 */

document.addEventListener('DOMContentLoaded', loadOptions);

// Save button click handler
document.getElementById('save-btn').addEventListener('click', saveOptions);

// Reset button click handler
document.getElementById('reset-btn').addEventListener('click', resetOptions);

/**
 * Load saved options from storage
 */
function loadOptions() {
  chrome.storage.sync.get('config', (result) => {
    const config = result.config || getDefaultConfig();
    
    // Set values for security check options
    document.getElementById('check-iframe-sandbox').checked = config.enabledChecks.iframeSandbox;
    document.getElementById('check-security-headers').checked = config.enabledChecks.securityHeaders;
    document.getElementById('check-csp').checked = config.enabledChecks.cspAnalysis;
    document.getElementById('check-cross-origin').checked = config.enabledChecks.crossOriginChecks;
    
    // Set values for notification options
    document.getElementById('auto-scan').checked = config.autoScanOnPageLoad;
    document.getElementById('notification-level').value = config.notificationLevel;
    
    // Set values for advanced options
    document.getElementById('custom-policies').checked = config.enableCustomPolicies;
    document.getElementById('whitelist-domains').value = config.whitelistDomains.join(', ');
  });
}

/**
 * Save options to storage
 */
function saveOptions() {
  const config = {
    enabledChecks: {
      iframeSandbox: document.getElementById('check-iframe-sandbox').checked,
      securityHeaders: document.getElementById('check-security-headers').checked,
      cspAnalysis: document.getElementById('check-csp').checked,
      crossOriginChecks: document.getElementById('check-cross-origin').checked
    },
    autoScanOnPageLoad: document.getElementById('auto-scan').checked,
    notificationLevel: document.getElementById('notification-level').value,
    enableCustomPolicies: document.getElementById('custom-policies').checked,
    whitelistDomains: document.getElementById('whitelist-domains').value
      .split(',')
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0)
  };
  
  chrome.storage.sync.set({ config }, () => {
    // Show success message
    const successMessage = document.getElementById('success-message');
    successMessage.style.display = 'block';
    
    // Hide message after a delay
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
  });
}

/**
 * Reset options to defaults
 */
function resetOptions() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    const config = getDefaultConfig();
    chrome.storage.sync.set({ config }, () => {
      loadOptions();
      
      // Show success message
      const successMessage = document.getElementById('success-message');
      successMessage.textContent = 'Settings reset to defaults!';
      successMessage.style.display = 'block';
      
      // Hide message after a delay
      setTimeout(() => {
        successMessage.style.display = 'none';
        successMessage.textContent = 'Settings saved successfully!';
      }, 3000);
    });
  }
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
    autoScanOnPageLoad: true,
    notificationLevel: 'medium',
    enableCustomPolicies: false,
    whitelistDomains: []
  };
}
