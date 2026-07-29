export type PlayerPosition = {
  x: number;
  z: number;
};

export type StarterAssetId =
  | "small-house"
  | "two-storey-house"
  | "three-storey-lodge"
  | "starter-tent"
  | "water-well"
  | "storage-hut"
  | "garden"
  | "wooden-sign"
  | "school"
  | "clinic"
  | "shop"
  | "worship-hall"
  | "playground"
  | "community-hall"
  | "flower-patch"
  | "city-tree"
  | "bush"
  | "rock"
  | "bench"
  | "park-piece"
  | "dirt-path"
  | "stone-road"
  | "bridge"
  | "street-light"
  | "water-tower"
  | "bus-stop"
  | "larger-school"
  | "hospital"
  | "market"
  | "library"
  | "fire-station"
  | "town-hall"
  | "apartment-block";

export type PlacedStructure = {
  instanceId: string;
  assetId: StarterAssetId;
  x: number;
  z: number;
  rotation: number;
  placedAt: number;
};

export type BuildCitySave = {
  playerPosition: PlayerPosition;
  coins: number;
  structures: PlacedStructure[];
};

export const BUILD_CITY_STORAGE_KEY = "proTutorsHub.buildCityWorld.phase2.starterSet.v1";

export const WORLD_SIZE = 8000;
export const WORLD_LIMIT = WORLD_SIZE / 2 - 90;
export const CHUNK_SIZE = 160;
export const VISIBLE_CHUNK_RADIUS = 3;
export const HIGH_DETAIL_CHUNK_RADIUS = 1;

export const PLAYER_START: PlayerPosition = {
  x: 520,
  z: 100,
};

export const SPAWN_CLEARING_POSITION: [number, number, number] = [520, 0, 100];

export const EMPTY_WORLD_SAVE: BuildCitySave = {
  playerPosition: PLAYER_START,
  coins: 520,
  structures: [],
};
