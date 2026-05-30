import GameLoop from './GameLoop.js';
import InputManager from './InputManager.js';
import AudioManager from './AudioManager.js';
import ParticleSystem from './ParticleSystem.js';
import FallingWord from './FallingWord.js';

const DICTIONARY = [
    "algorithm", "array", "binary", "boolean", "byte", "cache", "compiler",
    "debug", "element", "function", "gateway", "hash", "index", "java",
    "kernel", "logic", "macro", "node", "object", "pixel", "query",
    "router", "server", "token", "url", "variable", "widget", "xml",
    "yield", "zone", "developer", "engineering", "interface", "network",
    "database", "protocol", "security", "framework", "terminal", "console"
];

export default class FallingWordsGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Setup Systems
        this.audio = new AudioManager();
        this.input = new InputManager();
        this.particles = new ParticleSystem();
        
        // Game State
        this.words = [];
        this.activeWord = null;
        
        this.score = 0;
        this.combo = 0;
        this.highestCombo = 0;
        this.lives = 3;
        this.level = 1;
        this.totalStrokes = 0;
        this.correctStrokes = 0;
        
        // Timers & Scaling
        this.timeElapsed = 0;
        this.timeSinceLastSpawn = 0;
        this.spawnInterval = 2.5; // seconds
        this.baseSpeed = 40; // px per sec
        
        this.isGameOver = false;
        this.isStarted = false;
        this.isPaused = false;
        
        // Resize handling (ResizeObserver for exact element scaling)
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.canvas.width = entry.contentRect.width;
                this.canvas.height = entry.contentRect.height;
            }
        });
        this.resizeObserver.observe(this.canvas.parentElement);
        
        // Input Hook
        this.input.onKeyPress = (key) => this.handleTyping(key);
        
        // Blur / Focus handling
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.togglePause();
        });
        
        // Loop
        this.loop = new GameLoop((dt) => this.update(dt), () => this.draw());
    }
    
    resize() {
        // Match actual CSS pixels for sharp rendering
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.audio.resume();
        this.spawnWord();
        this.loop.start();
        document.getElementById('start-overlay').classList.add('hidden');
    }
    
    pause() {
        if (!this.isStarted || this.isGameOver || this.isPaused) return;
        this.isPaused = true;
        this.loop.stop();
        document.getElementById('pause-overlay').classList.remove('hidden');
    }
    
    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.audio.resume();
        this.loop.start();
        document.getElementById('pause-overlay').classList.add('hidden');
    }
    
    togglePause() {
        if (this.isPaused) this.resume();
        else this.pause();
    }
    
    handleTyping(key) {
        if (!this.isStarted || this.isGameOver || this.isPaused) return;
        if (key.length !== 1) return; // Only process printable chars
        
        this.totalStrokes++;
        
        if (!this.activeWord) {
            // Find a word starting with the key
            const match = this.words.find(w => w.text.startsWith(key) && !w.markedForDeletion);
            if (match) {
                this.activeWord = match;
                this.activeWord.isActive = true;
            }
        }
        
        if (this.activeWord) {
            const result = this.activeWord.typeChar(key);
            if (result === 'HIT' || result === 'COMPLETED') {
                this.audio.playType();
                this.correctStrokes++;
                
                if (result === 'COMPLETED') {
                    this.audio.playHit();
                    this.particles.spawn(this.activeWord.x + this.activeWord.width/2, this.activeWord.y, '#22c55e', 20);
                    
                    this.combo++;
                    if (this.combo > this.highestCombo) this.highestCombo = this.combo;
                    
                    if (this.combo % 5 === 0) this.audio.playCombo();
                    
                    // Score = word length * 10 * combo multiplier (capped at 5)
                    const comboMult = Math.min(5, 1 + Math.floor(this.combo / 5) * 0.5);
                    this.score += Math.floor(this.activeWord.text.length * 10 * comboMult);
                    
                    this.activeWord = null;
                }
            } else if (result === 'MISS') {
                this.audio.playMiss();
                this.combo = 0;
            }
        } else {
            // Typed a wrong letter with no active word
            this.audio.playMiss();
            this.combo = 0;
        }
        this.updateHUD();
    }
    
    spawnWord() {
        const text = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
        // Speed increases by 10% per level
        const currentSpeed = this.baseSpeed * Math.pow(1.1, this.level - 1);
        this.words.push(new FallingWord(text, this.canvas.width, currentSpeed, this.level));
    }
    
    update(dt) {
        if (this.isGameOver) return;
        
        this.timeElapsed += dt;
        this.timeSinceLastSpawn += dt;
        
        // Level up every 15 seconds
        if (this.level < Math.floor(this.timeElapsed / 15) + 1) {
            this.level = Math.floor(this.timeElapsed / 15) + 1;
            this.spawnInterval = Math.max(0.8, this.spawnInterval * 0.9); // Spawn faster
        }
        
        if (this.timeSinceLastSpawn >= this.spawnInterval) {
            this.spawnWord();
            this.timeSinceLastSpawn = 0;
        }
        
        this.particles.update(dt);
        
        for (let i = this.words.length - 1; i >= 0; i--) {
            const word = this.words[i];
            word.update(dt, this.canvas.height);
            
            if (word.markedForDeletion) {
                if (word.missed) {
                    this.audio.playMiss();
                    this.lives--;
                    this.combo = 0;
                    this.updateHUD();
                    
                    if (word === this.activeWord) {
                        this.activeWord = null;
                    }
                    
                    // Screen shake could go here
                    if (this.lives <= 0) {
                        this.triggerGameOver();
                    }
                }
                this.words.splice(i, 1);
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.words.forEach(w => w.draw(this.ctx));
        this.particles.draw(this.ctx);
    }
    
    updateHUD() {
        document.getElementById('hud-score').innerText = this.score;
        document.getElementById('hud-combo').innerText = this.combo > 0 ? `x${this.combo}` : '';
        document.getElementById('hud-lives').innerText = '❤️'.repeat(Math.max(0, this.lives));
    }
    
    triggerGameOver() {
        this.isGameOver = true;
        this.loop.stop();
        this.input.destroy();
        this.audio.playGameOver();
        
        const accuracy = this.totalStrokes > 0 ? (this.correctStrokes / this.totalStrokes) * 100 : 0;
        
        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
        
        // Save Score API
        fetch('/games/api/save-game-score/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                game_type: 'falling_words',
                score: this.score,
                accuracy: accuracy,
                highest_combo: this.highestCombo,
                level_reached: this.level,
                duration: Math.round(this.timeElapsed)
            })
        }).then(res => res.json()).then(data => {
            if(data.status === 'success') {
                const resultsLink = document.getElementById('results-btn');
                resultsLink.href = `/dashboard/`; // We can redirect to a dedicated game result later
                resultsLink.classList.remove('hidden');
            }
        });
    }
}
