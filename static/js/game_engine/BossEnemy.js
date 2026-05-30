import EnemyShip, { ENEMY_STATE } from './EnemyShip.js';

export default class BossEnemy extends EnemyShip {
    constructor(texts, startX, startY, speed) {
        // Boss takes multiple words. We feed the first word to the parent class.
        super(texts[0], startX, startY, speed, 'sine', true);
        
        this.texts = texts;
        this.currentPhase = 0;
        
        this.width = 120;
        this.height = 100;
        this.color = '#dc2626'; // Deep Red
        
        this.isBoss = true;
        
        // Boss FSM
        this.shieldActive = false;
        
        // Attack pattern timers
        this.attackTimer = 0;
    }
    
    update(dt, playerY) {
        if (this.state === ENEMY_STATE.DEAD || this.markedForDeletion) return;
        
        this.stateTimer += dt;
        this.lifeTime += dt;
        
        switch (this.state) {
            case ENEMY_STATE.SPAWNING:
                this.updateSpawning(dt);
                break;
            case ENEMY_STATE.FLYING:
                this.updateMovement(dt);
                this.updateAttacks(dt);
                break;
        }
    }
    
    updateSpawning(dt) {
        this.scale = Math.min(1.0, this.stateTimer / 2.0); // 2 second slow spawn
        this.y += this.speed * 0.2 * dt; 
        if (this.stateTimer > 2.0) {
            this.changeState(ENEMY_STATE.FLYING);
        }
    }
    
    updateMovement(dt) {
        // Hover near top of screen
        const targetY = 150;
        if (this.y < targetY) {
            this.y += this.speed * 0.5 * dt;
        }
        // Boss sine movement
        this.x = this.baseX + Math.sin(this.lifeTime) * 150;
    }
    
    updateAttacks(dt) {
        // Boss attacks (minions handle damage in this typing framework)
        // Kept modular for future projectile/laser expansions
    }
    
    draw(ctx) {
        if (this.markedForDeletion || this.state === ENEMY_STATE.DEAD) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Shield
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
            ctx.fill();
        }
        
        // Boss Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, this.height/2);
        ctx.lineTo(-this.width/2, -this.height/4);
        ctx.lineTo(-this.width/4, -this.height/2);
        ctx.lineTo(this.width/4, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-20, -this.height/2 + 10, 40, 20); // Bridge
        
        ctx.restore();
        
        // Draw Word Label (If shield is down)
        if (this.state !== ENEMY_STATE.SPAWNING && !this.shieldActive) {
            ctx.font = `bold 24px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            const labelY = this.y + this.height/2 + 35;
            const textWidth = ctx.measureText(this.text).width;
            
            ctx.fillStyle = this.isActive ? 'rgba(30, 58, 138, 0.8)' : 'rgba(15, 23, 42, 0.8)';
            ctx.beginPath();
            ctx.roundRect(this.x - textWidth/2 - 8, labelY - 24 - 4, textWidth + 16, 24 + 8, 4);
            ctx.fill();
            
            if (this.isActive) {
                ctx.strokeStyle = '#60a5fa';
                ctx.strokeRect(this.x - textWidth/2 - 8, labelY - 24 - 4, textWidth + 16, 24 + 8);
            }
            
            ctx.fillStyle = this.isActive ? '#60a5fa' : '#94a3b8';
            ctx.fillText(this.text, this.x, labelY);
            
            if (this.typedText.length > 0) {
                ctx.textAlign = 'left';
                ctx.fillStyle = '#22c55e';
                ctx.fillText(this.typedText, this.x - textWidth/2, labelY);
                ctx.textAlign = 'center';
            }
        }
    }
    
    typeChar(char) {
        if (this.state === ENEMY_STATE.DEAD || this.shieldActive) return 'IGNORE';
        
        const nextChar = this.text[this.typedText.length];
        if (nextChar === char) {
            this.typedText += char;
            if (this.typedText === this.text) {
                // Phase complete
                this.currentPhase++;
                if (this.currentPhase >= this.texts.length) {
                    this.changeState(ENEMY_STATE.DEAD); // Boss dead
                    return 'COMPLETED';
                } else {
                    // Next phase
                    this.text = this.texts[this.currentPhase];
                    this.typedText = "";
                    this.shieldActive = true; // Needs minions to break shield
                    return 'PHASE_COMPLETE';
                }
            }
            return 'HIT';
        }
        return 'MISS';
    }
}
