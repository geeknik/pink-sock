# Pink Sock - IFrame Security Analyzer

## Overview

Pink Sock is a Brave browser extension that analyzes web pages for improper sandboxing of iframes and other related security vulnerabilities. It helps developers and security professionals identify potential security risks in websites they visit or develop.

## Features

- **IFrame Security Analysis**: Detects improperly sandboxed iframes and risky attribute combinations
- **Security Headers Check**: Identifies missing or misconfigured security headers related to iframe protection
- **CSP Analysis**: Evaluates Content Security Policy configurations for iframe-related directives
- **Cross-Origin Configuration Checks**: Identifies vulnerable cross-origin settings
- **DevTools Integration**: Provides detailed analysis through a custom DevTools panel
- **Visual Indicators**: Shows severity-coded badges and notifications for identified issues
- **Remediation Guidance**: Offers specific recommendations to fix each security issue

## Installation

### From Source

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/pink-sock.git
   cd pink-sock
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

4. Load the extension in Brave:
   - Open Brave and go to `brave://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Usage

1. **Basic Analysis**:
   - Navigate to any website
   - Click the Pink Sock icon in the toolbar to see a summary of iframe security issues

2. **Detailed Analysis**:
   - Open DevTools (F12)
   - Navigate to the "Pink Sock" panel
   - View comprehensive security findings with element highlighting

3. **Export Reports**:
   - Use the "Export Report" button in the DevTools panel to save findings as JSON

## Development

### Directory Structure

```
pink-sock/
├── assets/
│   └── icons/       # Extension icons
├── src/
│   ├── background/  # Background service worker
│   ├── content/     # Content scripts
│   ├── popup/       # Browser action popup
│   ├── devtools/    # DevTools panel
│   └── manifest.json
├── README.md
└── DESIGN.md        # Detailed design documentation
```

### Building from Source

1. Install dependencies:
   ```
   npm install
   ```

2. Start development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Security Features Analyzed

- **IFrame Sandbox Attributes**: Checks for missing sandbox attributes and risky combinations like `allow-scripts` with `allow-same-origin`
- **Cross-Origin Resource Policies**: Validates CORP, COEP, and COOP headers
- **Content Security Policy**: Checks for proper frame-ancestors and frame-src directives
- **Permissions Policies**: Analyzes granted permissions for embedded content
- **Referrer Policies**: Ensures appropriate referrer handling for cross-origin iframes
- **Cross-Origin Link Security**: Detects target="_blank" links without rel="noopener"

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- Inspired by the need for better iframe security analysis tools
- Thanks to all contributors who have helped improve this extension
