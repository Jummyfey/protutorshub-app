# Obstacle Runner Character Asset Checklist

Current permanent runner animation asset:

`/assets/characters/pro-tutors-runner-running.fbx`

Optional future full-character GLB path:

`/assets/characters/pro-tutors-runner.glb`

Legacy development asset, not currently used:

`/assets/characters/temporary-runner-running.fbx`

Installed licensed visual test asset, not currently used:

`/assets/characters/girl-avatar-ready-player-me.glb`

Attribution:

“Girl Avatar - Ready Player Me” (https://skfb.ly/6YvBU) by Li cam is licensed under Creative Commons Attribution 4.0 (http://creativecommons.org/licenses/by/4.0/).

The current visible runner uses the permanent FBX file because it contains the working authored running motion. A future original Pro Tutors Hub character may still be exported as GLB/glTF 2.0, but it must include proper animation clips before it becomes the active visual asset.

A future full production character should contain:

- Skinned humanoid mesh.
- One humanoid skeleton.
- Clean skin weights.
- Child-friendly cartoon proportions.
- Textures and materials preserved in the GLB.
- Run animation.
- JumpStart or Jump animation.
- JumpLoop animation where possible.
- Land animation.
- Slide animation.
- Stumble or Hit reaction animation.
- Optional Idle, LaneLeft, LaneRight, Celebrate clips.
- Consistent bone naming.
- Correct forward orientation.
- Feet positioned near ground level.
- Reasonable polygon count and material count for mobile.
- Web-ready texture sizes, ideally not 4K.

Animation clips are mapped by normalized names, so these are accepted:

- `Run`, `Running`, `run`, `Armature|Run`
- `JumpStart`, `Jump Start`, `Jump`
- `JumpLoop`, `Airborne`
- `Land`, `Landing`
- `Slide`, `Sliding`
- `Stumble`, `HitReaction`

Changing the active runner asset should normally require changing only `RUNNER_CONFIG.character.activeAssetPath` in `scene/runnerConfig.js`.

## Runtime Clips

The FBX provides the permanent `Run` animation. The game also generates simple runtime clips for:

- `JumpStart`
- `JumpLoop`
- `Land`
- `Slide`
- `Stumble`
- `Hit`

These generated clips are used for early jump, landing, slide, stumble, and hit testing. They are built from common Mixamo-style bone names such as `mixamorigHips`, `mixamorigSpine`, `mixamorigLeftArm`, and `mixamorigLeftUpLeg`. A future custom character should include professionally authored clips for all gameplay states.
