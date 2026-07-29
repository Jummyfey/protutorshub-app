import type { StarterAssetId } from "./buildCityData";

export type BuildCityAssetKind = "building" | "character" | "environment" | "infrastructure" | "prop";

export type BuildCityAssetDefinition = {
  id: string;
  assetId?: StarterAssetId;
  kind: BuildCityAssetKind;
  displayName: string;
  modelPath: string;
  materialSet: string;
  collision: "capsule" | "box" | "compound" | "mesh";
  lod: "required" | "optional";
  status: "placeholder" | "asset-ready" | "production";
};

export type BuildCityMaterialDefinition = {
  id: string;
  albedo: string;
  normal: string;
  roughness: string;
  ao: string;
  scale: number;
};

export const BUILD_CITY_ASSET_ROOT = "/assets/build-city";

export const BUILD_CITY_MATERIAL_LIBRARY: BuildCityMaterialDefinition[] = [
  {
    id: "warm-plaster",
    albedo: `${BUILD_CITY_ASSET_ROOT}/textures/warm-plaster/albedo.png`,
    normal: `${BUILD_CITY_ASSET_ROOT}/textures/warm-plaster/normal.png`,
    roughness: `${BUILD_CITY_ASSET_ROOT}/textures/warm-plaster/roughness.png`,
    ao: `${BUILD_CITY_ASSET_ROOT}/textures/warm-plaster/ao.png`,
    scale: 2,
  },
  {
    id: "painted-roof-tile",
    albedo: `${BUILD_CITY_ASSET_ROOT}/textures/painted-roof-tile/albedo.png`,
    normal: `${BUILD_CITY_ASSET_ROOT}/textures/painted-roof-tile/normal.png`,
    roughness: `${BUILD_CITY_ASSET_ROOT}/textures/painted-roof-tile/roughness.png`,
    ao: `${BUILD_CITY_ASSET_ROOT}/textures/painted-roof-tile/ao.png`,
    scale: 1.5,
  },
  {
    id: "asphalt-road",
    albedo: `${BUILD_CITY_ASSET_ROOT}/textures/asphalt-road/albedo.png`,
    normal: `${BUILD_CITY_ASSET_ROOT}/textures/asphalt-road/normal.png`,
    roughness: `${BUILD_CITY_ASSET_ROOT}/textures/asphalt-road/roughness.png`,
    ao: `${BUILD_CITY_ASSET_ROOT}/textures/asphalt-road/ao.png`,
    scale: 8,
  },
  {
    id: "lush-grass",
    albedo: `${BUILD_CITY_ASSET_ROOT}/textures/lush-grass/albedo.png`,
    normal: `${BUILD_CITY_ASSET_ROOT}/textures/lush-grass/normal.png`,
    roughness: `${BUILD_CITY_ASSET_ROOT}/textures/lush-grass/roughness.png`,
    ao: `${BUILD_CITY_ASSET_ROOT}/textures/lush-grass/ao.png`,
    scale: 14,
  },
];

export const BUILD_CITY_ASSET_CATALOG: BuildCityAssetDefinition[] = [
  {
    id: "founder-house-production",
    assetId: "small-house",
    kind: "building",
    displayName: "Founder House",
    modelPath: `${BUILD_CITY_ASSET_ROOT}/models/buildings/founder-house.glb`,
    materialSet: "warm-plaster",
    collision: "compound",
    lod: "required",
    status: "asset-ready",
  },
  {
    id: "two-storey-family-house-production",
    assetId: "two-storey-house",
    kind: "building",
    displayName: "Two-Storey Family House",
    modelPath: `${BUILD_CITY_ASSET_ROOT}/models/buildings/two-storey-family-house.glb`,
    materialSet: "warm-plaster",
    collision: "compound",
    lod: "required",
    status: "asset-ready",
  },
  {
    id: "stylized-founder-character",
    kind: "character",
    displayName: "Founder Character",
    modelPath: `${BUILD_CITY_ASSET_ROOT}/models/characters/founder-character.glb`,
    materialSet: "character-skin-cloth",
    collision: "capsule",
    lod: "required",
    status: "asset-ready",
  },
  {
    id: "starter-road-kit",
    kind: "infrastructure",
    displayName: "Road, sidewalk, curb and drainage kit",
    modelPath: `${BUILD_CITY_ASSET_ROOT}/models/infrastructure/starter-road-kit.glb`,
    materialSet: "asphalt-road",
    collision: "compound",
    lod: "required",
    status: "asset-ready",
  },
  {
    id: "cozy-vegetation-kit",
    kind: "environment",
    displayName: "Trees, bushes, flowers and grass kit",
    modelPath: `${BUILD_CITY_ASSET_ROOT}/models/environment/cozy-vegetation-kit.glb`,
    materialSet: "lush-grass",
    collision: "box",
    lod: "required",
    status: "asset-ready",
  },
];

export const BUILD_CITY_ASSET_QUALITY_GATES = [
  "GLB/GLTF model with real scale in metres",
  "Separate collision primitive or documented collision hull",
  "PBR albedo, normal, roughness and ambient-occlusion maps",
  "At least one lower-detail LOD for large/repeated assets",
  "Named entrance/interior anchors for interactable buildings",
  "No copyrighted or restricted marketplace assets",
];

export type UserSuppliedBuildCityAsset = {
  id: string;
  label: string;
  category: "environment" | "residential" | "commerce" | "infrastructure" | "civic";
  path: string;
  recommendedUse: string;
  targetSize: number;
};

export const USER_SUPPLIED_BUILD_CITY_ASSETS: UserSuppliedBuildCityAsset[] = [
  {
    id: "countryside-houses",
    label: "Countryside Houses",
    category: "residential",
    path: `${BUILD_CITY_ASSET_ROOT}/models/user-supplied/countryside-model-houses.glb`,
    recommendedUse: "Residential showcase or starter neighborhood candidates",
    targetSize: 86,
  },
  {
    id: "old-residential-building",
    label: "Old Residential Building",
    category: "residential",
    path: `${BUILD_CITY_ASSET_ROOT}/models/user-supplied/old-residential-building-4k.glb`,
    recommendedUse: "Apartment or older-town residential asset",
    targetSize: 92,
  },
  {
    id: "blackfriar-pub",
    label: "Blackfriar Pub",
    category: "commerce",
    path: `${BUILD_CITY_ASSET_ROOT}/models/user-supplied/blackfriar-pub.glb`,
    recommendedUse: "Commerce/cafe-style building after rebranding for children",
    targetSize: 86,
  },
  {
    id: "german-farmer-market",
    label: "Farmer Market",
    category: "commerce",
    path: `${BUILD_CITY_ASSET_ROOT}/models/user-supplied/german-farmer-market.glb`,
    recommendedUse: "Market or community commerce zone",
    targetSize: 92,
  },
  {
    id: "farmland-river-road",
    label: "Farmland River Road",
    category: "environment",
    path: `${BUILD_CITY_ASSET_ROOT}/models/user-supplied/farmland-river-hills-country-road-railway.glb`,
    recommendedUse: "Environment reference only; likely too complete for player-built city",
    targetSize: 130,
  },
  {
    id: "forgotten-sanctuary-lake",
    label: "Sanctuary Lake",
    category: "environment",
    path: `${BUILD_CITY_ASSET_ROOT}/models/user-supplied/forgotten-sanctuary-lake.glb`,
    recommendedUse: "Environment reference only; very large file",
    targetSize: 140,
  },
  {
    id: "basilica",
    label: "Basilica",
    category: "civic",
    path: `${BUILD_CITY_ASSET_ROOT}/models/user-supplied/basilica-of-our-lady-of-the-rosary.glb`,
    recommendedUse: "Not suitable for generic civic building unless intentionally religious",
    targetSize: 96,
  },
];
