export const WAVE_STATE = {
    INTERMISSION: 'INTERMISSION',
    ACTIVE: 'ACTIVE'
};

export default class WaveManager {
    constructor() {
        this.currentWave = 1;
        this.state = WAVE_STATE.INTERMISSION;
        this.stateTimer = 3.0; // 3 seconds before wave 1
        
        this.zombiesSpawnedThisWave = 0;
        this.zombiesToSpawn = 5;
        this.spawnTimer = 0;
        this.spawnInterval = 3.0; // Seconds between spawns
        
        this.baseSpeed = 30; // pixels per second
        this.eliteChance = 0.0;
        
        this.onSpawn = null;
        this.onWaveComplete = null;
    }
    
    update(dt, activeZombieCount) {
        this.stateTimer -= dt;
        
        if (this.state === WAVE_STATE.INTERMISSION) {
            if (this.stateTimer <= 0) {
                this.startNextWave();
            }
        } else if (this.state === WAVE_STATE.ACTIVE) {
            if (this.zombiesSpawnedThisWave < this.zombiesToSpawn) {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) {
                    this.spawnZombie();
                    this.spawnTimer = this.spawnInterval;
                }
            } else if (activeZombieCount === 0) {
                // Wave cleared!
                this.completeWave();
            }
        }
    }
    
    startNextWave() {
        this.state = WAVE_STATE.ACTIVE;
        this.zombiesSpawnedThisWave = 0;
        
        // Scale Difficulty
        this.zombiesToSpawn = 5 + Math.floor(this.currentWave * 1.5);
        this.spawnInterval = Math.max(0.6, 3.0 - (this.currentWave * 0.2));
        this.baseSpeed = 30 + (this.currentWave * 5);
        this.eliteChance = Math.min(0.3, (this.currentWave - 1) * 0.05);
        
        this.spawnTimer = 0.5; // Quick initial spawn
    }
    
    completeWave() {
        this.state = WAVE_STATE.INTERMISSION;
        this.stateTimer = 4.0; // 4 second break
        this.currentWave++;
        
        if (this.onWaveComplete) {
            this.onWaveComplete(this.currentWave);
        }
    }
    
    spawnZombie() {
        this.zombiesSpawnedThisWave++;
        const isElite = Math.random() < this.eliteChance;
        const speed = this.baseSpeed * (isElite ? 1.5 : 1.0) * (0.8 + Math.random() * 0.4); // Random variance
        
        if (this.onSpawn) {
            this.onSpawn(speed, isElite);
        }
    }
}
