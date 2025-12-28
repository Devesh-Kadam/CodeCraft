class CodeEditor {
    constructor() {
        this.currentTab = 'html';
        this.editors = {
            html: document.getElementById('htmlCode'),
            css: document.getElementById('cssCode'),
            js: document.getElementById('jsCode')
        };
        this.preview = document.getElementById('preview');
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.loadSavedCode();
        this.updatePreview();
        this.updateCharCount();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Code input listeners
        Object.values(this.editors).forEach(editor => {
            editor.addEventListener('input', () => {
                this.updatePreview();
                this.updateCharCount();
                this.updateStatus('Modified');
            });
        });

        // Header buttons
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveCode();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.showDownloadModal();
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyCurrentCode();
        });

        document.getElementById('formatBtn').addEventListener('click', () => {
            this.formatCurrentCode();
        });

        // Preview actions
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.updatePreview();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideDownloadModal();
        });

        document.getElementById('downloadModal').addEventListener('click', (e) => {
            if (e.target.id === 'downloadModal') {
                this.hideDownloadModal();
            }
        });

        // Download options
        document.querySelectorAll('.download-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.downloadFile(type);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Project name change
        document.getElementById('projectName').addEventListener('input', () => {
            this.updateStatus('Modified');
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update editor visibility
        document.querySelectorAll('.editor').forEach(editor => {
            editor.classList.remove('active');
        });
        document.getElementById(`${tabName}Editor`).classList.add('active');

        this.currentTab = tabName;
        this.updateCharCount();
    }

    updatePreview() {
        const html = this.editors.html.value;
        const css = this.editors.css.value;
        const js = this.editors.js.value;

        const previewContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview</title>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>
                    try {
                        ${js}
                    } catch (error) {
                        console.error('JavaScript Error:', error);
                    }
                </script>
            </body>
            </html>
        `;

        const blob = new Blob([previewContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.preview.src = url;

        // Clean up previous blob URL
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    setupTheme() {
        const app = document.getElementById('app');
        const themeIcon = document.querySelector('#themeToggle i');
        
        if (this.isDarkMode) {
            app.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-sun';
        } else {
            app.removeAttribute('data-theme');
            themeIcon.className = 'fas fa-moon';
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.setupTheme();
        this.updateStatus('Theme changed');
    }

    saveCode() {
        const projectName = document.getElementById('projectName').value;
        const codeData = {
            projectName,
            html: this.editors.html.value,
            css: this.editors.css.value,
            js: this.editors.js.value,
            lastSaved: new Date().toISOString()
        };

        localStorage.setItem('codeEditor_project', JSON.stringify(codeData));
        this.updateStatus('Saved successfully');
        this.updateLastSaved();
        
        // Show success feedback
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
        saveBtn.classList.add('success');
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('success');
        }, 2000);
    }

    loadSavedCode() {
        const savedData = localStorage.getItem('codeEditor_project');
        if (savedData) {
            const data = JSON.parse(savedData);
            document.getElementById('projectName').value = data.projectName || 'My Project';
            this.editors.html.value = data.html || this.editors.html.value;
            this.editors.css.value = data.css || this.editors.css.value;
            this.editors.js.value = data.js || this.editors.js.value;
            this.updateLastSaved(data.lastSaved);
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.saveCode();
        }, 30000); // Auto-save every 30 seconds
    }

    copyCurrentCode() {
        const currentCode = this.editors[this.currentTab].value;
        navigator.clipboard.writeText(currentCode).then(() => {
            this.updateStatus('Code copied to clipboard');
            
            // Show success feedback
            const copyBtn = document.getElementById('copyBtn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
            copyBtn.classList.add('success');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('success');
            }, 2000);
        }).catch(() => {
            this.updateStatus('Failed to copy code');
        });
    }

    formatCurrentCode() {
        const editor = this.editors[this.currentTab];
        let code = editor.value;
        
        try {
            if (this.currentTab === 'html') {
                code = this.formatHTML(code);
            } else if (this.currentTab === 'css') {
                code = this.formatCSS(code);
            } else if (this.currentTab === 'js') {
                code = this.formatJS(code);
            }
            
            editor.value = code;
            this.updatePreview();
            this.updateStatus('Code formatted');
        } catch (error) {
            this.updateStatus('Failed to format code');
        }
    }

    formatHTML(html) {
        // Simple HTML formatting
        return html
            .replace(/></g, '>\n<')
            .replace(/^\s+|\s+$/g, '')
            .split('\n')
            .map((line, index, array) => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                
                const depth = this.getHTMLDepth(array.slice(0, index));
                return '  '.repeat(depth) + trimmed;
            })
            .filter(line => line.trim())
            .join('\n');
    }

    formatCSS(css) {
        // Simple CSS formatting
        return css
            .replace(/\{/g, ' {\n')
            .replace(/\}/g, '\n}\n')
            .replace(/;/g, ';\n')
            .split('\n')
            .map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                if (trimmed.includes('{') || trimmed.includes('}')) {
                    return trimmed;
                }
                return '  ' + trimmed;
            })
            .filter(line => line.trim())
            .join('\n');
    }

    formatJS(js) {
        // Simple JS formatting
        return js
            .replace(/\{/g, ' {\n')
            .replace(/\}/g, '\n}\n')
            .replace(/;/g, ';\n')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join('\n');
    }

    getHTMLDepth(lines) {
        let depth = 0;
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes('<') && !trimmed.includes('</') && !trimmed.includes('/>')) {
                depth++;
            } else if (trimmed.includes('</')) {
                depth--;
            }
        });
        return Math.max(0, depth);
    }

    showDownloadModal() {
        document.getElementById('downloadModal').classList.add('active');
    }

    hideDownloadModal() {
        document.getElementById('downloadModal').classList.remove('active');
    }

    downloadFile(type) {
        const projectName = document.getElementById('projectName').value || 'project';
        
        if (type === 'zip') {
            this.downloadZip(projectName);
        } else {
            const content = this.editors[type].value;
            const filename = `${projectName}.${type}`;
            this.downloadSingleFile(content, filename);
        }
        
        this.hideDownloadModal();
        this.updateStatus(`Downloaded ${type.toUpperCase()} file`);
    }

    downloadSingleFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadZip(projectName) {
        // Simple zip creation (for demo purposes)
        // In a real application, you'd use a library like JSZip
        const files = {
            'index.html': this.editors.html.value,
            'styles.css': this.editors.css.value,
            'script.js': this.editors.js.value
        };

        // Create a simple archive format
        let archive = '';
        Object.entries(files).forEach(([filename, content]) => {
            archive += `--- ${filename} ---\n${content}\n\n`;
        });

        this.downloadSingleFile(archive, `${projectName}.txt`);
    }

    toggleFullscreen() {
        const previewContainer = document.querySelector('.preview-container');
        if (!document.fullscreenElement) {
            previewContainer.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    updateCharCount() {
        const currentEditor = this.editors[this.currentTab];
        const count = currentEditor.value.length;
        document.getElementById('charCount').textContent = `${count} characters`;
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
        setTimeout(() => {
            document.getElementById('statusText').textContent = 'Ready';
        }, 3000);
    }

    updateLastSaved(timestamp = null) {
        const time = timestamp ? new Date(timestamp) : new Date();
        const formatted = time.toLocaleTimeString();
        document.getElementById('lastSaved').textContent = `Last saved: ${formatted}`;
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveCode();
                    break;
                case 'd':
                    e.preventDefault();
                    this.showDownloadModal();
                    break;
                case '/':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
                case '1':
                    e.preventDefault();
                    this.switchTab('html');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchTab('css');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchTab('js');
                    break;
            }
        }
    }
}

// Initialize the code editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CodeEditor();
});

// Add some utility functions for enhanced functionality
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced error handling for the preview iframe
window.addEventListener('message', (event) => {
    if (event.data.type === 'error') {
        console.error('Preview Error:', event.data.error);
    }
});

// Add resize functionality
let isResizing = false;

document.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('resize-handle')) {
        isResizing = true;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    }
});

function handleResize(e) {
    if (!isResizing) return;
    // Implement resize logic here
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}