#!/bin/bash
# Simple script to start a local server for the test suite

echo "Starting test server on http://localhost:8080"
echo "Press Ctrl+C to stop the server"

# Check for Python 3
if command -v python3 &>/dev/null; then
    python3 -m http.server 8080
# Fall back to Python 2 if Python 3 isn't available
elif command -v python &>/dev/null; then
    python -m SimpleHTTPServer 8080
# Provide instructions if Python isn't available
else
    echo "Error: Python not found. Please install Python or use another HTTP server."
    echo "Alternative options:"
    echo "  - Node.js: 'npx http-server -p 8080'"
    echo "  - PHP: 'php -S localhost:8080'"
    exit 1
fi
