import GameLoop from './GameLoop.js';
import InputManager from './InputManager.js';
import AudioManager from './AudioManager.js';
import ParticleSystem from './ParticleSystem.js';
import Projectile from './Projectile.js';
import EnemyShip, { ENEMY_STATE } from './EnemyShip.js';
import BossEnemy from './BossEnemy.js';
import FormationManager, { WAVE_STATE, FORMATION_TYPE } from './FormationManager.js';

const DICTIONARY = [
    "asteroid", "nebula", "galaxy", "orbit", "quasar", "pulsar", "laser",
    "shield", "hyperdrive", "plasma", "meteor", "comet", "starlight", "eclipse",
    "gravity", "quantum", "voyager", "apollo", "shuttle", "rocket", "thrust",
    "photon", "proton", "neutron", "nucleus", "cosmos", "universe", "vacuum",
    "alien", "cyborg", "drone", "mothership", "fleet", "squadron", "wingman",
    "missile", "torpedo", "blaster", "cannon", "radar", "sonar", "beacon"
];

const BOSS_WORDS = [
    "EXTERMINATE", "ANNIHILATE", "OBLITERATE", "ERADICATE", "DEVASTATE"
];

export default class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Systems
        this.audio = new AudioManager();
        this.input = new InputManager();
        this.particles = new ParticleSystem();
        this.waveManager = new FormationManager();
        
        // State
        this.enemies = [];
        this.projectiles = [];
        this.activeEnemy = null;
        
        this.stars = this.generateStars(100);
        
        this.score = 0;
        this.combo = 0;
        this.highestCombo = 0;
        this.maxShield = 100;
        this.shield = this.maxShield;
        
        this.totalStrokes = 0;
        this.correctStrokes = 0;
        this.enemiesDestroyed = 0;
        this.bossesKilled = 0;
        this.timeElapsed = 0;
        
        this.isGameOver = false;
        this.isStarted = false;
        this.isPaused = false;
        
        // Resize handling
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.canvas.width = entry.contentRect.width;
                this.canvas.height = entry.contentRect.height;
                if (!this.isStarted) this.draw();
            }
        });
        this.resizeObserver.observe(this.canvas.parentElement);
        
        // Hooks
        this.input.onKeyPress = (key) => this.handleTyping(key);
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.togglePause();
        });
        
        // Formation Hooks
        this.waveManager.onSpawnFormation = (type, count, speed) => this.spawnFormation(type, count, speed);
        this.waveManager.onSpawnBoss = (wave) => this.spawnBoss(speed);
        this.waveManager.onWaveComplete = (wave) => {
            this.audio.playWaveComplete();
            this.shield = Math.min(this.maxShield, this.shield + 20); // Heal 20
            this.updateHUD();
        };
        
        this.loop = new GameLoop((dt) => this.update(dt), () => this.draw());
        setTimeout(() => this.draw(), 100);
    }
    
    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * 2000, // Oversized for resize safety
                y: Math.random() * 2000,
                size: Math.random() * 2,
                speed: 10 + Math.random() * 30
            });
        }
        return stars;
    }
    
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.audio.resume();
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
        
        if (!this.activeEnemy) {
            // Find closest enemy starting with key
            let closest = null;
            let maxProgressY = -Infinity; // Target lowest enemy (closest to player)
            
            this.enemies.forEach(e => {
                if (e.state === ENEMY_STATE.DEAD || e.state === ENEMY_STATE.SPAWNING) return;
                if (e.shieldActive) return; // Boss shield
                
                if (e.text.startsWith(key) && !e.markedForDeletion) {
                    if (e.y > maxProgressY) {
                        maxProgressY = e.y;
                        closest = e;
                    }
                }
            });
            
            if (closest) {
                this.activeEnemy = closest;
                this.activeEnemy.isActive = true;
            }
        }
        
        if (this.activeEnemy) {
            const result = this.activeEnemy.typeChar(key);
            
            if (result === 'HIT' || result === 'COMPLETED' || result === 'PHASE_COMPLETE') {
                this.correctStrokes++;
                this.combo++;
                if (this.combo > this.highestCombo) this.highestCombo = this.combo;
                
                // Fire visual projectile immediately
                const playerX = this.canvas.width / 2;
                const playerY = this.canvas.height - 50;
                this.projectiles.push(new Projectile(playerX, playerY, this.activeEnemy.x, this.activeEnemy.y, 1500, '#60a5fa'));
                
                const now = performance.now();
                if (!this.lastLaserTime || now - this.lastLaserTime > 50) {
                    this.audio.playLaser();
                    this.lastLaserTime = now;
                }
                
                if (result === 'COMPLETED') {
                    this.enemiesDestroyed++;
                    
                    const comboMult = Math.min(5, 1 + Math.floor(this.combo / 10) * 0.5);
                    const basePoints = this.activeEnemy.isBoss ? 1000 : (this.activeEnemy.isElite ? 250 : 100);
                    this.score += Math.floor(basePoints * comboMult);
                    
                    if (this.activeEnemy.isBoss) {
                        this.bossesKilled++;
                    }
                    
                    this.activeEnemy = null;
                } else if (result === 'PHASE_COMPLETE') {
                    // Boss phased, break lock
                    this.activeEnemy.isActive = false;
                    this.activeEnemy = null;
                    
                    // Spawn shield-guard minions immediately
                    this.spawnFormation(FORMATION_TYPE.V_SHAPE, 3, 60);
                }
            } else if (result === 'MISS') {
                this.combo = 0;
            }
        } else {
            this.combo = 0;
        }
        this.updateHUD();
    }
    
    spawnFormation(type, count, speed) {
        const spacingX = this.canvas.width / (count + 1);
        const startY = -50;
        
        for (let i = 0; i < count; i++) {
            const text = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
            const isElite = Math.random() < 0.1;
            
            let x, y;
            if (type === FORMATION_TYPE.V_SHAPE) {
                const mid = Math.floor(count/2);
                x = spacingX * (i + 1);
                y = startY - Math.abs(i - mid) * 40;
            } else if (type === FORMATION_TYPE.LINE) {
                x = spacingX * (i + 1);
                y = startY;
            } else {
                // ARC
                x = spacingX * (i + 1);
                y = startY - Math.sin((i / (count-1)) * Math.PI) * 50;
            }
            
            this.enemies.push(new EnemyShip(text, x, y, speed, 'straight', isElite));
        }
    }
    
    spawnBoss(wave) {
        this.audio.playBossWarning();
        const startX = this.canvas.width / 2;
        const startY = -100;
        const speed = 50;
        
        // Mix a few boss words
        const words = [];
        for (let i = 0; i < 3; i++) {
            words.push(BOSS_WORDS[Math.floor(Math.random() * BOSS_WORDS.length)]);
        }
        
        this.enemies.push(new BossEnemy(words, startX, startY, speed));
    }
    
    update(dt) {
        if (this.isGameOver) return;
        this.timeElapsed += dt;
        
        const playerY = this.canvas.height - 50;
        
        this.waveManager.update(dt, this.enemies.length);
        
        // Boss Shield Logic
        const boss = this.enemies.find(e => e.isBoss);
        if (boss && boss.shieldActive) {
            const minionsAlive = this.enemies.some(e => !e.isBoss && e.state !== ENEMY_STATE.DEAD && !e.markedForDeletion);
            if (!minionsAlive && boss.stateTimer > 1.0) { // Give a small delay before shield drops
                boss.shieldActive = false;
                this.audio.playShieldHit();
            }
        }
        
        // Update Stars
        this.stars.forEach(s => {
            s.y += s.speed * dt;
            if (s.y > this.canvas.height) {
                s.y = 0;
                s.x = Math.random() * this.canvas.width;
            }
        });
        
        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt);
            if (p.markedForDeletion) {
                // Spawn impact explosion
                this.particles.spawn(p.x, p.y, p.color, 5);
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, playerY);
            
            // Damage check
            if (e.state === ENEMY_STATE.ATTACKING && e.damageDealt && !e.damageApplied) {
                e.damageApplied = true;
                
                // Damage
                this.shield -= e.isBoss ? 50 : (e.isElite ? 25 : 10);
                this.combo = 0;
                this.audio.playShieldHit();
                
                // Visual shake
                document.getElementById('game-container').classList.add('animate-shake');
                setTimeout(() => document.getElementById('game-container').classList.remove('animate-shake'), 300);
                
                if (this.activeEnemy === e) this.activeEnemy = null;
                
                if (this.shield <= 0) {
                    this.triggerGameOver();
                }
                this.updateHUD();
            }
            
            if (e.markedForDeletion) {
                // Death explosion
                if (e.state === ENEMY_STATE.DEAD) {
                    this.audio.playExplosion();
                    this.particles.spawn(e.x, e.y, e.color, e.isBoss ? 50 : 20);
                }
                if (this.activeEnemy === e) this.activeEnemy = null;
                this.enemies.splice(i, 1);
            }
        }
        
        this.particles.update(dt);
    }
    
    draw() {
        this.ctx.fillStyle = '#020617'; // Slate 950
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(s => {
            this.ctx.globalAlpha = s.size / 2;
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        this.ctx.globalAlpha = 1.0;
        
        // Draw Player Ship
        const playerX = this.canvas.width / 2;
        const playerY = this.canvas.height - 50;
        
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.beginPath();
        this.ctx.moveTo(playerX, playerY - 20);
        this.ctx.lineTo(playerX - 20, playerY + 20);
        this.ctx.lineTo(playerX, playerY + 10);
        this.ctx.lineTo(playerX + 20, playerY + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Engine Glow
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(playerX - 5, playerY + 10, 10, 15 + Math.random() * 5);
        
        // Draw Entities
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.particles.draw(this.ctx);
        
        // Draw Wave Intermission Text
        if (this.waveManager.state === WAVE_STATE.INTERMISSION) {
            this.ctx.font = "bold 40px 'Inter', sans-serif";
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            const text = this.waveManager.currentWave === 1 ? "Get Ready" : `Wave ${this.waveManager.currentWave} Cleared`;
            this.ctx.fillText(text, this.canvas.width/2, this.canvas.height/2 - 20);
        }
        
        // Debug Overlay
        if (document.getElementById('debug-toggle') && document.getElementById('debug-toggle').checked) {
            this.ctx.font = "12px monospace";
            this.ctx.fillStyle = "#00ff00";
            this.ctx.textAlign = "left";
            this.ctx.fillText(`FPS: ~${Math.round(1 / (this.loop.lastDelta || 0.016))}`, 10, 20);
            this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 35);
            this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, 10, 50);
            this.ctx.fillText(`Particles: ${this.particles.particles.length}`, 10, 65);
        }
    }
    
    updateHUD() {
        document.getElementById('hud-score').innerText = this.score;
        document.getElementById('hud-combo').innerText = this.combo > 0 ? `${this.combo}x` : '';
        document.getElementById('hud-wave').innerText = `Wave ${this.waveManager.currentWave}`;
        
        const shieldPercent = Math.max(0, (this.shield / this.maxShield) * 100);
        const fill = document.getElementById('shield-fill');
        fill.style.width = `${shieldPercent}%`;
        
        if (shieldPercent > 50) fill.className = "h-full bg-cyan-400 transition-all duration-300";
        else if (shieldPercent > 20) fill.className = "h-full bg-yellow-400 transition-all duration-300";
        else fill.className = "h-full bg-red-500 transition-all duration-300 animate-pulse";
    }
    
    triggerGameOver() {
        this.isGameOver = true;
        this.loop.stop();
        this.input.destroy();
        
        const accuracy = this.totalStrokes > 0 ? (this.correctStrokes / this.totalStrokes) * 100 : 0;
        
        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('final-wave').innerText = `Survived to Wave ${this.waveManager.currentWave}`;
        document.getElementById('final-score').innerText = this.score;
        
        // API Call
        fetch('/games/api/save-game-score/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game_type: 'space_shooter',
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
