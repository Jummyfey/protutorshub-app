import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import * as THREE from "three";
import {
  BUILD_CITY_STORAGE_KEY,
  CHUNK_SIZE,
  EMPTY_WORLD_SAVE,
  HIGH_DETAIL_CHUNK_RADIUS,
  SPAWN_CLEARING_POSITION,
  VISIBLE_CHUNK_RADIUS,
  WORLD_LIMIT,
  WORLD_SIZE,
} from "./buildCityData";
import type { BuildCitySave, PlacedStructure, PlayerPosition, StarterAssetId } from "./buildCityData";
import {
  BUILD_CITY_ASSET_CATALOG,
  BUILD_CITY_ASSET_QUALITY_GATES,
  BUILD_CITY_MATERIAL_LIBRARY,
  USER_SUPPLIED_BUILD_CITY_ASSETS,
} from "./buildCityAssets";
import type { UserSuppliedBuildCityAsset } from "./buildCityAssets";
import { clampPlayerPosition, normalizeWorldSave } from "./buildCityEngine";
import "./build-city.css";

type MovementIntent = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
};

type MovementVector = {
  x: number;
  z: number;
};

type BuildCityGameProps = {
  onBackToHub: () => void;
};

type ChunkCoord = {
  x: number;
  z: number;
};

type StarterAssetDefinition = {
  id: StarterAssetId;
  name: string;
  cost: number;
  size: string;
  icon: string;
  description: string;
  footprint: {
    width: number;
    depth: number;
    collisionRadius: number;
  };
  entrance: {
    label: string;
    localX: number;
    localZ: number;
    width: number;
  };
  floors: number;
  interiorReady: boolean;
  furnishingZones: string[];
  verticalTransport: "none" | "stairs" | "elevator";
};

type CityZoneId =
  | "residential"
  | "education"
  | "health"
  | "commerce"
  | "civic"
  | "recreation"
  | "infrastructure"
  | "nature";

type CityZoneDefinition = {
  id: CityZoneId;
  label: string;
  color: string;
  x: number;
  z: number;
  radius: number;
  description: string;
};

type PlannedLot = {
  id: string;
  x: number;
  z: number;
  rotation: number;
  label: string;
  preferred?: StarterAssetId[];
};

type PlannedRoadSegment = {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation: number;
};

type PlannedBridgeSlot = {
  id: string;
  x: number;
  z: number;
  rotation: number;
  label: string;
};

type PlannedResidentialDetail = {
  id: string;
  type: "tree" | "flower" | "lamp" | "well" | "garden" | "sign";
  x: number;
  z: number;
  scale?: number;
  rotation?: number;
};

type StructureCollisionHit = {
  structure: PlacedStructure;
  asset: StarterAssetDefinition;
};

const CITY_ZONES: CityZoneDefinition[] = [
  { id: "residential", label: "Residential", color: "#60a5fa", x: 760, z: 220, radius: 300, description: "Homes, tents, huts, apartments" },
  { id: "education", label: "Education", color: "#a78bfa", x: 850, z: -80, radius: 210, description: "Schools, library, learning buildings" },
  { id: "health", label: "Health", color: "#fb7185", x: 840, z: 310, radius: 185, description: "Clinic, hospital, health services" },
  { id: "commerce", label: "Commerce", color: "#f59e0b", x: 260, z: -190, radius: 210, description: "Shop, market, trading spaces" },
  { id: "civic", label: "Civic", color: "#38bdf8", x: 210, z: 250, radius: 210, description: "Town hall, community hall, worship hall" },
  { id: "recreation", label: "Recreation", color: "#22c55e", x: 610, z: 520, radius: 210, description: "Playgrounds, parks, benches, flowers" },
  { id: "infrastructure", label: "Infrastructure", color: "#94a3b8", x: 520, z: -420, radius: 230, description: "Roads, bridges, bus stops, lights, towers" },
  { id: "nature", label: "Nature", color: "#84cc16", x: 1040, z: 560, radius: 250, description: "Trees, bushes, rocks, gardens" },
];

const ASSET_ZONE_MAP: Record<StarterAssetId, CityZoneId> = {
  "small-house": "residential",
  "two-storey-house": "residential",
  "three-storey-lodge": "education",
  "starter-tent": "residential",
  "water-well": "infrastructure",
  "storage-hut": "residential",
  garden: "nature",
  "wooden-sign": "civic",
  school: "education",
  clinic: "health",
  shop: "commerce",
  "worship-hall": "civic",
  playground: "recreation",
  "community-hall": "civic",
  "flower-patch": "recreation",
  "city-tree": "nature",
  bush: "nature",
  rock: "nature",
  bench: "recreation",
  "park-piece": "recreation",
  "dirt-path": "infrastructure",
  "stone-road": "infrastructure",
  bridge: "infrastructure",
  "street-light": "infrastructure",
  "water-tower": "infrastructure",
  "bus-stop": "infrastructure",
  "larger-school": "education",
  hospital: "health",
  market: "commerce",
  library: "education",
  "fire-station": "civic",
  "town-hall": "civic",
  "apartment-block": "residential",
};

const getCityZone = (zoneId: CityZoneId) => CITY_ZONES.find((zone) => zone.id === zoneId) || CITY_ZONES[0];
const getAssetZone = (assetId: StarterAssetId) => getCityZone(ASSET_ZONE_MAP[assetId]);

const RESIDENTIAL_PLAN_LOTS: PlannedLot[] = [
  { id: "home-01", x: 590, z: 90, rotation: 0, label: "Founder Home Lot", preferred: ["small-house"] },
  { id: "home-02", x: 700, z: 90, rotation: 0, label: "Family Home Lot", preferred: ["two-storey-house"] },
  { id: "home-03", x: 820, z: 90, rotation: 0, label: "Garden Home Lot", preferred: ["small-house"] },
  { id: "home-04", x: 930, z: 90, rotation: 0, label: "Corner Home Lot", preferred: ["two-storey-house"] },
  { id: "home-05", x: 590, z: 350, rotation: Math.PI, label: "Starter Tent Lot", preferred: ["starter-tent"] },
  { id: "home-06", x: 700, z: 350, rotation: Math.PI, label: "Storage Hut Lot", preferred: ["storage-hut"] },
  { id: "home-07", x: 820, z: 350, rotation: Math.PI, label: "Apartment Lot", preferred: ["apartment-block"] },
  { id: "home-08", x: 930, z: 350, rotation: Math.PI, label: "Expansion Home Lot" },
  { id: "home-09", x: 590, z: -35, rotation: 0, label: "South Founder Lot", preferred: ["small-house"] },
  { id: "home-10", x: 700, z: -35, rotation: 0, label: "South Family Lot", preferred: ["two-storey-house"] },
  { id: "home-11", x: 820, z: -35, rotation: 0, label: "South Cottage Lot" },
  { id: "home-12", x: 930, z: -35, rotation: 0, label: "South Corner Lot" },
  { id: "home-13", x: 590, z: 475, rotation: Math.PI, label: "North Founder Lot" },
  { id: "home-14", x: 700, z: 475, rotation: Math.PI, label: "North Family Lot", preferred: ["two-storey-house"] },
  { id: "home-15", x: 820, z: 475, rotation: Math.PI, label: "North Apartment Lot", preferred: ["apartment-block"] },
  { id: "home-16", x: 930, z: 475, rotation: Math.PI, label: "North Corner Lot" },
  { id: "home-17", x: 470, z: 90, rotation: -Math.PI / 2, label: "West Starter Lot", preferred: ["small-house"] },
  { id: "home-18", x: 1050, z: 90, rotation: Math.PI / 2, label: "East Starter Lot", preferred: ["small-house"] },
  { id: "home-19", x: 470, z: 350, rotation: -Math.PI / 2, label: "West Family Lot", preferred: ["two-storey-house"] },
  { id: "home-20", x: 1050, z: 350, rotation: Math.PI / 2, label: "East Family Lot", preferred: ["two-storey-house"] },
  { id: "home-21", x: 470, z: -35, rotation: -Math.PI / 2, label: "West Front Lot" },
  { id: "home-22", x: 1050, z: -35, rotation: Math.PI / 2, label: "East Front Lot" },
  { id: "home-23", x: 470, z: 475, rotation: -Math.PI / 2, label: "West North Lot" },
  { id: "home-24", x: 1050, z: 475, rotation: Math.PI / 2, label: "East North Lot" },
  { id: "home-25", x: 590, z: 170, rotation: 0, label: "Inner Founder Lot" },
  { id: "home-26", x: 930, z: 170, rotation: 0, label: "Inner Family Lot", preferred: ["two-storey-house"] },
  { id: "home-27", x: 590, z: 270, rotation: Math.PI, label: "Inner Garden Lot" },
  { id: "home-28", x: 930, z: 270, rotation: Math.PI, label: "Inner Cottage Lot" },
];

const RESIDENTIAL_PLAN_ROADS: PlannedRoadSegment[] = [
  { id: "res-main-east-west", x: 760, z: 220, width: 690, depth: 24, rotation: 0 },
  { id: "res-main-north-south", x: 760, z: 220, width: 24, depth: 590, rotation: 0 },
  { id: "res-south-street", x: 760, z: 25, width: 640, depth: 18, rotation: 0 },
  { id: "res-north-street", x: 760, z: 415, width: 640, depth: 18, rotation: 0 },
  { id: "res-west-street", x: 530, z: 220, width: 18, depth: 520, rotation: 0 },
  { id: "res-east-street", x: 990, z: 220, width: 18, depth: 520, rotation: 0 },
  { id: "res-left-link", x: 645, z: 220, width: 18, depth: 250, rotation: 0 },
  { id: "res-right-link", x: 875, z: 220, width: 18, depth: 250, rotation: 0 },
];

const RESIDENTIAL_PLAN_PARKS: PlannedRoadSegment[] = [
  { id: "res-central-green", x: 760, z: 220, width: 92, depth: 72, rotation: 0 },
  { id: "res-west-green", x: 530, z: 220, width: 58, depth: 96, rotation: 0 },
  { id: "res-east-green", x: 990, z: 220, width: 58, depth: 96, rotation: 0 },
  { id: "res-south-green", x: 760, z: 25, width: 100, depth: 50, rotation: 0 },
  { id: "res-north-green", x: 760, z: 415, width: 100, depth: 50, rotation: 0 },
];

const RESIDENTIAL_PLAN_DETAILS: PlannedResidentialDetail[] = [
  { id: "res-tree-01", type: "tree", x: 530, z: 150, scale: 1.15 },
  { id: "res-tree-02", type: "tree", x: 990, z: 150, scale: 1.05 },
  { id: "res-tree-03", type: "tree", x: 530, z: 290, scale: 1.2 },
  { id: "res-tree-04", type: "tree", x: 990, z: 290, scale: 1.15 },
  { id: "res-tree-05", type: "tree", x: 760, z: 112, scale: 1.0 },
  { id: "res-tree-06", type: "tree", x: 760, z: 328, scale: 1.0 },
  { id: "res-tree-07", type: "tree", x: 420, z: 220, scale: 1.2 },
  { id: "res-tree-08", type: "tree", x: 1100, z: 220, scale: 1.2 },
  { id: "res-garden-01", type: "garden", x: 710, z: 170, scale: 1 },
  { id: "res-garden-02", type: "garden", x: 810, z: 170, scale: 1 },
  { id: "res-garden-03", type: "garden", x: 710, z: 270, scale: 1 },
  { id: "res-garden-04", type: "garden", x: 810, z: 270, scale: 1 },
  { id: "res-flower-01", type: "flower", x: 645, z: 150, scale: 0.9 },
  { id: "res-flower-02", type: "flower", x: 875, z: 150, scale: 0.9 },
  { id: "res-flower-03", type: "flower", x: 645, z: 290, scale: 0.9 },
  { id: "res-flower-04", type: "flower", x: 875, z: 290, scale: 0.9 },
  { id: "res-well", type: "well", x: 760, z: 220, scale: 1.05 },
  { id: "res-sign", type: "sign", x: 760, z: -78, scale: 1, rotation: 0 },
  { id: "res-lamp-01", type: "lamp", x: 530, z: 25, scale: 1 },
  { id: "res-lamp-02", type: "lamp", x: 760, z: 25, scale: 1 },
  { id: "res-lamp-03", type: "lamp", x: 990, z: 25, scale: 1 },
  { id: "res-lamp-04", type: "lamp", x: 530, z: 415, scale: 1 },
  { id: "res-lamp-05", type: "lamp", x: 760, z: 415, scale: 1 },
  { id: "res-lamp-06", type: "lamp", x: 990, z: 415, scale: 1 },
];

const BRIDGE_PLAN_SLOTS: PlannedBridgeSlot[] = [
  { id: "bridge-river-south", x: 72, z: -520, rotation: Math.PI / 2, label: "South River Bridge" },
  { id: "bridge-river-center", x: 174, z: -120, rotation: Math.PI / 2, label: "Central River Bridge" },
  { id: "bridge-river-north", x: 306, z: 360, rotation: Math.PI / 2, label: "North River Bridge" },
];

const SIMULATION_CENTER: PlayerPosition = { x: 1390, z: 260 };

const SIMULATION_ROADS: PlannedRoadSegment[] = [
  { id: "sim-main-boulevard-west", x: 1165, z: 260, width: 330, depth: 34, rotation: 0 },
  { id: "sim-main-boulevard-east", x: 1615, z: 260, width: 330, depth: 34, rotation: 0 },
  { id: "sim-community-avenue-south", x: 1390, z: 120, width: 34, depth: 210, rotation: 0 },
  { id: "sim-community-avenue-north", x: 1390, z: 400, width: 34, depth: 210, rotation: 0 },
  { id: "sim-south-street", x: 1390, z: 20, width: 720, depth: 22, rotation: 0 },
  { id: "sim-north-street", x: 1390, z: 500, width: 720, depth: 22, rotation: 0 },
  { id: "sim-west-street", x: 1000, z: 260, width: 22, depth: 560, rotation: 0 },
  { id: "sim-east-street", x: 1780, z: 260, width: 22, depth: 560, rotation: 0 },
];

const SIMULATION_GREEN_SPACES: PlannedRoadSegment[] = [
  { id: "sim-central-green", x: 1390, z: 260, width: 96, depth: 96, rotation: 0 },
  { id: "sim-west-play-green", x: 1185, z: 260, width: 118, depth: 112, rotation: 0 },
  { id: "sim-east-market-plaza", x: 1595, z: 260, width: 132, depth: 104, rotation: 0 },
];

const SIMULATION_STRUCTURES: PlacedStructure[] = [
  { instanceId: "sim-founder-01", assetId: "small-house", x: 1125, z: -115, rotation: 0, placedAt: 1 },
  { instanceId: "sim-founder-02", assetId: "small-house", x: 1285, z: -115, rotation: 0, placedAt: 1 },
  { instanceId: "sim-family-01", assetId: "two-storey-house", x: 1495, z: -122, rotation: 0, placedAt: 1 },
  { instanceId: "sim-family-02", assetId: "two-storey-house", x: 1660, z: -122, rotation: 0, placedAt: 1 },
  { instanceId: "sim-founder-03", assetId: "small-house", x: 1125, z: 635, rotation: Math.PI, placedAt: 1 },
  { instanceId: "sim-founder-04", assetId: "small-house", x: 1285, z: 635, rotation: Math.PI, placedAt: 1 },
  { instanceId: "sim-apartment-01", assetId: "apartment-block", x: 1495, z: 648, rotation: Math.PI, placedAt: 1 },
  { instanceId: "sim-family-03", assetId: "two-storey-house", x: 1660, z: 638, rotation: Math.PI, placedAt: 1 },
  { instanceId: "sim-school", assetId: "school", x: 1125, z: 130, rotation: -Math.PI / 2, placedAt: 1 },
  { instanceId: "sim-clinic", assetId: "clinic", x: 1125, z: 390, rotation: -Math.PI / 2, placedAt: 1 },
  { instanceId: "sim-shop", assetId: "shop", x: 1665, z: 120, rotation: Math.PI / 2, placedAt: 1 },
  { instanceId: "sim-market", assetId: "market", x: 1665, z: 400, rotation: Math.PI / 2, placedAt: 1 },
  { instanceId: "sim-playground", assetId: "playground", x: 1285, z: 260, rotation: 0, placedAt: 1 },
  { instanceId: "sim-water-well", assetId: "water-well", x: 1495, z: 260, rotation: 0, placedAt: 1 },
  { instanceId: "sim-storage", assetId: "storage-hut", x: 1495, z: 390, rotation: Math.PI / 2, placedAt: 1 },
  { instanceId: "sim-community", assetId: "community-hall", x: 1285, z: 130, rotation: 0, placedAt: 1 },
];

const isResidentialAsset = (assetId: StarterAssetId) => ASSET_ZONE_MAP[assetId] === "residential";

const getZoneArrivalPosition = (zone: CityZoneDefinition): PlayerPosition => {
  const candidates: PlayerPosition[] = [
    { x: zone.x, z: zone.z },
    { x: zone.x + zone.radius * 0.22, z: zone.z },
    { x: zone.x - zone.radius * 0.22, z: zone.z },
    { x: zone.x, z: zone.z + zone.radius * 0.22 },
    { x: zone.x, z: zone.z - zone.radius * 0.22 },
    { x: zone.x + zone.radius * 0.28, z: zone.z + zone.radius * 0.18 },
    { x: zone.x - zone.radius * 0.28, z: zone.z - zone.radius * 0.18 },
  ];

  return candidates.find((position) => (
    !isDeepWater(position.x, position.z) &&
    !isShorelineClearance(position.x, position.z) &&
    getTerrainSlope(position.x, position.z) < 8.5
  )) || { x: zone.x, z: zone.z };
};

const STARTER_ASSETS: StarterAssetDefinition[] = [
  {
    id: "small-house",
    name: "Founder House",
    cost: 120,
    size: "Large",
    icon: "H",
    description: "A bright first home for the new island settlement.",
    footprint: { width: 136, depth: 118, collisionRadius: 88 },
    entrance: { label: "Front Door", localX: 0, localZ: -63, width: 10 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["living room", "sleeping corner", "study corner", "storage wall"],
    verticalTransport: "none",
  },
  {
    id: "two-storey-house",
    name: "Two-Storey Family House",
    cost: 240,
    size: "Tall",
    icon: "2",
    description: "A beautiful two-floor home with a balcony, stairs, and room for family furniture.",
    footprint: { width: 132, depth: 116, collisionRadius: 84 },
    entrance: { label: "Main Door", localX: 0, localZ: -62, width: 10 },
    floors: 2,
    interiorReady: true,
    furnishingZones: ["ground-floor lounge", "kitchen", "upper bedrooms", "balcony", "stair hall"],
    verticalTransport: "stairs",
  },
  {
    id: "three-storey-lodge",
    name: "Three-Storey Learning Lodge",
    cost: 380,
    size: "Tower",
    icon: "3",
    description: "A premium three-floor city building with a lift shaft, study rooms, and rooftop space.",
    footprint: { width: 34, depth: 30, collisionRadius: 25 },
    entrance: { label: "Lobby Door", localX: 0, localZ: -15.5, width: 5.5 },
    floors: 3,
    interiorReady: true,
    furnishingZones: ["lobby", "learning rooms", "upper lounge", "roof terrace", "lift lobby"],
    verticalTransport: "elevator",
  },
  {
    id: "starter-tent",
    name: "Explorer Tent",
    cost: 65,
    size: "Medium",
    icon: "T",
    description: "A colourful base camp upgrade for young founders.",
    footprint: { width: 20, depth: 20, collisionRadius: 14 },
    entrance: { label: "Tent Flap", localX: 0, localZ: -9.5, width: 4.5 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["bedroll area", "supply corner", "lantern hook"],
    verticalTransport: "none",
  },
  {
    id: "water-well",
    name: "Water Well",
    cost: 90,
    size: "Medium",
    icon: "W",
    description: "A cheerful village well for the first community area.",
    footprint: { width: 16, depth: 16, collisionRadius: 11 },
    entrance: { label: "Well Approach", localX: 0, localZ: -8, width: 5 },
    floors: 0,
    interiorReady: false,
    furnishingZones: [],
    verticalTransport: "none",
  },
  {
    id: "storage-hut",
    name: "Storage Hut",
    cost: 95,
    size: "Large",
    icon: "S",
    description: "A sturdy hut for tools, food, and city supplies.",
    footprint: { width: 24, depth: 22, collisionRadius: 17 },
    entrance: { label: "Store Door", localX: 0, localZ: -11.5, width: 4 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["crate wall", "tool rack", "supply shelves"],
    verticalTransport: "none",
  },
  {
    id: "garden",
    name: "Food Garden",
    cost: 75,
    size: "Wide",
    icon: "G",
    description: "Neat vegetable beds and flowers for the first settlers.",
    footprint: { width: 30, depth: 24, collisionRadius: 20 },
    entrance: { label: "Garden Gate", localX: 0, localZ: -13, width: 6 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["crop rows", "flower border", "watering spot"],
    verticalTransport: "none",
  },
  {
    id: "wooden-sign",
    name: "Town Sign",
    cost: 45,
    size: "Small",
    icon: "!",
    description: "A founder sign that marks the start of the learner's city.",
    footprint: { width: 14, depth: 10, collisionRadius: 9 },
    entrance: { label: "Sign Front", localX: 0, localZ: -6, width: 4 },
    floors: 0,
    interiorReady: false,
    furnishingZones: [],
    verticalTransport: "none",
  },
  {
    id: "school",
    name: "School",
    cost: 300,
    size: "Community",
    icon: "Sc",
    description: "A welcoming first school where children can learn together.",
    footprint: { width: 36, depth: 30, collisionRadius: 26 },
    entrance: { label: "School Door", localX: 0, localZ: -16, width: 6 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["classroom", "reading corner", "teacher desk", "assembly wall"],
    verticalTransport: "none",
  },
  {
    id: "clinic",
    name: "Clinic",
    cost: 260,
    size: "Community",
    icon: "Cl",
    description: "A small health clinic for the growing island community.",
    footprint: { width: 30, depth: 26, collisionRadius: 22 },
    entrance: { label: "Clinic Door", localX: 0, localZ: -14, width: 5 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["waiting area", "checkup room", "medicine shelf", "rest space"],
    verticalTransport: "none",
  },
  {
    id: "shop",
    name: "Shop",
    cost: 220,
    size: "Community",
    icon: "$",
    description: "A cheerful local shop for daily supplies.",
    footprint: { width: 104, depth: 90, collisionRadius: 68 },
    entrance: { label: "Shop Door", localX: 0, localZ: -48, width: 9 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["counter", "shelves", "display table", "storage nook"],
    verticalTransport: "none",
  },
  {
    id: "worship-hall",
    name: "Worship Hall",
    cost: 280,
    size: "Community",
    icon: "^",
    description: "A peaceful gathering hall for worship and reflection.",
    footprint: { width: 34, depth: 32, collisionRadius: 25 },
    entrance: { label: "Hall Door", localX: 0, localZ: -16.5, width: 6 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["main hall", "quiet corner", "front platform", "seating rows"],
    verticalTransport: "none",
  },
  {
    id: "playground",
    name: "Playground",
    cost: 180,
    size: "Wide",
    icon: "P",
    description: "A bright play area with swings, slide, and soft ground.",
    footprint: { width: 36, depth: 30, collisionRadius: 24 },
    entrance: { label: "Play Area", localX: 0, localZ: -15, width: 7 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["swings", "slide", "sand area"],
    verticalTransport: "none",
  },
  {
    id: "community-hall",
    name: "Community Hall",
    cost: 340,
    size: "Community",
    icon: "C",
    description: "A larger hall for meetings, celebrations, and island events.",
    footprint: { width: 40, depth: 34, collisionRadius: 28 },
    entrance: { label: "Main Hall Door", localX: 0, localZ: -18, width: 7 },
    floors: 1,
    interiorReady: true,
    furnishingZones: ["main hall", "stage", "storage", "meeting corner"],
    verticalTransport: "none",
  },
  {
    id: "flower-patch",
    name: "Flower Patch",
    cost: 35,
    size: "Small",
    icon: "*",
    description: "A colourful patch of flowers for beautifying the learner's land.",
    footprint: { width: 12, depth: 10, collisionRadius: 8 },
    entrance: { label: "Flower Edge", localX: 0, localZ: -5, width: 3 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["flowers"],
    verticalTransport: "none",
  },
  {
    id: "city-tree",
    name: "Tree",
    cost: 50,
    size: "Small",
    icon: "Tr",
    description: "A buyable city tree for shade and beauty.",
    footprint: { width: 12, depth: 12, collisionRadius: 8 },
    entrance: { label: "Tree Base", localX: 0, localZ: -5, width: 3 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["shade"],
    verticalTransport: "none",
  },
  {
    id: "bush",
    name: "Bush",
    cost: 25,
    size: "Small",
    icon: "B",
    description: "A soft green bush for garden edges and parks.",
    footprint: { width: 9, depth: 8, collisionRadius: 6 },
    entrance: { label: "Bush Edge", localX: 0, localZ: -4, width: 3 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["greenery"],
    verticalTransport: "none",
  },
  {
    id: "rock",
    name: "Rock",
    cost: 20,
    size: "Small",
    icon: "R",
    description: "A natural rock for landscaping.",
    footprint: { width: 8, depth: 8, collisionRadius: 5 },
    entrance: { label: "Rock Edge", localX: 0, localZ: -4, width: 3 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["rock"],
    verticalTransport: "none",
  },
  {
    id: "bench",
    name: "Bench",
    cost: 60,
    size: "Small",
    icon: "=",
    description: "A simple bench for resting spots and parks.",
    footprint: { width: 12, depth: 7, collisionRadius: 7 },
    entrance: { label: "Bench Front", localX: 0, localZ: -4, width: 4 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["seat"],
    verticalTransport: "none",
  },
  {
    id: "park-piece",
    name: "Small Park Piece",
    cost: 140,
    size: "Wide",
    icon: "Pk",
    description: "A small park tile with grass, flowers, and a resting spot.",
    footprint: { width: 30, depth: 24, collisionRadius: 19 },
    entrance: { label: "Park Edge", localX: 0, localZ: -13, width: 6 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["grass", "flowers", "resting spot"],
    verticalTransport: "none",
  },
  {
    id: "dirt-path",
    name: "Dirt Path",
    cost: 40,
    size: "Path",
    icon: ".",
    description: "A simple starter path for connecting first buildings.",
    footprint: { width: 26, depth: 10, collisionRadius: 13 },
    entrance: { label: "Path Start", localX: 0, localZ: -5, width: 6 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["path"],
    verticalTransport: "none",
  },
  {
    id: "stone-road",
    name: "Stone Road",
    cost: 85,
    size: "Path",
    icon: "#",
    description: "A stronger road segment for a growing settlement.",
    footprint: { width: 30, depth: 12, collisionRadius: 15 },
    entrance: { label: "Road Edge", localX: 0, localZ: -6, width: 7 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["road"],
    verticalTransport: "none",
  },
  {
    id: "bridge",
    name: "Bridge",
    cost: 260,
    size: "Wide",
    icon: "Br",
    description: "A wooden bridge piece for future river crossings.",
    footprint: { width: 38, depth: 18, collisionRadius: 24 },
    entrance: { label: "Bridge Start", localX: 0, localZ: -10, width: 8 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["deck", "rails"],
    verticalTransport: "none",
  },
  {
    id: "street-light",
    name: "Street Light",
    cost: 75,
    size: "Small",
    icon: "L",
    description: "A cheerful lamp for roads and public spaces.",
    footprint: { width: 8, depth: 8, collisionRadius: 5 },
    entrance: { label: "Light Base", localX: 0, localZ: -4, width: 3 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["light"],
    verticalTransport: "none",
  },
  {
    id: "water-tower",
    name: "Water Tower",
    cost: 420,
    size: "Tall",
    icon: "Wt",
    description: "A tall water tower for advanced infrastructure.",
    footprint: { width: 24, depth: 24, collisionRadius: 16 },
    entrance: { label: "Tower Ladder", localX: 0, localZ: -12, width: 5 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["tank", "supports"],
    verticalTransport: "none",
  },
  {
    id: "bus-stop",
    name: "Bus Stop",
    cost: 160,
    size: "Small",
    icon: "Bs",
    description: "A small shelter for future city transport.",
    footprint: { width: 20, depth: 12, collisionRadius: 12 },
    entrance: { label: "Shelter Front", localX: 0, localZ: -7, width: 5 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["shelter", "seat"],
    verticalTransport: "none",
  },
  {
    id: "larger-school",
    name: "Larger School",
    cost: 720,
    size: "Advanced",
    icon: "LS",
    description: "A bigger multi-classroom school for long-term city growth.",
    footprint: { width: 50, depth: 42, collisionRadius: 34 },
    entrance: { label: "Main School Entrance", localX: 0, localZ: -22, width: 8 },
    floors: 2,
    interiorReady: true,
    furnishingZones: ["classrooms", "library room", "assembly hall", "stair hall"],
    verticalTransport: "stairs",
  },
  {
    id: "hospital",
    name: "Hospital",
    cost: 850,
    size: "Advanced",
    icon: "Hp",
    description: "A full hospital for a mature learner-built city.",
    footprint: { width: 48, depth: 42, collisionRadius: 33 },
    entrance: { label: "Hospital Lobby", localX: 0, localZ: -22, width: 8 },
    floors: 3,
    interiorReady: true,
    furnishingZones: ["reception", "wards", "clinic rooms", "lift lobby"],
    verticalTransport: "elevator",
  },
  {
    id: "market",
    name: "Market",
    cost: 520,
    size: "Advanced",
    icon: "Mk",
    description: "A colourful open market for trade and city life.",
    footprint: { width: 150, depth: 118, collisionRadius: 94 },
    entrance: { label: "Market Gate", localX: 0, localZ: -63, width: 13 },
    floors: 0,
    interiorReady: false,
    furnishingZones: ["stalls", "walkway", "shade"],
    verticalTransport: "none",
  },
  {
    id: "library",
    name: "Library",
    cost: 620,
    size: "Advanced",
    icon: "Lb",
    description: "A quiet library for reading, study, and future learning quests.",
    footprint: { width: 42, depth: 34, collisionRadius: 28 },
    entrance: { label: "Library Door", localX: 0, localZ: -18, width: 7 },
    floors: 2,
    interiorReady: true,
    furnishingZones: ["reading hall", "book stacks", "study rooms", "stairs"],
    verticalTransport: "stairs",
  },
  {
    id: "fire-station",
    name: "Fire Station",
    cost: 680,
    size: "Advanced",
    icon: "Fs",
    description: "A fire station for emergency services in the future city.",
    footprint: { width: 44, depth: 34, collisionRadius: 29 },
    entrance: { label: "Station Door", localX: 0, localZ: -18, width: 8 },
    floors: 2,
    interiorReady: true,
    furnishingZones: ["vehicle bay", "equipment wall", "office", "upper rest room"],
    verticalTransport: "stairs",
  },
  {
    id: "town-hall",
    name: "Town Hall",
    cost: 900,
    size: "Advanced",
    icon: "Th",
    description: "A civic landmark for the learner's growing city.",
    footprint: { width: 52, depth: 44, collisionRadius: 36 },
    entrance: { label: "Town Hall Steps", localX: 0, localZ: -23, width: 9 },
    floors: 2,
    interiorReady: true,
    furnishingZones: ["council room", "records office", "public hall", "stairs"],
    verticalTransport: "stairs",
  },
  {
    id: "apartment-block",
    name: "Apartment Block",
    cost: 980,
    size: "Advanced",
    icon: "A",
    description: "A tall residential block for future dense city districts.",
    footprint: { width: 152, depth: 130, collisionRadius: 98 },
    entrance: { label: "Apartment Lobby", localX: 0, localZ: -70, width: 11 },
    floors: 3,
    interiorReady: true,
    furnishingZones: ["lobby", "apartments", "shared lounge", "lift lobby"],
    verticalTransport: "elevator",
  },
];

const MOVEMENT_KEYS: Record<string, keyof MovementIntent> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
};

const MOVEMENT_KEY_BY_KEY: Record<string, keyof MovementIntent> = {
  w: "forward",
  W: "forward",
  ArrowUp: "forward",
  s: "backward",
  S: "backward",
  ArrowDown: "backward",
  a: "left",
  A: "left",
  ArrowLeft: "left",
  d: "right",
  D: "right",
  ArrowRight: "right",
  Shift: "sprint",
};

const WALK_SPEED = 34;
const RUN_SPEED = 52;
const MOVE_ACCELERATION = 11.5;
const MOVE_DECELERATION = 13.5;
const TURN_DAMPING = 11;
const REVERSAL_TURN_DAMPING = 18;
const CAMERA_POSITION_DAMPING = 4.8;
const CAMERA_LOOK_DAMPING = 7.2;
const MAX_FRAME_DELTA = 1 / 30;

const dampFactor = (damping: number, delta: number) => 1 - Math.exp(-damping * delta);

const hash = (x: number, z: number) => {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const valueNoise = (x: number, z: number) => {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const xf = x - x0;
  const zf = z - z0;
  const a = hash(x0, z0);
  const b = hash(x0 + 1, z0);
  const c = hash(x0, z0 + 1);
  const d = hash(x0 + 1, z0 + 1);
  const u = smoothstep(xf);
  const v = smoothstep(zf);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u), THREE.MathUtils.lerp(c, d, u), v);
};

const fbm = (x: number, z: number, octaves = 5) => {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let max = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    total += valueNoise(x * frequency, z * frequency) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return total / max;
};

const SEA_LEVEL = -3.2;
const ISLAND_RADIUS = WORLD_SIZE * 0.44;
const BEACH_START = WORLD_SIZE * 0.405;
const MOUNTAIN_START = WORLD_SIZE * 0.365;
const LAKE_CENTER = { x: 520, z: -360, radius: 150 };
const riverCenterX = (z: number) => 120 + Math.sin(z * 0.0018) * 170 + Math.sin(z * 0.00065 + 1.7) * 90;
const riverDistanceAt = (x: number, z: number) => Math.abs(x - riverCenterX(z));
const lakeDistanceAt = (x: number, z: number) => Math.hypot(x - LAKE_CENTER.x, z - LAKE_CENTER.z);
const radialDistanceAt = (x: number, z: number) => Math.hypot(x, z);

const getBiome = (x: number, z: number) => {
  const riverDistance = riverDistanceAt(x, z);
  const lake = lakeDistanceAt(x, z);
  const radial = radialDistanceAt(x, z);
  const rocky = fbm(x * 0.0048 + 80, z * 0.0048 - 20, 3);

  if (radial > ISLAND_RADIUS || riverDistance < 36 || lake < LAKE_CENTER.radius) return "water";
  if (radial > BEACH_START || riverDistance < 58 || lake < LAKE_CENTER.radius + 22) return "beach";
  if (radial > MOUNTAIN_START && rocky > 0.42) return "mountain";
  if (rocky > 0.78) return "rock";
  if (rocky < 0.13) return "dirt";
  return "grass";
};

const isDeepWater = (x: number, z: number) => (
  radialDistanceAt(x, z) > BEACH_START ||
  riverDistanceAt(x, z) < 60 ||
  lakeDistanceAt(x, z) < LAKE_CENTER.radius + 6
);

const isShorelineClearance = (x: number, z: number) => (
  radialDistanceAt(x, z) > BEACH_START - 22 ||
  riverDistanceAt(x, z) < 86 ||
  lakeDistanceAt(x, z) < LAKE_CENTER.radius + 38
);

const terrainHeight = (x: number, z: number) => {
  const broad = (fbm(x * 0.0011, z * 0.0011, 5) - 0.5) * 34;
  const rolling = (fbm(x * 0.0042, z * 0.0042, 4) - 0.5) * 15;
  const detail = (fbm(x * 0.015, z * 0.015, 3) - 0.5) * 3.5;
  const riverDistance = Math.abs(x - riverCenterX(z));
  const lakeDistance = Math.hypot(x - LAKE_CENTER.x, z - LAKE_CENTER.z);
  const radial = Math.hypot(x, z);
  const mountainBand = clamp01((radial - MOUNTAIN_START) / (ISLAND_RADIUS - MOUNTAIN_START));
  const beachDrop = clamp01((radial - BEACH_START) / (ISLAND_RADIUS - BEACH_START)) * 26;
  const mountainRise = mountainBand * mountainBand * 150 * (0.7 + fbm(x * 0.003, z * 0.003, 3) * 0.7);
  const cliffNoise = fbm(x * 0.008 + 9, z * 0.008 - 7, 3);
  const cliffs = cliffNoise > 0.82 ? (cliffNoise - 0.82) * 55 * mountainBand : 0;
  const riverCut = riverDistance < 78 ? (78 - riverDistance) * 0.28 : 0;
  const lakeCut = Math.max(0, LAKE_CENTER.radius + 28 - lakeDistance) * 0.23;
  const clearingDistance = Math.hypot(x - SPAWN_CLEARING_POSITION[0], z - SPAWN_CLEARING_POSITION[2]);
  const clearingBlend = clamp01(1 - clearingDistance / 96);
  const naturalHeight = broad + rolling + detail + mountainRise + cliffs - riverCut - lakeCut - beachDrop;

  return THREE.MathUtils.lerp(naturalHeight, 2.4, clearingBlend * clearingBlend);
};

const groundColor = (x: number, z: number, height: number) => {
  const biome = getBiome(x, z);
  const variation = fbm(x * 0.025 + 3, z * 0.025 - 2, 2);
  const slope = Math.abs(terrainHeight(x + 4, z) - terrainHeight(x - 4, z)) + Math.abs(terrainHeight(x, z + 4) - terrainHeight(x, z - 4));
  const wetness = clamp01((12 - height) / 20);
  const lushGrass = new THREE.Color("#3f9f4f").lerp(new THREE.Color("#79c85f"), variation * 0.72);
  const meadowGrass = new THREE.Color("#73b957").lerp(new THREE.Color("#a9cf68"), variation * 0.4);
  const dryGrass = new THREE.Color("#98b95e").lerp(new THREE.Color("#c7c46e"), variation * 0.28);
  const dirt = new THREE.Color("#8d714e").lerp(new THREE.Color("#5d5138"), wetness * 0.3);
  const rock = new THREE.Color("#898f87").lerp(new THREE.Color("#b8b8aa"), variation * 0.35);
  const sand = new THREE.Color("#dcc98e").lerp(new THREE.Color("#f0ddaa"), variation * 0.35);

  if (biome === "water") return new THREE.Color("#4dbfe8");
  if (biome === "beach") return sand;
  if (biome === "mountain" || height > 120 || slope > 24) return rock;
  if (biome === "rock" || slope > 14) return rock.lerp(dirt, 0.22);
  if (biome === "dirt") return dirt.lerp(lushGrass, 0.18);
  return lushGrass
    .lerp(meadowGrass, clamp01((height - 10) / 76) * 0.42)
    .lerp(dryGrass, clamp01((height - 60) / 90) * 0.16)
    .lerp(dirt, wetness * 0.12);
};

const getChunkKey = (chunk: ChunkCoord) => `${chunk.x}:${chunk.z}`;

const getStarterAsset = (assetId: StarterAssetId) => STARTER_ASSETS.find((asset) => asset.id === assetId) || STARTER_ASSETS[0];

const rotateLocalPoint = (localX: number, localZ: number, rotation: number) => ({
  x: localX * Math.cos(rotation) - localZ * Math.sin(rotation),
  z: localX * Math.sin(rotation) + localZ * Math.cos(rotation),
});

const isInsideRotatedRect = (
  point: PlayerPosition,
  center: PlayerPosition,
  rotation: number,
  halfWidth: number,
  halfDepth: number,
) => {
  const dx = point.x - center.x;
  const dz = point.z - center.z;
  const localX = dx * Math.cos(-rotation) - dz * Math.sin(-rotation);
  const localZ = dx * Math.sin(-rotation) + dz * Math.cos(-rotation);

  return Math.abs(localX) < halfWidth && Math.abs(localZ) < halfDepth;
};

const isInsideResidentialPreviewCompound = (position: PlayerPosition) => RESIDENTIAL_PLAN_LOTS.some((lot) => (
  isInsideRotatedRect(position, lot, lot.rotation, 19.5, 17.5)
));

const getStructureEntranceWorldPosition = (structure: PlacedStructure) => {
  const asset = getStarterAsset(structure.assetId);
  const rotated = rotateLocalPoint(asset.entrance.localX, asset.entrance.localZ, structure.rotation);
  return {
    x: structure.x + rotated.x,
    z: structure.z + rotated.z,
  };
};

const getStructureCollisionHit = (
  position: PlayerPosition,
  structures: PlacedStructure[],
  playerRadius = 5.6,
): StructureCollisionHit | undefined => {
  const passableAssetIds: StarterAssetId[] = ["dirt-path", "stone-road", "bridge", "flower-patch", "garden", "park-piece"];

  for (const structure of structures) {
    const asset = getStarterAsset(structure.assetId);
    if (passableAssetIds.includes(asset.id)) continue;

    const dx = position.x - structure.x;
    const dz = position.z - structure.z;
    const localX = dx * Math.cos(-structure.rotation) - dz * Math.sin(-structure.rotation);
    const localZ = dx * Math.sin(-structure.rotation) + dz * Math.cos(-structure.rotation);
    const halfWidth = asset.footprint.width / 2 + playerRadius;
    const halfDepth = asset.footprint.depth / 2 + playerRadius;
    const insideFootprint = Math.abs(localX) <= halfWidth && Math.abs(localZ) <= halfDepth;
    if (!insideFootprint) continue;

    return { structure, asset };
  }

  return undefined;
};

const getTerrainSlope = (x: number, z: number) => (
  Math.abs(terrainHeight(x + 5, z) - terrainHeight(x - 5, z)) +
  Math.abs(terrainHeight(x, z + 5) - terrainHeight(x, z - 5))
);

const validatePlacement = (
  asset: StarterAssetDefinition,
  position: PlayerPosition,
  structures: PlacedStructure[],
) => {
  if (asset.id === "bridge") {
    if (riverDistanceAt(position.x, position.z) > 92) {
      return "Bridges must be placed across the river, not on ordinary roads.";
    }
  } else if (isDeepWater(position.x, position.z) || isShorelineClearance(position.x, position.z)) {
    return "That place is too close to water. Choose dry open land.";
  }

  if (asset.id !== "bridge" && getTerrainSlope(position.x, position.z) > 7.5) {
    return "That ground is too steep. Try a flatter part of the island.";
  }

  const collidingStructure = structures.find((structure) => {
    const otherAsset = getStarterAsset(structure.assetId);
    return Math.hypot(structure.x - position.x, structure.z - position.z) <
      otherAsset.footprint.collisionRadius + asset.footprint.collisionRadius + 8;
  });

  if (collidingStructure) {
    return "That space overlaps another structure. Move to a wider open area.";
  }

  return "";
};

const getPlacementInFrontOfPlayer = (
  playerPosition: PlayerPosition,
  facing: MovementVector,
  asset: StarterAssetDefinition,
) => {
  const facingLength = Math.hypot(facing.x, facing.z) || 1;
  const forward = {
    x: facing.x / facingLength,
    z: facing.z / facingLength,
  };
  const distance = asset.footprint.collisionRadius + 18;

  return {
    x: playerPosition.x + forward.x * distance,
    z: playerPosition.z + forward.z * distance,
    rotation: Math.atan2(-forward.x, forward.z),
  };
};

const getPlannedResidentialPlacement = (
  asset: StarterAssetDefinition,
  structures: PlacedStructure[],
) => {
  if (!isResidentialAsset(asset.id)) return undefined;

  const isLotAvailable = (candidate: PlannedLot) => {
    const occupied = structures.some((structure) => (
      isResidentialAsset(structure.assetId) &&
      Math.hypot(structure.x - candidate.x, structure.z - candidate.z) < 34
    ));
    if (occupied) return false;

    return !structures.some((structure) => {
      const otherAsset = getStarterAsset(structure.assetId);
      return Math.hypot(structure.x - candidate.x, structure.z - candidate.z) <
        otherAsset.footprint.collisionRadius + asset.footprint.collisionRadius + 8;
    });
  };

  const preferredLot = RESIDENTIAL_PLAN_LOTS.find((candidate) => candidate.preferred?.includes(asset.id) && isLotAvailable(candidate));
  const lot = preferredLot || RESIDENTIAL_PLAN_LOTS.find(isLotAvailable);

  if (!lot) return undefined;

  return {
    x: lot.x,
    z: lot.z,
    rotation: lot.rotation,
    lotLabel: lot.label,
  };
};

const getPlannedBridgePlacement = (structures: PlacedStructure[]) => {
  const slot = BRIDGE_PLAN_SLOTS.find((candidate) => (
    !structures.some((structure) => (
      structure.assetId === "bridge" &&
      Math.hypot(structure.x - candidate.x, structure.z - candidate.z) < 46
    ))
  ));

  if (!slot) return undefined;

  return {
    x: slot.x,
    z: slot.z,
    rotation: slot.rotation,
    lotLabel: slot.label,
  };
};

const loadSavedWorld = (): BuildCitySave => {
  try {
    return normalizeWorldSave(JSON.parse(window.localStorage.getItem(BUILD_CITY_STORAGE_KEY) || "null"));
  } catch {
    return EMPTY_WORLD_SAVE;
  }
};

function useKeyboardMovement() {
  const keysRef = useRef<MovementIntent>({ forward: false, backward: false, left: false, right: false, sprint: false });

  useEffect(() => {
    const updateKey = (event: KeyboardEvent, active: boolean) => {
      const direction = MOVEMENT_KEYS[event.code] || MOVEMENT_KEY_BY_KEY[event.key];
      if (!direction) return;
      const target = event.target as HTMLElement | null;
      const targetTag = target?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || target?.isContentEditable) return;
      event.preventDefault();
      event.stopPropagation();
      keysRef.current[direction] = active;
    };

    const handleKeyDown = (event: KeyboardEvent) => updateKey(event, true);
    const handleKeyUp = (event: KeyboardEvent) => updateKey(event, false);

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
    };
  }, []);

  return keysRef;
}

function TerrainChunk({ chunk, highDetail }: { chunk: ChunkCoord; highDetail: boolean }) {
  const geometry = useMemo(() => {
    const segments = highDetail ? 20 : 6;
    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    const colors: number[] = [];
    const positions = geometry.attributes.position;
    const chunkOriginX = chunk.x * CHUNK_SIZE;
    const chunkOriginZ = chunk.z * CHUNK_SIZE;

    for (let index = 0; index < positions.count; index += 1) {
      const worldX = positions.getX(index) + chunkOriginX;
      const worldZ = positions.getZ(index) + chunkOriginZ;
      const height = terrainHeight(worldX, worldZ);
      const biome = getBiome(worldX, worldZ);
      positions.setY(index, biome === "water" ? Math.min(height, -7) : height);
      const color = groundColor(worldX, worldZ, height);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [chunk.x, chunk.z, highDetail]);

  return (
    <mesh geometry={geometry} position={[chunk.x * CHUNK_SIZE, 0, chunk.z * CHUNK_SIZE]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} />
    </mesh>
  );
}

function AnimatedWaterPlane({
  position,
  rotation = [-Math.PI / 2, 0, 0],
  shape,
  color,
  opacity,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  shape: "river" | "lake";
  color: string;
  opacity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const wave = Math.sin(clock.elapsedTime * 0.85 + position[0] * 0.006 + position[2] * 0.004);
    meshRef.current.position.y = position[1] + wave * 0.12;
    meshRef.current.rotation.z = rotation[2] + Math.sin(clock.elapsedTime * 0.16 + position[2] * 0.002) * 0.018;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} receiveShadow>
      {shape === "river" ? <planeGeometry args={[104, CHUNK_SIZE * 1.25, 6, 12]} /> : <circleGeometry args={[LAKE_CENTER.radius, 72]} />}
      <meshPhysicalMaterial
        color={color}
        roughness={0.18}
        metalness={0.04}
        clearcoat={0.7}
        clearcoatRoughness={0.18}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

function WaterChunk({ chunk }: { chunk: ChunkCoord }) {
  const riverX = riverCenterX(chunk.z * CHUNK_SIZE);
  const chunkCenterX = chunk.x * CHUNK_SIZE;
  const chunkCenterZ = chunk.z * CHUNK_SIZE;
  const hasRiver = Math.abs(chunkCenterX - riverX) < CHUNK_SIZE * 1.25;

  if (!hasRiver) return null;

  return (
    <group>
      <AnimatedWaterPlane
        position={[riverX, -5.55, chunkCenterZ]}
        rotation={[-Math.PI / 2, 0, Math.sin(chunk.z * 0.35) * 0.18]}
        shape="river"
        color="#50c7ec"
        opacity={0.78}
      />
    </group>
  );
}

function LakeWater({ playerPosition }: { playerPosition: PlayerPosition }) {
  const lakeVisible =
    Math.hypot(playerPosition.x - LAKE_CENTER.x, playerPosition.z - LAKE_CENTER.z) <
    CHUNK_SIZE * (VISIBLE_CHUNK_RADIUS + 1.4);

  if (!lakeVisible) return null;

  return (
    <AnimatedWaterPlane
      position={[LAKE_CENTER.x, -5.45, LAKE_CENTER.z]}
      rotation={[-Math.PI / 2, 0, 0.08]}
      shape="lake"
      color="#65d3ef"
      opacity={0.84}
    />
  );
}

function OceanAndHorizon() {
  const mountains = useMemo(() => Array.from({ length: 42 }, (_, index) => {
    const angle = (index / 42) * Math.PI * 2;
    const radius = WORLD_SIZE * (0.42 + hash(index, 12) * 0.08);
    const height = 120 + hash(index, 21) * 260;
    const width = 150 + hash(index, 31) * 240;
    return {
      id: index,
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius,
      y: height * 0.48 - 8,
      height,
      width,
      rotation: angle,
      color: new THREE.Color("#6f8793").lerp(new THREE.Color("#b8c6c9"), hash(index, 43) * 0.45),
    };
  }), []);

  const coastalRocks = useMemo(() => Array.from({ length: 64 }, (_, index) => {
    const angle = (index / 64) * Math.PI * 2;
    const radius = ISLAND_RADIUS + 30 + hash(index, 61) * 180;
    return {
      id: index,
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius,
      scale: 8 + hash(index, 72) * 26,
      y: -5.5 + hash(index, 83) * 5,
      rotation: hash(index, 94) * Math.PI,
    };
  }), []);

  return (
    <group>
      <mesh position={[0, SEA_LEVEL - 3.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[ISLAND_RADIUS + 56, WORLD_SIZE * 0.74, 160]} />
        <meshPhysicalMaterial
          color="#2aa6cf"
          roughness={0.24}
          metalness={0.03}
          clearcoat={0.55}
          clearcoatRoughness={0.24}
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      {mountains.map((mountain) => (
        <group key={mountain.id} position={[mountain.x, mountain.y, mountain.z]} rotation={[0, mountain.rotation, 0]}>
          <mesh castShadow receiveShadow>
            <coneGeometry args={[mountain.width, mountain.height, 5]} />
            <meshStandardMaterial color={mountain.color} roughness={0.86} />
          </mesh>
          <mesh position={[0, mountain.height * 0.28, 0]} castShadow>
            <coneGeometry args={[mountain.width * 0.32, mountain.height * 0.34, 5]} />
            <meshStandardMaterial color="#f2f5ed" roughness={0.72} />
          </mesh>
        </group>
      ))}
      {coastalRocks.map((rock) => (
        <mesh key={rock.id} position={[rock.x, rock.y, rock.z]} rotation={[0.2, rock.rotation, -0.1]} scale={rock.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8a918b" roughness={0.94} />
        </mesh>
      ))}
    </group>
  );
}

function VegetationChunk({ chunk, highDetail }: { chunk: ChunkCoord; highDetail: boolean }) {
  const treeRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);

  const items = useMemo(() => {
    const treeItems: { position: THREE.Vector3; scale: number; rotation: number; leaf: THREE.Color }[] = [];
    const bushItems: { position: THREE.Vector3; scale: number }[] = [];
    const rockItems: { position: THREE.Vector3; scale: number; rotation: number }[] = [];
    const flowerItems: { position: THREE.Vector3; scale: number; color: THREE.Color }[] = [];
    const density = highDetail ? 24 : 8;

    for (let i = 0; i < density; i += 1) {
      const rx = hash(chunk.x * 19 + i, chunk.z * 23 - i);
      const rz = hash(chunk.x * 31 - i, chunk.z * 17 + i);
      const x = chunk.x * CHUNK_SIZE + (rx - 0.5) * CHUNK_SIZE;
      const z = chunk.z * CHUNK_SIZE + (rz - 0.5) * CHUNK_SIZE;
      const biome = getBiome(x, z);
      if (isShorelineClearance(x, z) || biome === "water" || biome === "beach" || biome === "mountain") continue;
      const y = terrainHeight(x, z);
      const roll = hash(x * 0.07, z * 0.07);

      if (roll > 0.67) {
        treeItems.push({
          position: new THREE.Vector3(x, y + 1.2, z),
          scale: 0.8 + hash(x, z) * 1.6,
          rotation: hash(x + 2, z - 9) * Math.PI * 2,
          leaf: new THREE.Color(hash(x, z) > 0.5 ? "#3d8b3f" : "#5ca64f"),
        });
      } else if (roll > 0.5) {
        bushItems.push({ position: new THREE.Vector3(x, y + 0.45, z), scale: 0.8 + hash(x - 4, z) * 1.1 });
      } else if (roll > 0.36) {
        rockItems.push({ position: new THREE.Vector3(x, y + 0.35, z), scale: 0.6 + hash(x, z + 7) * 1.0, rotation: hash(x, z) * Math.PI });
      } else if (highDetail && roll > 0.22) {
        flowerItems.push({
          position: new THREE.Vector3(x, y + 0.16, z),
          scale: 0.55 + hash(x + 8, z) * 0.45,
          color: new THREE.Color(hash(x, z) > 0.5 ? "#facc15" : "#ff7ab6"),
        });
      }
    }

    return { treeItems, bushItems, rockItems, flowerItems };
  }, [chunk.x, chunk.z, highDetail]);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    items.treeItems.forEach((item, index) => {
      dummy.position.copy(item.position);
      dummy.rotation.set(0, item.rotation, 0);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      treeRef.current?.setMatrixAt(index, dummy.matrix);
      leafRef.current?.setMatrixAt(index, dummy.matrix);
      leafRef.current?.setColorAt(index, item.leaf);
    });
    if (treeRef.current) treeRef.current.instanceMatrix.needsUpdate = true;
    if (leafRef.current) leafRef.current.instanceMatrix.needsUpdate = true;
    if (leafRef.current?.instanceColor) leafRef.current.instanceColor.needsUpdate = true;

    items.bushItems.forEach((item, index) => {
      dummy.position.copy(item.position);
      dummy.rotation.set(0, hash(item.position.x, item.position.z) * Math.PI, 0);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      bushRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (bushRef.current) bushRef.current.instanceMatrix.needsUpdate = true;

    items.rockItems.forEach((item, index) => {
      dummy.position.copy(item.position);
      dummy.rotation.set(0.2, item.rotation, -0.1);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      rockRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (rockRef.current) rockRef.current.instanceMatrix.needsUpdate = true;

    items.flowerItems.forEach((item, index) => {
      dummy.position.copy(item.position);
      dummy.rotation.set(0, hash(item.position.x, item.position.z) * Math.PI, 0);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      flowerRef.current?.setMatrixAt(index, dummy.matrix);
      flowerRef.current?.setColorAt(index, item.color);
    });
    if (flowerRef.current) flowerRef.current.instanceMatrix.needsUpdate = true;
    if (flowerRef.current?.instanceColor) flowerRef.current.instanceColor.needsUpdate = true;
  }, [items]);

  return (
    <group>
      <instancedMesh ref={treeRef} args={[undefined, undefined, Math.max(1, items.treeItems.length)]} castShadow frustumCulled>
        <cylinderGeometry args={[0.45, 0.62, 4.2, 7]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, Math.max(1, items.treeItems.length)]} castShadow frustumCulled>
        <coneGeometry args={[2.3, 6.2, 9]} />
        <meshStandardMaterial roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={bushRef} args={[undefined, undefined, Math.max(1, items.bushItems.length)]} castShadow frustumCulled>
        <sphereGeometry args={[1.2, 10, 8]} />
        <meshStandardMaterial color="#4f9d49" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, Math.max(1, items.rockItems.length)]} castShadow receiveShadow frustumCulled>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8c8f89" roughness={0.96} />
      </instancedMesh>
      {highDetail ? (
        <instancedMesh ref={flowerRef} args={[undefined, undefined, Math.max(1, items.flowerItems.length)]} castShadow frustumCulled>
          <sphereGeometry args={[0.28, 8, 6]} />
          <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
      ) : null}
    </group>
  );
}

function Clouds() {
  const groupRef = useRef<THREE.Group>(null);
  const clouds = useMemo(() => Array.from({ length: 32 }, (_, index) => ({
    id: index,
    x: (hash(index, 2) - 0.5) * 2400,
    z: (hash(index, 9) - 0.5) * 2400,
    y: 170 + hash(index, 5) * 105,
    scale: 22 + hash(index, 7) * 46,
  })), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = Math.sin(clock.elapsedTime * 0.025) * 28;
    groupRef.current.position.z = Math.cos(clock.elapsedTime * 0.018) * 18;
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud) => (
        <group key={cloud.id} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale}>
          <mesh>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.58} roughness={1} />
          </mesh>
          <mesh position={[0.8, 0.1, 0.15]}>
            <sphereGeometry args={[0.75, 12, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.48} roughness={1} />
          </mesh>
          <mesh position={[-0.85, -0.04, -0.1]}>
            <sphereGeometry args={[0.65, 12, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.46} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ProductionRenderSettings() {
  const { gl } = useThree();

  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.setClearColor("#92d6f6", 1);
  }, [gl]);

  return null;
}

function CinematicLightingRig() {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (!sunRef.current) return;
    const shadow = sunRef.current.shadow;
    shadow.camera.near = 20;
    shadow.camera.far = 650;
    shadow.camera.left = -260;
    shadow.camera.right = 260;
    shadow.camera.top = 260;
    shadow.camera.bottom = -260;
    shadow.bias = -0.00018;
    shadow.normalBias = 0.045;
    shadow.mapSize.set(4096, 4096);
    shadow.camera.updateProjectionMatrix();
  }, []);

  return (
    <>
      <ambientLight intensity={0.46} />
      <hemisphereLight args={["#f0fbff", "#6aaa54", 0.76]} />
      <directionalLight
        ref={sunRef}
        position={[140, 210, 95]}
        intensity={2.55}
        color="#fff1c2"
        castShadow
      />
      <directionalLight position={[-100, 60, -140]} intensity={0.34} color="#88c9ff" />
    </>
  );
}

function ProceduralSkyDome() {
  const geometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(WORLD_SIZE * 1.45, 48, 24);
    const positions = geometry.attributes.position;
    const colors: number[] = [];
    const horizon = new THREE.Color("#c7efff");
    const midSky = new THREE.Color("#92d6f6");
    const topSky = new THREE.Color("#66bff1");

    for (let index = 0; index < positions.count; index += 1) {
      const y = positions.getY(index) / (WORLD_SIZE * 1.45);
      const t = clamp01((y + 0.08) / 0.9);
      const color = horizon.clone().lerp(midSky, clamp01(t * 1.25)).lerp(topSky, clamp01((t - 0.45) / 0.55) * 0.42);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, []);

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={-1000}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

function SpawnClearing() {
  const clearingY = terrainHeight(SPAWN_CLEARING_POSITION[0], SPAWN_CLEARING_POSITION[2]);

  return (
    <group position={SPAWN_CLEARING_POSITION}>
      <mesh position={[0, clearingY + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[18, 56]} />
        <meshStandardMaterial color="#76bf62" roughness={0.94} transparent opacity={0.52} />
      </mesh>
      <mesh position={[0, clearingY + 0.11, 0]} rotation={[-Math.PI / 2, 0, 0.35]} receiveShadow>
        <ringGeometry args={[20, 22, 72]} />
        <meshStandardMaterial color="#d9c88b" roughness={0.96} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Foundation({ radius = 11, color = "#d8c690" }: { radius?: number; color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[radius - 0.45, radius, 48]} />
        <meshStandardMaterial color="#f3e5aa" roughness={0.84} />
      </mesh>
    </group>
  );
}

function ZoningLayer({
  selectedZoneId,
  visible,
}: {
  selectedZoneId: CityZoneId;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <group>
      {CITY_ZONES.map((zone) => {
        const y = terrainHeight(zone.x, zone.z) + 0.18;
        const selected = zone.id === selectedZoneId;

        return (
          <group key={zone.id} position={[zone.x, y, zone.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={selected ? 3 : 2}>
              <circleGeometry args={[zone.radius, 96]} />
              <meshBasicMaterial
                color={zone.color}
                transparent
                opacity={selected ? 0.2 : 0.08}
                depthWrite={false}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={selected ? 4 : 3}>
              <ringGeometry args={[zone.radius - (selected ? 4 : 2), zone.radius, 96]} />
              <meshBasicMaterial
                color={zone.color}
                transparent
                opacity={selected ? 0.8 : 0.34}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function TerrainRoadSegment({
  road,
  color = "#a67c52",
  centerColor = "#c59b63",
  opacity = 1,
}: {
  road: PlannedRoadSegment;
  color?: string;
  centerColor?: string;
  opacity?: number;
}) {
  const tiles = useMemo(() => {
    const horizontal = road.width >= road.depth;
    const length = horizontal ? road.width : road.depth;
    const cross = horizontal ? road.depth : road.width;
    const tileLength = Math.min(28, length);
    const tileCount = Math.max(1, Math.ceil(length / tileLength));
    const actualLength = length / tileCount;

    return Array.from({ length: tileCount }, (_, index) => {
      const offset = -length / 2 + actualLength * (index + 0.5);
      const localX = horizontal ? offset : 0;
      const localZ = horizontal ? 0 : offset;
      const rotated = rotateLocalPoint(localX, localZ, road.rotation);
      const x = road.x + rotated.x;
      const z = road.z + rotated.z;

      return {
        id: `${road.id}-${index}`,
        x,
        z,
        width: horizontal ? actualLength + 0.35 : cross,
        depth: horizontal ? cross : actualLength + 0.35,
        y: terrainHeight(x, z) + 0.035,
      };
    });
  }, [road.depth, road.id, road.rotation, road.width, road.x, road.z]);

  return (
    <group>
      {tiles.map((tile) => (
        <group key={tile.id} position={[tile.x, tile.y, tile.z]} rotation={[0, road.rotation, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[tile.width, tile.depth]} />
            <meshStandardMaterial color={color} roughness={0.94} transparent={opacity < 1} opacity={opacity} depthWrite />
          </mesh>
          <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[Math.max(2, tile.width - 4), Math.max(2, tile.depth - 4)]} />
            <meshStandardMaterial color={centerColor} roughness={0.9} transparent={opacity < 1} opacity={Math.min(1, opacity + 0.08)} depthWrite />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ResidentialRoadPlan({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <group>
      {RESIDENTIAL_PLAN_ROADS.map((road) => (
        <TerrainRoadSegment key={road.id} road={road} opacity={0.98} />
      ))}
    </group>
  );
}

function ResidentialGhostBuilding({ lot, occupied }: { lot: PlannedLot; occupied: boolean }) {
  const preferred = lot.preferred?.[0] || "small-house";
  const lotNumber = Number(lot.id.replace("home-", "")) || 1;
  const variant = preferred === "starter-tent"
    ? "tent"
    : preferred === "storage-hut"
      ? "hut"
      : preferred === "apartment-block"
        ? "apartment"
        : preferred === "two-storey-house"
          ? lotNumber % 3 === 0 ? "townhouse" : "two-storey"
          : lotNumber % 4 === 0
            ? "courtyard"
            : lotNumber % 3 === 0
              ? "cottage"
              : "bungalow";
  const wallColors = ["#fff7ed", "#fde68a", "#dbeafe", "#dcfce7", "#fae8ff", "#e0f2fe"];
  const roofColors = ["#2563eb", "#ef4444", "#f59e0b", "#7c3aed", "#0f766e"];
  const wallColor = occupied ? "#dbeafe" : wallColors[lotNumber % wallColors.length];
  const roofColor = roofColors[lotNumber % roofColors.length];
  const y = terrainHeight(lot.x, lot.z) + 0.32;

  return (
    <group position={[lot.x, y, lot.z]} rotation={[0, lot.rotation, 0]}>
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 30]} />
        <meshStandardMaterial color={occupied ? "#c7d2fe" : "#f3e5aa"} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.02, -12.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 15]} />
        <meshStandardMaterial color="#d8a35d" roughness={0.9} />
      </mesh>
      <group>
        {[
          { position: [-12.3, 1.05, -15.3] as [number, number, number], scale: [11.4, 1.1, 0.45] as [number, number, number] },
          { position: [12.3, 1.05, -15.3] as [number, number, number], scale: [11.4, 1.1, 0.45] as [number, number, number] },
          { position: [0, 1.05, 15.3] as [number, number, number], scale: [35.5, 1.1, 0.45] as [number, number, number] },
          { position: [-17.5, 1.05, 0] as [number, number, number], scale: [0.45, 1.1, 30.5] as [number, number, number] },
          { position: [17.5, 1.05, 0] as [number, number, number], scale: [0.45, 1.1, 30.5] as [number, number, number] },
        ].map((rail, index) => (
          <mesh key={`rail-${index}`} position={rail.position} castShadow receiveShadow>
            <boxGeometry args={rail.scale} />
            <meshStandardMaterial color="#7c4f2a" roughness={0.78} />
          </mesh>
        ))}
        {[-17.5, 17.5].flatMap((x) => [-15.3, 15.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.3, z]} castShadow>
            <boxGeometry args={[1.2, 2.6, 1.2]} />
            <meshStandardMaterial color="#5f3f24" roughness={0.78} />
          </mesh>
        )))}
      </group>

      {variant === "tent" ? (
        <>
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[10, 8, 4]} />
            <meshStandardMaterial color="#fde68a" roughness={0.72} />
          </mesh>
          <mesh position={[0, 2.3, -5.2]} castShadow>
            <boxGeometry args={[4, 3.1, 0.5]} />
            <meshStandardMaterial color="#2563eb" roughness={0.62} />
          </mesh>
        </>
      ) : variant === "hut" ? (
        <>
          <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[14, 7.2, 12]} />
            <meshStandardMaterial color="#c08457" roughness={0.86} />
          </mesh>
          <mesh position={[0, 8.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[11, 5.4, 4]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.1, -6.12]}>
            <boxGeometry args={[3.4, 4.2, 0.32]} />
            <meshStandardMaterial color="#422006" roughness={0.7} />
          </mesh>
        </>
      ) : variant === "apartment" ? (
        <>
          <mesh position={[0, 10, 0]} castShadow>
            <boxGeometry args={[18, 20, 15]} />
            <meshStandardMaterial color="#bfdbfe" roughness={0.7} />
          </mesh>
          <mesh position={[0, 21.2, 0]} castShadow>
            <boxGeometry args={[19, 2.2, 16]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.7} />
          </mesh>
          {[-5.5, 0, 5.5].flatMap((x) => [5.2, 11, 16.8].map((yLevel) => (
            <mesh key={`${x}-${yLevel}`} position={[x, yLevel, -7.62]}>
              <boxGeometry args={[2.2, 2, 0.25]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.35} />
            </mesh>
          )))}
          <mesh position={[0, 2.6, -7.72]}>
            <boxGeometry args={[4.2, 5.2, 0.35]} />
            <meshStandardMaterial color="#1e293b" roughness={0.62} />
          </mesh>
        </>
      ) : variant === "townhouse" ? (
        <>
          <mesh position={[-5, 7.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[10, 14.4, 13]} />
            <meshStandardMaterial color="#fae8ff" roughness={0.72} />
          </mesh>
          <mesh position={[5, 9.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[10, 18.8, 13]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.72} />
          </mesh>
          <mesh position={[0, 19.7, 0]} castShadow>
            <boxGeometry args={[22, 2.5, 15]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} />
          </mesh>
          {[-7.5, -2.5, 2.5, 7.5].map((x) => (
            <mesh key={x} position={[x, 8.5, -6.62]}>
              <boxGeometry args={[2.4, 3.1, 0.24]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.34} />
            </mesh>
          ))}
          <mesh position={[0, 2.4, -6.75]}>
            <boxGeometry args={[4, 4.8, 0.35]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.62} />
          </mesh>
        </>
      ) : variant === "two-storey" ? (
        <>
          <mesh position={[0, 6.8, 0]} castShadow>
            <boxGeometry args={[17, 13.6, 14]} />
            <meshStandardMaterial color={wallColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 14.9, 0]} castShadow>
            <coneGeometry args={[12, 6.2, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.72} />
          </mesh>
          <mesh position={[8.3, 5.1, 1.8]} castShadow>
            <boxGeometry args={[6, 8.5, 8.5]} />
            <meshStandardMaterial color={wallColors[(lotNumber + 2) % wallColors.length]} roughness={0.72} />
          </mesh>
          {[-4.8, 4.8].map((x) => (
            <mesh key={x} position={[x, 7.4, -7.12]}>
              <boxGeometry args={[3.2, 3.3, 0.22]} />
              <meshStandardMaterial color="#dbeafe" roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 2.5, -7.22]}>
            <boxGeometry args={[3.6, 5, 0.35]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.62} />
          </mesh>
        </>
      ) : variant === "courtyard" ? (
        <>
          <mesh position={[-5.5, 4.7, 0]} castShadow receiveShadow>
            <boxGeometry args={[11, 9.4, 13]} />
            <meshStandardMaterial color="#dcfce7" roughness={0.75} />
          </mesh>
          <mesh position={[5.5, 4.7, 2]} castShadow receiveShadow>
            <boxGeometry args={[11, 9.4, 9]} />
            <meshStandardMaterial color="#fff7ed" roughness={0.75} />
          </mesh>
          <mesh position={[-5.5, 11.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[8.6, 5, 4]} />
            <meshStandardMaterial color="#0f766e" roughness={0.74} />
          </mesh>
          <mesh position={[5.5, 11.6, 2]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[7.6, 5, 4]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.74} />
          </mesh>
          <mesh position={[0, 2.2, -6.72]}>
            <boxGeometry args={[3.8, 4.4, 0.35]} />
            <meshStandardMaterial color="#92400e" roughness={0.62} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 4.6, 0]} castShadow>
            <boxGeometry args={[15, 9.2, 13]} />
            <meshStandardMaterial color={wallColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 11.6, 0]} castShadow>
            <coneGeometry args={[11, 5.4, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.72} />
          </mesh>
          {variant === "cottage" ? (
            <mesh position={[-8.5, 3.2, 1.2]} castShadow receiveShadow>
              <boxGeometry args={[6, 6.4, 8]} />
              <meshStandardMaterial color="#fde68a" roughness={0.74} />
            </mesh>
          ) : null}
          {[-4.2, 4.2].map((x) => (
            <mesh key={x} position={[x, 5.4, -6.62]}>
              <boxGeometry args={[2.8, 2.8, 0.22]} />
              <meshStandardMaterial color="#dbeafe" roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 2.35, -6.72]}>
            <boxGeometry args={[3.4, 4.7, 0.35]} />
            <meshStandardMaterial color="#92400e" roughness={0.62} />
          </mesh>
        </>
      )}
    </group>
  );
}

function ResidentialPlanDetail({ detail }: { detail: PlannedResidentialDetail }) {
  const y = terrainHeight(detail.x, detail.z) + 0.28;
  const scale = detail.scale || 1;

  if (detail.type === "tree") {
    return (
      <group position={[detail.x, y, detail.z]} scale={scale} rotation={[0, detail.rotation || 0, 0]}>
        <mesh position={[0, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.75, 6.4, 8]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.86} />
        </mesh>
        <mesh position={[0, 8.1, 0]} castShadow>
          <sphereGeometry args={[3.4, 14, 10]} />
          <meshStandardMaterial color="#4ade80" roughness={0.86} />
        </mesh>
      </group>
    );
  }

  if (detail.type === "lamp") {
    return (
      <group position={[detail.x, y, detail.z]} scale={scale}>
        <mesh position={[0, 4.1, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.26, 8.2, 10]} />
          <meshStandardMaterial color="#475569" roughness={0.55} />
        </mesh>
        <mesh position={[0, 8.6, 0]} castShadow>
          <sphereGeometry args={[0.9, 12, 8]} />
          <meshStandardMaterial color="#fde68a" emissive="#facc15" emissiveIntensity={0.25} roughness={0.38} />
        </mesh>
      </group>
    );
  }

  if (detail.type === "well") {
    return (
      <group position={[detail.x, y, detail.z]} scale={scale}>
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.4, 4.9, 2.8, 18]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[5.2, 3.4, 4]} />
          <meshStandardMaterial color="#92400e" roughness={0.82} />
        </mesh>
      </group>
    );
  }

  if (detail.type === "garden" || detail.type === "flower") {
    const flower = detail.type === "flower";
    return (
      <group position={[detail.x, y, detail.z]} scale={scale} rotation={[0, detail.rotation || 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[flower ? 7.2 : 10.5, 28]} />
          <meshStandardMaterial color={flower ? "#bbf7d0" : "#86efac"} roughness={0.9} />
        </mesh>
        {[-3, 0, 3].flatMap((x) => [-2.8, 1.8].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.5, z]} castShadow>
            <sphereGeometry args={[flower ? 0.62 : 0.85, 8, 6]} />
            <meshStandardMaterial color={flower ? (x === 0 ? "#facc15" : "#fb7185") : "#22c55e"} roughness={0.78} />
          </mesh>
        )))}
      </group>
    );
  }

  return (
    <group position={[detail.x, y, detail.z]} scale={scale} rotation={[0, detail.rotation || 0, 0]}>
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[8, 4.2, 0.7]} />
        <meshStandardMaterial color="#92400e" roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.2, -0.42]}>
        <boxGeometry args={[6.8, 2.7, 0.12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.65} />
      </mesh>
    </group>
  );
}

function ResidentialBridgePreview() {
  const slot = BRIDGE_PLAN_SLOTS[1];
  const y = terrainHeight(slot.x, slot.z) + 1.1;

  return (
    <group position={[slot.x, y, slot.z]} rotation={[0, slot.rotation, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[78, 1.7, 12]} />
        <meshStandardMaterial color="#9a5c2b" roughness={0.82} />
      </mesh>
      {[-5.8, 5.8].map((z) => (
        <mesh key={z} position={[0, 2.6, z]} castShadow>
          <boxGeometry args={[78, 0.65, 0.65]} />
          <meshStandardMaterial color="#5f3f24" roughness={0.82} />
        </mesh>
      ))}
      {[-32, -20, -8, 8, 20, 32].map((x) => [-5.8, 5.8].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 1.4, z]} castShadow>
          <boxGeometry args={[1.1, 2.8, 1.1]} />
          <meshStandardMaterial color="#6b3f1f" roughness={0.82} />
        </mesh>
      )))}
    </group>
  );
}

function ResidentialMasterPlanPreview({
  visible,
  structures,
}: {
  visible: boolean;
  structures: PlacedStructure[];
}) {
  if (!visible) return null;

  const hasResidentialStructure = (lot: PlannedLot) => structures.some((structure) => (
    isResidentialAsset(structure.assetId) &&
    Math.hypot(structure.x - lot.x, structure.z - lot.z) < 34
  ));

  return (
    <group>
      {RESIDENTIAL_PLAN_ROADS.map((road) => (
        <TerrainRoadSegment
          key={`preview-${road.id}`}
          road={road}
          color="#8b5e34"
          centerColor="#d8a35d"
          opacity={0.96}
        />
      ))}

      {RESIDENTIAL_PLAN_PARKS.map((park) => {
        const y = terrainHeight(park.x, park.z) + 0.045;

        return (
          <group key={`preview-${park.id}`} position={[park.x, y, park.z]} rotation={[0, park.rotation, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[park.width, park.depth]} />
              <meshStandardMaterial color="#86efac" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.min(park.width, park.depth) * 0.22, Math.min(park.width, park.depth) * 0.26, 48]} />
              <meshStandardMaterial color="#bbf7d0" roughness={0.86} />
            </mesh>
          </group>
        );
      })}

      {RESIDENTIAL_PLAN_LOTS.map((lot) => (
        <ResidentialGhostBuilding key={lot.id} lot={lot} occupied={hasResidentialStructure(lot)} />
      ))}

      {RESIDENTIAL_PLAN_DETAILS.map((detail) => (
        <ResidentialPlanDetail key={detail.id} detail={detail} />
      ))}

      <ResidentialBridgePreview />
    </group>
  );
}

function SimulatedCityLayout({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <group>
      {SIMULATION_ROADS.map((road) => (
        <TerrainRoadSegment
          key={road.id}
          road={road}
          color="#8a6a45"
          centerColor="#d3a05f"
          opacity={0.98}
        />
      ))}

      {SIMULATION_GREEN_SPACES.map((space) => {
        const y = terrainHeight(space.x, space.z) + 0.055;

        return (
          <group key={space.id} position={[space.x, y, space.z]} rotation={[0, space.rotation, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[space.width, space.depth]} />
              <meshStandardMaterial color="#75b965" roughness={0.92} />
            </mesh>
            <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <ringGeometry args={[Math.min(space.width, space.depth) * 0.3, Math.min(space.width, space.depth) * 0.36, 64]} />
              <meshStandardMaterial color="#f0d274" roughness={0.82} />
            </mesh>
          </group>
        );
      })}

      {SIMULATION_STRUCTURES.map((structure) => (
        <StarterStructureModel key={structure.instanceId} structure={structure} />
      ))}

      {[
        { x: 1040, z: -10, rotation: 0 },
        { x: 1180, z: -10, rotation: 0 },
        { x: 1600, z: -10, rotation: 0 },
        { x: 1740, z: -10, rotation: 0 },
        { x: 1040, z: 525, rotation: Math.PI },
        { x: 1180, z: 525, rotation: Math.PI },
        { x: 1600, z: 525, rotation: Math.PI },
        { x: 1740, z: 525, rotation: Math.PI },
      ].map((detail, index) => (
        <ResidentialPlanDetail
          key={`sim-tree-${index}`}
          detail={{
            id: `sim-tree-${index}`,
            type: "tree",
            x: detail.x,
            z: detail.z,
            scale: index % 2 ? 1.2 : 1,
            rotation: detail.rotation,
          }}
        />
      ))}
    </group>
  );
}

function SurrealSettlementAccent({ radius = 12 }: { radius?: number }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius + 0.8, radius + 1.35, 72]} />
        <meshStandardMaterial
          color="#fff3a3"
          emissive="#f59e0b"
          emissiveIntensity={0.22}
          transparent
          opacity={0.7}
          roughness={0.42}
        />
      </mesh>
      {[0, 1, 2, 3].map((index) => {
        const angle = index * (Math.PI / 2) + Math.PI / 4;
        return (
          <group key={index} position={[Math.sin(angle) * (radius + 2.2), 0.8, Math.cos(angle) * (radius + 2.2)]}>
            <mesh rotation={[0, angle, 0]} castShadow>
              <coneGeometry args={[0.75, 2.8, 5]} />
              <meshStandardMaterial color={index % 2 ? "#7dd3fc" : "#fef3c7"} emissive={index % 2 ? "#0ea5e9" : "#f59e0b"} emissiveIntensity={0.2} roughness={0.38} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function FounderHouse() {
  return (
    <group>
      <Foundation radius={13} />
      <SurrealSettlementAccent radius={13} />
      <mesh position={[0, 5.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[13, 9.2, 11]} />
        <meshStandardMaterial color="#ffe6b0" roughness={0.68} />
      </mesh>
      <mesh position={[0, 11.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[10.8, 6.2, 4]} />
        <meshStandardMaterial color="#e95747" roughness={0.58} />
      </mesh>
      <mesh position={[0, 4.1, -5.65]} castShadow>
        <boxGeometry args={[3.2, 5.5, 0.32]} />
        <meshStandardMaterial color="#6b3f22" roughness={0.7} />
      </mesh>
      <mesh position={[-4, 6.2, -5.72]} castShadow>
        <boxGeometry args={[2.4, 2.2, 0.22]} />
        <meshStandardMaterial color="#8bd6ff" roughness={0.28} metalness={0.02} />
      </mesh>
      <mesh position={[4, 6.2, -5.72]} castShadow>
        <boxGeometry args={[2.4, 2.2, 0.22]} />
        <meshStandardMaterial color="#8bd6ff" roughness={0.28} metalness={0.02} />
      </mesh>
      <mesh position={[-4, 6.2, -5.86]} castShadow>
        <boxGeometry args={[2.75, 2.55, 0.12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <mesh position={[4, 6.2, -5.86]} castShadow>
        <boxGeometry args={[2.75, 2.55, 0.12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <mesh position={[5.1, 13.8, 1.8]} castShadow>
        <boxGeometry args={[1.7, 4.8, 1.7]} />
        <meshStandardMaterial color="#9a6741" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.25, -8.2]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 0.28, 5.5]} />
        <meshStandardMaterial color="#b9a47a" roughness={0.88} />
      </mesh>
    </group>
  );
}

function WindowGrid({
  floors,
  width,
  startY,
  floorGap,
  z,
}: {
  floors: number;
  width: number;
  startY: number;
  floorGap: number;
  z: number;
}) {
  const columns = [-width, 0, width];

  return (
    <group>
      {Array.from({ length: floors }, (_, floorIndex) => (
        <group key={floorIndex}>
          {columns.map((x) => (
            <group key={`${floorIndex}-${x}`} position={[x, startY + floorIndex * floorGap, z]}>
              <mesh castShadow>
                <boxGeometry args={[2.35, 2, 0.2]} />
                <meshStandardMaterial color="#9be7ff" roughness={0.22} metalness={0.04} />
              </mesh>
              <mesh position={[0, 0, -0.12]} castShadow>
                <boxGeometry args={[2.7, 2.35, 0.08]} />
                <meshStandardMaterial color="#ffffff" roughness={0.48} />
              </mesh>
              <mesh position={[0, 0, -0.25]} castShadow>
                <boxGeometry args={[0.16, 2.25, 0.1]} />
                <meshStandardMaterial color="#38516a" roughness={0.58} />
              </mesh>
              <mesh position={[0, 0, -0.27]} castShadow>
                <boxGeometry args={[2.4, 0.14, 0.1]} />
                <meshStandardMaterial color="#38516a" roughness={0.58} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function TwoStoreyHouse() {
  return (
    <group>
      <Foundation radius={15.5} color="#d9c38a" />
      <SurrealSettlementAccent radius={15.5} />
      <mesh position={[0, 5.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 9.2, 13]} />
        <meshStandardMaterial color="#f7d38f" roughness={0.66} />
      </mesh>
      <mesh position={[0, 13.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[14.2, 7.4, 11.5]} />
        <meshStandardMaterial color="#ffebb8" roughness={0.64} />
      </mesh>
      <mesh position={[0, 18.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[12.7, 6.4, 4]} />
        <meshStandardMaterial color="#2f74c8" roughness={0.58} />
      </mesh>
      <mesh position={[0, 3.6, -6.65]} castShadow>
        <boxGeometry args={[3.8, 6.1, 0.32]} />
        <meshStandardMaterial color="#7c4526" roughness={0.72} />
      </mesh>
      <mesh position={[0, 10.15, -7.05]} castShadow receiveShadow>
        <boxGeometry args={[8.7, 0.55, 2.45]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
      </mesh>
      <mesh position={[-4.6, 11.35, -7.15]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 2.4, 8]} />
        <meshStandardMaterial color="#f9fafb" roughness={0.54} />
      </mesh>
      <mesh position={[4.6, 11.35, -7.15]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 2.4, 8]} />
        <meshStandardMaterial color="#f9fafb" roughness={0.54} />
      </mesh>
      <WindowGrid floors={2} width={5.2} startY={6.4} floorGap={7.3} z={-6.72} />
      <mesh position={[-8.7, 7.6, 0]} rotation={[0, 0, -0.34]} castShadow>
        <boxGeometry args={[0.5, 13.4, 0.5]} />
        <meshStandardMaterial color="#9a5c2b" roughness={0.78} />
      </mesh>
      <mesh position={[-9.2, 7.2, 0]} rotation={[0, 0, -0.34]} castShadow>
        <boxGeometry args={[0.32, 12.2, 0.32]} />
        <meshStandardMaterial color="#f2d099" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.25, -10.2]} castShadow receiveShadow>
        <boxGeometry args={[6.8, 0.28, 5.6]} />
        <meshStandardMaterial color="#b9a47a" roughness={0.88} />
      </mesh>
    </group>
  );
}

function ThreeStoreyLodge() {
  return (
    <group>
      <Foundation radius={17.5} color="#d8c893" />
      <SurrealSettlementAccent radius={17.5} />
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 10.8, 14]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.62} />
      </mesh>
      <mesh position={[0, 16.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[16.4, 10, 13]} />
        <meshStandardMaterial color="#bfdbfe" roughness={0.62} />
      </mesh>
      <mesh position={[0, 26.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[14.8, 9.4, 12]} />
        <meshStandardMaterial color="#eff6ff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 31.25, 0]} castShadow>
        <boxGeometry args={[17.5, 0.75, 14.2]} />
        <meshStandardMaterial color="#2563eb" roughness={0.54} />
      </mesh>
      <mesh position={[0, 33.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[11.2, 5.2, 4]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.54} />
      </mesh>
      <mesh position={[0, 4.2, -7.15]} castShadow>
        <boxGeometry args={[4.6, 6.8, 0.36]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.68} />
      </mesh>
      <mesh position={[7.3, 17.1, -7.05]} castShadow>
        <boxGeometry args={[2.1, 23.4, 0.34]} />
        <meshStandardMaterial color="#0f172a" roughness={0.42} metalness={0.12} />
      </mesh>
      <mesh position={[7.3, 17.1, -7.32]} castShadow>
        <boxGeometry args={[1.45, 22.1, 0.12]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.18} metalness={0.08} />
      </mesh>
      <WindowGrid floors={3} width={5.2} startY={7.4} floorGap={9.6} z={-7.25} />
      {[10.7, 20.4, 29.5].map((y, index) => (
        <mesh key={y} position={[0, y, -7.55]} castShadow receiveShadow>
          <boxGeometry args={[13.8 - index, 0.45, 1.6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.58} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, -11.4]} castShadow receiveShadow>
        <boxGeometry args={[8.8, 0.28, 6.2]} />
        <meshStandardMaterial color="#b9a47a" roughness={0.88} />
      </mesh>
    </group>
  );
}

function ExplorerTent() {
  return (
    <group>
      <Foundation radius={10} color="#cbb978" />
      <SurrealSettlementAccent radius={10} />
      <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[8.4, 8.6, 4]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.64} />
      </mesh>
      <mesh position={[0, 3.1, -3.1]} rotation={[0.05, 0, 0]} castShadow>
        <boxGeometry args={[4.5, 5.2, 0.18]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.8, -3.28]} castShadow>
        <boxGeometry args={[2.2, 4.1, 0.16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.62} />
      </mesh>
      <mesh position={[-5.1, 1.3, -4.1]} rotation={[0.2, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 6.5, 8]} />
        <meshStandardMaterial color="#5f3f24" roughness={0.82} />
      </mesh>
      <mesh position={[5.1, 1.3, -4.1]} rotation={[0.2, 0, 0.35]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 6.5, 8]} />
        <meshStandardMaterial color="#5f3f24" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.25, 5.8]} castShadow receiveShadow>
        <boxGeometry args={[8.5, 0.25, 2.2]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.82} />
      </mesh>
    </group>
  );
}

function WaterWell() {
  return (
    <group>
      <Foundation radius={9} color="#d5c489" />
      <SurrealSettlementAccent radius={9} />
      <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.1, 4.5, 5.4, 24]} />
        <meshStandardMaterial color="#a6a29a" roughness={0.88} />
      </mesh>
      <mesh position={[0, 5.62, 0]} castShadow>
        <torusGeometry args={[3.85, 0.35, 12, 32]} />
        <meshStandardMaterial color="#f3e9c7" roughness={0.74} />
      </mesh>
      <mesh position={[-4.8, 7.3, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 7.4, 8]} />
        <meshStandardMaterial color="#7a4b25" roughness={0.78} />
      </mesh>
      <mesh position={[4.8, 7.3, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 7.4, 8]} />
        <meshStandardMaterial color="#7a4b25" roughness={0.78} />
      </mesh>
      <mesh position={[0, 11.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[6.2, 4.4, 4]} />
        <meshStandardMaterial color="#b45309" roughness={0.66} />
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <cylinderGeometry args={[2.7, 2.7, 0.2, 24]} />
        <meshStandardMaterial color="#54c7ec" roughness={0.2} metalness={0.04} />
      </mesh>
    </group>
  );
}

function StorageHut() {
  return (
    <group>
      <Foundation radius={12} color="#cfb982" />
      <SurrealSettlementAccent radius={12} />
      <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 8.2, 9.2]} />
        <meshStandardMaterial color="#b7793b" roughness={0.82} />
      </mesh>
      <mesh position={[0, 9.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[9.4, 5.4, 4]} />
        <meshStandardMaterial color="#7c3f1d" roughness={0.78} />
      </mesh>
      {[-4, 0, 4].map((x) => (
        <mesh key={x} position={[x, 4.6, -4.72]} castShadow>
          <boxGeometry args={[0.35, 7.3, 0.2]} />
          <meshStandardMaterial color="#70451f" roughness={0.84} />
        </mesh>
      ))}
      <mesh position={[0, 3.5, -4.85]} castShadow>
        <boxGeometry args={[3.8, 5.2, 0.28]} />
        <meshStandardMaterial color="#5b3418" roughness={0.84} />
      </mesh>
      <mesh position={[4.7, 5.8, -4.9]} castShadow>
        <boxGeometry args={[2.3, 2, 0.18]} />
        <meshStandardMaterial color="#f8d37a" roughness={0.58} />
      </mesh>
      <mesh position={[-5.8, 0.9, 3.6]} rotation={[0.1, 0.2, -0.08]} castShadow>
        <boxGeometry args={[3.2, 1.8, 2.4]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.85} />
      </mesh>
    </group>
  );
}

function FoodGarden() {
  const rows = [-5, -2.5, 0, 2.5, 5];

  return (
    <group>
      <Foundation radius={12.5} color="#8b6f45" />
      <SurrealSettlementAccent radius={12.5} />
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[18, 0.34, 13]} />
        <meshStandardMaterial color="#6b4b2a" roughness={0.94} />
      </mesh>
      {rows.map((z, rowIndex) => (
        <group key={z}>
          <mesh position={[0, 0.55, z]} receiveShadow>
            <boxGeometry args={[15.5, 0.24, 1.1]} />
            <meshStandardMaterial color={rowIndex % 2 ? "#7c552d" : "#5f4325"} roughness={0.96} />
          </mesh>
          {Array.from({ length: 7 }, (_, index) => (
            <mesh key={index} position={[-6 + index * 2, 1.05, z]} castShadow>
              <sphereGeometry args={[0.55, 10, 8]} />
              <meshStandardMaterial color={index % 2 ? "#48a848" : "#87c94f"} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.sin(angle) * 9.6, 0.95, Math.cos(angle) * 7]} castShadow>
            <sphereGeometry args={[0.32, 8, 6]} />
            <meshStandardMaterial color={index % 3 === 0 ? "#f472b6" : index % 3 === 1 ? "#facc15" : "#fb7185"} roughness={0.72} />
          </mesh>
        );
      })}
    </group>
  );
}

function WoodenSign() {
  return (
    <group>
      <Foundation radius={7.5} color="#c7ad71" />
      <SurrealSettlementAccent radius={7.5} />
      <mesh position={[-2.7, 3.7, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 7.4, 8]} />
        <meshStandardMaterial color="#6b3f22" roughness={0.82} />
      </mesh>
      <mesh position={[2.7, 3.7, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 7.4, 8]} />
        <meshStandardMaterial color="#6b3f22" roughness={0.82} />
      </mesh>
      <mesh position={[0, 6.4, -0.08]} castShadow>
        <boxGeometry args={[7.8, 3.2, 0.42]} />
        <meshStandardMaterial color="#a3632d" roughness={0.78} />
      </mesh>
      <mesh position={[0, 6.42, -0.32]} castShadow>
        <boxGeometry args={[6.7, 2.2, 0.16]} />
        <meshStandardMaterial color="#f6d38a" roughness={0.62} />
      </mesh>
      <mesh position={[-2.2, 6.42, -0.48]} castShadow>
        <boxGeometry args={[0.55, 1.45, 0.14]} />
        <meshStandardMaterial color="#7c3f1d" roughness={0.72} />
      </mesh>
      <mesh position={[-1.25, 6.42, -0.48]} castShadow>
        <boxGeometry args={[0.55, 1.45, 0.14]} />
        <meshStandardMaterial color="#7c3f1d" roughness={0.72} />
      </mesh>
      <mesh position={[0.2, 6.42, -0.48]} castShadow>
        <boxGeometry args={[1.15, 0.42, 0.14]} />
        <meshStandardMaterial color="#7c3f1d" roughness={0.72} />
      </mesh>
      <mesh position={[1.75, 6.42, -0.48]} castShadow>
        <boxGeometry args={[1.15, 0.42, 0.14]} />
        <meshStandardMaterial color="#7c3f1d" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.55, 4.8]} castShadow>
        <boxGeometry args={[6.5, 0.4, 2.8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.84} />
      </mesh>
    </group>
  );
}

function SimpleCivicBuilding({
  bodyColor,
  roofColor,
  accentColor = "#ffffff",
  floors = 1,
  width = 18,
  depth = 14,
  label = "C",
  tower = false,
}: {
  bodyColor: string;
  roofColor: string;
  accentColor?: string;
  floors?: 1 | 2 | 3;
  width?: number;
  depth?: number;
  label?: string;
  tower?: boolean;
}) {
  const height = floors * 8.5;
  const foundationRadius = Math.max(width, depth) * 0.82;

  return (
    <group>
      <Foundation radius={foundationRadius} color="#d7c58e" />
      <SurrealSettlementAccent radius={foundationRadius} />
      {Array.from({ length: floors }, (_, floor) => (
        <mesh key={floor} position={[0, 4.3 + floor * 8.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[width - floor * 1.4, 8, depth - floor * 0.9]} />
          <meshStandardMaterial color={floor % 2 ? accentColor : bodyColor} roughness={0.64} />
        </mesh>
      ))}
      <mesh position={[0, height + 2.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(width, depth) * 0.62, 5.4, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.58} />
      </mesh>
      <mesh position={[0, 3.8, -depth / 2 - 0.15]} castShadow>
        <boxGeometry args={[4.4, 6.3, 0.32]} />
        <meshStandardMaterial color="#694322" roughness={0.7} />
      </mesh>
      <mesh position={[0, 7.2, -depth / 2 - 0.36]} castShadow>
        <boxGeometry args={[5.6, 2.2, 0.18]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, 7.2, -depth / 2 - 0.52]} castShadow>
        <boxGeometry args={[3.2, 1.25, 0.12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.4} emissive="#f59e0b" emissiveIntensity={0.08} />
      </mesh>
      <WindowGrid floors={floors} width={width * 0.27} startY={6.4} floorGap={8.5} z={-depth / 2 - 0.25} />
      {tower ? (
        <group position={[width * 0.36, height * 0.55, depth * 0.24]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.2, height * 0.92, 4.2]} />
            <meshStandardMaterial color={accentColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, height * 0.48, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[3.5, 4.6, 4]} />
            <meshStandardMaterial color={roofColor} roughness={0.52} />
          </mesh>
        </group>
      ) : null}
      <mesh position={[0, height * 0.5, -depth / 2 - 0.62]} castShadow>
        <boxGeometry args={[1.8, 2.1, 0.14]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </mesh>
      <mesh position={[0, height * 0.5, -depth / 2 - 0.75]} castShadow>
        <boxGeometry args={[0.72, 1.45, 0.12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} emissive="#fbbf24" emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, 0.25, -depth / 2 - 4.8]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.46, 0.28, 6]} />
        <meshStandardMaterial color="#b9a47a" roughness={0.88} />
      </mesh>
    </group>
  );
}

function NatureAsset({ type }: { type: StarterAssetId }) {
  if (type === "city-tree") {
    return (
      <group>
        <Foundation radius={5.4} color="#83b96b" />
        <mesh position={[0, 3.8, 0]} castShadow>
          <cylinderGeometry args={[0.8, 1, 7.2, 10]} />
          <meshStandardMaterial color="#7a4b25" roughness={0.82} />
        </mesh>
        {[5.8, 7.4, 8.8].map((y, index) => (
          <mesh key={y} position={[index - 1, y, index % 2 ? 0.3 : -0.2]} castShadow>
            <sphereGeometry args={[3.4 - index * 0.35, 14, 10]} />
            <meshStandardMaterial color={index === 1 ? "#4fae52" : "#64bd57"} roughness={0.86} />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === "flower-patch" || type === "park-piece") {
    const large = type === "park-piece";
    return (
      <group>
        <Foundation radius={large ? 14 : 5.8} color="#6cab5b" />
        {Array.from({ length: large ? 22 : 10 }, (_, index) => {
          const angle = (index / (large ? 22 : 10)) * Math.PI * 2;
          const radius = large ? 2.4 + (index % 4) * 2.2 : 1.2 + (index % 3) * 1.2;
          return (
            <mesh key={index} position={[Math.sin(angle) * radius, 0.75, Math.cos(angle) * radius]} castShadow>
              <sphereGeometry args={[0.34, 8, 6]} />
              <meshStandardMaterial color={index % 3 === 0 ? "#f472b6" : index % 3 === 1 ? "#fde047" : "#fb7185"} roughness={0.72} />
            </mesh>
          );
        })}
        {large ? <BenchModel /> : null}
      </group>
    );
  }

  if (type === "bench") return <BenchModel />;

  return (
    <group>
      <Foundation radius={type === "rock" ? 4.5 : 5.2} color={type === "rock" ? "#aaa99a" : "#7db65e"} />
      <mesh position={[0, type === "rock" ? 1.2 : 1.5, 0]} scale={type === "rock" ? [1.8, 1.15, 1.35] : [1.5, 1.1, 1.35]} castShadow>
        <sphereGeometry args={[2.2, 12, 8]} />
        <meshStandardMaterial color={type === "rock" ? "#8f9188" : "#62ad55"} roughness={0.88} />
      </mesh>
    </group>
  );
}

function BenchModel() {
  return (
    <group>
      <Foundation radius={6} color="#b5a070" />
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[7.5, 0.55, 1.6]} />
        <meshStandardMaterial color="#9a5c2b" roughness={0.78} />
      </mesh>
      <mesh position={[0, 2.5, 0.8]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[7.8, 0.5, 1.4]} />
        <meshStandardMaterial color="#a3632d" roughness={0.78} />
      </mesh>
      {[-2.8, 2.8].map((x) => (
        <mesh key={x} position={[x, 0.75, 0]} castShadow>
          <boxGeometry args={[0.38, 1.5, 1.2]} />
          <meshStandardMaterial color="#5f3f24" roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function InfrastructureAsset({ type }: { type: StarterAssetId }) {
  if (type === "dirt-path" || type === "stone-road") {
    const stone = type === "stone-road";
    return (
      <group>
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[stone ? 30 : 26, stone ? 12 : 10, 1, 1]} />
          <meshStandardMaterial color={stone ? "#8f948b" : "#a77a48"} roughness={0.95} />
        </mesh>
        {stone ? [-10, 0, 10].map((x) => (
          <mesh key={x} position={[x, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1.1, 10.4]} />
            <meshStandardMaterial color="#d5d2c4" roughness={0.88} />
          </mesh>
        )) : null}
      </group>
    );
  }

  if (type === "bridge") {
    return (
      <group>
        <Foundation radius={18} color="#a87948" />
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[36, 1.4, 10]} />
          <meshStandardMaterial color="#9a5c2b" roughness={0.82} />
        </mesh>
        {[-5.2, 5.2].map((z) => (
          <mesh key={z} position={[0, 2.8, z]} castShadow>
            <boxGeometry args={[36, 0.55, 0.5]} />
            <meshStandardMaterial color="#5f3f24" roughness={0.82} />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === "street-light") {
    return (
      <group>
        <Foundation radius={4.2} color="#b9a47a" />
        <mesh position={[0, 5, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.25, 9.5, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.55} metalness={0.15} />
        </mesh>
        <mesh position={[0, 10.2, -0.8]} castShadow>
          <sphereGeometry args={[1.1, 14, 10]} />
          <meshStandardMaterial color="#fff3a3" emissive="#facc15" emissiveIntensity={0.45} roughness={0.35} />
        </mesh>
      </group>
    );
  }

  if (type === "water-tower") {
    return (
      <group>
        <Foundation radius={12} color="#b9a47a" />
        {[-4, 4].map((x) => [-4, 4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 8, z]} castShadow>
            <cylinderGeometry args={[0.25, 0.32, 16, 8]} />
            <meshStandardMaterial color="#6b4b2a" roughness={0.78} />
          </mesh>
        )))}
        <mesh position={[0, 17.2, 0]} castShadow>
          <cylinderGeometry args={[6, 5.5, 7.2, 24]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.42} metalness={0.06} />
        </mesh>
        <mesh position={[0, 21.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[5.8, 3.4, 4]} />
          <meshStandardMaterial color="#2563eb" roughness={0.54} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <Foundation radius={9} color="#b9a47a" />
      <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[15, 4.4, 6.2]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.58} />
      </mesh>
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[16.2, 0.5, 7]} />
        <meshStandardMaterial color="#1e40af" roughness={0.55} />
      </mesh>
      <BenchModel />
    </group>
  );
}

function PlaygroundModel() {
  return (
    <group>
      <Foundation radius={15} color="#d7b56d" />
      <SurrealSettlementAccent radius={15} />
      <mesh position={[-5, 3.5, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[1, 8.2, 1]} />
        <meshStandardMaterial color="#ef4444" roughness={0.65} />
      </mesh>
      <mesh position={[2, 4.5, 0]} rotation={[0, 0, 0.55]} castShadow>
        <boxGeometry args={[9, 0.55, 2.2]} />
        <meshStandardMaterial color="#f97316" roughness={0.58} />
      </mesh>
      {[-8, -4].map((x) => (
        <mesh key={x} position={[x, 5.2, 6]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 8, 8]} />
          <meshStandardMaterial color="#2563eb" roughness={0.58} />
        </mesh>
      ))}
      <mesh position={[-6, 8.6, 6]} castShadow>
        <boxGeometry args={[6, 0.5, 0.55]} />
        <meshStandardMaterial color="#2563eb" roughness={0.58} />
      </mesh>
      <mesh position={[-6, 3, 6]} castShadow>
        <boxGeometry args={[2.8, 0.35, 1.4]} />
        <meshStandardMaterial color="#facc15" roughness={0.62} />
      </mesh>
    </group>
  );
}

function MarketModel() {
  return (
    <group>
      <Foundation radius={22} color="#d7b56d" />
      <SurrealSettlementAccent radius={22} />
      {[-14, 0, 14].map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[9, 4, 8]} />
            <meshStandardMaterial color={index % 2 ? "#fef3c7" : "#fee2e2"} roughness={0.7} />
          </mesh>
          <mesh position={[0, 5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[6.6, 4.3, 4]} />
            <meshStandardMaterial color={index % 2 ? "#22c55e" : "#ef4444"} roughness={0.56} />
          </mesh>
          <mesh position={[0, 1.2, -4.2]} castShadow>
            <boxGeometry args={[6.5, 1.2, 0.5]} />
            <meshStandardMaterial color="#9a5c2b" roughness={0.78} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StarterStructureModel({ structure }: { structure: PlacedStructure }) {
  const y = terrainHeight(structure.x, structure.z);
  const ageSeconds = Math.max(0.6, (Date.now() - structure.placedAt) / 1000);
  const appearScale = Math.min(1, ageSeconds / 0.7);
  const asset = getStarterAsset(structure.assetId);

  const renderAsset = () => {
    switch (structure.assetId) {
      case "small-house":
        return <SuppliedStarterAsset assetId={structure.assetId} />;
      case "two-storey-house":
        return <SuppliedStarterAsset assetId={structure.assetId} />;
      case "three-storey-lodge":
        return <ThreeStoreyLodge />;
      case "starter-tent":
        return <ExplorerTent />;
      case "water-well":
        return <WaterWell />;
      case "storage-hut":
        return <StorageHut />;
      case "garden":
        return <FoodGarden />;
      case "wooden-sign":
        return <WoodenSign />;
      case "school":
        return <SimpleCivicBuilding bodyColor="#fef3c7" roofColor="#2563eb" accentColor="#dbeafe" label="S" width={24} depth={18} />;
      case "clinic":
        return <SimpleCivicBuilding bodyColor="#ffffff" roofColor="#0ea5e9" accentColor="#e0f2fe" label="Cl" width={20} depth={16} />;
      case "shop":
        return <SuppliedStarterAsset assetId={structure.assetId} />;
      case "worship-hall":
        return <SimpleCivicBuilding bodyColor="#e0e7ff" roofColor="#7c3aed" accentColor="#f5f3ff" label="^" width={23} depth={21} tower />;
      case "playground":
        return <PlaygroundModel />;
      case "community-hall":
        return <SimpleCivicBuilding bodyColor="#dcfce7" roofColor="#16a34a" accentColor="#f0fdf4" label="C" width={28} depth={22} />;
      case "flower-patch":
      case "city-tree":
      case "bush":
      case "rock":
      case "bench":
      case "park-piece":
        return <NatureAsset type={structure.assetId} />;
      case "dirt-path":
      case "stone-road":
      case "bridge":
      case "street-light":
      case "water-tower":
      case "bus-stop":
        return <InfrastructureAsset type={structure.assetId} />;
      case "larger-school":
        return <SimpleCivicBuilding bodyColor="#fef3c7" roofColor="#1d4ed8" accentColor="#dbeafe" label="LS" floors={2} width={34} depth={28} tower />;
      case "hospital":
        return <SimpleCivicBuilding bodyColor="#ffffff" roofColor="#0f766e" accentColor="#ccfbf1" label="Hp" floors={3} width={32} depth={27} />;
      case "market":
        return <SuppliedStarterAsset assetId={structure.assetId} />;
      case "library":
        return <SimpleCivicBuilding bodyColor="#ede9fe" roofColor="#6d28d9" accentColor="#f5f3ff" label="L" floors={2} width={29} depth={23} />;
      case "fire-station":
        return <SimpleCivicBuilding bodyColor="#fecaca" roofColor="#b91c1c" accentColor="#fee2e2" label="F" floors={2} width={30} depth={22} tower />;
      case "town-hall":
        return <SimpleCivicBuilding bodyColor="#e5e7eb" roofColor="#475569" accentColor="#f8fafc" label="T" floors={2} width={36} depth={28} tower />;
      case "apartment-block":
        return <SuppliedStarterAsset assetId={structure.assetId} />;
      default:
        return null;
    }
  };

  return (
    <group position={[structure.x, y, structure.z]} rotation={[0, structure.rotation, 0]} scale={appearScale}>
      {renderAsset()}
      <group position={[asset.entrance.localX, 0.18, asset.entrance.localZ]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[asset.entrance.width * 0.42, asset.entrance.width * 0.62, 28]} />
          <meshStandardMaterial color="#fff3a3" emissive="#a16207" emissiveIntensity={0.15} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.35, -asset.entrance.width * 0.35]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <coneGeometry args={[0.9, 1.8, 3]} />
          <meshStandardMaterial color="#fff7c2" emissive="#f59e0b" emissiveIntensity={0.18} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function StarterSettlement({ structures }: { structures: PlacedStructure[] }) {
  return (
    <group>
      {structures.map((structure) => (
        <StarterStructureModel key={structure.instanceId} structure={structure} />
      ))}
    </group>
  );
}

function Player({
  movementRef,
  mobileMovement,
  mobileSprinting,
  initialPosition,
  onPositionChange,
  onFacingChange,
  structures,
  residentialPreviewActive,
  stopSignal,
}: {
  movementRef: React.MutableRefObject<MovementIntent>;
  mobileMovement: MovementVector;
  mobileSprinting: boolean;
  initialPosition: PlayerPosition;
  onPositionChange: (position: PlayerPosition) => void;
  onFacingChange: (facing: MovementVector) => void;
  structures: PlacedStructure[];
  residentialPreviewActive: boolean;
  stopSignal: number;
}) {
  const playerRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Mesh>(null);
  const rightFootRef = useRef<THREE.Mesh>(null);
  const backpackRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const facingRef = useRef(new THREE.Vector3(0, 0, -1));
  const cameraLookRef = useRef(new THREE.Vector3(initialPosition.x, terrainHeight(initialPosition.x, initialPosition.z) + 12, initialPosition.z));
  const walkTimeRef = useRef(0);
  const fallUntilRef = useRef(0);
  const fallDirectionRef = useRef(new THREE.Vector3(0, 0, -1));
  const { camera } = useThree();

  useEffect(() => {
    if (playerRef.current) {
      const y = terrainHeight(initialPosition.x, initialPosition.z);
      playerRef.current.position.set(initialPosition.x, y, initialPosition.z);
    }
  }, [initialPosition.x, initialPosition.z]);

  useEffect(() => {
    velocity.current.multiplyScalar(0.18);
  }, [stopSignal]);

  useFrame(({ clock }, frameDelta) => {
    if (!playerRef.current) return;
    const delta = Math.min(frameDelta, MAX_FRAME_DELTA);
    const now = clock.elapsedTime;
    const falling = now < fallUntilRef.current;

    const keyboardDirection = new THREE.Vector3(
      (movementRef.current.right ? 1 : 0) - (movementRef.current.left ? 1 : 0),
      0,
      (movementRef.current.backward ? 1 : 0) - (movementRef.current.forward ? 1 : 0),
    );
    const rawInput = keyboardDirection;
    if (rawInput.lengthSq() > 1) rawInput.normalize();

    const cameraForward = new THREE.Vector3(facingRef.current.x, 0, facingRef.current.z).normalize();
    const cameraRight = new THREE.Vector3(-cameraForward.z, 0, cameraForward.x).normalize();
    const direction = cameraRight
      .multiplyScalar(rawInput.x)
      .add(cameraForward.multiplyScalar(-rawInput.z))
      .add(new THREE.Vector3(mobileMovement.x, 0, mobileMovement.z));
    const hasInput = !falling && direction.lengthSq() > 0.0001;
    const sprinting = movementRef.current.sprint || mobileSprinting;
    const targetSpeed = sprinting ? RUN_SPEED : WALK_SPEED;
    const desiredFacing = hasInput ? direction.clone().normalize() : facingRef.current.clone();
    const facingAlignment = clamp01((facingRef.current.dot(desiredFacing) + 1) / 2);
    const turningAround = hasInput && facingAlignment < 0.38;

    if (hasInput) {
      const turnDamping = turningAround ? REVERSAL_TURN_DAMPING : TURN_DAMPING;
      facingRef.current.lerp(desiredFacing, dampFactor(turnDamping, delta)).normalize();
      onFacingChange({ x: facingRef.current.x, z: facingRef.current.z });
    }

    const postTurnAlignment = hasInput ? clamp01((facingRef.current.dot(desiredFacing) + 1) / 2) : 0;
    const turnSpeedGate = hasInput
      ? THREE.MathUtils.smoothstep(postTurnAlignment, 0.46, 0.95)
      : 0;
    const targetVelocity = hasInput
      ? facingRef.current.clone().multiplyScalar(targetSpeed * turnSpeedGate)
      : new THREE.Vector3();

    // Direction changes rotate the avatar first, then let speed rise as the body aligns.
    const movementDamping = hasInput ? MOVE_ACCELERATION : MOVE_DECELERATION;
    velocity.current.lerp(targetVelocity, dampFactor(movementDamping, delta));
    if (!hasInput && velocity.current.lengthSq() < 0.08) {
      velocity.current.set(0, 0, 0);
    }

    const actualSpeed = velocity.current.length();

    playerRef.current.rotation.y = Math.atan2(-facingRef.current.x, -facingRef.current.z);

    const previousX = playerRef.current.position.x;
    const previousZ = playerRef.current.position.z;
    const nextPosition = playerRef.current.position.clone().addScaledVector(velocity.current, delta);
    let clamped = clampPlayerPosition({
      x: nextPosition.x,
      z: nextPosition.z,
    });

    if (isDeepWater(clamped.x, clamped.z)) {
      const slideX = clampPlayerPosition({ x: clamped.x, z: previousZ });
      const slideZ = clampPlayerPosition({ x: previousX, z: clamped.z });

      if (!isDeepWater(slideX.x, slideX.z)) {
        clamped = slideX;
        velocity.current.z = 0;
      } else if (!isDeepWater(slideZ.x, slideZ.z)) {
        clamped = slideZ;
        velocity.current.x = 0;
      } else {
        clamped = { x: previousX, z: previousZ };
        velocity.current.multiplyScalar(0.18);
      }
    }

    const blockingStructure = getStructureCollisionHit(clamped, structures);

    if (blockingStructure) {
      const slideX = clampPlayerPosition({ x: clamped.x, z: previousZ });
      const slideZ = clampPlayerPosition({ x: previousX, z: clamped.z });
      const hitX = getStructureCollisionHit(slideX, structures);
      const hitZ = getStructureCollisionHit(slideZ, structures);

      if (!hitX) {
        clamped = slideX;
        velocity.current.z = 0;
      } else if (!hitZ) {
        clamped = slideZ;
        velocity.current.x = 0;
      } else {
        clamped = { x: previousX, z: previousZ };
        const impactVector = new THREE.Vector3(previousX - blockingStructure.structure.x, 0, previousZ - blockingStructure.structure.z);
        if (impactVector.lengthSq() < 0.001) {
          impactVector.copy(facingRef.current).multiplyScalar(-1);
        }
        fallDirectionRef.current.copy(impactVector.normalize());
        if (actualSpeed > 2.4 && now >= fallUntilRef.current) {
          fallUntilRef.current = now + 0.78;
        }
        velocity.current.copy(fallDirectionRef.current).multiplyScalar(4.2);
      }
    }

    if (residentialPreviewActive && isInsideResidentialPreviewCompound(clamped)) {
      const slideX = clampPlayerPosition({ x: clamped.x, z: previousZ });
      const slideZ = clampPlayerPosition({ x: previousX, z: clamped.z });

      if (!isInsideResidentialPreviewCompound(slideX)) {
        clamped = slideX;
        velocity.current.z = 0;
      } else if (!isInsideResidentialPreviewCompound(slideZ)) {
        clamped = slideZ;
        velocity.current.x = 0;
      } else {
        clamped = { x: previousX, z: previousZ };
        velocity.current.multiplyScalar(0.18);
      }
    }

    const groundY = terrainHeight(clamped.x, clamped.z);
    playerRef.current.position.x = clamped.x;
    playerRef.current.position.z = clamped.z;
    playerRef.current.position.y = groundY;

    const walkBlend = clamp01(actualSpeed / WALK_SPEED);
    const runBlend = clamp01((actualSpeed - WALK_SPEED) / (RUN_SPEED - WALK_SPEED));
    const idleBreath = Math.sin(clock.elapsedTime * 2.2);
    walkTimeRef.current += delta * THREE.MathUtils.lerp(2.8, 10.4, clamp01(actualSpeed / RUN_SPEED));
    const stride = Math.sin(walkTimeRef.current);
    const counterStride = Math.sin(walkTimeRef.current + Math.PI);
    const lift = Math.abs(Math.cos(walkTimeRef.current));

    if (bodyRef.current) {
      const fallProgress = clamp01((fallUntilRef.current - now) / 0.78);
      const fallCurve = Math.sin(fallProgress * Math.PI);
      bodyRef.current.position.y = 0.18 + idleBreath * 0.012 * (1 - walkBlend) + lift * THREE.MathUtils.lerp(0.045, 0.09, runBlend) * walkBlend - fallCurve * 0.18;
      bodyRef.current.rotation.z = stride * THREE.MathUtils.lerp(0.022, 0.045, runBlend) * walkBlend + fallDirectionRef.current.x * fallCurve * 0.34;
      bodyRef.current.rotation.x = -Math.abs(stride) * THREE.MathUtils.lerp(0.018, 0.045, runBlend) * walkBlend - fallCurve * 0.42;
    }
    if (headRef.current) {
      headRef.current.position.y = 2.08 + idleBreath * 0.01 * (1 - walkBlend) + lift * 0.028 * walkBlend;
      headRef.current.rotation.z = -stride * 0.016 * walkBlend;
    }
    if (backpackRef.current) {
      backpackRef.current.position.y = 1.42 + lift * 0.035 * walkBlend;
      backpackRef.current.rotation.x = -0.04 + counterStride * THREE.MathUtils.lerp(0.04, 0.08, runBlend) * walkBlend;
    }
    if (leftArmRef.current) leftArmRef.current.rotation.x = counterStride * THREE.MathUtils.lerp(0.72, 1.12, runBlend) * walkBlend + 0.16;
    if (rightArmRef.current) rightArmRef.current.rotation.x = stride * THREE.MathUtils.lerp(0.72, 1.12, runBlend) * walkBlend + 0.16;
    if (leftLegRef.current) leftLegRef.current.rotation.x = stride * THREE.MathUtils.lerp(0.68, 0.95, runBlend) * walkBlend;
    if (rightLegRef.current) rightLegRef.current.rotation.x = counterStride * THREE.MathUtils.lerp(0.68, 0.95, runBlend) * walkBlend;
    if (leftFootRef.current) leftFootRef.current.rotation.x = 0.12 - Math.max(0, counterStride) * 0.38 * walkBlend;
    if (rightFootRef.current) rightFootRef.current.rotation.x = 0.12 - Math.max(0, stride) * 0.38 * walkBlend;

    // Cinematic follow camera: behind the avatar, slightly elevated, looking toward playable land ahead.
    const cameraBehind = facingRef.current.clone().multiplyScalar(-58);
    const speedPullback = THREE.MathUtils.lerp(0, 11, runBlend);
    const targetCamera = new THREE.Vector3(
      clamped.x + cameraBehind.x - facingRef.current.x * speedPullback,
      groundY + 22 + runBlend * 3,
      clamped.z + cameraBehind.z - facingRef.current.z * speedPullback,
    );
    const cameraGroundY = terrainHeight(targetCamera.x, targetCamera.z);
    targetCamera.y = Math.max(targetCamera.y, cameraGroundY + 12);
    const lookTarget = new THREE.Vector3(
      clamped.x + facingRef.current.x * 70,
      groundY + 9,
      clamped.z + facingRef.current.z * 70,
    );
    camera.position.lerp(targetCamera, dampFactor(CAMERA_POSITION_DAMPING, delta));
    cameraLookRef.current.lerp(lookTarget, dampFactor(CAMERA_LOOK_DAMPING, delta));
    camera.lookAt(cameraLookRef.current);

    onPositionChange(clamped);
  });

  return (
    <group ref={playerRef} scale={2.2}>
      <group ref={bodyRef} position={[0, 0.18, 0]}>
        <group ref={leftLegRef} position={[-0.22, 1.08, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.17, 0.58, 8, 14]} />
            <meshStandardMaterial color="#1f2937" roughness={0.72} />
          </mesh>
          <mesh position={[-0.08, -0.7, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.5, 6, 12]} />
            <meshStandardMaterial color="#ffe0b8" roughness={0.68} />
          </mesh>
          <mesh ref={leftFootRef} position={[-0.08, -1.02, -0.09]} castShadow>
            <boxGeometry args={[0.27, 0.18, 0.56]} />
            <meshStandardMaterial color="#2563eb" roughness={0.62} />
          </mesh>
          <mesh position={[-0.08, -1.14, -0.1]} castShadow>
            <boxGeometry args={[0.31, 0.06, 0.6]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.22, 1.08, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.17, 0.58, 8, 14]} />
            <meshStandardMaterial color="#1f2937" roughness={0.72} />
          </mesh>
          <mesh position={[0.08, -0.7, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.5, 6, 12]} />
            <meshStandardMaterial color="#ffe0b8" roughness={0.68} />
          </mesh>
          <mesh ref={rightFootRef} position={[0.08, -1.02, -0.09]} castShadow>
            <boxGeometry args={[0.27, 0.18, 0.56]} />
            <meshStandardMaterial color="#2563eb" roughness={0.62} />
          </mesh>
          <mesh position={[0.08, -1.14, -0.1]} castShadow>
            <boxGeometry args={[0.31, 0.06, 0.6]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
        </group>
        <mesh position={[0, 1.21, 0]} castShadow>
          <capsuleGeometry args={[0.45, 0.76, 12, 20]} />
          <meshStandardMaterial color="#f7f2e9" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.23, 0.12]} castShadow>
          <capsuleGeometry args={[0.52, 0.68, 12, 20]} />
          <meshStandardMaterial color="#1d5fc8" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.24, -0.24]} castShadow>
          <boxGeometry args={[0.7, 0.68, 0.08]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.27, -0.31]} rotation={[0, 0, Math.PI / 5]} castShadow>
          <coneGeometry args={[0.2, 0.09, 5]} />
          <meshStandardMaterial color="#f8b422" roughness={0.46} />
        </mesh>
        <mesh position={[0, 1.72, -0.02]} castShadow>
          <capsuleGeometry args={[0.16, 0.16, 8, 12]} />
          <meshStandardMaterial color="#ffd9ad" roughness={0.62} />
        </mesh>
        <mesh position={[-0.13, 1.39, -0.28]} rotation={[0.22, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.74} />
        </mesh>
        <mesh position={[0.13, 1.39, -0.28]} rotation={[0.22, 0, 0.08]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.74} />
        </mesh>
        <mesh position={[-0.25, 1.24, -0.34]} rotation={[0.1, 0, 0.1]} castShadow>
          <boxGeometry args={[0.08, 0.55, 0.04]} />
          <meshStandardMaterial color="#184a9b" roughness={0.68} />
        </mesh>
        <mesh position={[0.25, 1.24, -0.34]} rotation={[0.1, 0, -0.1]} castShadow>
          <boxGeometry args={[0.08, 0.55, 0.04]} />
          <meshStandardMaterial color="#184a9b" roughness={0.68} />
        </mesh>
        <mesh position={[0, 1.47, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.33, 0.08, 10, 22]} />
          <meshStandardMaterial color="#1d5fc8" roughness={0.78} />
        </mesh>

        <group ref={leftArmRef} position={[-0.52, 1.55, 0.02]} rotation={[0.18, 0, -0.22]}>
          <mesh position={[-0.1, -0.34, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.65, 8, 14]} />
            <meshStandardMaterial color="#1d5fc8" roughness={0.7} />
          </mesh>
          <mesh position={[-0.17, -0.78, -0.04]} castShadow>
            <sphereGeometry args={[0.14, 14, 10]} />
            <meshStandardMaterial color="#ffe0b8" roughness={0.66} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.52, 1.55, 0.02]} rotation={[0.18, 0, 0.22]}>
          <mesh position={[0.1, -0.34, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.65, 8, 14]} />
            <meshStandardMaterial color="#1d5fc8" roughness={0.7} />
          </mesh>
          <mesh position={[0.17, -0.78, -0.04]} castShadow>
            <sphereGeometry args={[0.14, 14, 10]} />
            <meshStandardMaterial color="#ffe0b8" roughness={0.66} />
          </mesh>
        </group>

        <group ref={backpackRef} position={[0, 1.42, 0.52]} rotation={[0.04, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.88, 0.32]} />
            <meshStandardMaterial color="#d9902f" roughness={0.62} />
          </mesh>
          <mesh position={[0, 0, 0.14]} castShadow>
            <boxGeometry args={[0.36, 0.28, 0.05]} />
            <meshStandardMaterial color="#2f5e9e" roughness={0.7} />
          </mesh>
          <mesh position={[-0.28, -0.16, 0.08]} castShadow>
            <boxGeometry args={[0.1, 0.28, 0.08]} />
            <meshStandardMaterial color="#244f8d" roughness={0.72} />
          </mesh>
          <mesh position={[0.28, -0.16, 0.08]} castShadow>
            <boxGeometry args={[0.1, 0.28, 0.08]} />
            <meshStandardMaterial color="#244f8d" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.12, 0.18]} castShadow>
            <circleGeometry args={[0.11, 18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.68} />
          </mesh>
          <mesh position={[0, 0.12, 0.185]} rotation={[0, 0, Math.PI / 5]} castShadow>
            <coneGeometry args={[0.07, 0.035, 5]} />
            <meshStandardMaterial color="#2f5e9e" roughness={0.58} />
          </mesh>
          <mesh position={[0, 0.44, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.24, 0.035, 8, 18]} />
            <meshStandardMaterial color="#7c4a1f" roughness={0.75} />
          </mesh>
        </group>

        <group ref={headRef} position={[0, 2.08, -0.04]}>
          <mesh castShadow>
            <sphereGeometry args={[0.52, 34, 24]} />
            <meshStandardMaterial color="#ffd9ad" roughness={0.58} />
          </mesh>
          <mesh position={[0, 0.25, 0.05]} scale={[1.05, 0.62, 0.94]} castShadow>
            <sphereGeometry args={[0.48, 28, 16]} />
            <meshStandardMaterial color="#2a150c" roughness={0.86} />
          </mesh>
          <mesh position={[-0.2, 0.035, -0.445]} castShadow>
            <sphereGeometry args={[0.092, 16, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.38} />
          </mesh>
          <mesh position={[0.2, 0.035, -0.445]} castShadow>
            <sphereGeometry args={[0.092, 16, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.38} />
          </mesh>
          <mesh position={[-0.2, 0.02, -0.505]} castShadow>
            <sphereGeometry args={[0.052, 12, 8]} />
            <meshStandardMaterial color="#21120a" roughness={0.45} />
          </mesh>
          <mesh position={[0.2, 0.02, -0.505]} castShadow>
            <sphereGeometry args={[0.052, 12, 8]} />
            <meshStandardMaterial color="#21120a" roughness={0.45} />
          </mesh>
          <mesh position={[-0.2, 0.135, -0.47]} rotation={[0, 0, -0.18]} castShadow>
            <boxGeometry args={[0.2, 0.035, 0.025]} />
            <meshStandardMaterial color="#2a150c" roughness={0.8} />
          </mesh>
          <mesh position={[0.2, 0.135, -0.47]} rotation={[0, 0, 0.18]} castShadow>
            <boxGeometry args={[0.2, 0.035, 0.025]} />
            <meshStandardMaterial color="#2a150c" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.035, -0.535]} castShadow>
            <sphereGeometry args={[0.055, 12, 8]} />
            <meshStandardMaterial color="#ffbd8a" roughness={0.56} />
          </mesh>
          <mesh position={[-0.3, -0.075, -0.46]} castShadow>
            <sphereGeometry args={[0.052, 10, 8]} />
            <meshStandardMaterial color="#ff9f9a" roughness={0.62} transparent opacity={0.72} />
          </mesh>
          <mesh position={[0.3, -0.075, -0.46]} castShadow>
            <sphereGeometry args={[0.052, 10, 8]} />
            <meshStandardMaterial color="#ff9f9a" roughness={0.62} transparent opacity={0.72} />
          </mesh>
          <mesh position={[0, -0.15, -0.48]} rotation={[0, 0, 0]} castShadow>
            <torusGeometry args={[0.13, 0.014, 6, 22, Math.PI]} />
            <meshStandardMaterial color="#8a3f22" roughness={0.55} />
          </mesh>
          <mesh position={[-0.55, -0.02, 0.03]} castShadow>
            <sphereGeometry args={[0.12, 12, 8]} />
            <meshStandardMaterial color="#ffd0a0" roughness={0.62} />
          </mesh>
          <mesh position={[0.55, -0.02, 0.03]} castShadow>
            <sphereGeometry args={[0.12, 12, 8]} />
            <meshStandardMaterial color="#ffd0a0" roughness={0.62} />
          </mesh>
          {Array.from({ length: 30 }, (_, index) => {
            const angle = (index / 30) * Math.PI * 2;
            const frontBias = Math.cos(angle) < 0 ? 0.16 : 0;
            const radius = 0.38 + hash(index, 3) * 0.14 + frontBias;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius * 0.84 - frontBias * 0.4;
            const y = 0.35 + hash(index, 5) * 0.17;
            return (
              <mesh key={index} position={[x, y, z]} rotation={[0.62 + hash(index, 8) * 0.68, angle, 0.08]} castShadow>
                <capsuleGeometry args={[0.105, 0.34, 6, 8]} />
                <meshStandardMaterial color={index % 3 === 0 ? "#2a150c" : "#3b1d0d"} roughness={0.88} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}

const USER_ASSET_PREVIEW_POSITION = { x: 760, z: 220 };

const SUPPLIED_MODEL_BY_STARTER_ASSET: Partial<Record<StarterAssetId, { assetId: string; targetSize: number }>> = {
  "small-house": { assetId: "countryside-houses", targetSize: 118 },
  "two-storey-house": { assetId: "old-residential-building", targetSize: 112 },
  shop: { assetId: "blackfriar-pub", targetSize: 92 },
  market: { assetId: "german-farmer-market", targetSize: 132 },
  "apartment-block": { assetId: "old-residential-building", targetSize: 136 },
};

function cloneSceneForPreview(scene: THREE.Group | THREE.Object3D) {
  const clone = scene.clone(true);

  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true;
    }
  });

  clone.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  return {
    object: clone,
    center,
    minY: box.min.y,
    largestSide: Math.max(size.x, size.y, size.z) || 1,
  };
}

function AssetPreviewPlaceholder() {
  const y = terrainHeight(USER_ASSET_PREVIEW_POSITION.x, USER_ASSET_PREVIEW_POSITION.z) + 0.12;

  return (
    <group position={[USER_ASSET_PREVIEW_POSITION.x, y, USER_ASSET_PREVIEW_POSITION.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[26, 34, 48]} />
        <meshStandardMaterial color="#f7d55d" emissive="#e3a41c" emissiveIntensity={0.18} roughness={0.72} />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[16, 5, 16]} />
        <meshStandardMaterial color="#f4c84d" transparent opacity={0.55} roughness={0.62} />
      </mesh>
    </group>
  );
}

function LoadedUserSuppliedAsset({ asset }: { asset: UserSuppliedBuildCityAsset }) {
  const gltf = useGLTF(asset.path);
  const preview = useMemo(() => {
    const clonedScene = cloneSceneForPreview(gltf.scene);

    return {
      object: clonedScene.object,
      center: clonedScene.center,
      scale: asset.targetSize / clonedScene.largestSide,
    };
  }, [asset.targetSize, gltf.scene]);

  const y = terrainHeight(USER_ASSET_PREVIEW_POSITION.x, USER_ASSET_PREVIEW_POSITION.z);
  const scaledCenter = preview.center.clone().multiplyScalar(preview.scale);
  const scaledGroundOffset = preview.minY * preview.scale;

  return (
    <group position={[USER_ASSET_PREVIEW_POSITION.x, y + 0.25, USER_ASSET_PREVIEW_POSITION.z]} rotation={[0, Math.PI * 0.12, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <circleGeometry args={[asset.targetSize * 0.62, 80]} />
        <meshStandardMaterial color="#88bd64" roughness={0.92} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <ringGeometry args={[asset.targetSize * 0.62, asset.targetSize * 0.67, 80]} />
        <meshStandardMaterial color="#f6cf68" roughness={0.72} />
      </mesh>
      <group scale={preview.scale} position={[-scaledCenter.x, -scaledGroundOffset, -scaledCenter.z]}>
        <primitive object={preview.object} />
      </group>
    </group>
  );
}

function SuppliedStarterAssetFallback({ radius = 16 }: { radius?: number }) {
  return (
    <group>
      <Foundation radius={radius} color="#d9c38a" />
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 0.8, 5, radius * 0.62]} />
        <meshStandardMaterial color="#dec28f" roughness={0.76} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function LoadedSuppliedStarterAsset({
  asset,
  targetSize,
}: {
  asset: UserSuppliedBuildCityAsset;
  targetSize: number;
}) {
  const gltf = useGLTF(asset.path);
  const preview = useMemo(() => {
    const clonedScene = cloneSceneForPreview(gltf.scene);

    return {
      object: clonedScene.object,
      center: clonedScene.center,
      minY: clonedScene.minY,
      scale: targetSize / clonedScene.largestSide,
    };
  }, [gltf.scene, targetSize]);
  const scaledCenter = preview.center.clone().multiplyScalar(preview.scale);
  const scaledGroundOffset = preview.minY * preview.scale;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[targetSize * 0.62, 64]} />
        <meshStandardMaterial color="#7fb868" roughness={0.92} />
      </mesh>
      <group scale={preview.scale} position={[-scaledCenter.x, -scaledGroundOffset, -scaledCenter.z]}>
        <primitive object={preview.object} />
      </group>
    </group>
  );
}

function SuppliedStarterAsset({ assetId }: { assetId: StarterAssetId }) {
  const modelConfig = SUPPLIED_MODEL_BY_STARTER_ASSET[assetId];
  const asset = modelConfig
    ? USER_SUPPLIED_BUILD_CITY_ASSETS.find((item) => item.id === modelConfig.assetId)
    : undefined;

  if (!asset || !modelConfig) return null;

  return (
    <Suspense fallback={<SuppliedStarterAssetFallback radius={Math.max(14, modelConfig.targetSize * 0.35)} />}>
      <LoadedSuppliedStarterAsset asset={asset} targetSize={modelConfig.targetSize} />
    </Suspense>
  );
}

function UserSuppliedAssetPreview({ assetId }: { assetId: string }) {
  const asset = USER_SUPPLIED_BUILD_CITY_ASSETS.find((item) => item.id === assetId);
  if (!asset) return null;

  return (
    <Suspense fallback={<AssetPreviewPlaceholder />}>
      <LoadedUserSuppliedAsset asset={asset} />
    </Suspense>
  );
}

function WorldScene({
  world,
  mobileMovement,
  mobileSprinting,
  stopSignal,
  selectedZoneId,
  showZoning,
  previewAssetId,
  showLayoutSimulation,
  onPlayerPositionChange,
  onPlayerFacingChange,
}: {
  world: BuildCitySave;
  mobileMovement: MovementVector;
  mobileSprinting: boolean;
  stopSignal: number;
  selectedZoneId: CityZoneId;
  showZoning: boolean;
  previewAssetId: string;
  showLayoutSimulation: boolean;
  onPlayerPositionChange: (position: PlayerPosition) => void;
  onPlayerFacingChange: (facing: MovementVector) => void;
}) {
  const movementRef = useKeyboardMovement();
  const saveFrameRef = useRef(0);
  const playerChunk = useMemo(() => ({
    x: Math.round(world.playerPosition.x / CHUNK_SIZE),
    z: Math.round(world.playerPosition.z / CHUNK_SIZE),
  }), [world.playerPosition.x, world.playerPosition.z]);
  const chunks = useMemo(() => {
    const items: { chunk: ChunkCoord; highDetail: boolean }[] = [];
    for (let z = playerChunk.z - VISIBLE_CHUNK_RADIUS; z <= playerChunk.z + VISIBLE_CHUNK_RADIUS; z += 1) {
      for (let x = playerChunk.x - VISIBLE_CHUNK_RADIUS; x <= playerChunk.x + VISIBLE_CHUNK_RADIUS; x += 1) {
        const distance = Math.max(Math.abs(x - playerChunk.x), Math.abs(z - playerChunk.z));
        items.push({ chunk: { x, z }, highDetail: distance <= HIGH_DETAIL_CHUNK_RADIUS });
      }
    }
    return items;
  }, [playerChunk.x, playerChunk.z]);

  const handlePositionChange = useCallback((position: PlayerPosition) => {
    saveFrameRef.current += 1;
    if (saveFrameRef.current % 24 === 0) {
      onPlayerPositionChange(position);
    }
  }, [onPlayerPositionChange]);

  return (
    <>
      <ProductionRenderSettings />
      <color attach="background" args={["#92d6f6"]} />
      <fog attach="fog" args={["#c7f0ff", 520, 2300]} />
      <ProceduralSkyDome />
      <CinematicLightingRig />
      <Clouds />
      <OceanAndHorizon />
      {chunks.map(({ chunk, highDetail }) => (
        <group key={getChunkKey(chunk)}>
          <TerrainChunk chunk={chunk} highDetail={highDetail} />
          <WaterChunk chunk={chunk} />
          <VegetationChunk chunk={chunk} highDetail={highDetail} />
        </group>
      ))}
      <LakeWater playerPosition={world.playerPosition} />
      <SpawnClearing />
      <ZoningLayer selectedZoneId={selectedZoneId} visible={showZoning} />
      <ResidentialRoadPlan enabled={world.structures.some((structure) => isResidentialAsset(structure.assetId))} />
      <StarterSettlement structures={world.structures} />
      <SimulatedCityLayout visible={showLayoutSimulation} />
      {!showLayoutSimulation ? <UserSuppliedAssetPreview assetId={previewAssetId} /> : null}
      <Player
        movementRef={movementRef}
        mobileMovement={mobileMovement}
        mobileSprinting={mobileSprinting}
        initialPosition={world.playerPosition}
        onPositionChange={handlePositionChange}
        onFacingChange={onPlayerFacingChange}
        structures={showLayoutSimulation ? [...world.structures, ...SIMULATION_STRUCTURES] : world.structures}
        residentialPreviewActive={false}
        stopSignal={stopSignal}
      />
    </>
  );
}

function MobileControls({
  setMobileMovement,
  playerFacing,
  onStop,
}: {
  setMobileMovement: React.Dispatch<React.SetStateAction<MovementVector>>;
  playerFacing: MovementVector;
  onStop: () => void;
}) {
  const stickRef = useRef<HTMLDivElement>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [activeDirection, setActiveDirection] = useState("");

  const toWorldMovement = (input: MovementVector) => {
    const facingLength = Math.hypot(playerFacing.x, playerFacing.z) || 1;
    const forward = {
      x: playerFacing.x / facingLength,
      z: playerFacing.z / facingLength,
    };
    const right = {
      x: -forward.z,
      z: forward.x,
    };

    const worldMovement = {
      x: right.x * input.x + forward.x * -input.z,
      z: right.z * input.x + forward.z * -input.z,
    };
    const worldLength = Math.hypot(worldMovement.x, worldMovement.z) || 1;

    return {
      x: worldMovement.x / worldLength,
      z: worldMovement.z / worldLength,
    };
  };

  const setDpadMovement = (movement: MovementVector) => {
    setStickPosition({
      x: movement.x * 28,
      y: movement.z * 28,
    });
    setMobileMovement(toWorldMovement(movement));
    if (movement.x === 0 && movement.z === 0) {
      setActiveDirection("");
    } else if (movement.z < 0) {
      setActiveDirection("up");
    } else if (movement.z > 0) {
      setActiveDirection("down");
    } else if (movement.x < 0) {
      setActiveDirection("left");
    } else {
      setActiveDirection("right");
    }
  };

  const updateStick = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = stickRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const radius = bounds.width * 0.38;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > radius ? radius / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;

    setStickPosition({ x, y });
    setMobileMovement(toWorldMovement({
      x: x / radius,
      z: y / radius,
    }));
  };

  const resetStick = () => {
    setStickPosition({ x: 0, y: 0 });
    setMobileMovement({ x: 0, z: 0 });
    setActiveDirection("");
    onStop();
  };

  return (
    <div
      ref={stickRef}
      className="bc-mobile-controls"
      aria-label="360 degree movement joystick"
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget) return;
        dragPointerIdRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateStick(event);
      }}
      onPointerMove={(event) => {
        if (dragPointerIdRef.current === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
          updateStick(event);
        }
      }}
      onPointerUp={(event) => {
        if (dragPointerIdRef.current !== event.pointerId) return;
        dragPointerIdRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        resetStick();
      }}
      onPointerCancel={(event) => {
        if (dragPointerIdRef.current !== event.pointerId) return;
        dragPointerIdRef.current = null;
        resetStick();
      }}
      onPointerLeave={(event) => {
        if (dragPointerIdRef.current !== event.pointerId) return;
        dragPointerIdRef.current = null;
        resetStick();
      }}
    >
      {[ 
        { className: "bc-joystick-up", direction: "up", label: "^", movement: { x: 0, z: -1 } },
        { className: "bc-joystick-left", direction: "left", label: "<", movement: { x: -1, z: 0 } },
        { className: "bc-joystick-down", direction: "down", label: "v", movement: { x: 0, z: 1 } },
        { className: "bc-joystick-right", direction: "right", label: ">", movement: { x: 1, z: 0 } },
      ].map((item) => (
        <button
          className={`bc-dpad-button ${item.className} ${activeDirection === item.direction ? "active" : ""}`}
          type="button"
          key={item.label}
          aria-label={`Move ${item.label}`}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDpadMovement(item.movement);
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
          }}
          onPointerCancel={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {item.label}
        </button>
      ))}
      <button
        className="bc-stop-button"
        type="button"
        aria-label="Stop walking"
        onPointerDown={(event) => {
          event.stopPropagation();
          resetStick();
        }}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerCancel={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        Stop
      </button>
      <span
        className="bc-joystick-thumb"
        style={{
          transform: `translate(calc(-50% + ${stickPosition.x}px), calc(-50% + ${stickPosition.y}px))`,
        }}
      />
    </div>
  );
}

function WorldMinimap({ position }: { position: PlayerPosition }) {
  const x = 50 + (position.x / WORLD_LIMIT) * 42;
  const y = 50 + (position.z / WORLD_LIMIT) * 42;

  return (
    <section className="bc-minimap" aria-label="Island location">
      <div className="bc-minimap-land">
        <span className="bc-minimap-water bc-water-a" />
        <span className="bc-minimap-water bc-water-b" />
        <span className="bc-minimap-mountain bc-mountain-a" />
        <span className="bc-minimap-mountain bc-mountain-b" />
        <span
          className="bc-minimap-player"
          style={{
            left: `${Math.max(12, Math.min(88, x))}%`,
            top: `${Math.max(12, Math.min(88, y))}%`,
          }}
        />
      </div>
    </section>
  );
}

function RunButton({
  active,
  onActiveChange,
}: {
  active: boolean;
  onActiveChange: (active: boolean) => void;
}) {
  return (
    <button
      className={`bc-run-button ${active ? "active" : ""}`}
      type="button"
      aria-label="Run"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onActiveChange(true);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onActiveChange(false);
      }}
      onPointerCancel={() => onActiveChange(false)}
      onPointerLeave={() => onActiveChange(false)}
    >
      <span />
    </button>
  );
}

function AssetShopThumbnail({ assetId }: { assetId: StarterAssetId }) {
  const zone = getAssetZone(assetId).id;
  const usesSuppliedModel = Boolean(SUPPLIED_MODEL_BY_STARTER_ASSET[assetId]);
  const shapeClass = assetId === "apartment-block" || assetId === "three-storey-lodge" || assetId === "hospital" || assetId === "larger-school"
    ? "tower"
    : assetId === "two-storey-house" || assetId === "school" || assetId === "community-hall" || assetId === "library"
      ? "two"
      : assetId === "starter-tent"
        ? "tent"
        : assetId === "storage-hut" || assetId === "worship-hall"
          ? "hut"
          : assetId === "water-well"
            ? "well"
            : assetId === "city-tree" || assetId === "bush" || assetId === "garden" || assetId === "flower-patch"
              ? "nature"
              : assetId === "bridge"
                ? "bridge"
                : "home";

  return (
    <span className={`bc-shop-thumb ${zone} ${shapeClass} ${usesSuppliedModel ? "supplied" : ""}`} aria-hidden="true">
      <i className="thumb-ground" />
      <i className="thumb-body" />
      <i className="thumb-roof" />
      <i className="thumb-extra" />
      {usesSuppliedModel ? <b>GLB</b> : null}
    </span>
  );
}

function StarterShop({
  coins,
  structures,
  selectedAssetId,
  feedback,
  trialMode,
  showZoning,
  showLayoutSimulation,
  onSelectAsset,
  onBuild,
  onEarnCoins,
  onTrialModeChange,
  onTrialCoins,
  onShowZoningChange,
  onGoToZone,
  onLayoutSimulationChange,
  onGoToSimulation,
}: {
  coins: number;
  structures: PlacedStructure[];
  selectedAssetId: StarterAssetId;
  feedback: string;
  trialMode: boolean;
  showZoning: boolean;
  showLayoutSimulation: boolean;
  onSelectAsset: (assetId: StarterAssetId) => void;
  onBuild: () => void;
  onEarnCoins: () => void;
  onTrialModeChange: (enabled: boolean) => void;
  onTrialCoins: () => void;
  onShowZoningChange: (enabled: boolean) => void;
  onGoToZone: (zoneId: CityZoneId) => void;
  onLayoutSimulationChange: (enabled: boolean) => void;
  onGoToSimulation: () => void;
}) {
  const selectedAsset = getStarterAsset(selectedAssetId);
  const selectedZone = getAssetZone(selectedAsset.id);

  return (
    <section className="bc-starter-shop" aria-label="Starter settlement shop">
      <div className="bc-shop-header">
        <div>
          <span>{trialMode ? "Trial Builder" : "Starter Settlement"}</span>
          <strong>{trialMode ? "Free build" : `${coins} coins`}</strong>
        </div>
        <div className="bc-shop-actions">
          <button type="button" onClick={onEarnCoins}>Practice +40</button>
          <button type="button" onClick={onTrialCoins}>Trial +5000</button>
          <label className="bc-trial-toggle">
            <input
              type="checkbox"
              checked={trialMode}
              onChange={(event) => onTrialModeChange(event.target.checked)}
            />
            <span>Trial</span>
          </label>
          <label className="bc-trial-toggle">
            <input
              type="checkbox"
              checked={showZoning}
              onChange={(event) => onShowZoningChange(event.target.checked)}
            />
            <span>Zones</span>
          </label>
          <label className="bc-trial-toggle">
            <input
              type="checkbox"
              checked={showLayoutSimulation}
              onChange={(event) => onLayoutSimulationChange(event.target.checked)}
            />
            <span>Plan</span>
          </label>
        </div>
      </div>

      <div className="bc-zone-guide">
        <div className="bc-zone-current">
          <div>
            <span>Recommended Zone</span>
            <strong style={{ color: selectedZone.color }}>{selectedZone.label}</strong>
            <small>{selectedZone.description}</small>
          </div>
          <div className="bc-zone-actions">
            <button type="button" onClick={() => onGoToZone(selectedZone.id)}>Go to Zone</button>
            <button type="button" onClick={onGoToSimulation}>View Plan</button>
          </div>
        </div>
        <div className="bc-zone-legend" aria-label="City zone legend">
          {CITY_ZONES.map((zone) => (
            <button key={zone.id} type="button" title={`Go to ${zone.label}`} onClick={() => onGoToZone(zone.id)}>
              <i style={{ background: zone.color }} />
              {zone.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bc-shop-grid">
        {STARTER_ASSETS.map((asset) => {
          const isSelected = asset.id === selectedAssetId;
          const builtCount = structures.filter((structure) => structure.assetId === asset.id).length;
          return (
            <button
              className={`bc-shop-card ${isSelected ? "selected" : ""}`}
              type="button"
              key={asset.id}
              onClick={() => onSelectAsset(asset.id)}
            >
              <AssetShopThumbnail assetId={asset.id} />
              <span>{asset.name}</span>
              <small>{getAssetZone(asset.id).label} - {builtCount ? `Built x${builtCount} - ${trialMode ? "free" : `${asset.cost} coins`}` : trialMode ? "Free in trial" : `${asset.cost} coins`}</small>
            </button>
          );
        })}
      </div>

      <div className="bc-build-panel">
        <div>
          <strong>{selectedAsset.name}</strong>
          <span>{selectedAsset.description}</span>
          <small>
            {selectedAsset.size} footprint - {selectedZone.label} zone - {isResidentialAsset(selectedAsset.id) ? "planned neighborhood lot - " : ""}entrance: {selectedAsset.entrance.label} - interiors: {selectedAsset.interiorReady ? "ready" : "not needed"}{trialMode ? " - trial placement is free" : ""}
          </small>
          <small>Phase 1 quality gate: {BUILD_CITY_ASSET_QUALITY_GATES[0]}.</small>
        </div>
        <button type="button" onClick={onBuild}>{trialMode ? "Add Free" : "Build Here"}</button>
      </div>

      {feedback ? <p className="bc-build-feedback">{feedback}</p> : null}
    </section>
  );
}

function BuildingInterior({
  structure,
  onExit,
}: {
  structure: PlacedStructure;
  onExit: () => void;
}) {
  const asset = getStarterAsset(structure.assetId);
  const roomPlan = asset.id === "starter-tent"
    ? {
        title: "Explorer Tent Interior",
        summary: "A cozy camp interior with a bedroll, supply corner, and lantern space.",
        living: "Camp Space",
        study: "Map Corner",
        sleep: "Bedroll Area",
        utility: "Supply Corner",
        slots: ["Bedroll", "Lantern", "Crate", "Map"],
      }
    : asset.id === "two-storey-house"
      ? {
          title: "Two-Storey Home Interior",
          summary: "A practical two-floor family layout with a ground-floor living area, upstairs bedrooms, balcony access, and stairs.",
          living: "Ground Floor Lounge",
          study: "Kitchen / Study",
          sleep: "Upper Bedrooms",
          utility: "Stair Hall",
          slots: ["Sofa", "Dining", "Beds", "Stairs"],
        }
      : asset.id === "three-storey-lodge"
        ? {
            title: "Three-Storey Lodge Interior",
            summary: "A tall three-floor building with a lobby, learning rooms, upper lounge, roof terrace, and elevator access.",
            living: "Lobby",
            study: "Learning Rooms",
            sleep: "Upper Lounge",
            utility: "Lift Lobby",
            slots: ["Reception", "Desks", "Lift", "Roof"],
          }
      : asset.id === "storage-hut"
        ? {
            title: "Storage Hut Interior",
            summary: "A practical supply room with shelves, tool racks, and walkable storage zones.",
            living: "Packing Area",
            study: "Tool Rack",
            sleep: "Supply Shelves",
            utility: "Crate Wall",
            slots: ["Crate", "Shelf", "Tools", "Barrel"],
          }
      : {
          title: asset.id === "small-house" ? "Founder House Interior" : `${asset.name} Interior`,
          summary: asset.id === "small-house"
            ? "Accessible single-floor layout with practical room zones, a clear entrance, and future furnishing space."
            : `Accessible ${asset.floors > 1 ? `${asset.floors}-floor` : "single-floor"} layout with clear entrance flow and future furnishing space.`,
          living: asset.furnishingZones[0] || "Main Area",
          study: asset.furnishingZones[1] || "Activity Area",
          sleep: asset.furnishingZones[2] || "Upper Area",
          utility: asset.furnishingZones[3] || "Utility Zone",
          slots: asset.id === "small-house" ? ["Sofa", "Table", "Bed", "Shelf"] : ["Zone A", "Zone B", "Zone C", asset.verticalTransport === "elevator" ? "Lift" : asset.verticalTransport === "stairs" ? "Stairs" : "Storage"],
        };

  return (
    <section className="bc-interior-shell" aria-label={`${asset.name} interior`}>
      <div className="bc-interior-panel">
        <header className="bc-interior-header">
          <div>
            <span>{roomPlan.title}</span>
            <h2>{asset.name}</h2>
            <p>{roomPlan.summary}</p>
          </div>
          <button type="button" onClick={onExit}>Exit</button>
        </header>

        <div className="bc-floorplan" aria-label={`${asset.name} floor plan`}>
          <div className="bc-room bc-room-living">
            <strong>{roomPlan.living}</strong>
            <span>free furniture placement</span>
          </div>
          <div className="bc-room bc-room-study">
            <strong>{roomPlan.study}</strong>
            <span>desk, books, learning tools</span>
          </div>
          <div className="bc-room bc-room-sleep">
            <strong>{roomPlan.sleep}</strong>
            <span>bed and storage</span>
          </div>
          <div className="bc-room bc-room-utility">
            <strong>{roomPlan.utility}</strong>
            <span>future upgrades</span>
          </div>
          <div className="bc-interior-door">{asset.entrance.label}</div>
          <div className="bc-furniture-slot slot-a">{roomPlan.slots[0]}</div>
          <div className="bc-furniture-slot slot-b">{roomPlan.slots[1]}</div>
          <div className="bc-furniture-slot slot-c">{roomPlan.slots[2]}</div>
          <div className="bc-furniture-slot slot-d">{roomPlan.slots[3]}</div>
        </div>

        <div className="bc-interior-meta">
          <span>Floors: {asset.floors}</span>
          <span>Vertical travel: {asset.verticalTransport}</span>
          <span>Furnishing zones: {asset.furnishingZones.join(", ")}</span>
        </div>
      </div>
    </section>
  );
}

function UserSuppliedAssetPanel({
  selectedAssetId,
  onSelectAsset,
}: {
  selectedAssetId: string;
  onSelectAsset: (assetId: string) => void;
}) {
  const selectedAsset = USER_SUPPLIED_BUILD_CITY_ASSETS.find((asset) => asset.id === selectedAssetId) || USER_SUPPLIED_BUILD_CITY_ASSETS[0];

  return (
    <section className="bc-user-asset-panel">
      <div className="bc-user-asset-panel__heading">
        <span>Supplied GLB Preview</span>
        <strong>{selectedAsset?.label}</strong>
      </div>
      <select
        value={selectedAssetId}
        onChange={(event) => onSelectAsset(event.target.value)}
        aria-label="Choose supplied 3D asset to preview"
      >
        {USER_SUPPLIED_BUILD_CITY_ASSETS.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.label}
          </option>
        ))}
      </select>
      {selectedAsset ? (
        <div className="bc-user-asset-panel__details">
          <span>{selectedAsset.category}</span>
          <p>{selectedAsset.recommendedUse}</p>
        </div>
      ) : null}
    </section>
  );
}

export default function BuildCityGame({ onBackToHub }: BuildCityGameProps) {
  const [world, setWorld] = useState<BuildCitySave>(loadSavedWorld);
  const [mobileMovement, setMobileMovement] = useState<MovementVector>({
    x: 0,
    z: 0,
  });
  const [mobileSprinting, setMobileSprinting] = useState(false);
  const [playerFacing, setPlayerFacing] = useState<MovementVector>({ x: 0, z: -1 });
  const [stopSignal, setStopSignal] = useState(0);
  const [selectedAssetId, setSelectedAssetId] = useState<StarterAssetId>("small-house");
  const [feedback, setFeedback] = useState("Choose a starter item and build your first settlement.");
  const [activeInteriorId, setActiveInteriorId] = useState("");
  const [nearbyEntranceId, setNearbyEntranceId] = useState("");
  const [trialMode, setTrialMode] = useState(() => window.localStorage.getItem(`${BUILD_CITY_STORAGE_KEY}.trialMode`) === "true");
  const [showZoning, setShowZoning] = useState(() => window.localStorage.getItem(`${BUILD_CITY_STORAGE_KEY}.showZoning`) === "true");
  const [showLayoutSimulation, setShowLayoutSimulation] = useState(() => window.localStorage.getItem(`${BUILD_CITY_STORAGE_KEY}.showLayoutSimulation`) === "true");
  const [previewAssetId, setPreviewAssetId] = useState(() => USER_SUPPLIED_BUILD_CITY_ASSETS[0]?.id || "");
  const selectedZone = getAssetZone(selectedAssetId);
  const visibleStructures = useMemo(
    () => (showLayoutSimulation ? [...world.structures, ...SIMULATION_STRUCTURES] : world.structures),
    [showLayoutSimulation, world.structures],
  );

  useEffect(() => {
    window.localStorage.setItem(BUILD_CITY_STORAGE_KEY, JSON.stringify(world));
  }, [world]);

  useEffect(() => {
    window.localStorage.setItem(`${BUILD_CITY_STORAGE_KEY}.trialMode`, String(trialMode));
  }, [trialMode]);

  useEffect(() => {
    window.localStorage.setItem(`${BUILD_CITY_STORAGE_KEY}.showZoning`, String(showZoning));
  }, [showZoning]);

  useEffect(() => {
    window.localStorage.setItem(`${BUILD_CITY_STORAGE_KEY}.showLayoutSimulation`, String(showLayoutSimulation));
  }, [showLayoutSimulation]);

  useEffect(() => {
    const currentEntrance = nearbyEntranceId
      ? visibleStructures.find((structure) => structure.instanceId === nearbyEntranceId)
      : undefined;

    if (currentEntrance) {
      const asset = getStarterAsset(currentEntrance.assetId);
      const entrance = getStructureEntranceWorldPosition(currentEntrance);
      const entranceDistance = Math.hypot(world.playerPosition.x - entrance.x, world.playerPosition.z - entrance.z);
      const structureDistance = Math.hypot(world.playerPosition.x - currentEntrance.x, world.playerPosition.z - currentEntrance.z);

      if (entranceDistance < 36 || structureDistance < asset.footprint.collisionRadius + 50) return;
    }

    const nextEntrance = visibleStructures.find((structure) => {
      const asset = getStarterAsset(structure.assetId);
      if (!asset.interiorReady) return false;
      const entrance = getStructureEntranceWorldPosition(structure);
      const entranceDistance = Math.hypot(world.playerPosition.x - entrance.x, world.playerPosition.z - entrance.z);
      const structureDistance = Math.hypot(world.playerPosition.x - structure.x, world.playerPosition.z - structure.z);

      return entranceDistance < 28 || structureDistance < asset.footprint.collisionRadius + 42;
    });

    setNearbyEntranceId(nextEntrance?.instanceId || "");
  }, [nearbyEntranceId, visibleStructures, world.playerPosition.x, world.playerPosition.z]);

  const nearbyEntrance = nearbyEntranceId
    ? visibleStructures.find((structure) => structure.instanceId === nearbyEntranceId)
    : undefined;

  const buildSelectedAsset = () => {
    const asset = getStarterAsset(selectedAssetId);
    const recommendedZone = getAssetZone(asset.id);
    const bridgePlacement = asset.id === "bridge" ? getPlannedBridgePlacement(world.structures) : undefined;
    const residentialPlacement = getPlannedResidentialPlacement(asset, world.structures);
    const plannedPlacement = bridgePlacement || residentialPlacement;

    if (asset.id === "bridge" && !bridgePlacement) {
      setFeedback("All planned river bridge crossings are already filled.");
      return;
    }

    const placement = plannedPlacement || getPlacementInFrontOfPlayer(world.playerPosition, playerFacing, asset);
    const placementError = validatePlacement(asset, placement, world.structures);
    const distanceToZone = Math.hypot(placement.x - recommendedZone.x, placement.z - recommendedZone.z);
    const zoneHint = distanceToZone <= recommendedZone.radius
      ? `Placed inside the ${recommendedZone.label} zone.`
      : `Tip: ${asset.name} fits best in the ${recommendedZone.label} zone.`;
    const planHint = plannedPlacement
      ? asset.id === "bridge"
        ? `Assigned to ${plannedPlacement.lotLabel}; bridges are reserved for river crossings.`
        : `Assigned to ${plannedPlacement.lotLabel}; residential roads are connected.`
      : isResidentialAsset(asset.id)
        ? "Residential planned lots are full, so this used free placement."
        : "";

    if (!trialMode && world.coins < asset.cost) {
      setFeedback(`You need ${asset.cost - world.coins} more coins for ${asset.name}.`);
      return;
    }

    if (placementError) {
      setFeedback(placementError);
      return;
    }

    const newStructure: PlacedStructure = {
      instanceId: `${selectedAssetId}-${Date.now()}`,
      assetId: selectedAssetId,
      x: placement.x,
      z: placement.z,
      rotation: placement.rotation,
      placedAt: Date.now(),
    };

    setWorld((currentWorld) => ({
      ...currentWorld,
      coins: trialMode ? currentWorld.coins : currentWorld.coins - asset.cost,
      structures: [...currentWorld.structures, newStructure],
    }));
    setFeedback(`${asset.name} ${trialMode ? "added in trial mode" : "built"} with a clear entrance and footprint. ${planHint || zoneHint}`);
  };

  const earnPracticeCoins = () => {
    setWorld((currentWorld) => ({
      ...currentWorld,
      coins: currentWorld.coins + 40,
    }));
    setFeedback("Correct practice answer. +40 coins.");
  };

  const addTrialCoins = () => {
    setWorld((currentWorld) => ({
      ...currentWorld,
      coins: currentWorld.coins + 5000,
    }));
    setFeedback("Trial top-up added. +5000 coins for testing.");
  };

  const goToZone = (zoneId: CityZoneId) => {
    const zone = getCityZone(zoneId);
    const arrival = getZoneArrivalPosition(zone);

    setMobileMovement({ x: 0, z: 0 });
    setMobileSprinting(false);
    setStopSignal((signal) => signal + 1);
    setShowZoning(true);
    setWorld((currentWorld) => ({
      ...currentWorld,
      playerPosition: arrival,
    }));
    setFeedback(`Moved to the ${zone.label} zone. ${zone.description}.`);
  };

  const goToSimulation = () => {
    setMobileMovement({ x: 0, z: 0 });
    setMobileSprinting(false);
    setStopSignal((signal) => signal + 1);
    setShowLayoutSimulation(true);
    setShowZoning(true);
    setWorld((currentWorld) => ({
      ...currentWorld,
      playerPosition: { x: SIMULATION_CENTER.x, z: SIMULATION_CENTER.z - 170 },
    }));
    setFeedback("Layout simulation on. Walk around the planned town to judge spacing, roads, homes, commerce, and community buildings.");
  };

  const activeInteriorStructure = activeInteriorId
    ? visibleStructures.find((structure) => structure.instanceId === activeInteriorId)
    : undefined;

  return (
    <main className="bc-game-3d">
      <Canvas shadows camera={{ position: [0, 32, 92], fov: 46 }} dpr={[1, 1.6]}>
        <WorldScene
          world={world}
          mobileMovement={mobileMovement}
          mobileSprinting={mobileSprinting}
          stopSignal={stopSignal}
          selectedZoneId={selectedZone.id}
          showZoning={showZoning}
          previewAssetId={previewAssetId}
          showLayoutSimulation={showLayoutSimulation}
          onPlayerPositionChange={(position) => {
            setWorld((currentWorld) => ({ ...currentWorld, playerPosition: position }));
          }}
          onPlayerFacingChange={setPlayerFacing}
        />
      </Canvas>

      <section className="bc-world-hud">
        <button className="bc-back" type="button" onClick={onBackToHub}>
          <ArrowLeft size={18} /> Games
        </button>
        <div>
          <span>Founder World</span>
          <strong>Production foundation - {WORLD_SIZE.toLocaleString()} x {WORLD_SIZE.toLocaleString()}</strong>
        </div>
        <div>
          <span>Asset Pipeline</span>
          <strong>{BUILD_CITY_ASSET_CATALOG.length} asset slots - {BUILD_CITY_MATERIAL_LIBRARY.length} PBR materials</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>X {Math.round(world.playerPosition.x)} - Z {Math.round(world.playerPosition.z)}</strong>
        </div>
        {nearbyEntrance ? (
          <button
            className="bc-enter-button"
            type="button"
            onClick={() => setActiveInteriorId(nearbyEntrance.instanceId)}
          >
            Enter {getStarterAsset(nearbyEntrance.assetId).name}
          </button>
        ) : null}
      </section>

      <section className="bc-world-note">
        {showLayoutSimulation
          ? "Layout simulation: walk the completed test area and judge building scale, spacing, roads, and zone placement."
          : "Build the first beautiful starter settlement. More land and organic roads come next."}
      </section>

      {!showLayoutSimulation ? (
        <UserSuppliedAssetPanel
          selectedAssetId={previewAssetId}
          onSelectAsset={(assetId) => {
            setPreviewAssetId(assetId);
            const asset = USER_SUPPLIED_BUILD_CITY_ASSETS.find((item) => item.id === assetId);
            setFeedback(asset ? `Previewing ${asset.label}. ${asset.recommendedUse}.` : "Choose a supplied GLB asset to preview.");
          }}
        />
      ) : null}

      <StarterShop
        coins={world.coins}
        structures={world.structures}
        selectedAssetId={selectedAssetId}
        feedback={feedback}
        trialMode={trialMode}
        showZoning={showZoning}
        showLayoutSimulation={showLayoutSimulation}
        onSelectAsset={(assetId) => {
          setSelectedAssetId(assetId);
          const nextAsset = getStarterAsset(assetId);
          const nextZone = getAssetZone(assetId);
          setFeedback(`${nextAsset.description} Recommended zone: ${nextZone.label}.`);
        }}
        onBuild={buildSelectedAsset}
        onEarnCoins={earnPracticeCoins}
        onTrialModeChange={(enabled) => {
          setTrialMode(enabled);
          setFeedback(enabled ? "Trial mode on. You can add every asset for free." : "Trial mode off. Normal coin costs are active.");
        }}
        onTrialCoins={addTrialCoins}
        onShowZoningChange={(enabled) => {
          setShowZoning(enabled);
          setFeedback(enabled ? "Zoning layer on. Use the coloured fields as planning guides." : "Zoning layer off. You can still place items freely.");
        }}
        onGoToZone={goToZone}
        onLayoutSimulationChange={(enabled) => {
          setShowLayoutSimulation(enabled);
          setFeedback(enabled
            ? "Layout simulation on. This is a visual master plan only; it is not saved as learner-built progress."
            : "Layout simulation off. Showing only learner-built structures and the supplied GLB preview.");
        }}
        onGoToSimulation={goToSimulation}
      />
      <WorldMinimap position={world.playerPosition} />
      <MobileControls
        setMobileMovement={setMobileMovement}
        playerFacing={playerFacing}
        onStop={() => setStopSignal((signal) => signal + 1)}
      />
      <RunButton active={mobileSprinting} onActiveChange={setMobileSprinting} />
      {activeInteriorStructure ? (
        <BuildingInterior
          structure={activeInteriorStructure}
          onExit={() => setActiveInteriorId("")}
        />
      ) : null}
    </main>
  );
}
