# Pink Sock Extension Troubleshooting

## Common Errors and Solutions

### Service Worker Registration Failed (Status code: 15)

**Problem:** When loading the extension, you see an error: "Service worker registration failed. Status code: 15" along with "Uncaught TypeError: Cannot read properties of undefined (reading 'bind')".

**Solution:**

1. The extension is now using a simplified service worker that doesn't rely on class bindings. To update:
   - Go to `brave://extensions/`
   - Make sure "Developer mode" is enabled (toggle in the top-right)
   - Find Pink Sock and click the refresh/reload icon
   - If that doesn't work, try removing the extension and loading it again

2. If the error persists, try these steps:
   - Check the browser console for more detailed error messages
   - Make sure there are no conflicts with other extensions
   - Try loading the extension in a clean browser profile

### DevTools Panel Shows "It may have been moved, edited, or deleted"

**Problem:** The Pink Sock panel in DevTools appears blank or shows an error.

**Solution:**

1. Make sure the extension is properly loaded:
   - Go to `brave://extensions/`
   - Verify Pink Sock is enabled
   - Click the reload button

2. Check DevTools panel paths:
   - Make sure `manifest.json` has the correct `devtools_page` path
   - Verify that all resources in `src/devtools/` are accessible

3. Restart DevTools:
   - Close DevTools completely (F12 or Ctrl+Shift+I to close)
   - Reopen DevTools
   - Navigate to the Pink Sock panel

### Content Script Not Running

**Problem:** The extension isn't detecting iframe issues when you visit pages.

**Solution:**

1. Check permissions:
   - Make sure the extension has `<all_urls>` permission
   - Verify content scripts are properly configured

2. Test on simple pages:
   - Try using the test pages in `/tests/` to verify functionality
   - Start with simple test cases like missing sandbox attributes

3. Verify background communication:
   - The content script should communicate scan results to the background script
   - Check the console for any message passing errors

### Debugging Service Worker Issues

If you need to debug the service worker specifically:

1. Open `brave://extensions/`
2. Find Pink Sock and click "Details"
3. Scroll down to "Inspect views" and click "service worker"
4. This opens DevTools connected to the service worker
5. Check the console for any errors

### Icons or Resources Not Loading

**Problem:** Extension icons or resources do not appear properly.

**Solution:**

1. Check file paths:
   - Make sure all referenced files exist
   - Verify paths in `manifest.json` are correct

2. Check web_accessible_resources:
   - Ensure all necessary resources are listed
   - Make sure the matches pattern includes necessary URLs

3. Regenerate or replace icons:
   - Use the provided scripts in `assets/icons/` to regenerate icons
   - Or manually add placeholder PNG files

## Quick Fix for Service Worker Error

If you're experiencing the "Cannot read properties of undefined (reading 'bind')" error, the quickest fix is to use our simplified service worker:

1. Make sure `manifest.json` points to `src/background/simple-service-worker.js`
2. Reload the extension
3. Test basic functionality

This simplified service worker avoids using class methods with binding, which eliminates the main cause of the error.

## Additional Resources

- [Chrome Extensions Debugging Guide](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/)
- [Brave Extension Documentation](https://brave.com/brave-ads/help/developer-portal/)
- [Service Worker Troubleshooting](https://developer.chrome.com/docs/workbox/service-worker-troubleshooting/)

If you continue to experience issues, please file a report with:
- Detailed steps to reproduce the issue
- Error messages from the console
- Screenshots of the problem
- Browser version and OS information
