# Math Racing League GLB Assets

The racing scene currently uses these production vehicle models:

- `2022 Cavallo Daytona SP3.glb` - player car
- `Porsche GT3 RS.glb` - AI Flash
- `Nissan 350z Rocket Bunny.glb` - Steady Ada
- `2020 NASCAR Chevrolet Camaro Zl1 1LE.glb` - Math Titan

The React Three Fiber scene loads these paths with `useGLTF()` and normalizes
their size in the track at runtime.
Do not add placeholder toy cars here; use real GLB/GLTF vehicle assets.
Math Racing League now loads the actual requested GLB files directly:

- Player / You: `/models/2022 Cavallo Daytona SP3.glb`
- AI Speedster: `/models/Porsche GT3 RS.glb`
- AI Flash: `/models/Nissan 350z Rocket Bunny.glb`

The old alias files (`player-car.glb`, `ai-car-1.glb`, `ai-car-2.glb`, `ai-car-3.glb`) are no longer used by the active race scene.
