export const ZOMBIE_STATES = {
    SPAWNING: 'SPAWNING',
    WALKING: 'WALKING',
    DAMAGED: 'DAMAGED',
    ATTACKING: 'ATTACKING',
    DEAD: 'DEAD'
};

export default class Zombie {
    constructor(text, canvasWidth, canvasHeight, speed, isElite = false) {
        this.text = text;
        this.typedText = "";
        
        this.speed = speed;
        this.isElite = isElite;
        
        // Render properties
        this.fontSize = isElite ? 28 : 22;
        this.width = 40;
        this.height = isElite ? 60 : 50;
        
        // Side selection (0 = left, 1 = right)
        this.side = Math.random() > 0.5 ? 1 : 0;
        this.x = this.side === 0 ? -this.width : canvasWidth + this.width;
        this.y = canvasHeight - this.height - 20; // Ground level
        
        // FSM State
        this.state = ZOMBIE_STATES.SPAWNING;
        this.stateTimer = 0;
        
        this.isActive = false; // Is player targeting this zombie?
        this.markedForDeletion = false;
        this.damageDealt = false;
    }
    
    update(dt, playerX) {
        if (this.state === ZOMBIE_STATES.DEAD || this.markedForDeletion) return;
        
        this.stateTimer += dt;
        
        switch (this.state) {
            case ZOMBIE_STATES.SPAWNING:
                // Rise up or just delay
                if (this.stateTimer > 0.5) {
                    this.changeState(ZOMBIE_STATES.WALKING);
                }
                break;
                
            case ZOMBIE_STATES.WALKING:
                // Move towards player (center)
                const direction = this.x < playerX ? 1 : -1;
                this.x += direction * this.speed * dt;
                
                // Collision check
                if (Math.abs(this.x - playerX) < 30) {
                    this.changeState(ZOMBIE_STATES.ATTACKING);
                }
                break;
                
            case ZOMBIE_STATES.DAMAGED:
                // Pause briefly when hit
                if (this.stateTimer > 0.15) {
                    this.changeState(ZOMBIE_STATES.WALKING);
                }
                break;
                
            case ZOMBIE_STATES.ATTACKING:
                // Deal damage after animation delay
                if (this.stateTimer > 0.4 && !this.damageDealt) {
                    this.damageDealt = true;
                    // Will be handled by orchestrator to reduce player health
                }
                if (this.stateTimer > 0.8) {
                    this.markedForDeletion = true; // Zombie disappears after hitting
                }
                break;
                
            case ZOMBIE_STATES.DEAD:
                // Death animation
                if (this.stateTimer > 0.3) {
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
        if (this.markedForDeletion) return;
        
        // Draw Zombie Body
        let color = this.isElite ? '#991b1b' : '#166534'; // Red for elite, green for normal
        if (this.state === ZOMBIE_STATES.DAMAGED) color = '#f87171';
        if (this.state === ZOMBIE_STATES.DEAD) ctx.globalAlpha = Math.max(0, 1 - (this.stateTimer / 0.3));
        
        ctx.fillStyle = color;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        
        ctx.globalAlpha = 1.0;
        
        // Draw Word Label
        if (this.state !== ZOMBIE_STATES.DEAD && this.state !== ZOMBIE_STATES.SPAWNING) {
            ctx.font = `bold ${this.fontSize}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            const labelY = this.y - 10;
            
            // Draw background pill
            const textWidth = ctx.measureText(this.text).width;
            ctx.fillStyle = this.isActive ? 'rgba(30, 58, 138, 0.8)' : 'rgba(15, 23, 42, 0.8)';
            ctx.beginPath();
            ctx.roundRect(this.x - textWidth/2 - 8, labelY - this.fontSize - 4, textWidth + 16, this.fontSize + 8, 4);
            ctx.fill();
            
            if (this.isActive) {
                ctx.strokeStyle = '#60a5fa';
                ctx.strokeRect(this.x - textWidth/2 - 8, labelY - this.fontSize - 4, textWidth + 16, this.fontSize + 8);
            }
            
            // Draw untyped text
            ctx.fillStyle = this.isActive ? '#60a5fa' : '#94a3b8';
            ctx.fillText(this.text, this.x, labelY);
            
            // Draw typed text
            if (this.typedText.length > 0) {
                // Calculate position to overlap exactly
                ctx.textAlign = 'left';
                const startX = this.x - textWidth/2;
                ctx.fillStyle = '#22c55e';
                ctx.fillText(this.typedText, startX, labelY);
                ctx.textAlign = 'center'; // reset
            }
        }
    }
    
    typeChar(char) {
        if (this.state === ZOMBIE_STATES.DEAD || this.state === ZOMBIE_STATES.ATTACKING) return 'IGNORE';
        
        const nextChar = this.text[this.typedText.length];
        if (nextChar === char) {
            this.typedText += char;
            this.changeState(ZOMBIE_STATES.DAMAGED);
            
            if (this.typedText === this.text) {
                this.changeState(ZOMBIE_STATES.DEAD);
                return 'COMPLETED';
            }
            return 'HIT';
        }
        return 'MISS';
    }
}
