export default class TrackManager {
    constructor(canvasWidth, canvasHeight, laneCount) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.laneCount = laneCount;
        this.laneWidth = canvasWidth / laneCount;
        
        this.offsetY = 0;
        this.stripeHeight = 40;
        this.stripeGap = 40;
    }
    
    update(dt, scrollSpeed) {
        // Move the track markings backwards based on player speed
        this.offsetY += scrollSpeed * dt;
        
        // Loop the offset
        if (this.offsetY > this.stripeHeight + this.stripeGap) {
            this.offsetY -= (this.stripeHeight + this.stripeGap);
        }
    }
    
    draw(ctx) {
        // Road surface
        ctx.fillStyle = '#020617'; // Deep dark background
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Lane dividers (Neon Cyberpunk)
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;
        
        for (let lane = 1; lane < this.laneCount; lane++) {
            const x = lane * this.laneWidth;
            for (let y = this.offsetY - this.stripeHeight; y < this.height; y += this.stripeHeight + this.stripeGap) {
                ctx.fillRect(x - 2, y, 4, this.stripeHeight);
            }
        }
        ctx.shadowBlur = 0;
        
        // Shoulders
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 15, this.height);
        ctx.fillRect(this.width - 15, 0, 15, this.height);
        
        // Neon side strips
        ctx.shadowColor = '#06b6d4'; // Cyan glow
        ctx.shadowBlur = 10;
        const stripHeight = 30;
        for (let y = this.offsetY - stripHeight; y < this.height; y += stripHeight * 2) {
            ctx.fillStyle = '#06b6d4'; 
            ctx.fillRect(0, y, 15, stripHeight);
            ctx.fillRect(this.width - 15, y, 15, stripHeight);
            
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(0, y + stripHeight, 15, stripHeight);
            ctx.fillRect(this.width - 15, y + stripHeight, 15, stripHeight);
        }
        ctx.shadowBlur = 0;
    }
}
