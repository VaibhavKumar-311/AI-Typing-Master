export default class GameLoop {
    constructor(update, draw) {
        this.update = update;
        this.draw = draw;
        this.lastTime = 0;
        this.animationId = null;
        this.isRunning = false;
        
        this.loop = this.loop.bind(this);
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animationId = requestAnimationFrame(this.loop);
        }
    }
    
    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
    }
    
    loop(timestamp) {
        if (!this.isRunning) return;
        
        // Cap delta time to prevent massive jumps if tab is inactive
        let deltaTime = (timestamp - this.lastTime) / 1000;
        if (deltaTime > 0.1) deltaTime = 0.1; 
        
        this.lastTime = timestamp;
        this.lastDelta = deltaTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame(this.loop);
    }
}
