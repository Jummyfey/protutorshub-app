import { EMPTY_WORLD_SAVE, PLAYER_START, WORLD_LIMIT } from "./buildCityData";
import type { BuildCitySave, PlacedStructure, PlayerPosition, StarterAssetId } from "./buildCityData";

export const clampPlayerPosition = (position: PlayerPosition): PlayerPosition => ({
  x: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, position.x)),
  z: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, position.z)),
});

const normalizePlayerPosition = (value: unknown): PlayerPosition => {
  if (!value || typeof value !== "object") return PLAYER_START;
  const candidate = value as Partial<PlayerPosition>;

  if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.z)) {
    return PLAYER_START;
  }

  return clampPlayerPosition({
    x: Number(candidate.x),
    z: Number(candidate.z),
  });
};

const STARTER_ASSET_IDS: StarterAssetId[] = [
  "small-house",
  "two-storey-house",
  "three-storey-lodge",
  "starter-tent",
  "water-well",
  "storage-hut",
  "garden",
  "wooden-sign",
  "school",
  "clinic",
  "shop",
  "worship-hall",
  "playground",
  "community-hall",
  "flower-patch",
  "city-tree",
  "bush",
  "rock",
  "bench",
  "park-piece",
  "dirt-path",
  "stone-road",
  "bridge",
  "street-light",
  "water-tower",
  "bus-stop",
  "larger-school",
  "hospital",
  "market",
  "library",
  "fire-station",
  "town-hall",
  "apartment-block",
];

const normalizeStructures = (value: unknown): PlacedStructure[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<PlacedStructure>;
    if (!candidate.assetId || !STARTER_ASSET_IDS.includes(candidate.assetId)) return [];
    if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.z)) return [];

    const position = clampPlayerPosition({
      x: Number(candidate.x),
      z: Number(candidate.z),
    });

    return [{
      instanceId: String(candidate.instanceId || `${candidate.assetId}-${index}`),
      assetId: candidate.assetId,
      x: position.x,
      z: position.z,
      rotation: Number.isFinite(candidate.rotation) ? Number(candidate.rotation) : 0,
      placedAt: Number.isFinite(candidate.placedAt) ? Number(candidate.placedAt) : Date.now(),
    }];
  });
};

export const normalizeWorldSave = (save: unknown): BuildCitySave => {
  if (!save || typeof save !== "object") {
    return EMPTY_WORLD_SAVE;
  }

  const candidate = save as Partial<BuildCitySave>;

  return {
    playerPosition: normalizePlayerPosition(candidate.playerPosition),
    coins: Number.isFinite(candidate.coins) ? Math.max(0, Number(candidate.coins)) : EMPTY_WORLD_SAVE.coins,
    structures: normalizeStructures(candidate.structures),
  };
};
