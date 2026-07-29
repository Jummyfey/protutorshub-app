# Build City Production Asset Folder

This folder is reserved for production Build City assets.

Expected structure:

- `models/buildings/*.glb`
- `models/characters/*.glb`
- `models/environment/*.glb`
- `models/infrastructure/*.glb`
- `textures/<material-name>/albedo.png`
- `textures/<material-name>/normal.png`
- `textures/<material-name>/roughness.png`
- `textures/<material-name>/ao.png`

Asset rules:

- Use only original, commissioned, CC0, MIT, Apache 2.0, BSD, or otherwise permissively licensed assets.
- Record source and license before committing external assets.
- Every placed building needs a real entrance anchor and collision shape.
- Every repeated asset should include LODs or be instancing-friendly.
