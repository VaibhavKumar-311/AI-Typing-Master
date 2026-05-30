export const FORMATION_TYPE = {
    V_SHAPE: 'V_SHAPE',
    LINE: 'LINE',
    ARC: 'ARC'
};

export const WAVE_STATE = {
    INTERMISSION: 'INTERMISSION',
    ACTIVE: 'ACTIVE',
    BOSS: 'BOSS'
};

export default class FormationManager {
    constructor() {
        this.currentWave = 1;
        this.state = WAVE_STATE.INTERMISSION;
        this.stateTimer = 3.0; // 3 seconds before wave 1
        
        this.formationsToSpawn = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 5.0;
        
        this.onSpawnFormation = null;
        this.onSpawnBoss = null;
        this.onWaveComplete = null;
    }
    
    update(dt, activeEnemyCount) {
        this.stateTimer -= dt;
        
        if (this.state === WAVE_STATE.INTERMISSION) {
            if (this.stateTimer <= 0) {
                this.startNextWave();
            }
        } else if (this.state === WAVE_STATE.ACTIVE) {
            if (this.formationsToSpawn > 0) {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) {
                    this.triggerFormation();
                    this.formationsToSpawn--;
                    this.spawnTimer = this.spawnInterval;
                }
            } else if (activeEnemyCount === 0) {
                // Wave cleared!
                if (this.currentWave % 5 === 0) {
                    this.startBossPhase();
                } else {
                    this.completeWave();
                }
            }
        } else if (this.state === WAVE_STATE.BOSS) {
            if (activeEnemyCount === 0) {
                // Boss defeated
                this.completeWave();
            }
        }
    }
    
    startNextWave() {
        this.state = WAVE_STATE.ACTIVE;
        this.formationsToSpawn = 2 + Math.floor(this.currentWave / 2);
        this.spawnInterval = Math.max(2.0, 5.0 - (this.currentWave * 0.3));
        this.spawnTimer = 1.0;
    }
    
    startBossPhase() {
        this.state = WAVE_STATE.BOSS;
        if (this.onSpawnBoss) {
            this.onSpawnBoss(this.currentWave);
        }
    }
    
    completeWave() {
        this.state = WAVE_STATE.INTERMISSION;
        this.stateTimer = 4.0;
        this.currentWave++;
        
        if (this.onWaveComplete) {
            this.onWaveComplete(this.currentWave);
        }
    }
    
    triggerFormation() {
        if (!this.onSpawnFormation) return;
        
        const types = [FORMATION_TYPE.V_SHAPE, FORMATION_TYPE.LINE, FORMATION_TYPE.ARC];
        const type = types[Math.floor(Math.random() * types.length)];
        const count = Math.min(5, 3 + Math.floor(this.currentWave / 3));
        const baseSpeed = 40 + (this.currentWave * 5);
        
        this.onSpawnFormation(type, count, baseSpeed);
    }
}
