# Pink Sock Extension Installation & Troubleshooting Guide

## Installation

### Method 1: Loading the Unpacked Extension

1. Clone the repository or download the code to your local machine
2. Open Brave browser and navigate to `brave://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click the "Load unpacked" button
5. Select the root folder of the Pink Sock extension (`/Users/geeknik/brave_Ext/pink-sock`)
6. The extension should now appear in your extensions list

### Method 2: Building the Extension (for development)

1. Install Node.js and npm if you haven't already
2. Navigate to the extension directory in your terminal
3. Run `npm install` to install dependencies
4. Run `npm run build` to build the extension
5. Load the extension from the `dist` directory using the steps from Method 1

## Using Pink Sock

1. After installation, you should see the Pink Sock icon in your browser toolbar
2. Navigate to any website you want to analyze
3. Click the Pink Sock icon to see a summary of iframe security issues
4. For detailed analysis, open DevTools (F12 or Ctrl+Shift+I) and navigate to the "Pink Sock" panel

## Troubleshooting

### Common Issues

#### The extension icon doesn't appear in the toolbar

- Make sure the extension is installed and enabled
- Check the `manifest.json` file to ensure the icon paths are correct
- Try restarting the browser

#### The DevTools panel shows "It may have been moved, edited, or deleted."

This error usually indicates a path or resource loading issue. Try the following:

1. **Reload the extension**:
   - Go to `brave://extensions/`
   - Find Pink Sock and click the refresh/reload icon
   - Reopen DevTools and check if the panel loads correctly

2. **Check browser console for errors**:
   - Open DevTools (F12)
   - Go to the Console tab
   - Look for any error messages related to Pink Sock

3. **Run the diagnostic script**:
   - Open DevTools Console
   - Copy the content from `debug.js` and paste it into the console
   - Run `runDiagnostics()` to identify specific issues

4. **Fix for path issues**:
   - If you've modified any code, make sure all file paths are correct
   - The DevTools panel and background script must be able to communicate properly

#### No scan results appear in the popup or DevTools panel

1. Make sure the current page uses HTTP/HTTPS protocol (not about:, chrome:, etc.)
2. Try manually triggering a scan by clicking the "Scan Again" button
3. Check if content scripts are running by looking for Pink Sock logs in the Console

### Advanced Troubleshooting

If basic troubleshooting doesn't solve your issue:

1. **Enable verbose logging**:
   - Open the background service worker file (`src/background/service-worker.js`)
   - Uncomment any debug logging statements or add your own
   - Reload the extension

2. **Check Browser Extension Compatibility**:
   - Brave is based on Chromium, but some extensions may have compatibility issues
   - Make sure you're using a recent version of Brave

3. **Verify Permissions**:
   - Check that all required permissions in `manifest.json` are properly set
   - Host permissions (`<all_urls>`) are particularly important

4. **Check for Resource Conflicts**:
   - If you have other security-focused extensions, they might conflict
   - Try temporarily disabling other extensions to isolate the issue

5. **Extension Storage Issues**:
   - If settings aren't persisting, try clearing extension storage
   - In DevTools Console (while on the extension page): `chrome.storage.sync.clear()`

## Reporting Issues

If you continue to experience problems:

1. Create a detailed bug report including:
   - Brave browser version
   - Extension version
   - Steps to reproduce the issue
   - Any error messages from the console
   - Results from the diagnostic tool
   
2. Submit the issue on GitHub or contact the extension developer

## Known Issues

- DevTools panel might not load properly on the first try after installation (reload the extension to fix)
- Some complex iframes might not be fully analyzed if they load dynamically
- Extension may have limited functionality on certain special pages (PDF viewer, browser UI pages)
