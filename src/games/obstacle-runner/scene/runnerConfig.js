export const RUNNER_CONFIG = {
  lanes: [-2.5, 0, 2.5],
  laneWidth: 2.5,
  movement: {
    baseSpeed: 10,
    maxSpeed: 16,
    acceleration: 0.18,
    laneSwitchSmoothing: 9.5,
  },
  track: {
    segmentLength: 42,
    activeSegments: 11,
    recycleBehindDistance: 70,
    roadWidth: 9.4,
    shoulderWidth: 4.8,
  },
  camera: {
    followDistance: 12,
    height: 6.2,
    lookAheadDistance: 15,
    followSmoothing: 5.6,
    laneResponseStrength: 0.26,
    fov: 53,
  },
  world: {
    fogNear: 34,
    fogFar: 190,
    pixelRatio: [1, 1.6],
  },
  character: {
    productionGlbPath: "/assets/characters/pro-tutors-runner.glb",
    runningFbxPath: "/assets/characters/pro-tutors-runner-running.fbx",
    activeAssetPath: "/assets/characters/pro-tutors-runner-running.fbx",
    attribution: null,
    targetHeight: 1.72,
    verticalOffset: 0,
    forwardRotation: Math.PI,
    leanStrength: 0.16,
    playbackMultiplier: 0.095,
    collider: {
      radius: 0.34,
      height: 1.72,
      slideHeight: 0.88,
    },
    fadeDurations: {
      ordinary: 0.15,
      land: 0.1,
      stumble: 0.2,
    },
  },
};

export const TRACK_VARIANTS = [
  "straight-dirt",
  "jungle-path",
  "riverside-path",
  "rocky-path",
  "open-grassland",
];
