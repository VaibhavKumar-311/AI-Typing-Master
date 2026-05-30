import { fetchParagraph } from './paragraphLoader.js';
import { StatsCalculator } from './statsCalculator.js';
import { Timer } from './timer.js';

class TypingEngine {
    constructor() {
        this.textContainer = document.getElementById('text-container');
        this.typingArea = document.getElementById('typing-area');
        this.caret = document.getElementById('caret');
        this.focusOverlay = document.getElementById('focus-overlay');
        
        this.timerDisplay = document.getElementById('timer-display');
        this.wpmDisplay = document.getElementById('wpm-display');
        this.accDisplay = document.getElementById('accuracy-display');
        
        this.timeSelector = document.getElementById('time-selector');
        this.categorySelector = document.getElementById('category-selector');
        this.difficultySelector = document.getElementById('difficulty-selector');

        this.text = "";
        this.charElements = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.hasStarted = false;
        
        this.duration = parseInt(this.timeSelector.value);

        this.stats = new StatsCalculator();
        this.timer = new Timer(
            this.duration,
            (time) => { this.timerDisplay.innerText = time; this.updateLiveStats(); },
            () => this.endTest()
        );

        this.initEventListeners();
        this.loadNewTest();
    }

    initEventListeners() {
        this.typingArea.addEventListener('click', () => this.focus());
        this.focusOverlay.addEventListener('click', () => this.focus());
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) {
                if (e.key.length === 1 || e.key === 'Backspace') {
                    this.focus();
                }
            }
        });
        
        this.typingArea.addEventListener('blur', () => this.blur());
        this.typingArea.addEventListener('keydown', (e) => this.handleKeyDown(e));

        this.timeSelector.addEventListener('change', () => {
            this.duration = parseInt(this.timeSelector.value);
            this.loadNewTest();
        });
        this.categorySelector.addEventListener('change', () => this.loadNewTest());
        this.difficultySelector.addEventListener('change', () => this.loadNewTest());

        this.typingArea.addEventListener('paste', (e) => {
            e.preventDefault();
        });
        this.typingArea.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // prevent right click
        });
    }

    async loadNewTest() {
        this.resetState();
        this.textContainer.innerHTML = '<span class="text-gray-500">Loading paragraph...</span>';
        
        const category = this.categorySelector.value;
        const difficulty = this.difficultySelector.value;
        
        this.text = await fetchParagraph(category, difficulty, GET_PARAGRAPH_URL);
        this.renderText();
    }

    resetState() {
        this.timer.reset(this.duration);
        this.stats.reset();
        this.currentIndex = 0;
        this.hasStarted = false;
        this.charElements = [];
        this.updateLiveStats(true);
        this.caret.style.display = 'none';
    }

    renderText() {
        this.textContainer.innerHTML = '';
        this.charElements = [];
        
        for (let i = 0; i < this.text.length; i++) {
            const span = document.createElement('span');
            span.innerText = this.text[i];
            this.charElements.push(span);
            this.textContainer.appendChild(span);
        }
        
        if (this.isActive) {
            this.updateCaretPosition();
        }
    }

    focus() {
        this.isActive = true;
        this.focusOverlay.classList.add('opacity-0', 'pointer-events-none');
        this.typingArea.focus();
        this.updateCaretPosition();
        this.caret.classList.add('caret-blink');
    }

    blur() {
        this.isActive = false;
        this.focusOverlay.classList.remove('opacity-0', 'pointer-events-none');
        this.caret.style.display = 'none';
    }

    handleKeyDown(e) {
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
        
        if (e.isTrusted === false) return;

        e.preventDefault();

        if (!this.hasStarted) {
            this.hasStarted = true;
            this.stats.start();
            this.timer.start();
            this.caret.classList.remove('caret-blink');
            this.lastKeyPressTime = Date.now();
        }

        if (e.key === 'Backspace') {
            if (window.ThemeManager) window.ThemeManager.playKeystroke();
            this.handleBackspace();
        } else if (e.key.length === 1) {
            if (window.ThemeManager) window.ThemeManager.playKeystroke();
            this.handleCharacter(e.key);
        }

        this.updateCaretPosition();
        
        if (this.currentIndex >= this.text.length) {
            this.endTest();
        }
    }

    handleBackspace() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            const charEl = this.charElements[this.currentIndex];
            
            const wasCorrect = charEl.classList.contains('correct');
            this.stats.handleBackspace(wasCorrect);
            
            charEl.classList.remove('correct', 'incorrect');
        }
    }

    handleCharacter(key) {
        if (this.currentIndex < this.text.length) {
            const expectedChar = this.text[this.currentIndex];
            const charEl = this.charElements[this.currentIndex];
            
            const isCorrect = (key === expectedChar);
            const now = Date.now();
            const timeSinceLast = this.lastKeyPressTime ? now - this.lastKeyPressTime : 0;
            this.lastKeyPressTime = now;
            
            this.stats.update(isCorrect, expectedChar, key, timeSinceLast);
            
            if (isCorrect) {
                charEl.classList.add('correct');
            } else {
                charEl.classList.add('incorrect');
            }
            
            this.currentIndex++;
        }
    }

    updateCaretPosition() {
        if (this.charElements.length === 0) return;
        
        this.caret.style.display = 'block';
        
        if (this.currentIndex < this.text.length) {
            const charEl = this.charElements[this.currentIndex];
            this.caret.style.left = `${charEl.offsetLeft}px`;
            this.caret.style.top = `${charEl.offsetTop}px`;
            
            this.charElements.forEach(el => el.classList.remove('active-char'));
            charEl.classList.add('active-char');
        } else {
            const lastChar = this.charElements[this.text.length - 1];
            this.caret.style.left = `${lastChar.offsetLeft + lastChar.offsetWidth}px`;
            this.charElements.forEach(el => el.classList.remove('active-char'));
        }
    }

    updateLiveStats(forceReset = false) {
        if (forceReset) {
            this.wpmDisplay.innerText = "0";
            this.accDisplay.innerText = "100%";
            return;
        }
        const timeElapsed = (Date.now() - this.stats.startTime) / 1000;
        const currentStats = this.stats.getStats(timeElapsed);
        
        this.wpmDisplay.innerText = currentStats.wpm;
        this.accDisplay.innerText = `${currentStats.accuracy}%`;
    }

    async endTest() {
        this.timer.stop();
        this.blur();
        
        const timeElapsed = (Date.now() - this.stats.startTime) / 1000;
        const finalStats = this.stats.getStats(timeElapsed);
        
        try {
            const response = await fetch(SAVE_RESULT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRF_TOKEN
                },
                body: JSON.stringify({
                    wpm: finalStats.wpm,
                    cpm: finalStats.cpm,
                    accuracy: parseFloat(finalStats.accuracy),
                    mistakes: finalStats.mistakes,
                    duration: Math.round(timeElapsed),
                    category: this.categorySelector.value,
                    difficulty: this.difficultySelector.value
                })
            });
            const data = await response.json();
            
            // Fire-and-forget Analytics payload
            fetch('/analytics/api/save-metrics/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRF_TOKEN
                },
                body: JSON.stringify({
                    key_events: finalStats.keyEvents,
                    wpm: finalStats.wpm,
                    accuracy: parseFloat(finalStats.accuracy)
                })
            }).catch(e => console.error("Analytics Error", e));

            if (data.status === 'success' && data.result_id) {
                let redirectUrl = `/test/result/${data.result_id}/`;
                if (data.leveled_up) {
                    redirectUrl += '?leveled_up=1';
                }
                window.location.href = redirectUrl;
            } else {
                alert("Test finished but couldn't save result.");
                this.loadNewTest();
            }
        } catch (error) {
            console.error("Failed to save result", error);
            alert("Error saving test result.");
            this.loadNewTest();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TypingEngine();
});
