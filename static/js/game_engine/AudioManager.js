export default class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }
    
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    playTone(frequency, type, duration, vol) {
        if (!this.enabled) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    }
    
    playType() { this.playTone(600, 'sine', 0.05, 0.1); }
    playHit() { this.playTone(1200, 'sine', 0.1, 0.2); }
    playMiss() { this.playTone(150, 'sawtooth', 0.3, 0.3); }
    playCombo() { this.playTone(800, 'square', 0.2, 0.15); }
    playGameOver() { this.playTone(100, 'sawtooth', 1.0, 0.4); }
    
    // Zombie Extensions
    playZombieHit() { this.playTone(200, 'square', 0.1, 0.2); }
    playZombieDeath() { this.playTone(100, 'sawtooth', 0.4, 0.3); }
    playPlayerDamage() { this.playTone(50, 'sawtooth', 0.5, 0.5); }
    playWaveComplete() { this.playTone(600, 'sine', 0.8, 0.2); }
    
    // Racing Extensions
    playEngineRev() { this.playTone(150, 'sawtooth', 0.1, 0.1); }
    playBoostActivate() { this.playTone(1000, 'sine', 0.5, 0.2); }
    playCollision() { this.playTone(100, 'square', 0.2, 0.4); }
    playFinishLine() { this.playTone(800, 'sine', 1.0, 0.2); }
    
    // Space Shooter Extensions
    playLaser() { this.playTone(1200, 'sine', 0.1, 0.1); }
    playExplosion() { this.playTone(150, 'sawtooth', 0.3, 0.4); }
    playShieldHit() { this.playTone(600, 'square', 0.1, 0.2); }
    playBossWarning() { this.playTone(200, 'square', 0.8, 0.5); }
}
