/**
 * Companion Mode Web IDE
 * Main application logic with Monaco Editor and Socket.IO
 */

// Configuration
const CONFIG = {
    serverUrl: 'http://localhost:3001',
    debounceDelay: 300, // ms delay before sending code changes
};

// State
let editor = null;
let socket = null;
let sessionCode = null;
let debounceTimer = null;
let isCompanionConnected = false;

// Default widget JSON
const DEFAULT_CODE = `{
  "type": "Center",
  "child": {
    "type": "Text",
    "data": "Hello, World!",
    "style": {
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#6366F1"
    }
  }
}`;

// Example widget for the "Try Example" button
const EXAMPLE_CODE = `{
  "type": "Center",
  "child": {
    "type": "Column",
    "mainAxisAlignment": "center",
    "children": [
      {
        "type": "Text",
        "data": "🚀 Welcome!",
        "style": {
          "fontSize": 28,
          "fontWeight": "bold",
          "color": "#6366F1"
        }
      },
      {
        "type": "SizedBox",
        "height": 16
      },
      {
        "type": "Text",
        "data": "Your code appears here instantly",
        "style": {
          "fontSize": 16,
          "color": "#94A3B8"
        }
      }
    ]
  }
}`;

// DOM Elements
const elements = {
    connectionStatus: document.getElementById('connectionStatus'),
    pairingCode: document.getElementById('pairingCode'),
    copyBtn: document.getElementById('copyBtn'),
    companionStatus: document.getElementById('companionStatus'),
    syncIndicator: document.getElementById('syncIndicator'),
    tryExampleBtn: document.getElementById('tryExampleBtn'),
};

// Initialize Monaco Editor
function initEditor() {
    require.config({
        paths: {
            vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
        }
    });

    require(['vs/editor/editor.main'], function () {
        // Define custom theme
        monaco.editor.defineTheme('companionDark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'string.key.json', foreground: '6366F1' },
                { token: 'string.value.json', foreground: '10B981' },
                { token: 'number', foreground: 'F59E0B' },
            ],
            colors: {
                'editor.background': '#0a0a0f',
                'editor.foreground': '#f8fafc',
                'editor.lineHighlightBackground': '#1a1a25',
                'editorCursor.foreground': '#6366F1',
                'editor.selectionBackground': '#6366F140',
            }
        });

        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: DEFAULT_CODE,
            language: 'json',
            theme: 'companionDark',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
        });

        // Listen for content changes
        editor.onDidChangeModelContent(() => {
            handleCodeChange();
        });

        console.log('[Editor] Monaco Editor initialized');
    });
}

// Initialize Socket.IO connection
function initSocket() {
    socket = io(CONFIG.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected to server');
        updateConnectionStatus('connected');
        createSession();
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from server');
        updateConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error);
        updateConnectionStatus('error');
    });

    socket.on('companion-connected', (data) => {
        console.log('[Socket] Companion connected:', data);
        isCompanionConnected = true;
        updateCompanionStatus(true);

        // Send current code to newly connected companion
        if (editor) {
            sendCodeToServer(editor.getValue());
        }
    });

    socket.on('companion-disconnected', () => {
        console.log('[Socket] Companion disconnected');
        isCompanionConnected = false;
        updateCompanionStatus(false);
    });
}

// Create a new session
function createSession() {
    socket.emit('create-session', (response) => {
        if (response.success) {
            sessionCode = response.code;
            elements.pairingCode.textContent = sessionCode;
            console.log('[Session] Created session:', sessionCode);
        } else {
            console.error('[Session] Failed to create session');
        }
    });
}

// Handle code changes with debouncing
function handleCodeChange() {
    // Show syncing indicator
    elements.syncIndicator.classList.add('syncing');
    elements.syncIndicator.querySelector('.sync-text').textContent = 'Syncing...';

    // Clear existing timer
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    // Set new debounce timer
    debounceTimer = setTimeout(() => {
        const code = editor.getValue();
        sendCodeToServer(code);
    }, CONFIG.debounceDelay);
}

// Send code to server
function sendCodeToServer(code) {
    if (socket && socket.connected) {
        socket.emit('code-change', { code });

        // Update sync indicator
        elements.syncIndicator.classList.remove('syncing');
        elements.syncIndicator.querySelector('.sync-text').textContent = 'Synced';

        console.log('[Socket] Code sent to server');
    }
}

// Update connection status UI
function updateConnectionStatus(status) {
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    const statusText = elements.connectionStatus.querySelector('.status-text');

    statusDot.classList.remove('connected', 'error');

    switch (status) {
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            break;
        case 'disconnected':
            statusText.textContent = 'Reconnecting...';
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = 'Connection Failed';
            break;
    }
}

// Update companion status UI
function updateCompanionStatus(connected) {
    if (connected) {
        elements.companionStatus.classList.add('connected');
        elements.companionStatus.innerHTML = '<span style="color: var(--success);">✓</span> Device Connected';
    } else {
        elements.companionStatus.classList.remove('connected');
        elements.companionStatus.innerHTML = `
            <div class="waiting-animation">
                <span></span><span></span><span></span>
            </div>
            <span>Waiting for device...</span>
        `;
    }
}

// Copy pairing code to clipboard
function copyPairingCode() {
    if (sessionCode) {
        navigator.clipboard.writeText(sessionCode).then(() => {
            elements.copyBtn.textContent = '✓';
            setTimeout(() => {
                elements.copyBtn.textContent = '📋';
            }, 2000);
        });
    }
}

// Load example code
function loadExample() {
    if (editor) {
        editor.setValue(EXAMPLE_CODE);
    }
}

// Event Listeners
elements.copyBtn.addEventListener('click', copyPairingCode);
elements.tryExampleBtn.addEventListener('click', loadExample);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initEditor();
    initSocket();
});
