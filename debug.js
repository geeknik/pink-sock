/**
 * Pink Sock Debug Helper
 * 
 * This script helps diagnose issues with the Pink Sock extension.
 * To use: Copy and paste parts of this script into the browser console
 * when having issues with the extension.
 */

// 1. Test if the extension is properly installed and accessible
function testExtensionAccess() {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    console.log('✅ Extension is accessible, ID:', chrome.runtime.id);
  } else {
    console.error('❌ Extension is not accessible. Make sure it is installed properly.');
  }
}

// 2. Check if background service worker is running
async function checkBackgroundWorker() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'PING' });
    console.log('✅ Background service worker responded:', response);
  } catch (e) {
    console.error('❌ Could not communicate with background service worker:', e);
    console.log('Possible causes:');
    console.log('- Service worker is not running');
    console.log('- Error in service worker code');
    console.log('- Permission issues');
  }
}

// 3. Verify DevTools panel registration
function checkDevToolsRegistration() {
  if (typeof chrome.devtools !== 'undefined') {
    console.log('✅ DevTools API is accessible');
    console.log('Current panel context:', window.location.href);
  } else {
    console.log('❓ Not running in a DevTools context. Run this in the DevTools panel.');
  }
}

// 4. Test message passing between devtools and background
async function testDevToolsMessagePassing() {
  if (typeof chrome.devtools === 'undefined') {
    console.log('❓ Not running in a DevTools context. Run this in the DevTools panel.');
    return;
  }
  
  try {
    console.log('Sending test message to background service worker...');
    const response = await chrome.runtime.sendMessage({
      type: 'GET_RESULTS',
      tabId: chrome.devtools.inspectedWindow.tabId
    });
    
    console.log('✅ Got response from background service worker:', response);
    if (response && response.results) {
      console.log('Results data found:', {
        findings: response.results.findings ? response.results.findings.length : 0,
        headers: response.results.headers ? Object.keys(response.results.headers).length : 0
      });
    } else {
      console.log('⚠️ No results data returned. Has a scan been performed?');
    }
  } catch (e) {
    console.error('❌ Message passing failed:', e);
  }
}

// 5. Check extension file access
async function checkFileAccess() {
  const files = [
    'assets/icons/icon16.png',
    'src/devtools/panel.html',
    'src/devtools/panel.css',
    'src/devtools/panel.js'
  ];
  
  console.log('Testing file access...');
  
  for (const file of files) {
    const url = chrome.runtime.getURL(file);
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ File accessible: ${file}`);
      } else {
        console.error(`❌ File not accessible: ${file} (Status: ${response.status})`);
      }
    } catch (e) {
      console.error(`❌ Error accessing file: ${file}`, e);
    }
  }
}

// 6. Full diagnostic report
async function runDiagnostics() {
  console.log('----- Pink Sock Diagnostics -----');
  console.log('Running diagnostics at:', new Date().toISOString());
  
  testExtensionAccess();
  await checkBackgroundWorker();
  checkDevToolsRegistration();
  await checkFileAccess();
  
  if (typeof chrome.devtools !== 'undefined') {
    await testDevToolsMessagePassing();
  }
  
  console.log('----- Diagnostics Complete -----');
}

// Usage instructions
console.log('Pink Sock Debug Helper loaded');
console.log('To run diagnostics, call: runDiagnostics()');
console.log('For specific tests, call any of these functions:');
console.log('- testExtensionAccess()');
console.log('- checkBackgroundWorker()');
console.log('- checkDevToolsRegistration()');
console.log('- testDevToolsMessagePassing()');
console.log('- checkFileAccess()');
