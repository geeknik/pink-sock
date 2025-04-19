# Pink Sock Test Suite

This directory contains test cases for the Pink Sock browser extension, which checks for improper sandboxing of iframes and other related security vulnerabilities.

## Purpose

These test pages are designed to demonstrate various security vulnerabilities that the Pink Sock extension should detect. Each page contains a specific security issue or a combination of issues that represent common security vulnerabilities related to iframes and web content embedding.

## Test Categories

### IFrame Sandbox Vulnerabilities
- **Missing Sandbox Attribute**: Demonstrates an iframe without any sandbox attribute
- **Sandbox Bypass**: Shows how combining allow-scripts and allow-same-origin can bypass sandbox protection
- **Risky Navigation**: Demonstrates risky navigation capabilities in sandboxed iframes
- **Form & Script Combinations**: Shows potentially dangerous combinations of form and script capabilities

### Content Security Policy Issues
- **Missing CSP**: A page without any Content Security Policy
- **Missing frame-ancestors Directive**: CSP lacking the frame-ancestors directive to prevent clickjacking
- **Missing frame-src Directive**: CSP without proper control of iframe sources
- **Unsafe Inline Scripts**: CSP allowing unsafe-inline scripts

### Feature/Permissions Policy Issues
- **Risky Feature Permissions**: Iframes with potentially risky feature permissions
- **Fullscreen Permission**: Security implications of the allowfullscreen attribute
- **Payment Request Permission**: Demonstrates the allowpaymentrequest permission risks

### Cross-Origin Issues
- **Missing crossorigin Attribute**: Cross-origin iframe without the crossorigin attribute
- **Weak Referrer Policy**: Demonstrates referrer policy vulnerabilities
- **Target Blank Links**: Links with target="_blank" without rel="noopener"

### Secure Implementation Examples
- **Secure IFrame Implementation**: Example of properly secured iframe with all recommended protections
- **Secure Content Security Policy**: Example of a robust CSP configuration

## Usage

1. Start a local server in this directory (e.g., `python -m http.server 8000`)
2. Open your browser with the Pink Sock extension installed
3. Navigate to http://localhost:8000/
4. Click on any test case to see how the extension detects and reports issues

## Directory Structure

```
tests/
├── index.html                 # Main test suite index
├── README.md                  # This file
├── assets/                    # Shared resources
│   ├── style.css              # Common stylesheet
│   ├── logo.svg               # Test suite logo
│   ├── iframe-content.html    # Content for test iframes
│   └── template.html          # Template for test pages
├── sandbox/                   # Sandbox attribute tests
├── csp/                       # Content Security Policy tests
├── permissions/               # Permissions Policy tests
├── cross-origin/              # Cross-origin related tests
└── secure/                    # Secure implementation examples
```

## Contributing

To add a new test case:

1. Use the template file in `assets/template.html`
2. Place the file in the appropriate category directory
3. Add a link to the test in `index.html`
4. Ensure the test demonstrates a clear vulnerability that Pink Sock should detect
