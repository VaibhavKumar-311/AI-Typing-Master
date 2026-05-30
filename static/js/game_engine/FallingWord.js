export default class FallingWord {
    constructor(text, canvasWidth, speed, level) {
        this.text = text;
        this.typedText = "";
        
        this.fontSize = 24 + Math.min(level, 10);
        this.width = this.text.length * (this.fontSize * 0.6); // Approximate width
        
        // Ensure word spawns fully within bounds
        const padding = 20;
        this.x = padding + Math.random() * (canvasWidth - this.width - padding * 2);
        this.y = -50; // Start above canvas
        
        this.speed = speed;
        this.isActive = false; // Is the player currently typing this word?
        
        // Colors
        this.baseColor = '#94a3b8'; // Slate 400
        this.activeColor = '#60a5fa'; // Blue 400
        this.typedColor = '#22c55e'; // Green 500
        
        this.markedForDeletion = false;
        this.missed = false;
    }
    
    update(dt, canvasHeight) {
        this.y += this.speed * dt;
        
        if (this.y > canvasHeight + 30) {
            this.markedForDeletion = true;
            this.missed = true;
        }
    }
    
    draw(ctx) {
        ctx.font = `bold ${this.fontSize}px 'Inter', sans-serif`;
        ctx.textBaseline = 'top';
        
        // Draw glow if active
        if (this.isActive) {
            ctx.shadowColor = this.activeColor;
            ctx.shadowBlur = 15;
            ctx.fillStyle = this.activeColor;
        } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = this.baseColor;
        }
        
        // Background pill
        ctx.beginPath();
        const padding = 8;
        ctx.roundRect(this.x - padding, this.y - padding, ctx.measureText(this.text).width + padding*2, this.fontSize + padding*2, 8);
        ctx.fillStyle = this.isActive ? 'rgba(30, 58, 138, 0.6)' : 'rgba(15, 23, 42, 0.6)';
        ctx.fill();
        ctx.strokeStyle = this.isActive ? 'rgba(96, 165, 250, 0.5)' : 'rgba(71, 85, 105, 0.5)';
        ctx.stroke();
        
        // Draw untyped text
        ctx.fillStyle = this.isActive ? this.activeColor : this.baseColor;
        ctx.fillText(this.text, this.x, this.y);
        
        // Overlay typed text
        if (this.typedText.length > 0) {
            ctx.fillStyle = this.typedColor;
            ctx.fillText(this.typedText, this.x, this.y);
        }
        
        ctx.shadowBlur = 0; // reset
    }
    
    typeChar(char) {
        const nextChar = this.text[this.typedText.length];
        if (nextChar === char) {
            this.typedText += char;
            if (this.typedText === this.text) {
                this.markedForDeletion = true;
                return 'COMPLETED';
            }
            return 'HIT';
        }
        return 'MISS';
    }
}
