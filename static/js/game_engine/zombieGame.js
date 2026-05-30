import GameLoop from './GameLoop.js';
import InputManager from './InputManager.js';
import AudioManager from './AudioManager.js';
import ParticleSystem from './ParticleSystem.js';
import Zombie, { ZOMBIE_STATES } from './Zombie.js';
import WaveManager, { WAVE_STATE } from './WaveManager.js';

const DICTIONARY = [
    "survive", "horde", "undead", "blood", "brains", "flesh", "bite",
    "virus", "apocalypse", "infection", "decay", "bones", "grave", "corpse",
    "flee", "panic", "terror", "nightmare", "shadow", "creep", "crawl",
    "monster", "demon", "ghoul", "stalker", "slayer", "shotgun", "barricade",
    "defend", "protect", "survivor", "escape", "rescue", "evacuate", "radio"
];

export default class ZombieGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Setup Systems
        this.audio = new AudioManager();
        this.input = new InputManager();
        this.particles = new ParticleSystem();
        this.waveManager = new WaveManager();
        
        // Game State
        this.zombies = [];
        this.activeZombie = null;
        
        this.score = 0;
        this.combo = 0;
        this.highestCombo = 0;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.totalStrokes = 0;
        this.correctStrokes = 0;
        this.timeElapsed = 0;
        
        this.isGameOver = false;
        this.isStarted = false;
        this.isPaused = false;
        
        // Resize handling
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.canvas.width = entry.contentRect.width;
                this.canvas.height = entry.contentRect.height;
            }
        });
        this.resizeObserver.observe(this.canvas.parentElement);
        
        // Input Hooks
        this.input.onKeyPress = (key) => this.handleTyping(key);
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.togglePause();
        });
        
        // Wave Hooks
        this.waveManager.onSpawn = (speed, isElite) => this.spawnZombie(speed, isElite);
        this.waveManager.onWaveComplete = (nextWave) => {
            this.audio.playWaveComplete();
            this.health = Math.min(this.maxHealth, this.health + 20); // Heal 20 on wave complete
            this.updateHUD();
        };
        
        // Loop
        this.loop = new GameLoop((dt) => this.update(dt), () => this.draw());
    }
    
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.audio.resume();
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
        if (key.length !== 1) return;
        
        this.totalStrokes++;
        
        if (!this.activeZombie) {
            // Find closest zombie starting with the key
            let closest = null;
            let minDistance = Infinity;
            const playerX = this.canvas.width / 2;
            
            this.zombies.forEach(z => {
                if (z.state === ZOMBIE_STATES.DEAD || z.state === ZOMBIE_STATES.ATTACKING) return;
                if (z.text.startsWith(key) && !z.markedForDeletion) {
                    const dist = Math.abs(z.x - playerX);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closest = z;
                    }
                }
            });
            
            if (closest) {
                this.activeZombie = closest;
                this.activeZombie.isActive = true;
            }
        }
        
        if (this.activeZombie) {
            const result = this.activeZombie.typeChar(key);
            if (result === 'HIT' || result === 'COMPLETED') {
                this.correctStrokes++;
                
                if (result === 'COMPLETED') {
                    this.audio.playZombieDeath();
                    this.particles.spawn(this.activeZombie.x, this.activeZombie.y - 20, '#ef4444', 30);
                    
                    this.combo++;
                    if (this.combo > this.highestCombo) this.highestCombo = this.combo;
                    
                    if (this.combo % 10 === 0) this.audio.playCombo();
                    
                    const comboMult = Math.min(5, 1 + Math.floor(this.combo / 10) * 0.5);
                    const basePoints = this.activeZombie.isElite ? 250 : 100;
                    this.score += Math.floor(basePoints * comboMult);
                    
                    this.activeZombie = null;
                } else {
                    this.audio.playZombieHit();
                    this.particles.spawn(this.activeZombie.x, this.activeZombie.y - 10, '#f87171', 5);
                }
            } else if (result === 'MISS') {
                this.audio.playMiss();
                this.combo = 0;
            }
        } else {
            this.audio.playMiss();
            this.combo = 0;
        }
        this.updateHUD();
    }
    
    spawnZombie(speed, isElite) {
        const text = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
        this.zombies.push(new Zombie(text, this.canvas.width, this.canvas.height, speed, isElite));
    }
    
    update(dt) {
        if (this.isGameOver) return;
        this.timeElapsed += dt;
        
        const playerX = this.canvas.width / 2;
        
        this.waveManager.update(dt, this.zombies.length);
        this.particles.update(dt);
        
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            z.update(dt, playerX);
            
            // Handle Damage Application
            if (z.state === ZOMBIE_STATES.ATTACKING && z.damageDealt && !z.damageApplied) {
                z.damageApplied = true;
                
                // Damage Cooldown (Invincibility frames for 0.5s)
                if (this.timeElapsed - (this.lastDamageTime || 0) > 0.5) {
                    this.lastDamageTime = this.timeElapsed;
                    this.health -= z.isElite ? 25 : 10;
                    this.combo = 0;
                    this.audio.playPlayerDamage();
                    this.updateHUD();
                }
                
                if (this.activeZombie === z) {
                    this.activeZombie = null;
                }
                
                if (this.health <= 0) {
                    this.triggerGameOver();
                }
            }
            
            if (z.markedForDeletion) {
                if (this.activeZombie === z) this.activeZombie = null;
                this.zombies.splice(i, 1);
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Player Base (Center)
        const playerX = this.canvas.width / 2;
        const playerY = this.canvas.height - 40;
        
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillRect(playerX - 20, playerY, 40, 40);
        
        // Draw Wave Intermission Text
        if (this.waveManager.state === WAVE_STATE.INTERMISSION) {
            this.ctx.font = "bold 40px 'Inter', sans-serif";
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            const text = this.waveManager.currentWave === 1 ? "Get Ready" : `Wave ${this.waveManager.currentWave} Complete`;
            this.ctx.fillText(text, this.canvas.width/2, this.canvas.height/2 - 20);
            
            this.ctx.font = "20px 'Inter', sans-serif";
            this.ctx.fillStyle = "#9ca3af";
            this.ctx.fillText(`Next wave in ${Math.ceil(this.waveManager.stateTimer)}s`, this.canvas.width/2, this.canvas.height/2 + 20);
        }
        
        // Draw Entities & Particles
        this.zombies.forEach(z => z.draw(this.ctx));
        this.particles.draw(this.ctx);
        
        // Debug Overlay
        if (document.getElementById('debug-toggle') && document.getElementById('debug-toggle').checked) {
            this.ctx.font = "12px monospace";
            this.ctx.fillStyle = "#00ff00";
            this.ctx.textAlign = "left";
            this.ctx.fillText(`FPS: ~${Math.round(1 / (this.loop.lastDelta || 0.016))}`, 10, 20);
            this.ctx.fillText(`Zombies: ${this.zombies.length}`, 10, 35);
            this.ctx.fillText(`Particles: ${this.particles.particles.length}`, 10, 50);
            this.ctx.fillText(`State: ${this.waveManager.state}`, 10, 65);
        }
    }
    
    updateHUD() {
        document.getElementById('hud-score').innerText = this.score;
        document.getElementById('hud-combo').innerText = this.combo > 0 ? `x${this.combo}` : '';
        document.getElementById('hud-wave').innerText = `Wave ${this.waveManager.currentWave}`;
        
        const healthBar = document.getElementById('health-fill');
        const hpPercent = Math.max(0, (this.health / this.maxHealth) * 100);
        healthBar.style.width = `${hpPercent}%`;
        
        if (hpPercent > 50) healthBar.className = "h-full bg-green-500 transition-all duration-300";
        else if (hpPercent > 20) healthBar.className = "h-full bg-yellow-500 transition-all duration-300";
        else healthBar.className = "h-full bg-red-600 transition-all duration-300 animate-pulse";
    }
    
    triggerGameOver() {
        this.isGameOver = true;
        this.loop.stop();
        this.input.destroy();
        this.audio.playGameOver();
        
        const accuracy = this.totalStrokes > 0 ? (this.correctStrokes / this.totalStrokes) * 100 : 0;
        
        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('final-wave').innerText = `Survived to Wave ${this.waveManager.currentWave}`;
        
        // Save Score API
        fetch('/games/api/save-game-score/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_type: 'zombie_typing',
                score: this.score,
                accuracy: accuracy,
                highest_combo: this.highestCombo,
                level_reached: this.waveManager.currentWave,
                duration: Math.round(this.timeElapsed)
            })
        }).then(res => res.json()).then(data => {
            if(data.status === 'success') {
                const resultsLink = document.getElementById('results-btn');
                resultsLink.href = `/dashboard/`;
                resultsLink.classList.remove('hidden');
            }
        });
    }
}
