export default class Car {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 70;
        this.color = color;
        
        // Physics
        this.speed = 0; // Current speed (pixels per second)
        this.maxSpeed = 300; 
        this.acceleration = 150;
        this.deceleration = 80;
        
        // Progress on track
        this.progress = 0; 
        
        // Nitro system
        this.nitro = 0;
        this.nitroActive = false;
        this.nitroTimer = 0;
        
        // Throttle system for smooth momentum
        this.throttle = 0;
        
        this.hasFinished = false;
    }
    
    update(dt) {
        if (this.hasFinished) {
            // Coast to a stop
            this.speed -= this.deceleration * dt;
        } else {
            // Apply throttle
            if (this.throttle > 0) {
                this.accelerate(dt);
                this.throttle -= dt * 2.5; // Throttle decays over 0.4s
            } else {
                this.decelerate(dt);
            }
            
            // Apply nitro modifiers
            const currentMaxSpeed = this.nitroActive ? this.maxSpeed * 1.5 : this.maxSpeed;
            
            // Speed limits
            if (this.speed > currentMaxSpeed) {
                // Smooth decay from nitro top speed back to normal top speed
                this.speed -= this.deceleration * 1.5 * dt; 
            } else if (this.speed < 0) {
                this.speed = 0;
            }
            
            // Nitro timer
            if (this.nitroActive) {
                this.nitroTimer -= dt;
                if (this.nitroTimer <= 0) {
                    this.nitroActive = false;
                }
            }
        }
        
        // Update distance
        if (this.speed > 0) {
            this.progress += this.speed * dt;
        }
    }
    
    accelerate(dt) {
        if (this.hasFinished) return;
        const currentMaxSpeed = this.nitroActive ? this.maxSpeed * 1.5 : this.maxSpeed;
        if (this.speed < currentMaxSpeed) {
            const accRate = this.nitroActive ? this.acceleration * 2 : this.acceleration;
            this.speed += accRate * dt;
        }
    }
    
    decelerate(dt) {
        if (this.speed > 0) {
            this.speed -= this.deceleration * dt;
        }
    }
    
    activateNitro(duration) {
        this.nitroActive = true;
        this.nitroTimer = duration;
    }
    
    draw(ctx, renderX, renderY) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(renderX + 4, renderY + 4, this.width, this.height);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(renderX, renderY, this.width, this.height);
        
        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(renderX + 4, renderY + 15, this.width - 8, 15);
        
        // Rear Window
        ctx.fillRect(renderX + 4, renderY + this.height - 20, this.width - 8, 10);
        
        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(renderX + 2, renderY - 2, 8, 4);
        ctx.fillRect(renderX + this.width - 10, renderY - 2, 8, 4);
        
        // Nitro Exhaust
        if (this.nitroActive && this.speed > 0) {
            ctx.fillStyle = '#3b82f6'; // Blue flame
            ctx.beginPath();
            ctx.moveTo(renderX + 10, renderY + this.height);
            ctx.lineTo(renderX + 20, renderY + this.height + 15 + Math.random() * 10);
            ctx.lineTo(renderX + 30, renderY + this.height);
            ctx.fill();
        }
    }
}
