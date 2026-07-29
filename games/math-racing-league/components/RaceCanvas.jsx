import { useEffect, useRef } from "react";

const LANES = [-0.42, 0, 0.42];

function drawCar(ctx, x, y, scale, color, name, boost) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 46, 54, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  if (boost) {
    const flame = ctx.createLinearGradient(0, 38, 0, 100);
    flame.addColorStop(0, "rgba(56, 217, 255, 0.95)");
    flame.addColorStop(0.5, "rgba(255, 202, 40, 0.85)");
    flame.addColorStop(1, "rgba(255, 80, 40, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-22, 42);
    ctx.lineTo(0, 105);
    ctx.lineTo(22, 42);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.roundRect(-42, -52, 84, 104, 18);
  ctx.fill();
  ctx.stroke();

  const shine = ctx.createLinearGradient(-32, -48, 34, 40);
  shine.addColorStop(0, "rgba(255,255,255,0.58)");
  shine.addColorStop(0.5, "rgba(255,255,255,0.12)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.roundRect(-31, -44, 62, 84, 13);
  ctx.fill();

  ctx.fillStyle = "#172033";
  ctx.beginPath();
  ctx.roundRect(-25, -38, 50, 30, 9);
  ctx.fill();

  ctx.fillStyle = "rgba(159, 220, 255, 0.9)";
  ctx.fillRect(-18, -32, 36, 12);

  ctx.fillStyle = "#111827";
  [-42, 42].forEach((side) => {
    ctx.beginPath();
    ctx.roundRect(side - 7, -32, 14, 26, 6);
    ctx.roundRect(side - 7, 22, 14, 26, 6);
    ctx.fill();
  });

  ctx.fillStyle = "#fff7b2";
  ctx.beginPath();
  ctx.arc(-22, -52, 6, 0, Math.PI * 2);
  ctx.arc(22, -52, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff5e6c";
  ctx.fillRect(-26, 49, 14, 6);
  ctx.fillRect(12, 49, 14, 6);

  if (name) {
    ctx.fillStyle = "rgba(3, 7, 18, 0.82)";
    ctx.beginPath();
    ctx.roundRect(-52, -86, 104, 28, 8);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "800 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, 0, -67);
  }

  ctx.restore();
}

export default function RaceCanvas({ league, raceState, leaderboard, feedback }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const render = (now) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      if (
        canvas.width !== Math.round(rect.width * ratio) ||
        canvas.height !== Math.round(rect.height * ratio)
      ) {
        canvas.width = Math.round(rect.width * ratio);
        canvas.height = Math.round(rect.height * ratio);
      }

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const horizon = height * 0.32;

      const speed = raceState.speed || 0;
      const scroll = ((raceState.playerDistance || 0) * 2.8 + now * 0.06) % 160;

      ctx.clearRect(0, 0, width, height);

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, league.sky || "#bff6ff");
      sky.addColorStop(0.55, "#e0f7ff");
      sky.addColorStop(1, "#dbeafe");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(28, 43, 78, 0.72)";
      for (let x = -40; x < width + 80; x += 70) {
        const h = 70 + ((x + now * 0.02) % 80);
        ctx.fillRect(x, horizon - h, 44, h);
      }

      const roadTop = width * 0.16;
      const roadBottom = width * 1.02;

      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(cx - roadTop / 2, horizon);
      ctx.lineTo(cx + roadTop / 2, horizon);
      ctx.lineTo(cx + roadBottom / 2, height);
      ctx.lineTo(cx - roadBottom / 2, height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(250, 204, 21, 0.95)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx - roadTop / 2 - 10, horizon);
      ctx.lineTo(cx - roadBottom / 2 - 30, height);
      ctx.moveTo(cx + roadTop / 2 + 10, horizon);
      ctx.lineTo(cx + roadBottom / 2 + 30, height);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;

      [1 / 3, 2 / 3].forEach((t) => {
        ctx.beginPath();
        ctx.moveTo(cx - roadTop / 2 + roadTop * t, horizon);
        ctx.lineTo(cx - roadBottom / 2 + roadBottom * t, height);
        ctx.stroke();
      });

      for (let i = 0; i < 24; i += 1) {
        const depth = ((i * 65 + scroll * 2.4) % (height - horizon + 180)) / (height - horizon + 180);
        const y = horizon + depth * depth * (height - horizon + 190);
        const w = 8 + depth * 28;
        const h = 24 + depth * 54;

        ctx.fillStyle = "rgba(255,255,255,0.84)";
        ctx.fillRect(cx - w / 2, y, w, h);
      }

      const cars = [...leaderboard].sort((a, b) => (a.isPlayer ? 1 : -1));

      cars.forEach((car) => {
        const lane = LANES[car.lane ?? 1];
        const isPlayer = car.isPlayer;

        const relative = isPlayer
          ? 0
          : Math.max(12, Math.min(80, (car.distanceTravelled || 0) - (raceState.playerDistance || 0)));

        const y = isPlayer ? height - 115 : height - 250 - relative * 1.35;
        const perspective = Math.max(0.38, Math.min(1, (y - horizon) / (height - horizon)));
        const roadWidthAtY = roadTop + (roadBottom - roadTop) * perspective;
        const x = cx + lane * roadWidthAtY;

        drawCar(
          ctx,
          x,
          y,
          isPlayer ? 1.1 : 0.76 + perspective * 0.24,
          car.color,
          car.name,
          isPlayer && raceState.boostLevel > 0
        );
      });

      if (feedback === "correct") {
        ctx.strokeStyle = "rgba(74, 222, 128, 0.75)";
        ctx.lineWidth = 10;
        ctx.strokeRect(8, 8, width - 16, height - 16);
      }

      if (feedback === "wrong") {
        ctx.fillStyle = "rgba(255, 45, 85, 0.16)";
        ctx.fillRect(0, 0, width, height);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationRef.current);
  }, [feedback, league, leaderboard, raceState]);

  return (
    <canvas
      ref={canvasRef}
      className="mrl-race-canvas"
      aria-label="Math Racing League fallback race"
    />
  );
}