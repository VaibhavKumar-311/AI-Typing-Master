export default class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    spawn(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1.0,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 1.5; // decay rate
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        for (let p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}
