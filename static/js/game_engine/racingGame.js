import GameLoop from './GameLoop.js';
import InputManager from './InputManager.js';
import AudioManager from './AudioManager.js';
import ParticleSystem from './ParticleSystem.js';
import Car from './Car.js';
import OpponentAI from './OpponentAI.js';
import TrackManager from './TrackManager.js';

const PARAGRAPH = "The roar of the engines echoed through the valley as the cars lined up at the starting grid. Adrenaline pumped through their veins, fingers gripping the steering wheels tight. When the green light flashed, tires screeched against the asphalt, leaving trails of smoke behind. The race was a blur of neon and chrome, each driver fighting for the lead. Slipstreaming past opponents, drifting around tight corners, and hitting the nitro boost on the final straightaway were the keys to victory. Only the fastest typist would cross the finish line first and claim the championship trophy.";

export default class RacingGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Systems
        this.audio = new AudioManager();
        this.input = new InputManager();
        this.particles = new ParticleSystem();
        
        // Resize handling
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.canvas.width = entry.contentRect.width;
                this.canvas.height = entry.contentRect.height;
                if (!this.isStarted) this.draw();
            }
        });
        this.resizeObserver.observe(this.canvas.parentElement);
        
        // Text Logic
        this.text = PARAGRAPH;
        this.typedText = "";
        
        // Track Distance logic
        // 1 character = 50 units of distance
        this.totalDistance = this.text.length * 50; 
        
        // State
        this.isStarted = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.timeElapsed = 0;
        
        // Scoring
        this.score = 0;
        this.combo = 0;
        this.highestCombo = 0;
        this.totalStrokes = 0;
        this.correctStrokes = 0;
        this.mistakes = 0;
        
        // Entities
        this.track = new TrackManager(this.canvas.width, this.canvas.height, 4);
        
        const laneWidth = this.canvas.width / 4;
        this.player = new Car(laneWidth * 1.5 - 20, this.canvas.height - 120, '#ef4444'); // Red car in lane 2
        
        this.opponents = [
            new OpponentAI(laneWidth * 0.5 - 20, this.canvas.height - 120, '#3b82f6', 220, 0.9), // Blue in lane 1
            new OpponentAI(laneWidth * 2.5 - 20, this.canvas.height - 120, '#10b981', 250, 1.0), // Green in lane 3
            new OpponentAI(laneWidth * 3.5 - 20, this.canvas.height - 120, '#f59e0b', 280, 1.1)  // Yellow in lane 4
        ];
        
        // Hooks
        this.input.onKeyPress = (key) => this.handleTyping(key);
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.togglePause();
        });
        
        // Loop
        this.loop = new GameLoop((dt) => this.update(dt), () => this.draw());
        
        // Force initial draw
        setTimeout(() => this.draw(), 100);
    }
    
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.audio.resume();
        this.audio.playEngineRev();
        this.loop.start();
        document.getElementById('start-overlay').classList.add('hidden');
        this.updateHUD();
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
        if (key.length !== 1) return;
        
        this.totalStrokes++;
        const nextChar = this.text[this.typedText.length];
        
        if (key === nextChar) {
            this.correctStrokes++;
            this.typedText += key;
            this.combo++;
            if (this.combo > this.highestCombo) this.highestCombo = this.combo;
            
            this.player.throttle = 1.0; // Injects 0.4s of smooth continuous acceleration
            
            // Nitro combo triggers
            if (this.combo > 0 && this.combo % 20 === 0) {
                this.player.activateNitro(2.0);
                this.audio.playBoostActivate();
                this.particles.spawn(this.player.x + 20, this.player.y + 70, '#60a5fa', 20);
            } else {
                this.audio.playType();
            }
            
            // Reached finish line
            if (this.typedText.length === this.text.length) {
                this.triggerFinishLine();
            }
            
            const viewport = document.getElementById('racing-viewport-frame');
            if (viewport) {
                viewport.classList.remove('shake-active');
                void viewport.offsetWidth; // trigger reflow
                viewport.classList.add('shake-active');
            }
            
        } else {
            this.mistakes++;
            this.combo = 0;
            this.player.throttle = 0; // Kills momentum generation instantly
            this.player.speed *= 0.5; // Instant 50% velocity penalty on mistake
            
            this.audio.playCollision(); // Collision/error sound
            this.particles.spawn(this.player.x + 20, this.player.y + 10, '#f87171', 10);
            
            // Screen shake effect and Red Flash
            const viewport = document.getElementById('racing-viewport-frame');
            if (viewport) {
                viewport.classList.add('error-flash', 'shake-active');
                setTimeout(() => {
                    viewport.classList.remove('error-flash', 'shake-active');
                }, 150);
            }
            
            const errorOverlay = document.getElementById('error-overlay');
            if (errorOverlay) {
                errorOverlay.style.opacity = '1';
                setTimeout(() => errorOverlay.style.opacity = '0', 150);
            }
        }
        
        this.updateTextUI();
    }
    
    update(dt) {
        if (this.isGameOver) return;
        this.timeElapsed += dt;
        
        this.player.update(dt);
        
        // Track visual speed maps to player speed
        this.track.update(dt, this.player.speed);
        
        // Update opponents
        this.opponents.forEach(ai => {
            ai.updateAI(dt, this.player.progress, this.player.speed);
            
            // Check finish line for AI
            if (ai.progress >= this.totalDistance && !ai.hasFinished) {
                ai.hasFinished = true;
            }
        });
        
        // Throttled engine sounds based on speed
        if (this.player.speed > 100) {
            this.engineTimer = (this.engineTimer || 0) + dt;
            if (this.engineTimer > 0.8) {
                this.audio.playEngineRev();
                this.engineTimer = 0;
            }
        }
        
        this.particles.update(dt);
        this.updateHUD();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Ensure track is responsive
        this.track.width = this.canvas.width;
        this.track.height = this.canvas.height;
        this.track.laneWidth = this.canvas.width / 4;
        this.track.draw(this.ctx);
        
        // Proportional Player Y (fixed offset from bottom of racing panel)
        const playerRenderY = this.canvas.height - 150;
        
        // Draw opponents relative to player progress
        this.opponents.forEach(ai => {
            const progressDiff = ai.progress - this.player.progress;
            
            // Scale progress diff to pixels (e.g. 1 unit of progress = 1 pixel visually)
            const renderY = playerRenderY - progressDiff;
            
            // Update X dynamically to match lane width on resize
            if (ai.color === '#3b82f6') ai.x = this.track.laneWidth * 0.5 - 20;
            if (ai.color === '#10b981') ai.x = this.track.laneWidth * 2.5 - 20;
            if (ai.color === '#f59e0b') ai.x = this.track.laneWidth * 3.5 - 20;
            
            // Draw if within bounds
            if (renderY > -100 && renderY < this.canvas.height + 100) {
                ai.draw(this.ctx, ai.x, renderY);
            }
        });
        
        // Draw player
        this.player.x = this.track.laneWidth * 1.5 - 20;
        this.player.draw(this.ctx, this.player.x, playerRenderY);
        
        // Draw particles (offset by speed for moving effect)
        this.particles.particles.forEach(p => {
            p.y += this.player.speed * (this.loop.lastDelta || 0.016);
        });
        this.particles.draw(this.ctx);
        
        // Finish line drawing
        const finishLineDist = this.totalDistance - this.player.progress;
        if (finishLineDist < this.canvas.height) {
            const finishY = playerRenderY - finishLineDist;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, finishY, this.canvas.width, 20);
            
            // Checkerboard pattern
            this.ctx.fillStyle = '#000000';
            for (let i = 0; i < this.canvas.width; i += 20) {
                this.ctx.fillRect(i, finishY + ((i / 20) % 2 === 0 ? 0 : 10), 20, 10);
            }
        }
        
        // Debug Overlay
        if (document.getElementById('debug-toggle') && document.getElementById('debug-toggle').checked) {
            this.ctx.font = "12px monospace";
            this.ctx.fillStyle = "#00ff00";
            this.ctx.textAlign = "left";
            this.ctx.fillText(`FPS: ~${Math.round(1 / (this.loop.lastDelta || 0.016))}`, 10, 20);
            this.ctx.fillText(`Player Speed: ${Math.round(this.player.speed)}`, 10, 35);
            this.ctx.fillText(`Progress: ${Math.round(this.player.progress)}/${this.totalDistance}`, 10, 50);
        }
    }
    
    updateTextUI() {
        const textContainer = document.getElementById('typing-text');
        if (!textContainer) return;
        
        const typed = this.text.substring(0, this.typedText.length);
        const next = this.text.substring(this.typedText.length, this.typedText.length + 1);
        const untyped = this.text.substring(this.typedText.length + 1);
        
        textContainer.innerHTML = `<span class="char-correct">${typed}</span><span class="char-active">${next}</span><span class="char-untyped">${untyped}</span>`;
    }
    
    updateHUD() {
        document.getElementById('hud-speed').innerText = `${Math.round(this.player.speed)} MPH`;
        
        // Calculate Placement
        let place = 1;
        this.opponents.forEach(ai => {
            if (ai.progress > this.player.progress) place++;
        });
        
        let suffix = "th";
        if (place === 1) suffix = "st";
        else if (place === 2) suffix = "nd";
        else if (place === 3) suffix = "rd";
        
        document.getElementById('hud-position').innerText = `${place}${suffix}`;
        
        const progressPercent = Math.min(100, (this.player.progress / this.totalDistance) * 100);
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;
        
        // Update Typing Panel Stats
        const minutes = this.timeElapsed / 60;
        const words = this.correctStrokes / 5;
        const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
        const accuracy = this.totalStrokes > 0 ? Math.round((this.correctStrokes / this.totalStrokes) * 100) : 100;
        
        const wpmEl = document.getElementById('stat-wpm');
        if(wpmEl) wpmEl.innerText = wpm;
        
        const accEl = document.getElementById('stat-accuracy');
        if(accEl) accEl.innerText = `${accuracy}%`;
        
        const comboEl = document.getElementById('stat-combo');
        if(comboEl) comboEl.innerText = this.combo;
        
        const timeEl = document.getElementById('stat-time');
        if(timeEl) timeEl.innerText = `${Math.floor(this.timeElapsed)}s`;
        
        const mistakesEl = document.getElementById('stat-mistakes');
        if(mistakesEl) mistakesEl.innerText = this.mistakes;
    }
    
    triggerFinishLine() {
        this.player.hasFinished = true;
        this.isGameOver = true;
        this.audio.playFinishLine();
        
        // Calculate Placement
        let place = 1;
        this.opponents.forEach(ai => {
            if (ai.progress >= this.totalDistance) place++;
        });
        
        // Base score = WPM * 10
        const minutes = this.timeElapsed / 60;
        const words = this.text.length / 5;
        const wpm = Math.round(words / minutes);
        
        // Placement bonus
        const placementBonus = place === 1 ? 2000 : place === 2 ? 1000 : place === 3 ? 500 : 0;
        this.score = (wpm * 10) + placementBonus;
        
        const accuracy = this.totalStrokes > 0 ? (this.correctStrokes / this.totalStrokes) * 100 : 0;
        
        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('final-position').innerText = `${place}${place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} Place`;
        document.getElementById('final-speed').innerText = `${wpm} WPM`;
        document.getElementById('final-score').innerText = this.score;
        
        // API Call
        fetch('/games/api/save-game-score/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game_type: 'racing_typing',
                score: this.score,
                accuracy: accuracy,
                highest_combo: this.highestCombo,
                level_reached: place, // use level_reached for placement storage
                duration: Math.round(this.timeElapsed)
            })
        }).then(res => res.json()).then(data => {
            if(data.status === 'success') {
                const resultsLink = document.getElementById('results-btn');
                resultsLink.href = `/dashboard/`;
                resultsLink.classList.remove('hidden');
            }
        });
        
        // Let it coast visually for a few seconds
        setTimeout(() => this.loop.stop(), 3000);
    }
}
