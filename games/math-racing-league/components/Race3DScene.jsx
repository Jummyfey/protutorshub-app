import { useEffect, useRef } from "react";
import * as THREE from "three";

const LANES = [-5.2, 0, 5.2];
const ROAD_WIDTH = 20;
const TRACK_LENGTH = 1000;
const TRACK_RX = 128;
const TRACK_RZ = 58;
const CAMERA_MAX_DELTA = 0.05;
const VISUAL_DISTANCE_SNAP = 180;

const TRACK_SEGMENTS = [
  { id: "starting-city", startDistance: 0, endDistance: 250, theme: "city" },
  { id: "coastal-highway", startDistance: 250, endDistance: 500, theme: "beach" },
  { id: "mountain-stretch", startDistance: 500, endDistance: 750, theme: "mountain" },
  { id: "champion-stadium", startDistance: 750, endDistance: 1000, theme: "stadium" },
];

const PALETTES = {
  orange: { body: "#ff7a18", dark: "#c2410c", accent: "#ffd166", tail: "#ff2d55" },
  blue: { body: "#19a7ff", dark: "#0f4c81", accent: "#9ff7ff", tail: "#ff3b5f" },
  purpleGold: { body: "#7c3aed", dark: "#3b0764", accent: "#f0b84e", tail: "#ff5c8a" },
};

function getLoopedDistance(distance) {
  return ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
}

function getTrackPose(distance, offset = 0) {
  const loopedDistance = getLoopedDistance(distance);
  const theta = (loopedDistance / TRACK_LENGTH) * Math.PI * 2 - Math.PI / 2;
  const x = Math.cos(theta) * TRACK_RX;
  const z = Math.sin(theta) * TRACK_RZ;
  const tangent = new THREE.Vector3(-Math.sin(theta) * TRACK_RX, 0, Math.cos(theta) * TRACK_RZ).normalize();
  const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
  const position = new THREE.Vector3(x, 0, z).addScaledVector(right, offset);
  const yaw = Math.atan2(tangent.x, tangent.z);
  return { position, tangent, right, yaw };
}

function getActiveSegment(distance) {
  return TRACK_SEGMENTS.find((segment) => distance >= segment.startDistance && distance < segment.endDistance) || TRACK_SEGMENTS[0];
}

function easeAngle(current, target, amount) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * amount;
}

function makeCanvasTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (kind === "road") {
    ctx.fillStyle = "#242a34";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i += 1) {
      const v = 32 + Math.floor(Math.random() * 46);
      ctx.fillStyle = `rgba(${v},${v},${v + 8},0.35)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1);
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, "#2f9e44");
    gradient.addColorStop(0.5, "#1f7a3a");
    gradient.addColorStop(1, "#155f31");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 360; i += 1) {
      ctx.strokeStyle = `rgba(28,${120 + Math.random() * 80},52,0.32)`;
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, y - 4 - Math.random() * 8);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "road" ? 3 : 14, kind === "road" ? 20 : 14);
  texture.anisotropy = 2;
  return texture;
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.45,
    metalness: options.metalness ?? 0.25,
    emissive: options.emissive || "#000000",
    emissiveIntensity: options.emissiveIntensity || 0,
    transparent: options.transparent || false,
    opacity: options.opacity ?? 1,
  });
}

function addBox(group, args, position, mat, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...args), mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

function createWheel(accent) {
  const group = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.47, 0.34, 18),
    material("#05070c", { roughness: 0.5, metalness: 0.15 })
  );
  tire.rotation.x = Math.PI / 2;
  group.add(tire);
  const hub = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.04, 6, 18),
    material(accent, { roughness: 0.24, metalness: 0.65 })
  );
  group.add(hub);
  return group;
}

function createNameTag(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  const safeLabel = String(label || "").slice(0, 18);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(6, 12, 28, 0.82)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(14, 18, 228, 56, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff7c2";
  ctx.font = "800 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(safeLabel, 128, 47, 198);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.position.set(0, 2.18, -0.35);
  sprite.scale.set(2.9, 1.08, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function createCar(kind = "orange", scale = 1, label = "") {
  const palette = PALETTES[kind] || PALETTES.orange;
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  const body = material(palette.body, { roughness: 0.32, metalness: 0.42 });
  const dark = material(palette.dark, { roughness: 0.28, metalness: 0.45 });
  const glass = material("#07111f", { roughness: 0.12, metalness: 0.15, emissive: "#0ea5e9", emissiveIntensity: 0.08 });
  const black = material("#0b1020", { roughness: 0.3, metalness: 0.45 });

  addBox(group, [2.45, 0.58, 4.65], [0, 0.62, 0], body);
  addBox(group, [2.05, 0.22, 1.35], [0, 0.9, 1.15], body, [-0.16, 0, 0]);
  addBox(group, [2.18, 0.24, 0.82], [0, 0.78, -1.75], dark, [0.18, 0, 0]);
  addBox(group, [1.55, 0.72, 1.55], [0, 1.16, -0.36], dark);
  addBox(group, [1.24, 0.055, 0.74], [0, 1.26, 0.25], glass, [-0.28, 0, 0]);
  addBox(group, [2.28, 0.2, 0.28], [0, 0.89, 2.36], dark);
  addBox(group, [2.34, 0.24, 0.32], [0, 0.72, -2.42], black);
  addBox(group, [0.52, 0.08, 0.08], [-0.62, 0.86, 2.56], material("#fff7b2", { emissive: "#fff7b2", emissiveIntensity: 1.2 }));
  addBox(group, [0.52, 0.08, 0.08], [0.62, 0.86, 2.56], material("#fff7b2", { emissive: "#fff7b2", emissiveIntensity: 1.2 }));
  addBox(group, [0.58, 0.08, 0.08], [-0.68, 0.9, -2.58], material(palette.tail, { emissive: palette.tail, emissiveIntensity: 1.2 }));
  addBox(group, [0.58, 0.08, 0.08], [0.68, 0.9, -2.58], material(palette.tail, { emissive: palette.tail, emissiveIntensity: 1.2 }));

  [[-1.23, 1.35], [1.23, 1.35], [-1.23, -1.45], [1.23, -1.45]].forEach(([x, z]) => {
    const wheel = createWheel(palette.accent);
    wheel.position.set(x, 0.42, z);
    group.add(wheel);
  });

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 20),
    new THREE.MeshBasicMaterial({ color: "#020617", transparent: true, opacity: 0.32, depthWrite: false })
  );
  shadow.position.set(0, 0.08, -0.2);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(3.1, 1.05, 1);
  group.add(shadow);

  const flameMat = new THREE.MeshBasicMaterial({ color: "#38d9ff", transparent: true, opacity: 0.82 });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 3.2, 12), flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.set(0, 0.35, -3);
  flame.visible = false;
  group.userData.flame = flame;
  group.add(flame);
  group.add(createNameTag(label));

  return group;
}

function createRoad() {
  const group = new THREE.Group();
  const roadShape = new THREE.Shape();
  roadShape.absellipse(0, 0, TRACK_RX + ROAD_WIDTH / 2, TRACK_RZ + ROAD_WIDTH / 2, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, TRACK_RX - ROAD_WIDTH / 2, TRACK_RZ - ROAD_WIDTH / 2, 0, Math.PI * 2, true);
  roadShape.holes.push(hole);

  const road = new THREE.Mesh(
    new THREE.ShapeGeometry(roadShape, 96),
    material("#2d333f", { roughness: 0.72, metalness: 0.12 })
  );
  road.material.map = makeCanvasTexture("road");
  road.rotation.x = -Math.PI / 2;
  group.add(road);

  const stripeMat = material("#ffffff", { roughness: 0.18, metalness: 0.35, emissive: "#dbeafe", emissiveIntensity: 0.35 });
  const railMat = material("#facc15", { emissive: "#854d0e", emissiveIntensity: 0.28 });
  for (let index = 0; index < 32; index += 1) {
    const distance = (index / 32) * TRACK_LENGTH;
    [-3.45, 3.45].forEach((offset) => {
      const pose = getTrackPose(distance, offset);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 4.4), stripeMat);
      mesh.position.copy(pose.position).setY(0.06);
      mesh.rotation.set(-Math.PI / 2, 0, pose.yaw);
      group.add(mesh);
    });
    [-ROAD_WIDTH / 2 - 0.5, ROAD_WIDTH / 2 + 0.5].forEach((offset) => {
      const pose = getTrackPose(distance, offset);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 4.8), railMat);
      mesh.position.copy(pose.position).setY(0.34);
      mesh.rotation.y = pose.yaw;
      group.add(mesh);
    });
  }

  return group;
}

function createWorld() {
  const group = new THREE.Group();
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(440, 320, 1, 1),
    material("#2f9e44", { roughness: 0.92, metalness: 0 })
  );
  grass.material.map = makeCanvasTexture("grass");
  grass.position.y = -0.08;
  grass.rotation.x = -Math.PI / 2;
  group.add(grass);

  const cityMat = ["#334155", "#1e3a8a", "#475569", "#312e81"].map((color) => material(color, { roughness: 0.55 }));
  for (let distance = 35; distance <= 980; distance += 55) {
    const segment = getActiveSegment(distance);
    const side = Math.floor(distance / 55) % 2 === 0 ? -1 : 1;
    const variant = Math.floor(distance / 55) % 4;
    const pose = getTrackPose(distance, side * (segment.theme === "mountain" ? 33 : 22));

    if (segment.theme === "city" || segment.theme === "stadium") {
      const h = segment.theme === "stadium" ? 4.2 : 6 + variant * 1.8;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(segment.theme === "stadium" ? 8 : 4, h, segment.theme === "stadium" ? 10 : 5),
        cityMat[variant]
      );
      building.position.copy(pose.position).setY(h / 2);
      building.rotation.y = pose.yaw;
      group.add(building);
    } else if (segment.theme === "beach") {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 3.3, 8), material("#9a5b2e", { roughness: 0.82 }));
      trunk.position.copy(pose.position).setY(1.65);
      group.add(trunk);
      for (let i = 0; i < 5; i += 1) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.8, 6), material("#16a34a"));
        leaf.position.copy(pose.position).setY(3.55);
        leaf.rotation.set(0.55, (i * Math.PI) / 2.5, 0.22);
        group.add(leaf);
      }
    } else {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(10 + variant * 2, 22 + variant * 2, 4),
        material("#64748b", { roughness: 0.92 })
      );
      mountain.position.copy(pose.position).setY(7);
      mountain.rotation.set(0, pose.yaw, Math.PI / 4);
      group.add(mountain);
    }
  }

  return group;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((item) => {
        if (item.map) item.map.dispose();
        item.dispose();
      });
    }
  });
}

export default function Race3DScene({ league, raceState, leaderboard, onSceneReady, onSceneError }) {
  const hostRef = useRef(null);
  const raceStateRef = useRef(raceState);
  const leaderboardRef = useRef(leaderboard);
  const visualDistancesRef = useRef(new Map());

  useEffect(() => {
    raceStateRef.current = raceState;
    leaderboardRef.current = leaderboard;
  }, [leaderboard, raceState]);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    let frameId = 0;
    let lastTime = performance.now();
    let disposed = false;
    let readySent = false;
    let cameraPrimed = false;

    try {
      const host = hostRef.current;
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(1, window.devicePixelRatio || 1));
      renderer.setSize(host.clientWidth || 960, host.clientHeight || 540);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(57, (host.clientWidth || 960) / (host.clientHeight || 540), 0.1, 700);
      const cameraLookAt = new THREE.Vector3();
      scene.background = new THREE.Color("#8fc8ee");
      scene.fog = new THREE.Fog("#8fc8ee", 70, 320);

      scene.add(new THREE.HemisphereLight("#bfe9ff", "#1e293b", 0.85));
      scene.add(new THREE.AmbientLight("#ffffff", 0.5));
      const sun = new THREE.DirectionalLight("#ffffff", 1.6);
      sun.position.set(8, 15, 10);
      scene.add(sun);
      const boostLight = new THREE.PointLight(league.accent || "#38d9ff", 0.8, 28);
      boostLight.position.set(0, 5, 7);
      scene.add(boostLight);

      scene.add(createWorld());
      scene.add(createRoad());

      const carGroups = new Map();
      const ensureCarGroup = (car) => {
        if (carGroups.has(car.id)) return carGroups.get(car.id);
        const kind = car.isPlayer ? "orange" : car.id === "ai-speedster" ? "blue" : "purpleGold";
        const carGroup = createCar(kind, car.isPlayer ? 1 : 0.88, car.isPlayer ? "You" : car.name);
        scene.add(carGroup);
        carGroups.set(car.id, carGroup);
        return carGroup;
      };
      (leaderboardRef.current || []).forEach((car) => {
        ensureCarGroup(car);
      });

      const speedLines = new THREE.Group();
      const speedLineMat = new THREE.MeshBasicMaterial({ color: "#9ff7ff", transparent: true, opacity: 0.24 });
      for (let i = 0; i < 14; i += 1) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 7), speedLineMat);
        line.position.set((i % 2 ? -1 : 1) * (5 + (i % 7) * 1.4), 1.2 + (i % 5) * 0.7, -8 - i * 3);
        speedLines.add(line);
      }
      speedLines.visible = false;
      scene.add(speedLines);

      const resizeObserver = new ResizeObserver(() => {
        const width = host.clientWidth || 960;
        const height = host.clientHeight || 540;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
      resizeObserver.observe(host);

      const animate = (now) => {
        if (disposed) return;
        const delta = Math.min(CAMERA_MAX_DELTA, Math.max(0, (now - lastTime) / 1000));
        lastTime = now;

        const currentRace = raceStateRef.current || {};
        const visualDistances = visualDistancesRef.current;
        const raceIsMoving = currentRace.status === "racing";
        const poseBlend = 1 - Math.pow(0.002, delta);
        const correctionBlend = Math.min(0.025, delta * 0.55);
        const syncVisualDistance = (id, rawDistance, speed = 0) => {
          const currentVisual = visualDistances.has(id) ? visualDistances.get(id) : rawDistance;
          const projectedDistance = raceIsMoving ? currentVisual + speed * delta : rawDistance;
          const correction = raceIsMoving ? (rawDistance - projectedDistance) * correctionBlend : 0;
          const nextVisual =
            Math.abs(currentVisual - rawDistance) > VISUAL_DISTANCE_SNAP
              ? rawDistance
              : projectedDistance + correction;
          const loopRaceDistance = Math.max(0, nextVisual);
          visualDistances.set(id, loopRaceDistance);
          return loopRaceDistance;
        };
        const playerDistance = syncVisualDistance("player", currentRace.playerDistance || 0, currentRace.speed || 0);
        const boost = Math.min(1, (currentRace.boostLevel || 0) / 3);
        const segment = getActiveSegment(playerDistance);
        const fogColor = segment.theme === "beach" ? "#83d8f5" : segment.theme === "mountain" ? "#9fb7ea" : segment.theme === "stadium" ? "#a7b7e8" : "#8fc8ee";
        scene.background.set(fogColor);
        scene.fog.color.set(fogColor);
        boostLight.intensity = boost > 0 ? 3 : 0.8;
        speedLines.visible = boost > 0;

        (leaderboardRef.current || []).forEach((car) => {
          const carGroup = ensureCarGroup(car);
          if (!carGroup) return;
          const distance = car.isPlayer
            ? playerDistance
            : syncVisualDistance(car.id, car.distanceTravelled || 0, car.speed || 0);
          const pose = getTrackPose(distance, LANES[car.lane ?? 1]);
          carGroup.position.copy(pose.position).setY(0.48);
          const previousYaw = carGroup.userData.visualYaw ?? pose.yaw;
          const nextYaw = easeAngle(previousYaw, pose.yaw, poseBlend);
          carGroup.userData.visualYaw = nextYaw;
          carGroup.rotation.y = nextYaw;
          if (carGroup.userData.flame) carGroup.userData.flame.visible = car.isPlayer && boost > 0;
        });

        const pose = getTrackPose(playerDistance);
        const shake = boost > 0 ? Math.sin(now * 0.038) * (0.025 * boost) : 0;
        const target = pose.position.clone().addScaledVector(pose.tangent, -21 + boost * 1.6).addScaledVector(pose.right, shake * 9).setY(4.8 + boost * 0.28);
        const lookAt = pose.position.clone().addScaledVector(pose.tangent, 22).setY(1.15);
        if (!cameraPrimed) {
          camera.position.copy(target);
          cameraLookAt.copy(lookAt);
          cameraPrimed = true;
        } else {
          camera.position.lerp(target, 1 - Math.pow(0.001, delta));
          cameraLookAt.lerp(lookAt, 1 - Math.pow(0.002, delta));
        }
        camera.lookAt(cameraLookAt);
        camera.fov = THREE.MathUtils.lerp(camera.fov, 57 + boost * 7, 0.08);
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
        if (!readySent) {
          readySent = true;
          onSceneReady?.();
        }
        frameId = requestAnimationFrame(animate);
      };

      frameId = requestAnimationFrame(animate);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        disposeObject(scene);
        renderer.dispose();
        renderer.domElement.remove();
      };
    } catch (error) {
      console.error("Math Racing League scene error:", error);
      onSceneError?.();
      return undefined;
    }
  }, [league.accent, onSceneError, onSceneReady]);

  return <div ref={hostRef} className="mrl-race-canvas" />;
}
