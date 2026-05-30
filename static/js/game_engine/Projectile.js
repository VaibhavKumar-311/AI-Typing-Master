export default class Projectile {
    constructor(startX, startY, targetX, targetY, speed, color) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.color = color;
        
        // Calculate velocity vector
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.hypot(dx, dy);
        
        if (distance === 0) {
            this.vx = 0;
            this.vy = 0;
        } else {
            this.vx = (dx / distance) * speed;
            this.vy = (dy / distance) * speed;
        }
        
        this.active = true;
        this.markedForDeletion = false;
    }
    
    update(dt) {
        if (this.markedForDeletion) return;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Check if reached target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        // If the dot product of velocity and remaining distance is <= 0, we passed it
        if ((this.vx * dx + this.vy * dy) <= 0) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.active = false;
            this.markedForDeletion = true;
        }
    }
    
    draw(ctx) {
        if (this.markedForDeletion) return;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        
        ctx.beginPath();
        // Draw a line stretching back slightly along its velocity vector
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
        ctx.stroke();
    }
}
