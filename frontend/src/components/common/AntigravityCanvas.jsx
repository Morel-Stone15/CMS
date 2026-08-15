import { useRef, useEffect } from 'react';

export function AntigravityCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2
    };

    const numPoints = 14;
    const baseRadius = Math.min(width, height) * 0.22;
    const points = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        angle,
        baseRadius,
        phase: Math.random() * Math.PI * 2,
        frequency: 1 + Math.random() * 1.5
      });
    }

    const numParticles = 30;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const parent = canvas.parentElement;
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    parent.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.018;

      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const bgGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 10,
        mouse.x, mouse.y, Math.max(width, height) * 0.65
      );
      bgGrad.addColorStop(0, 'rgba(0, 212, 255, 0.16)');
      bgGrad.addColorStop(0.35, 'rgba(124, 58, 237, 0.12)');
      bgGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.06)');
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00d4ff';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const pathPoints = points.map((p, i) => {
        const angle = p.angle;
        const distortion =
          Math.sin(time * p.frequency + p.phase) * 24 +
          Math.cos(time * 1.4 + i * 0.5) * 16;

        const dx = mouse.x - width / 2;
        const dy = mouse.y - height / 2;
        const mouseDist = Math.hypot(dx, dy);
        const mouseAngle = Math.atan2(dy, dx);
        const angleDiff = Math.cos(angle - mouseAngle);

        const mousePull = angleDiff * Math.min(mouseDist * 0.2, 50);
        const r = baseRadius + distortion + mousePull;

        const px = mouse.x + Math.cos(angle) * r;
        const py = mouse.y + Math.sin(angle) * r;
        return { x: px, y: py };
      });

      ctx.save();
      ctx.beginPath();
      const len = pathPoints.length;
      ctx.moveTo(
        (pathPoints[0].x + pathPoints[len - 1].x) / 2,
        (pathPoints[0].y + pathPoints[len - 1].y) / 2
      );

      for (let i = 0; i < len; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[(i + 1) % len];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      ctx.closePath();

      const blobGrad = ctx.createLinearGradient(
        mouse.x - baseRadius, mouse.y - baseRadius,
        mouse.x + baseRadius, mouse.y + baseRadius
      );
      blobGrad.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
      blobGrad.addColorStop(0.35, 'rgba(59, 130, 246, 0.75)');
      blobGrad.addColorStop(0.7, 'rgba(124, 58, 237, 0.75)');
      blobGrad.addColorStop(1, 'rgba(236, 72, 153, 0.7)');

      ctx.fillStyle = blobGrad;
      ctx.shadowBlur = 45;
      ctx.shadowColor = 'rgba(0, 212, 255, 0.65)';
      ctx.fill();

      ctx.lineWidth = 2;
      const strokeGrad = ctx.createLinearGradient(
        mouse.x - baseRadius, mouse.y - baseRadius,
        mouse.x + baseRadius, mouse.y + baseRadius
      );
      strokeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      strokeGrad.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
      strokeGrad.addColorStop(1, 'rgba(236, 72, 153, 0.7)');
      ctx.strokeStyle = strokeGrad;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (parent) parent.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="antigravity-canvas" />;
}
