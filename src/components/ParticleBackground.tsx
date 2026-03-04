import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  alphaDir: number;
  life: number;
  maxLife: number;
}

interface Sparkle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  alphaDir: number;
  color: string;
  pulseSpeed: number;
}

const COLORS = [
  'rgba(207, 85, 235,',   // energy-cyan (#cf55eb)
  'rgba(120, 100, 255,',   // violet-blue
  'rgba(80, 140, 255,',    // soft blue
  'rgba(245, 180, 60,',    // action gold
  'rgba(255, 120, 200,',   // pink
];

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let sparkles: Sparkle[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    // Init particles
    const PARTICLE_COUNT = 60;
    const SPARKLE_COUNT = 25;

    const createParticle = (): Particle => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      radius: Math.random() * 2 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.6 + 0.1,
      alphaDir: (Math.random() - 0.5) * 0.008,
      life: 0,
      maxLife: Math.random() * 400 + 200,
    });

    const createSparkle = (): Sparkle => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      radius: Math.random() * 1.5 + 0.3,
      alpha: 0,
      alphaDir: 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulseSpeed: Math.random() * 0.02 + 0.008,
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
    for (let i = 0; i < SPARKLE_COUNT; i++) sparkles.push(createSparkle());

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());

      // Draw gradient base
      const grad = ctx.createRadialGradient(
        w() * 0.7, h() * 0.3, 0,
        w() * 0.5, h() * 0.5, w() * 0.9
      );
      grad.addColorStop(0, 'hsla(265, 80%, 18%, 0.4)');
      grad.addColorStop(0.4, 'hsla(260, 60%, 10%, 0.2)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w(), h());

      // Flowing aurora effect
      const time = Date.now() * 0.0003;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Aurora wave 1
      const auroraGrad1 = ctx.createLinearGradient(0, 0, w(), h());
      auroraGrad1.addColorStop(0, `rgba(120, 100, 255, ${0.03 + Math.sin(time) * 0.02})`);
      auroraGrad1.addColorStop(0.5, `rgba(207, 85, 235, ${0.04 + Math.sin(time + 1) * 0.02})`);
      auroraGrad1.addColorStop(1, `rgba(245, 180, 60, ${0.02 + Math.sin(time + 2) * 0.01})`);

      ctx.beginPath();
      ctx.moveTo(0, h() * 0.3);
      for (let x = 0; x <= w(); x += 10) {
        const y = h() * 0.4 + Math.sin(x * 0.003 + time * 3) * h() * 0.12 + Math.sin(x * 0.007 + time * 2) * h() * 0.05;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w(), h());
      ctx.lineTo(0, h());
      ctx.closePath();
      ctx.fillStyle = auroraGrad1;
      ctx.fill();

      ctx.restore();

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha += p.alphaDir;

        if (p.alpha > 0.7) p.alphaDir = -Math.abs(p.alphaDir);
        if (p.alpha < 0.05) p.alphaDir = Math.abs(p.alphaDir);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.fill();

        // Soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        glowGrad.addColorStop(0, `${p.color} ${p.alpha * 0.3})`);
        glowGrad.addColorStop(1, `${p.color} 0)`);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Reset if off screen or expired
        if (p.x < -10 || p.x > w() + 10 || p.y < -10 || p.y > h() + 10 || p.life > p.maxLife) {
          Object.assign(p, createParticle());
        }
      });

      // Draw sparkles (pulsing twinkles)
      sparkles.forEach((s) => {
        s.alpha += s.pulseSpeed * s.alphaDir;
        if (s.alpha >= 0.9) {
          s.alphaDir = -1;
        }
        if (s.alpha <= 0) {
          s.alphaDir = 1;
          s.x = Math.random() * w();
          s.y = Math.random() * h();
          s.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }

        if (s.alpha > 0) {
          // Star cross effect
          const size = s.radius * (1 + s.alpha * 2);
          ctx.save();
          ctx.globalAlpha = s.alpha;
          ctx.strokeStyle = `${s.color} ${s.alpha})`;
          ctx.lineWidth = 0.5;

          ctx.beginPath();
          ctx.moveTo(s.x - size * 2, s.y);
          ctx.lineTo(s.x + size * 2, s.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(s.x, s.y - size * 2);
          ctx.lineTo(s.x, s.y + size * 2);
          ctx.stroke();

          // Center dot
          ctx.beginPath();
          ctx.arc(s.x, s.y, size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `${s.color} ${s.alpha})`;
          ctx.fill();

          // Glow
          const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 4);
          sg.addColorStop(0, `${s.color} ${s.alpha * 0.4})`);
          sg.addColorStop(1, `${s.color} 0)`);
          ctx.beginPath();
          ctx.arc(s.x, s.y, size * 4, 0, Math.PI * 2);
          ctx.fillStyle = sg;
          ctx.fill();

          ctx.restore();
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default ParticleBackground;
