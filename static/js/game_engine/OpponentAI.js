import Car from './Car.js';

export default class OpponentAI extends Car {
    constructor(x, y, color, baseSpeed, difficulty) {
        super(x, y, color);
        this.baseAIspeed = baseSpeed;
        this.difficulty = difficulty; // 0.8 to 1.2
        this.maxSpeed = baseSpeed * difficulty;
        this.acceleration = 120 * difficulty;
    }
    
    updateAI(dt, playerProgress, playerSpeed) {
        if (this.hasFinished) {
            this.decelerate(dt);
            this.update(dt);
            return;
        }
        
        // Rubber-banding logic
        const distanceDiff = playerProgress - this.progress;
        
        let targetSpeed = this.baseAIspeed * this.difficulty;
        
        // If player is far ahead, AI speeds up slightly
        if (distanceDiff > 500) {
            targetSpeed *= 1.15;
        }
        // If player is far behind, AI slows down slightly to maintain tension
        else if (distanceDiff < -500) {
            targetSpeed *= 0.85;
        }
        
        // Apply smooth acceleration/deceleration towards target speed
        if (this.speed < targetSpeed) {
            this.accelerate(dt);
        } else if (this.speed > targetSpeed) {
            this.decelerate(dt);
        }
        
        // Random nitro trigger
        if (!this.nitroActive && Math.random() < 0.002 * dt * 60) {
            this.activateNitro(1.5);
        }
        
        // Base update for momentum
        this.update(dt);
    }
}
