import * as THREE from "three";
import { mapAnimationClips } from "./runnerAnimationMap";

const BONE_NAMES = {
  hips: "mixamorigHips",
  spine: "mixamorigSpine",
  spine1: "mixamorigSpine1",
  spine2: "mixamorigSpine2",
  head: "mixamorigHead",
  leftArm: "mixamorigLeftArm",
  leftForeArm: "mixamorigLeftForeArm",
  rightArm: "mixamorigRightArm",
  rightForeArm: "mixamorigRightForeArm",
  leftUpLeg: "mixamorigLeftUpLeg",
  leftLeg: "mixamorigLeftLeg",
  rightUpLeg: "mixamorigRightUpLeg",
  rightLeg: "mixamorigRightLeg",
};

function findBone(root, name) {
  let found = null;
  root.traverse((node) => {
    if (!found && node.isBone && node.name === name) found = node;
  });
  return found;
}

function getBoneMap(root) {
  return Object.fromEntries(
    Object.entries(BONE_NAMES).map(([key, name]) => [key, findBone(root, name)]),
  );
}

function offsetQuaternion(bone, euler) {
  if (!bone) return null;
  return bone.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...euler)));
}

function quaternionTrack(bone, times, eulers) {
  if (!bone) return null;
  const values = eulers.flatMap((euler) => {
    const q = offsetQuaternion(bone, euler);
    return q ? [q.x, q.y, q.z, q.w] : [];
  });
  return new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values);
}

function positionTrack(bone, times, offsets) {
  if (!bone) return null;
  const base = bone.position.clone();
  const values = offsets.flatMap(([x, y, z]) => [base.x + x, base.y + y, base.z + z]);
  return new THREE.VectorKeyframeTrack(`${bone.name}.position`, times, values);
}

function compactTracks(tracks) {
  return tracks.filter(Boolean);
}

function makeJumpStart(bones) {
  const times = [0, 0.14, 0.28];
  return new THREE.AnimationClip("JumpStart", 0.28, compactTracks([
    positionTrack(bones.hips, times, [[0, 0, 0], [0, -2.5, 0], [0, 3.5, 0]]),
    quaternionTrack(bones.hips, times, [[0, 0, 0], [-0.18, 0, 0], [0.12, 0, 0]]),
    quaternionTrack(bones.spine2, times, [[0, 0, 0], [0.16, 0, 0], [-0.1, 0, 0]]),
    // Keep jump arms compact; the authored run clip has active arms, but generated jumps should not throw hands overhead.
    quaternionTrack(bones.leftArm, times, [[0, 0, 0], [-0.18, 0.04, -0.05], [-0.28, 0.04, -0.04]]),
    quaternionTrack(bones.rightArm, times, [[0, 0, 0], [-0.18, -0.04, 0.05], [-0.28, -0.04, 0.04]]),
    quaternionTrack(bones.leftForeArm, times, [[0, 0, 0], [-0.22, 0, 0], [-0.32, 0, 0]]),
    quaternionTrack(bones.rightForeArm, times, [[0, 0, 0], [-0.22, 0, 0], [-0.32, 0, 0]]),
    quaternionTrack(bones.leftUpLeg, times, [[0, 0, 0], [0.55, 0, 0], [0.25, 0, 0]]),
    quaternionTrack(bones.rightUpLeg, times, [[0, 0, 0], [0.55, 0, 0], [0.25, 0, 0]]),
    quaternionTrack(bones.leftLeg, times, [[0, 0, 0], [-0.55, 0, 0], [-0.25, 0, 0]]),
    quaternionTrack(bones.rightLeg, times, [[0, 0, 0], [-0.55, 0, 0], [-0.25, 0, 0]]),
  ]));
}

function makeJumpLoop(bones) {
  const times = [0, 0.32, 0.64];
  return new THREE.AnimationClip("JumpLoop", 0.64, compactTracks([
    positionTrack(bones.hips, times, [[0, 2.8, 0], [0, 3.4, 0], [0, 2.8, 0]]),
    quaternionTrack(bones.hips, times, [[0.08, 0, 0], [0.04, 0, 0], [0.08, 0, 0]]),
    quaternionTrack(bones.spine2, times, [[-0.08, 0, 0], [-0.14, 0, 0], [-0.08, 0, 0]]),
    quaternionTrack(bones.leftArm, times, [[-0.24, 0.04, -0.04], [-0.3, 0.03, -0.03], [-0.24, 0.04, -0.04]]),
    quaternionTrack(bones.rightArm, times, [[-0.24, -0.04, 0.04], [-0.3, -0.03, 0.03], [-0.24, -0.04, 0.04]]),
    quaternionTrack(bones.leftForeArm, times, [[-0.28, 0, 0], [-0.34, 0, 0], [-0.28, 0, 0]]),
    quaternionTrack(bones.rightForeArm, times, [[-0.28, 0, 0], [-0.34, 0, 0], [-0.28, 0, 0]]),
    quaternionTrack(bones.leftUpLeg, times, [[0.4, 0, 0], [0.34, 0, 0], [0.4, 0, 0]]),
    quaternionTrack(bones.rightUpLeg, times, [[0.4, 0, 0], [0.34, 0, 0], [0.4, 0, 0]]),
  ]));
}

function makeLand(bones) {
  const times = [0, 0.1, 0.22];
  return new THREE.AnimationClip("Land", 0.22, compactTracks([
    positionTrack(bones.hips, times, [[0, 1.8, 0], [0, -2.2, 0], [0, 0, 0]]),
    quaternionTrack(bones.hips, times, [[0.08, 0, 0], [-0.2, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.spine2, times, [[-0.08, 0, 0], [0.18, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.leftUpLeg, times, [[0.25, 0, 0], [0.62, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.rightUpLeg, times, [[0.25, 0, 0], [0.62, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.leftLeg, times, [[-0.2, 0, 0], [-0.72, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.rightLeg, times, [[-0.2, 0, 0], [-0.72, 0, 0], [0, 0, 0]]),
  ]));
}

function makeSlide(bones) {
  const times = [0, 0.18, 0.52, 0.72];
  return new THREE.AnimationClip("Slide", 0.72, compactTracks([
    positionTrack(bones.hips, times, [[0, 0, 0], [0, -9, 2.2], [0, -9, 2.2], [0, 0, 0]]),
    quaternionTrack(bones.hips, times, [[0, 0, 0], [-1.08, 0, 0], [-1.08, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.spine, times, [[0, 0, 0], [0.55, 0, 0], [0.55, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.spine2, times, [[0, 0, 0], [0.3, 0, 0], [0.3, 0, 0], [0, 0, 0]]),
    // Slide tucks the arms beside the body instead of spreading them out.
    quaternionTrack(bones.leftArm, times, [[0, 0, 0], [-0.2, 0.05, -0.08], [-0.2, 0.05, -0.08], [0, 0, 0]]),
    quaternionTrack(bones.rightArm, times, [[0, 0, 0], [-0.2, -0.05, 0.08], [-0.2, -0.05, 0.08], [0, 0, 0]]),
    quaternionTrack(bones.leftForeArm, times, [[0, 0, 0], [-0.55, 0, 0.05], [-0.55, 0, 0.05], [0, 0, 0]]),
    quaternionTrack(bones.rightForeArm, times, [[0, 0, 0], [-0.55, 0, -0.05], [-0.55, 0, -0.05], [0, 0, 0]]),
    quaternionTrack(bones.leftUpLeg, times, [[0, 0, 0], [1.15, 0.12, 0.08], [1.15, 0.12, 0.08], [0, 0, 0]]),
    quaternionTrack(bones.rightUpLeg, times, [[0, 0, 0], [0.35, -0.12, -0.08], [0.35, -0.12, -0.08], [0, 0, 0]]),
    quaternionTrack(bones.leftLeg, times, [[0, 0, 0], [-0.95, 0, 0], [-0.95, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.rightLeg, times, [[0, 0, 0], [-0.25, 0, 0], [-0.25, 0, 0], [0, 0, 0]]),
  ]));
}

function makeStumble(bones) {
  const times = [0, 0.12, 0.28, 0.52];
  return new THREE.AnimationClip("Stumble", 0.52, compactTracks([
    positionTrack(bones.hips, times, [[0, 0, 0], [1.5, -1.2, 0.6], [-1, -0.5, 0.2], [0, 0, 0]]),
    quaternionTrack(bones.hips, times, [[0, 0, 0], [0.35, 0, -0.18], [-0.12, 0, 0.14], [0, 0, 0]]),
    quaternionTrack(bones.spine2, times, [[0, 0, 0], [-0.35, 0, 0.18], [0.22, 0, -0.12], [0, 0, 0]]),
    quaternionTrack(bones.head, times, [[0, 0, 0], [-0.22, 0, 0.16], [0.12, 0, -0.12], [0, 0, 0]]),
    quaternionTrack(bones.leftArm, times, [[0, 0, 0], [-1.2, 0.5, -0.45], [-0.4, 0.2, -0.15], [0, 0, 0]]),
    quaternionTrack(bones.rightArm, times, [[0, 0, 0], [-0.4, -0.4, 0.35], [-1.1, -0.2, 0.18], [0, 0, 0]]),
    quaternionTrack(bones.leftUpLeg, times, [[0, 0, 0], [0.72, 0.1, 0], [0.2, 0, 0], [0, 0, 0]]),
    quaternionTrack(bones.rightUpLeg, times, [[0, 0, 0], [-0.18, -0.1, 0], [0.48, 0, 0], [0, 0, 0]]),
  ]));
}

export function createGeneratedRunnerClips(root, authoredClips = []) {
  const authoredMap = mapAnimationClips(authoredClips, { includeFallbacks: false });
  const bones = getBoneMap(root);
  const generated = [];

  if (!authoredMap.JumpStart) generated.push(makeJumpStart(bones));
  if (!authoredMap.JumpLoop) generated.push(makeJumpLoop(bones));
  if (!authoredMap.Land) generated.push(makeLand(bones));
  if (!authoredMap.Slide) generated.push(makeSlide(bones));
  if (!authoredMap.Stumble) generated.push(makeStumble(bones));
  if (!authoredMap.Hit) {
    const hitClip = makeStumble(bones).clone();
    hitClip.name = "Hit";
    hitClip.duration = 0.45;
    generated.push(hitClip);
  }

  return generated.filter((clip) => clip.tracks.length > 0);
}
