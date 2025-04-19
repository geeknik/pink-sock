/**
 * Pink Sock - Content Script Analyzer
 * Analyzes the DOM for iframe security issues and reports findings
 */

class IFrameSecurityAnalyzer {
  constructor() {
    this.findings = [];
    this.setupListeners();
  }
  
  setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'START_SCAN') {
        this.analyze()
          .then(() => {
            chrome.runtime.sendMessage({
              type: 'SCAN_RESULTS',
              data: this.findings
            });
            sendResponse({ status: 'success' });
          })
          .catch(error => {
            console.error("Error during analysis:", error);
            sendResponse({ status: 'error', message: error.message });
          });
        return true; // Keep the channel open for the async response
      }
    });
  }
  
  async analyze() {
    this.findings = [];
    await this.findAllIframes();
    this.checkSecurityHeaders();
    this.analyzeCSP();
    this.checkCrossOriginSettings();
    return this.findings;
  }
  
  async findAllIframes() {
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      await this.analyzeIframe(iframe);
    }
  }
  
  async analyzeIframe(iframe) {
    // Check sandbox attributes
    const sandboxAttr = iframe.getAttribute('sandbox');
    if (!sandboxAttr) {
      this.addFinding(
        'high', 
        'iframe_missing_sandbox', 
        this.getElementDetails(iframe),
        'Iframe does not have sandbox attribute, allowing full privileges.'
      );
    } else {
      this.analyzeSandboxDirectives(sandboxAttr, iframe);
    }
    
    // Check allow attributes
    this.analyzeAllowAttributes(iframe);
    
    // Check cross-origin settings
    await this.analyzeFrameOrigin(iframe);
  }
  
  analyzeSandboxDirectives(sandboxAttr, iframe) {
    const directives = sandboxAttr.split(' ').filter(Boolean);
    
    // Check for overly permissive sandbox
    if (directives.includes('allow-scripts') && 
        directives.includes('allow-same-origin')) {
      this.addFinding(
        'high', 
        'iframe_sandbox_bypass', 
        this.getElementDetails(iframe),
        'Combining allow-scripts and allow-same-origin allows sandbox bypass'
      );
    }
    
    // Check other directive combinations
    this.checkRiskyDirectiveCombinations(directives, iframe);
  }
  
  checkRiskyDirectiveCombinations(directives, iframe) {
    // Check for allow-top-navigation without user activation
    if (directives.includes('allow-top-navigation') && 
        !directives.includes('allow-top-navigation-by-user-activation')) {
      this.addFinding(
        'medium', 
        'iframe_risky_navigation', 
        this.getElementDetails(iframe),
        'allow-top-navigation without user activation could enable clickjacking'
      );
    }
    
    // Check for allow-forms and allow-scripts without user activation
    if (directives.includes('allow-forms') && 
        directives.includes('allow-scripts') && 
        !directives.includes('allow-top-navigation-by-user-activation')) {
      this.addFinding(
        'medium', 
        'iframe_form_script_risk', 
        this.getElementDetails(iframe),
        'allow-forms with allow-scripts could enable phishing attacks'
      );
    }
  }
  
  analyzeAllowAttributes(iframe) {
    const allowAttrs = {
      'allow': iframe.getAttribute('allow'),
      'allowfullscreen': iframe.hasAttribute('allowfullscreen'),
      'allowpaymentrequest': iframe.hasAttribute('allowpaymentrequest')
    };
    
    // Check for risky permissions
    if (allowAttrs.allowfullscreen) {
      this.addFinding(
        'low', 
        'iframe_fullscreen', 
        this.getElementDetails(iframe),
        'Iframe allows fullscreen mode which could be used for phishing'
      );
    }
    
    if (allowAttrs.allowpaymentrequest) {
      this.addFinding(
        'medium', 
        'iframe_payment', 
        this.getElementDetails(iframe),
        'Iframe allows payment requests which increases the attack surface'
      );
    }
    
    // Parse and analyze the 'allow' attribute if present
    if (allowAttrs.allow) {
      this.analyzeAllowFeatures(allowAttrs.allow, iframe);
    }
  }
  
  analyzeAllowFeatures(allowAttr, iframe) {
    const features = allowAttr.split(';').map(f => f.trim());
    const riskyFeatures = [
      'camera', 
      'microphone', 
      'geolocation', 
      'display-capture'
    ];
    
    features.forEach(feature => {
      const featureName = feature.split(' ')[0];
      
      if (riskyFeatures.includes(featureName)) {
        this.addFinding(
          'medium', 
          'iframe_risky_feature', 
          this.getElementDetails(iframe),
          `Iframe allows potentially risky feature: ${featureName}`
        );
      }
    });
  }
  
  async analyzeFrameOrigin(iframe) {
    const src = iframe.getAttribute('src');
    if (!src) {
      return;
    }
    
    try {
      const iframeOrigin = new URL(src, window.location.href).origin;
      const pageOrigin = window.location.origin;
      
      if (iframeOrigin !== pageOrigin) {
        // Check cross-origin attributes
        if (!iframe.hasAttribute('crossorigin')) {
          this.addFinding(
            'medium', 
            'iframe_missing_crossorigin', 
            this.getElementDetails(iframe),
            'Cross-origin iframe without crossorigin attribute'
          );
        }
        
        // Check if there are additional protections for cross-origin iframes
        const referrerPolicy = iframe.getAttribute('referrerpolicy');
        if (!referrerPolicy || referrerPolicy === 'no-referrer-when-downgrade') {
          this.addFinding(
            'low', 
            'iframe_weak_referrer_policy', 
            this.getElementDetails(iframe),
            'Cross-origin iframe with weak or missing referrer policy'
          );
        }
      }
    } catch (error) {
      console.error("Error analyzing iframe origin:", error);
    }
  }
  
  checkSecurityHeaders() {
    // This is a placeholder - actual header checks will be done by the background script
    // since content scripts can't access response headers directly
  }
  
  analyzeCSP() {
    // Check for meta CSP tags, since response headers are handled in the background script
    const cspMetaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    
    if (cspMetaTags.length === 0) {
      return;
    }
    
    for (const metaTag of cspMetaTags) {
      const cspContent = metaTag.getAttribute('content');
      if (cspContent) {
        this.analyzeCSPContent(cspContent);
      }
    }
  }
  
  analyzeCSPContent(cspContent) {
    // Check for frame-ancestors directive
    if (!cspContent.includes('frame-ancestors')) {
      this.addFinding(
        'medium',
        'csp_missing_frame_ancestors',
        null,
        'CSP is missing frame-ancestors directive to prevent clickjacking'
      );
    }
    
    // Check for default-src or frame-src
    if (!cspContent.includes('default-src') && !cspContent.includes('frame-src')) {
      this.addFinding(
        'medium',
        'csp_missing_frame_src',
        null,
        'CSP is missing frame-src or default-src directive to control iframe sources'
      );
    }
    
    // Check for unsafe-inline in script-src
    if (cspContent.includes('script-src') && cspContent.includes('unsafe-inline')) {
      this.addFinding(
        'medium',
        'csp_unsafe_inline_script',
        null,
        'CSP allows unsafe-inline scripts which reduces security'
      );
    }
  }
  
  checkCrossOriginSettings() {
    // Check for cross-origin links with target="_blank" but without rel="noopener"
    const links = document.querySelectorAll('a[target="_blank"]');
    for (const link of links) {
      const relAttr = link.getAttribute('rel') || '';
      const href = link.getAttribute('href') || '';
      
      try {
        // Skip if it's not a cross-origin link or if it has rel="noopener"
        if (!href || relAttr.includes('noopener')) {
          continue;
        }
        
        // Try to determine if it's cross-origin
        const linkUrl = new URL(href, window.location.href);
        if (linkUrl.origin !== window.location.origin) {
          this.addFinding(
            'low',
            'link_missing_noopener',
            this.getElementDetails(link),
            'Cross-origin link with target="_blank" without rel="noopener" can expose your site to performance and security issues'
          );
        }
      } catch (error) {
        // Skip malformed URLs
        continue;
      }
    }
  }
  
  getElementDetails(element) {
    // Create a representation of the element for reporting
    if (!element) return null;
    
    let attributes = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      attributes: attributes,
      path: this.getElementPath(element)
    };
  }
  
  getElementPath(element) {
    if (!element) return '';
    
    let path = [];
    let currentElement = element;
    
    while (currentElement && currentElement !== document.documentElement) {
      let selector = currentElement.tagName.toLowerCase();
      
      if (currentElement.id) {
        selector += `#${currentElement.id}`;
      } else {
        const siblings = Array.from(currentElement.parentNode.children).filter(
          child => child.tagName === currentElement.tagName
        );
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(currentElement) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      
      path.unshift(selector);
      currentElement = currentElement.parentNode;
    }
    
    return path.join(' > ');
  }
  
  addFinding(severity, code, element, details = '') {
    const finding = {
      severity,   // 'critical', 'high', 'medium', 'low', 'info'
      code,       // unique identifier for the issue
      element,    // reference to DOM element (if applicable)
      details,    // explanation of the issue
      timestamp: Date.now(),
      url: window.location.href,
      remediation: this.getRemediation(code)
    };
    
    this.findings.push(finding);
  }
  
  getRemediation(code) {
    const remediations = {
      'iframe_missing_sandbox': 
        'Add a sandbox attribute to restrict iframe capabilities. Example: sandbox="allow-scripts allow-same-origin"',
      
      'iframe_sandbox_bypass': 
        'Avoid combining allow-scripts and allow-same-origin in sandbox attribute, as this combination can bypass sandbox protections.',
      
      'iframe_risky_navigation': 
        'Use allow-top-navigation-by-user-activation instead of allow-top-navigation to require user interaction.',
      
      'iframe_form_script_risk': 
        'Carefully evaluate if the iframe needs both form and script capabilities. Consider using allow-forms without allow-scripts if possible.',
      
      'iframe_fullscreen': 
        'Remove allowfullscreen attribute if fullscreen mode is not necessary for the iframe content.',
      
      'iframe_payment': 
        'Remove allowpaymentrequest attribute unless payment functionality is explicitly required.',
      
      'iframe_risky_feature': 
        'Remove unneeded permissions from the allow attribute. Only grant permissions necessary for functionality.',
      
      'iframe_missing_crossorigin': 
        'Add crossorigin="anonymous" to cross-origin iframes to prevent sending credentials.',
      
      'iframe_weak_referrer_policy': 
        'Add referrerpolicy="no-referrer" or "same-origin" to cross-origin iframes.',
      
      'csp_missing_frame_ancestors': 
        'Add frame-ancestors directive to your Content Security Policy to control which domains can embed your site.',
      
      'csp_missing_frame_src': 
        'Add frame-src or default-src directive to your Content Security Policy to control which sources can be loaded in iframes.',
      
      'csp_unsafe_inline_script': 
        'Remove unsafe-inline from script-src directive and use nonces or hashes for inline scripts.',
      
      'link_missing_noopener': 
        'Add rel="noopener noreferrer" to all cross-origin links with target="_blank".'
    };
    
    return remediations[code] || 'No specific remediation available.';
  }
}

// Initialize the analyzer
const analyzer = new IFrameSecurityAnalyzer();
console.log("Pink Sock content analyzer initialized");
