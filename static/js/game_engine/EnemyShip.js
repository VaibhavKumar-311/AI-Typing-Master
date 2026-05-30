export const ENEMY_STATE = {
    SPAWNING: 'SPAWNING',
    FLYING: 'FLYING',
    ATTACKING: 'ATTACKING',
    DEAD: 'DEAD'
};

export default class EnemyShip {
    constructor(text, startX, startY, speed, pathType, isElite = false) {
        this.text = text;
        this.typedText = "";
        
        this.x = startX;
        this.y = startY;
        this.baseX = startX;
        this.speed = speed;
        this.isElite = isElite;
        this.pathType = pathType; // 'straight', 'sine', 'arc'
        
        this.width = isElite ? 50 : 35;
        this.height = isElite ? 50 : 35;
        this.color = isElite ? '#f43f5e' : '#8b5cf6'; // Rose for elite, Violet for normal
        
        this.state = ENEMY_STATE.SPAWNING;
        this.stateTimer = 0;
        this.lifeTime = 0;
        
        this.isActive = false;
        this.markedForDeletion = false;
        this.damageDealt = false;
        
        // FSM parameters
        this.spawnDuration = 0.5;
        this.scale = 0;
    }
    
    update(dt, playerY) {
        if (this.state === ENEMY_STATE.DEAD || this.markedForDeletion) return;
        
        this.stateTimer += dt;
        this.lifeTime += dt;
        
        switch (this.state) {
            case ENEMY_STATE.SPAWNING:
                this.scale = Math.min(1.0, this.stateTimer / this.spawnDuration);
                this.y += this.speed * 0.5 * dt; // Move slowly while spawning
                if (this.stateTimer > this.spawnDuration) {
                    this.changeState(ENEMY_STATE.FLYING);
                }
                break;
                
            case ENEMY_STATE.FLYING:
                this.scale = 1.0;
                this.y += this.speed * dt;
                
                // Movement Path logic
                if (this.pathType === 'sine') {
                    this.x = this.baseX + Math.sin(this.lifeTime * 3) * 60;
                } else if (this.pathType === 'arc') {
                    // Sweeping arc
                    this.x += Math.sin(this.lifeTime) * this.speed * 0.3 * dt;
                }
                
                // Attack range check
                if (this.y > playerY - 100) {
                    this.changeState(ENEMY_STATE.ATTACKING);
                }
                break;
                
            case ENEMY_STATE.ATTACKING:
                // Wind up and deal damage
                if (this.stateTimer > 0.3 && !this.damageDealt) {
                    this.damageDealt = true;
                }
                if (this.stateTimer > 0.5) {
                    this.markedForDeletion = true;
                }
                break;
        }
    }
    
    changeState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    draw(ctx) {
        if (this.markedForDeletion || this.state === ENEMY_STATE.DEAD) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Draw Ship Body
        ctx.fillStyle = this.color;
        
        // Triangle shape pointing down
        ctx.beginPath();
        ctx.moveTo(0, this.height/2);
        ctx.lineTo(-this.width/2, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Engine glow
        if (this.state === ENEMY_STATE.FLYING || this.state === ENEMY_STATE.SPAWNING) {
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(-8, -this.height/2 - 10, 16, 10 + Math.random() * 5);
        }
        
        ctx.restore();
        
        // Draw Word Label
        if (this.state !== ENEMY_STATE.SPAWNING) {
            ctx.font = `bold 16px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            const labelY = this.y + this.height/2 + 25;
            const textWidth = ctx.measureText(this.text).width;
            
            ctx.fillStyle = this.isActive ? 'rgba(30, 58, 138, 0.8)' : 'rgba(15, 23, 42, 0.8)';
            ctx.beginPath();
            ctx.roundRect(this.x - textWidth/2 - 6, labelY - 16 - 4, textWidth + 12, 16 + 8, 4);
            ctx.fill();
            
            if (this.isActive) {
                ctx.strokeStyle = '#60a5fa';
                ctx.strokeRect(this.x - textWidth/2 - 6, labelY - 16 - 4, textWidth + 12, 16 + 8);
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
        if (this.state === ENEMY_STATE.DEAD || this.state === ENEMY_STATE.ATTACKING) return 'IGNORE';
        
        const nextChar = this.text[this.typedText.length];
        if (nextChar === char) {
            this.typedText += char;
            if (this.typedText === this.text) {
                this.changeState(ENEMY_STATE.DEAD); // Instantly logic-dead
                return 'COMPLETED';
            }
            return 'HIT';
        }
        return 'MISS';
    }
}
