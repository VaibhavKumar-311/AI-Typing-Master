import { StatsCalculator } from './typing_engine/statsCalculator.js';

export default class CodingEngine {
    constructor(rawCode, language) {
        this.rawCode = rawCode.replace(/\r\n/g, '\n'); // Normalize newlines
        this.language = language;
        
        this.codeContainer = document.getElementById('code-container');
        this.typingArea = document.getElementById('typing-area');
        this.focusOverlay = document.getElementById('focus-overlay');
        
        this.timerDisplay = document.getElementById('timer-display');
        this.wpmDisplay = document.getElementById('wpm-display');
        this.accDisplay = document.getElementById('accuracy-display');
        
        this.charElements = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.hasStarted = false;
        
        this.stats = new StatsCalculator();
        this.timerInterval = null;
        
        this.initDOM();
        this.initEventListeners();
    }
    
    initDOM() {
        // 1. Highlight via Prism
        let html = this.rawCode;
        if (Prism.languages[this.language]) {
            html = Prism.highlight(this.rawCode, Prism.languages[this.language], this.language);
        }
        
        this.codeContainer.innerHTML = html;
        
        // 2. Wrap characters
        this.charElements = [];
        this.wrapCharacters(this.codeContainer);
        
        // Ensure first char is active
        if (this.charElements.length > 0) {
            this.charElements[0].classList.add('active-char');
        }
    }
    
    wrapCharacters(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const fragment = document.createDocumentFragment();
            
            for (let i = 0; i < text.length; i++) {
                const span = document.createElement('span');
                span.className = 'type-char';
                
                // Keep actual char for logical comparison
                span.dataset.char = text[i];
                
                if (text[i] === '\n') {
                    span.innerText = '↵\n';
                    span.classList.add('opacity-30'); // Make enter arrows faint
                } else if (text[i] === '\t') {
                    span.innerText = '→   ';
                    span.classList.add('opacity-30');
                } else {
                    span.innerText = text[i];
                }
                
                fragment.appendChild(span);
                this.charElements.push(span);
            }
            node.parentNode.replaceChild(fragment, node);
        } else {
            const children = Array.from(node.childNodes);
            for (let child of children) {
                this.wrapCharacters(child);
            }
        }
    }
    
    initEventListeners() {
        this.typingArea.addEventListener('click', () => this.focus());
        this.focusOverlay.addEventListener('click', () => this.focus());
        
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) {
                if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
                    this.focus();
                }
            }
        });
        
        this.typingArea.addEventListener('blur', () => this.blur());
        this.typingArea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Anti-cheat: No pasting
        this.typingArea.addEventListener('paste', (e) => e.preventDefault());
        this.typingArea.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    focus() {
        this.isActive = true;
        this.focusOverlay.classList.add('opacity-0', 'pointer-events-none');
        this.typingArea.focus();
    }
    
    blur() {
        this.isActive = false;
        this.focusOverlay.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    handleKeyDown(e) {
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
        if (e.isTrusted === false) return;
        
        // Prevent default browser scrolling/tabbing
        if (['Tab', ' ', 'Enter', 'Backspace'].includes(e.key)) {
            e.preventDefault();
        }

        if (!this.hasStarted) {
            this.hasStarted = true;
            this.stats.start();
            this.lastKeyPressTime = Date.now();
            this.timerInterval = setInterval(() => this.updateLiveStats(), 100);
        }

        if (e.key === 'Backspace') {
            if (window.ThemeManager) window.ThemeManager.playKeystroke();
            this.handleBackspace();
        } else {
            // Map logical keys
            let mappedKey = e.key;
            if (e.key === 'Enter') mappedKey = '\n';
            if (e.key === 'Tab') mappedKey = '\t';
            
            if (window.ThemeManager) window.ThemeManager.playKeystroke();
            this.handleCharacter(mappedKey);
        }
    }
    
    handleBackspace() {
        if (this.currentIndex > 0) {
            this.charElements[this.currentIndex].classList.remove('active-char');
            this.currentIndex--;
            
            const charEl = this.charElements[this.currentIndex];
            const wasCorrect = charEl.classList.contains('typed-correct');
            this.stats.handleBackspace(wasCorrect);
            
            charEl.classList.remove('typed-correct', 'typed-incorrect');
            charEl.classList.add('active-char');
            
            // Scroll to active
            charEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    }
    
    handleCharacter(key) {
        if (this.currentIndex < this.charElements.length) {
            const charEl = this.charElements[this.currentIndex];
            const expectedChar = charEl.dataset.char;
            
            const isCorrect = (key === expectedChar);
            
            const now = Date.now();
            const timeSinceLast = this.lastKeyPressTime ? now - this.lastKeyPressTime : 0;
            this.lastKeyPressTime = now;
            
            this.stats.update(isCorrect, expectedChar, key, timeSinceLast);
            
            charEl.classList.remove('active-char');
            if (isCorrect) {
                charEl.classList.add('typed-correct');
            } else {
                charEl.classList.add('typed-incorrect');
            }
            
            this.currentIndex++;
            
            if (this.currentIndex < this.charElements.length) {
                this.charElements[this.currentIndex].classList.add('active-char');
                this.charElements[this.currentIndex].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            } else {
                this.endTest();
            }
        }
    }
    
    updateLiveStats() {
        if (!this.hasStarted) return;
        const timeElapsed = (Date.now() - this.stats.startTime) / 1000;
        this.timerDisplay.innerText = timeElapsed.toFixed(1) + 's';
        
        const currentStats = this.stats.getStats(timeElapsed);
        this.wpmDisplay.innerText = currentStats.wpm;
        this.accDisplay.innerText = `${currentStats.accuracy}%`;
    }
    
    async endTest() {
        clearInterval(this.timerInterval);
        this.blur();
        
        const timeElapsed = (Date.now() - this.stats.startTime) / 1000;
        const finalStats = this.stats.getStats(timeElapsed);
        
        try {
            // Reusing the typing_test save_result logic, or just send to analytics directly.
            // For custom practice, we might not want to skew the global WPM, but we DO want analytics!
            await fetch('/analytics/api/save-metrics/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.CSRF_TOKEN
                },
                body: JSON.stringify({
                    key_events: finalStats.keyEvents,
                    wpm: finalStats.wpm,
                    accuracy: parseFloat(finalStats.accuracy)
                })
            });
            
            this.focusOverlay.innerHTML = `
                <div class="text-center">
                    <span class="text-5xl">🏆</span>
                    <h2 class="text-3xl font-black text-white mt-4">Coding Complete!</h2>
                    <p class="text-xl text-blue-400 mt-2">${finalStats.wpm} WPM | ${finalStats.accuracy}% ACC</p>
                    <a href="/practice/studio/" class="inline-block mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition-colors">Return to Studio</a>
                </div>
            `;
            this.focusOverlay.classList.remove('opacity-0', 'pointer-events-none');
            
        } catch (error) {
            console.error(error);
            alert("Error saving stats");
        }
    }
}
