import {
  ArrowLeft,
  Award,
  Calculator,
  Clock3,
  Copy,
  Coins,
  Flame,
  Lightbulb,
  Move3D,
  Pause,
  RotateCcw,
  Save,
  ShoppingBag,
  SkipForward,
  Smile,
  Sparkles,
  Star,
  Users,
  Volume2,
} from "lucide-react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Bounds, ContactShadows, Html, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { RESTAURANT_MANAGER_CONFIG } from "./restaurantManagerConfig";
import {
  CLASS_LEVELS,
  DIFFICULTY_SETTINGS,
  FOOD_CATALOG,
  PATIENCE_RULES,
  applyFoodSelection,
  calculateOrderTotal,
  calculateQuestionScore,
  canAdmitCustomer,
  createCustomer,
  createInitialStock,
  createLevelConfig,
  formatNaira,
  getHintForQuestion,
  getLevelStars,
  getMoodFromPatience,
  handleKeypadInput,
  promoteQueue,
  restoreTemporaryFood,
  updateCustomerPatience,
  validateFoodSelection,
  validateNumericAnswer,
} from "./restaurantMathGameEngine";
import "./restaurant-manager.css";

const PLACEMENT_STORAGE_KEY = "proTutorsHub.restaurantManagerPlacement";
const PLACEMENT_PANEL_STORAGE_KEY = "proTutorsHub.restaurantManagerPlacementPanel";
const DEFAULT_CHARACTER_PATH_STORAGE_KEY = RESTAURANT_MANAGER_CONFIG.pathEditor.storageKeys.defaultCharacterPath;
const LOW_STOCK_REFILL_THRESHOLD = 3;
const DEFAULT_WHITE_PLATE_COUNT = Math.max(1, RESTAURANT_MANAGER_CONFIG.whitePlateStackTransform.count || 10);
const MONEY_MACHINE_SCREEN_TILT_DEFAULT = -0.28;
const MONEY_MACHINE_SCREEN_TILT_MIN = -0.36;
const MONEY_MACHINE_SCREEN_TILT_MAX = 0.08;
const MONEY_MACHINE_KEY_LABELS = [
  "7", "8", "9", "/",
  "4", "5", "6", "x",
  "1", "2", "3", "-",
  "0", "00", ".", "+",
  "C", "DEL", "=", "OK",
];
const CASH_DRAWER_NOTES = [
  { id: "N1000", value: "1000", bottom: "N4000", color: "#e3c2b0", accent: "#7b3f3c", portrait: "#856357", imagePath: "/assets/restaurant-manager/currency/naira-1000.jpg" },
  { id: "N500", value: "500", bottom: "N200", color: "#ddd7a8", accent: "#7489b9", portrait: "#526aa2", imagePath: "/assets/restaurant-manager/currency/naira-500.jpg" },
  { id: "N200", value: "200", bottom: "N200", color: "#c1ddd9", accent: "#8c686c", portrait: "#6f6862", imagePath: "/assets/restaurant-manager/currency/naira-200.jpg" },
  { id: "N100", value: "100", bottom: "N100", color: "#d0a2c5", accent: "#7f4374", portrait: "#766050", imagePath: "/assets/restaurant-manager/currency/naira-100.jpg" },
  { id: "N50", value: "50", bottom: "N50", color: "#bdd2a3", accent: "#4f7138", portrait: "#66705e", imagePath: "/assets/restaurant-manager/currency/naira-50.jpg" },
  { id: "N20", value: "20", bottom: "N5", color: "#b6cf8f", accent: "#536f2f", portrait: "#66705e", imagePath: "/assets/restaurant-manager/currency/naira-20.jpg" },
  { id: "N10", value: "10", bottom: "N6", color: "#d5a975", accent: "#8a5a2a", portrait: "#85403e", imagePath: "/assets/restaurant-manager/currency/naira-10.jpg" },
  { id: "N5", value: "5", bottom: "N5", color: "#efc7bf", accent: "#a86a72", portrait: "#77615f", imagePath: "/assets/restaurant-manager/currency/naira-5.jpg" },
];
const CASH_DRAWER_NOTE_STACK_COUNT = 5;
const CASH_DRAWER_COINS = [
  { id: "N2", label: "N2", color: "#9a5138", metal: "#bd714c", imagePath: "/assets/restaurant-manager/currency/coin-n2.jpg" },
  { id: "N1", label: "N1", color: "#c7b37a", metal: "#d8c58a", imagePath: "/assets/restaurant-manager/currency/coin-n1.jpg" },
  { id: "50k", label: "50k", color: "#77736d", metal: "#9c9a94", imagePath: "/assets/restaurant-manager/currency/coin-50k.jpg" },
  { id: "25k", label: "25k", color: "#9b6e37", metal: "#d2a85a", imagePath: "/assets/restaurant-manager/currency/coin-25k.jpg" },
  { id: "10k", label: "10k", color: "#9f6c31", metal: "#cf9447", imagePath: "/assets/restaurant-manager/currency/coin-extra.avif" },
  { id: "5k", label: "5k", color: "#8d8b80", metal: "#b3b1a5", imagePath: "/assets/restaurant-manager/currency/coin-5k.jpg" },
  { id: "1k", label: "1k", color: "#8b5b2c", metal: "#bd8040", imagePath: "/assets/restaurant-manager/currency/coin-1k.jpg" },
];
const CASH_DRAWER_COIN_STACK_COUNT = 4;
const CHECKOUT_BODY_COLOR = "#c8a77f";
const CHECKOUT_BODY_DARK = "#9b7650";
const CHECKOUT_BODY_LIGHT = "#d7bc98";
const CHECKOUT_DEEP_BROWN = "#4a2817";
const CHECKOUT_DEEP_BROWN_LIGHT = "#5f3822";
const CUSTOMER_PLACEMENT_STORAGE_KEY = "proTutorsHub.restaurantManagerCustomerPlacements.v9";
const CUSTOMER_PREVIEW_COUNT = 4;
const CUSTOMER_COUNTER_MASK_DEFAULT = 220;
const CUSTOMER_COORDINATE_DESIGN_WIDTH = 3840;
const CUSTOMER_COORDINATE_DESIGN_HEIGHT = 1080;
const GAME_STAGE_DESIGN_WIDTH = 2304;
const GAME_STAGE_DESIGN_HEIGHT = 1296;
const CUSTOMER_SHOWCASE_DEFAULTS = [
  { position: [900, 340, 0, CUSTOMER_COUNTER_MASK_DEFAULT] },
  { position: [1260, 334, -8, CUSTOMER_COUNTER_MASK_DEFAULT] },
  { position: [1620, 340, -4, CUSTOMER_COUNTER_MASK_DEFAULT] },
  { position: [1980, 334, 0, CUSTOMER_COUNTER_MASK_DEFAULT] },
  { position: [2340, 340, 2, CUSTOMER_COUNTER_MASK_DEFAULT] },
  { position: [2700, 334, 4, CUSTOMER_COUNTER_MASK_DEFAULT] },
];
const RESTAURANT_SCENE_CUSTOMERS = [
  {
    id: "customer-scene-1",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/young-female-full.png",
    position: [-2.18, 2.22, -18.86],
    scale: [0.58, 0.64, 1],
    visibleFraction: 0.46,
  },
  {
    id: "customer-scene-2",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/young-male-full.png",
    position: [-0.78, 2.26, -18.84],
    scale: [0.6, 0.66, 1],
    visibleFraction: 0.46,
  },
  {
    id: "customer-scene-3",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/middle-aged-female-full.png",
    position: [0.62, 2.22, -18.86],
    scale: [0.6, 0.64, 1],
    visibleFraction: 0.46,
  },
  {
    id: "customer-scene-4",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/old-male-full.png",
    position: [2.0, 2.25, -18.84],
    scale: [0.6, 0.66, 1],
    visibleFraction: 0.46,
  },
];

const FOOD_CLICK_ZONES = {
  "croissant-tray": { left: 1.2, top: 52.0, width: 16.2, height: 15.2, columns: 5, rows: 2 },
  "hotdog-tray": { left: 18.0, top: 51.8, width: 11.2, height: 13.8, columns: 5, rows: 2 },
  "hamburger-tray": { left: 29.1, top: 50.5, width: 8.7, height: 14.7, columns: 2, rows: 5 },
  "cupcake-tray": { left: 39.1, top: 49.2, width: 8.8, height: 15.5, columns: 2, rows: 5 },
  "doughnut-tray": { left: 48.1, top: 49.5, width: 8.5, height: 15.6, columns: 2, rows: 5 },
  "fruit-cup-tray": { left: 57.0, top: 47.5, width: 8.8, height: 16.2, columns: 2, rows: 5 },
  "cheese-tray": { left: 66.2, top: 47.2, width: 9.8, height: 14.2, columns: 2, rows: 5 },
  "pizza-tray": { left: 0.8, top: 68.5, width: 31.0, height: 15.8, columns: 5, rows: 2 },
  "meatpie-tray": { left: 35.8, top: 66.2, width: 18.0, height: 13.8, columns: 5, rows: 2 },
  "fries-tray": { left: 59.0, top: 63.8, width: 18.8, height: 13.8, columns: 5, rows: 2 },
};
const CUSTOMER_GROUPS = [
  {
    key: "old-male",
    label: "Old male",
    age: "old",
    gender: "male",
    base: { glasses: true, moustache: true, hairStyle: "elder", jacket: true },
    variants: [
      ["Chief Ade", "#6f432d", "#efe7dc", "#25465f", "#f5f1e8", "#7c2d12"],
      ["Mr Okoro", "#4f2f22", "#d9d1c8", "#5b4632", "#efe3c7", "#14532d"],
      ["Papa Musa", "#8c5638", "#f5f0e7", "#2f3b52", "#fff7ed", "#991b1b"],
      ["Elder Dan", "#5d3928", "#e8e1d8", "#6b5b35", "#f6ecd4", "#1e3a8a"],
      ["Baba Tunde", "#7d4a30", "#f1eadf", "#394150", "#fef3c7", "#7f1d1d"],
    ],
  },
  {
    key: "young-male",
    label: "Young male",
    age: "young",
    gender: "male",
    base: { hairStyle: "short" },
    variants: [
      ["Jayden", "#a4613b", "#1a100b", "#22a447", "#dcfce7", "#0f766e"],
      ["Kelechi", "#7b442d", "#130d0a", "#2563eb", "#dbeafe", "#f59e0b"],
      ["Femi", "#c27a4d", "#2a170e", "#ef4444", "#fee2e2", "#111827"],
      ["Seyi", "#8f5638", "#19100c", "#7c3aed", "#ede9fe", "#0284c7"],
      ["Malik", "#5c3627", "#090706", "#f97316", "#ffedd5", "#16a34a"],
    ],
  },
  {
    key: "old-female",
    label: "Old female",
    age: "old",
    gender: "female",
    base: { glasses: true, hairStyle: "wrap", earrings: true },
    variants: [
      ["Mama Bisi", "#70452f", "#f6eee8", "#8b5cf6", "#f3e8ff", "#dc2626"],
      ["Grandma Ife", "#98603e", "#fff7ed", "#0f766e", "#ccfbf1", "#ca8a04"],
      ["Aunty Grace", "#5f3928", "#eee7dc", "#be185d", "#fce7f3", "#2563eb"],
      ["Mama Zainab", "#875334", "#f7efe4", "#7c2d12", "#ffedd5", "#16a34a"],
      ["Nana Ruth", "#6b422e", "#ece5d9", "#334155", "#e2e8f0", "#b45309"],
    ],
  },
  {
    key: "young-female",
    label: "Young female",
    age: "young",
    gender: "female",
    base: { hairStyle: "braids", earrings: true },
    variants: [
      ["Amara", "#8c5033", "#1c120d", "#ec4899", "#fce7f3", "#7c3aed"],
      ["Tomi", "#b86f45", "#29170e", "#facc15", "#fef9c3", "#0891b2"],
      ["Aisha", "#6c3f2a", "#100a07", "#22c55e", "#dcfce7", "#e11d48"],
      ["Ada", "#c47a4d", "#3a2114", "#38bdf8", "#e0f2fe", "#f97316"],
      ["Nora", "#7a472e", "#1b100b", "#a855f7", "#f3e8ff", "#15803d"],
    ],
  },
  {
    key: "middle-aged-men",
    label: "Middle aged man",
    age: "adult",
    gender: "male",
    base: { hairStyle: "fade", moustache: true, jacket: true },
    variants: [
      ["Mr Bello", "#8a5235", "#17110d", "#1f2937", "#f8fafc", "#b91c1c"],
      ["Uncle Joe", "#5f3828", "#080605", "#0f766e", "#ccfbf1", "#f59e0b"],
      ["Mr Emeka", "#b16942", "#2a160e", "#374151", "#e5e7eb", "#2563eb"],
      ["Sir David", "#76462f", "#15100c", "#581c87", "#f3e8ff", "#dc2626"],
      ["Mr Sola", "#9d6040", "#20120b", "#164e63", "#cffafe", "#16a34a"],
    ],
  },
  {
    key: "aged-women",
    label: "Aged woman",
    age: "aged",
    gender: "female",
    base: { glasses: true, hairStyle: "silver-bun", earrings: true },
    variants: [
      ["Madam Rose", "#7a4b33", "#f8f1e8", "#92400e", "#fffbeb", "#be123c"],
      ["Mrs Eno", "#5b3828", "#eee8df", "#1e40af", "#dbeafe", "#ca8a04"],
      ["Mama Lola", "#95603f", "#fff7ed", "#166534", "#dcfce7", "#7c3aed"],
      ["Aunty Mary", "#6c412d", "#e8e0d4", "#9d174d", "#fce7f3", "#0f766e"],
      ["Nneka", "#845336", "#f5efe6", "#475569", "#e2e8f0", "#dc2626"],
    ],
  },
];
const RESTAURANT_CUSTOMERS = CUSTOMER_GROUPS.flatMap((group) =>
  group.variants.map(([name, skin, hair, shirt, collar, accent], index) => ({
    id: `${group.key}-${index + 1}`,
    name,
    label: group.label,
    age: group.age,
    gender: group.gender,
    skin,
    blush: skin,
    hair,
    shirt,
    collar,
    accent,
    smile: index % 3 === 0 ? "happy" : index % 3 === 1 ? "calm" : "patient",
    ...group.base,
  }))
);
const CUSTOMER_SAMPLE_ASSETS = [
  {
    id: "old-male-sample",
    name: "Old male sample",
    label: "Old male",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/old-male-full.png",
  },
  {
    id: "old-female-sample",
    name: "Old female sample",
    label: "Old female",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/old-female-full.png",
  },
  {
    id: "middle-aged-male-sample",
    name: "Middle aged male sample",
    label: "Middle aged male",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/middle-aged-male-full.png",
  },
  {
    id: "middle-aged-female-sample",
    name: "Middle aged female sample",
    label: "Middle aged female",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/middle-aged-female-full.png",
  },
  {
    id: "young-male-sample",
    name: "Young male sample",
    label: "Young male",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/young-male-full.png",
  },
  {
    id: "young-female-sample",
    name: "Young female sample",
    label: "Young female",
    imagePath: "/assets/restaurant-manager/customers/full-body-samples/young-female-full.png",
  },
];

function getCustomerForQuestion(questionIndex = 0) {
  return RESTAURANT_CUSTOMERS[Math.abs(questionIndex) % RESTAURANT_CUSTOMERS.length];
}

function getCustomerLayer(zValue = 0) {
  const depth = Number.isFinite(Number(zValue)) ? Number(zValue) : 0;
  return 20 + Math.round(depth);
}

function normalizeCustomerPosition(position, fallback = [0, 0, 0, CUSTOMER_COUNTER_MASK_DEFAULT]) {
  const values = Array.isArray(position) ? position : [];
  return [
    Number.isFinite(Number(values[0])) ? Number(values[0]) : fallback[0],
    Number.isFinite(Number(values[1])) ? Number(values[1]) : fallback[1],
    Number.isFinite(Number(values[2])) ? Number(values[2]) : fallback[2],
    Number.isFinite(Number(values[3])) ? Number(values[3]) : fallback[3],
  ];
}

function clampCustomerMask(value) {
  const nextValue = Number.isFinite(Number(value)) ? Number(value) : CUSTOMER_COUNTER_MASK_DEFAULT;
  return Math.max(0, Math.min(320, nextValue));
}

function getResponsiveCustomerStyle(position) {
  const xPercent = roundValue((position[0] / CUSTOMER_COORDINATE_DESIGN_WIDTH) * 100);
  const yPercent = roundValue((position[1] / CUSTOMER_COORDINATE_DESIGN_HEIGHT) * 100);
  return {
    left: `clamp(0px, calc(${xPercent}vw - (var(--customer-width) * 0.5)), calc(100vw - var(--customer-width)))`,
    top: `clamp(var(--customer-min-top), ${yPercent}vh, calc(100vh - var(--customer-height) - var(--customer-bottom-clearance)))`,
    zIndex: getCustomerLayer(position[2]),
    "--customer-counter-mask": `${clampCustomerMask(position[3])}px`,
  };
}

function isPhoneViewport() {
  if (typeof window === "undefined") return false;
  return Math.min(window.innerWidth, window.innerHeight) < 768;
}

function clampMoneyMachineScreenTilt(value) {
  const nextValue = Number.isFinite(value) ? value : MONEY_MACHINE_SCREEN_TILT_DEFAULT;
  return roundValue(Math.max(MONEY_MACHINE_SCREEN_TILT_MIN, Math.min(MONEY_MACHINE_SCREEN_TILT_MAX, nextValue)));
}

function clonePlacementConfig() {
  return {
    restaurantTransform: {
      ...RESTAURANT_MANAGER_CONFIG.restaurantTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.restaurantTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.restaurantTransform.rotation],
    },
    barServiceCounterAnchor: {
      ...RESTAURANT_MANAGER_CONFIG.barServiceCounterAnchor,
      position: [...RESTAURANT_MANAGER_CONFIG.barServiceCounterAnchor.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.barServiceCounterAnchor.rotation],
      size: [...RESTAURANT_MANAGER_CONFIG.barServiceCounterAnchor.size],
    },
    foodBasketTransform: {
      ...RESTAURANT_MANAGER_CONFIG.foodBasketTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.foodBasketTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.foodBasketTransform.rotation],
    },
    tableOverlayTransform: {
      ...RESTAURANT_MANAGER_CONFIG.tableOverlayTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.tableOverlayTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.tableOverlayTransform.rotation],
      size: [...RESTAURANT_MANAGER_CONFIG.tableOverlayTransform.size],
    },
    checkoutPropsTransform: {
      ...RESTAURANT_MANAGER_CONFIG.checkoutPropsTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.checkoutPropsTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.checkoutPropsTransform.rotation],
    },
    cashDrawerTransform: {
      ...RESTAURANT_MANAGER_CONFIG.cashDrawerTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.cashDrawerTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.cashDrawerTransform.rotation],
    },
    receiptPrinterTransform: {
      ...RESTAURANT_MANAGER_CONFIG.receiptPrinterTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.receiptPrinterTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.receiptPrinterTransform.rotation],
    },
    whitePlateStackTransform: {
      ...RESTAURANT_MANAGER_CONFIG.whitePlateStackTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.whitePlateStackTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.whitePlateStackTransform.rotation],
    },
    servingTrayTransform: {
      ...RESTAURANT_MANAGER_CONFIG.servingTrayTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.servingTrayTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.servingTrayTransform.rotation],
    },
    plateStackTransform: {
      ...RESTAURANT_MANAGER_CONFIG.plateStackTransform,
      position: [...RESTAURANT_MANAGER_CONFIG.plateStackTransform.position],
      rotation: [...RESTAURANT_MANAGER_CONFIG.plateStackTransform.rotation],
      packTransforms: RESTAURANT_MANAGER_CONFIG.plateStackTransform.packTransforms?.map((pack) => ({
        ...pack,
        position: [...pack.position],
        rotation: [...pack.rotation],
      })),
      colors: { ...RESTAURANT_MANAGER_CONFIG.plateStackTransform.colors },
    },
    foodDisplayAssets: RESTAURANT_MANAGER_CONFIG.foodDisplayAssets.map((asset) => ({
      ...asset,
      position: [...asset.position],
      rotation: [...asset.rotation],
    })),
  };
}

function loadSavedPlacement() {
  const base = clonePlacementConfig();
  try {
    const saved = JSON.parse(localStorage.getItem(PLACEMENT_STORAGE_KEY) || "null");
    if (!saved) return base;
    const canUseSavedTrayLayout = saved.foodTrayLayoutVersion === RESTAURANT_MANAGER_CONFIG.foodTrayLayoutVersion;
    return {
      restaurantTransform: base.restaurantTransform,
      barServiceCounterAnchor: base.barServiceCounterAnchor,
      foodBasketTransform: { ...base.foodBasketTransform, ...saved.foodBasketTransform },
      tableOverlayTransform: saved.tableOverlayTransform
        ? {
            ...base.tableOverlayTransform,
            ...saved.tableOverlayTransform,
            position: saved.tableOverlayTransform.position || base.tableOverlayTransform.position,
            rotation: saved.tableOverlayTransform.rotation || base.tableOverlayTransform.rotation,
            size: saved.tableOverlayTransform.size || base.tableOverlayTransform.size,
          }
        : base.tableOverlayTransform,
      checkoutPropsTransform: saved.checkoutPropsTransform
        ? {
            ...base.checkoutPropsTransform,
            ...saved.checkoutPropsTransform,
            position: saved.checkoutPropsTransform.position || base.checkoutPropsTransform.position,
            rotation: saved.checkoutPropsTransform.rotation || base.checkoutPropsTransform.rotation,
            displayTilt: clampMoneyMachineScreenTilt(saved.checkoutPropsTransform.displayTilt ?? base.checkoutPropsTransform.displayTilt),
          }
        : base.checkoutPropsTransform,
      cashDrawerTransform: saved.cashDrawerTransform && canUseSavedTrayLayout
        ? {
            ...base.cashDrawerTransform,
            ...saved.cashDrawerTransform,
            position: saved.cashDrawerTransform.position || base.cashDrawerTransform.position,
            rotation: saved.cashDrawerTransform.rotation || base.cashDrawerTransform.rotation,
          }
        : base.cashDrawerTransform,
      receiptPrinterTransform: saved.receiptPrinterTransform && canUseSavedTrayLayout
        ? {
            ...base.receiptPrinterTransform,
            ...saved.receiptPrinterTransform,
            position: saved.receiptPrinterTransform.position || base.receiptPrinterTransform.position,
            rotation: saved.receiptPrinterTransform.rotation || base.receiptPrinterTransform.rotation,
          }
        : base.receiptPrinterTransform,
      whitePlateStackTransform: saved.whitePlateStackTransform && canUseSavedTrayLayout
        ? {
            ...base.whitePlateStackTransform,
            ...saved.whitePlateStackTransform,
            position: saved.whitePlateStackTransform.position || base.whitePlateStackTransform.position,
            rotation: saved.whitePlateStackTransform.rotation || base.whitePlateStackTransform.rotation,
          }
        : base.whitePlateStackTransform,
      servingTrayTransform: saved.servingTrayTransform && canUseSavedTrayLayout
        ? {
            ...base.servingTrayTransform,
            ...saved.servingTrayTransform,
            position: saved.servingTrayTransform.position || base.servingTrayTransform.position,
            rotation: saved.servingTrayTransform.rotation || base.servingTrayTransform.rotation,
          }
        : base.servingTrayTransform,
      plateStackTransform: saved.plateStackTransform && canUseSavedTrayLayout
        ? {
            ...base.plateStackTransform,
            ...saved.plateStackTransform,
            position: saved.plateStackTransform.position || base.plateStackTransform.position,
            rotation: saved.plateStackTransform.rotation || base.plateStackTransform.rotation,
            packTransforms: saved.plateStackTransform.packTransforms || base.plateStackTransform.packTransforms,
            colors: { ...base.plateStackTransform.colors, ...saved.plateStackTransform.colors },
          }
        : base.plateStackTransform,
      foodDisplayAssets: base.foodDisplayAssets.map((asset) => {
        const savedAsset = saved.foodDisplayAssets?.find((item) => item.id === asset.id);
        return savedAsset
          ? {
              ...asset,
              position: savedAsset.position || asset.position,
              rotation: savedAsset.rotation || asset.rotation,
              scale: savedAsset.scale ?? asset.scale,
              shelfStock: asset.shelfStock?.map((stock) => {
                const savedStock = savedAsset.shelfStock?.find((item) => item.id === stock.id);
                return savedStock && canUseSavedTrayLayout
                  ? {
                      ...stock,
                      targetWidth: savedStock.targetWidth ?? stock.targetWidth,
                      count: savedStock.count ?? stock.count,
                      rows: savedStock.rows ?? stock.rows,
                      localPosition: savedStock.localPosition || stock.localPosition,
                      localRotation: savedStock.localRotation || stock.localRotation,
                      priceTagPosition: savedStock.priceTagPosition || stock.priceTagPosition,
                      priceTagRotation: savedStock.priceTagRotation || stock.priceTagRotation,
                      priceTagScale: savedStock.priceTagScale ?? stock.priceTagScale,
                      rowWidth: savedStock.rowWidth ?? stock.rowWidth,
                      trayWidth: savedStock.trayWidth ?? stock.trayWidth,
                      trayDepth: savedStock.trayDepth ?? stock.trayDepth,
                    }
                  : stock;
              }),
            }
          : asset;
      }),
    };
  } catch {
    return base;
  }
}

function loadLockedCameraView() {
  return {
    position: [...RESTAURANT_MANAGER_CONFIG.camera.position],
    target: [...RESTAURANT_MANAGER_CONFIG.camera.target],
  };
}

function loadPlacementPanelPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLACEMENT_PANEL_STORAGE_KEY) || "null");
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      return saved;
    }
  } catch {
    // Ignore malformed localStorage and use the visible default.
  }
  return { left: 16, top: 112 };
}

function updateVector(values, index, nextValue) {
  const next = [...values];
  next[index] = Number(nextValue);
  return next;
}

function roundValue(value) {
  return Number(Number(value).toFixed(3));
}

function formatNairaPrice(price) {
  return `N${Number(price || 0).toLocaleString("en-NG")}`;
}

function makeTrayPriceTexture(label, price) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fff6df");
  gradient.addColorStop(1, "#e8c792");
  context.fillStyle = gradient;
  roundRect(context, 24, 24, 464, 208, 34);
  context.fill();
  context.strokeStyle = "rgba(77, 48, 22, 0.38)";
  context.lineWidth = 8;
  context.stroke();

  context.fillStyle = "#2b1a10";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 48px Arial";
  context.fillText(label, 256, 92, 410);
  context.fillStyle = "#0f0a05";
  context.font = "900 54px Arial";
  context.fillText(formatNairaPrice(price), 256, 154, 410);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeMoneyMachineScreenTexture(amount = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#244d78");
  gradient.addColorStop(0.54, "#132b46");
  gradient.addColorStop(1, "#071525");
  context.fillStyle = gradient;
  roundRect(context, 20, 20, 600, 320, 22);
  context.fill();

  context.strokeStyle = "rgba(166, 210, 255, 0.28)";
  context.lineWidth = 8;
  roundRect(context, 34, 34, 572, 292, 16);
  context.stroke();

  context.fillStyle = "#68b7ff";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.font = "800 42px Arial";
  context.fillText("TOTAL", 72, 86);

  context.fillStyle = "#f7fbff";
  context.font = "900 88px Arial";
  context.fillText(`N ${Number(amount || 0).toLocaleString("en-NG")}`, 72, 202);

  context.fillStyle = "rgba(255,255,255,0.26)";
  context.fillRect(76, 260, 210, 8);
  context.fillStyle = "rgba(255,255,255,0.14)";
  context.fillRect(76, 282, 350, 7);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeMoneyMachineKeyTexture(label, color = CHECKOUT_DEEP_BROWN, textColor = "#f8fafc") {
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 180;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = color;
  roundRect(context, 12, 12, 216, 156, 26);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.22)";
  context.lineWidth = 7;
  context.stroke();
  context.fillStyle = textColor;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = label.length > 1 ? "900 70px Arial" : "900 96px Arial";
  context.fillText(label, 120, 92, 188);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeReceiptPaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#fffdf2";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#222222";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 28px Arial";
  context.fillText("PRO TUTORS HUB", 160, 52, 240);
  context.font = "700 16px Arial";
  context.fillText("RESTAURANT RECEIPT", 160, 86, 230);
  context.strokeStyle = "rgba(30,30,30,0.4)";
  context.setLineDash([10, 8]);
  context.beginPath();
  context.moveTo(40, 124);
  context.lineTo(280, 124);
  context.stroke();
  context.setLineDash([]);

  const rows = ["Burger    N600", "Fries     N400", "Pizza   N1,200", "Total   N2,200"];
  context.textAlign = "left";
  context.font = "800 22px Arial";
  rows.forEach((row, index) => {
    context.fillText(row, 52, 180 + index * 54, 224);
  });

  context.fillStyle = "rgba(30,30,30,0.16)";
  for (let index = 0; index < 7; index += 1) {
    context.fillRect(52, 420 + index * 24, 198 - (index % 3) * 32, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeCashNoteTexture(note) {
  const canvas = document.createElement("canvas");
  canvas.width = 280;
  canvas.height = 420;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f8f1dc");
  gradient.addColorStop(0.42, note.color);
  gradient.addColorStop(1, note.accent);
  context.fillStyle = gradient;
  roundRect(context, 14, 14, 252, 392, 18);
  context.fill();
  context.strokeStyle = "rgba(35, 26, 20, 0.58)";
  context.lineWidth = 7;
  context.stroke();

  context.fillStyle = "rgba(255,255,255,0.34)";
  roundRect(context, 52, 96, 176, 148, 18);
  context.fill();
  context.strokeStyle = "rgba(40,40,40,0.18)";
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = note.portrait;
  context.beginPath();
  context.ellipse(140, 176, 44, 62, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.32)";
  context.beginPath();
  context.ellipse(126, 152, 18, 24, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(35,25,20,0.28)";
  context.fillRect(104, 220, 72, 18);

  context.fillStyle = "rgba(255,255,255,0.28)";
  for (let index = 0; index < 4; index += 1) {
    context.beginPath();
    context.arc(68 + index * 48, 292, 12, 0, Math.PI * 2);
    context.fill();
  }

  context.strokeStyle = "rgba(35, 26, 20, 0.28)";
  context.lineWidth = 2;
  for (let index = 0; index < 5; index += 1) {
    context.beginPath();
    context.moveTo(46 + index * 48, 78);
    context.lineTo(72 + index * 48, 258);
    context.stroke();
  }

  context.fillStyle = "#1c130e";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 38px Arial";
  context.fillText(`N${note.value}`, 140, 52, 210);
  context.font = "800 16px Arial";
  context.fillText("CENTRAL BANK OF NIGERIA", 140, 82, 230);
  context.font = "900 34px Arial";
  context.fillText(note.bottom, 140, 352, 210);

  context.fillStyle = note.accent;
  context.font = "900 46px Arial";
  context.fillText(note.value, 140, 286, 180);

  context.fillStyle = "rgba(12, 12, 12, 0.46)";
  context.font = "700 13px monospace";
  context.fillText(`CBN${note.value}23840`, 140, 382, 180);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeCashCoinTexture(coin) {
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 240;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff7dc";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = coin.label.length > 2 ? "900 52px Arial" : "900 64px Arial";
  context.fillText(coin.label, 120, 122, 146);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function RestaurantCustomerSvg({ customer }) {
  const isOlder = customer.age === "old" || customer.age === "aged";
  const skinShadow = isOlder ? "rgba(55, 29, 20, 0.32)" : "rgba(55, 29, 20, 0.22)";
  const cheekOpacity = customer.age === "young" ? 0.22 : 0.16;
  const mouthPath =
    customer.smile === "happy"
      ? "M96 151 C108 164 132 164 144 151"
      : customer.smile === "patient"
        ? "M101 155 C112 162 128 162 139 155"
        : "M101 157 C113 161 127 161 139 157";
  const hasLongHair = ["braids", "wrap", "silver-bun"].includes(customer.hairStyle);
  const faceShape =
    customer.age === "young"
      ? "M72 104 C72 67 92 47 120 47 C148 47 168 67 168 104 L166 132 C163 168 145 188 120 190 C95 188 77 168 74 132 Z"
      : "M70 105 C70 62 93 41 120 41 C147 41 170 62 170 105 L167 134 C163 173 145 195 120 197 C95 195 77 173 73 134 Z";
  const hairFront =
    customer.hairStyle === "fade"
      ? "M65 99 C73 57 163 54 176 101 C146 84 96 84 65 99 Z"
      : customer.hairStyle === "short"
        ? "M63 101 C73 51 162 47 180 101 C153 82 130 84 113 72 C101 88 79 85 63 101 Z"
        : customer.hairStyle === "elder"
          ? "M66 98 C81 57 108 49 122 58 C139 45 167 63 176 101 C148 87 92 87 66 98 Z"
          : customer.hairStyle === "wrap"
            ? "M55 101 C68 50 96 31 121 33 C154 34 177 60 186 101 C154 78 86 78 55 101 Z"
            : customer.hairStyle === "silver-bun"
              ? "M63 100 C76 55 100 42 121 47 C143 39 169 61 177 101 C148 86 92 86 63 100 Z"
              : customer.hairStyle === "braids"
                ? "M60 104 C70 50 171 50 180 104 C151 82 91 82 60 104 Z"
                : "M62 108 C68 55 176 54 180 109 C148 88 91 88 62 108 Z";

  return (
    <svg className="rm-customer-svg" viewBox="0 0 240 318" role="img" aria-label={`${customer.label} ${customer.name}`}>
      <defs>
        <linearGradient id={`${customer.id}-shirt`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={customer.shirt} stopOpacity="0.98" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={`${customer.id}-face`} cx="0.35" cy="0.24" r="0.78">
          <stop offset="0" stopColor="#fff1d6" stopOpacity="0.34" />
          <stop offset="0.35" stopColor={customer.skin} />
          <stop offset="1" stopColor={customer.skin} stopOpacity="0.92" />
        </radialGradient>
        <linearGradient id={`${customer.id}-neck`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={customer.skin} />
          <stop offset="1" stopColor="#4a2418" stopOpacity="0.32" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="292" rx="78" ry="14" fill="rgba(0,0,0,0.2)" />
      {customer.hairStyle === "silver-bun" ? <circle cx="120" cy="47" r="23" fill={customer.hair} /> : null}
      {customer.hairStyle === "wrap" ? <path d="M48 105 C50 52 83 26 121 26 C160 26 191 54 193 105 L180 121 C145 97 94 97 60 121 Z" fill={customer.hair} /> : null}
      {hasLongHair ? <path d="M58 105 C58 53 182 53 182 105 L178 210 C148 229 92 229 62 210 Z" fill={customer.hair} /> : null}
      {customer.hairStyle === "braids" ? (
        <>
          <path d="M65 117 C51 158 61 216 86 249" fill="none" stroke={customer.hair} strokeWidth="17" strokeLinecap="round" />
          <path d="M175 117 C189 158 179 216 154 249" fill="none" stroke={customer.hair} strokeWidth="17" strokeLinecap="round" />
          <path d="M62 149 C74 153 78 164 70 176 M68 190 C80 196 83 209 76 220" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
          <path d="M178 149 C166 153 162 164 170 176 M172 190 C160 196 157 209 164 220" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : null}
      {customer.hairStyle === "bob" ? <path d="M59 111 C59 48 181 48 181 111 L174 202 C145 221 95 221 66 202 Z" fill={customer.hair} /> : null}

      <path d="M48 280 C52 228 77 197 109 188 L131 188 C163 197 188 228 192 280 Z" fill={`url(#${customer.id}-shirt)`} />
      {customer.jacket ? (
        <>
          <path d="M50 280 C57 228 82 199 108 190 L120 236 L76 280 Z" fill="#1f2937" opacity="0.8" />
          <path d="M190 280 C183 228 158 199 132 190 L120 236 L164 280 Z" fill="#1f2937" opacity="0.8" />
        </>
      ) : null}
      <path d="M91 176 C99 192 141 192 149 176 L147 213 C140 226 100 226 93 213 Z" fill={`url(#${customer.id}-neck)`} />
      <path d="M80 202 L120 236 L160 202 L150 188 L120 216 L90 188 Z" fill={customer.collar} opacity="0.96" />
      {customer.jacket ? <path d="M111 217 L129 217 L136 274 L120 286 L104 274 Z" fill={customer.accent} /> : null}
      <path d="M65 270 C91 255 149 255 175 270" fill="none" stroke="rgba(255,255,255,0.23)" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="64" cy="126" rx="13" ry="18" fill={customer.skin} />
      <ellipse cx="176" cy="126" rx="13" ry="18" fill={customer.skin} />
      <path d="M63 126 C69 123 70 132 65 136" fill="none" stroke={skinShadow} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M177 126 C171 123 170 132 175 136" fill="none" stroke={skinShadow} strokeWidth="2.5" strokeLinecap="round" />
      <path d={faceShape} fill={`url(#${customer.id}-face)`} />
      <path d={hairFront} fill={customer.hair} />
      {customer.hairStyle === "wrap" ? <path d="M59 104 C77 78 164 78 181 104 L174 117 C145 96 96 96 66 117 Z" fill={customer.accent} opacity="0.88" /> : null}
      {isOlder ? (
        <>
          <path d="M76 101 C88 76 112 65 120 68 C132 60 160 78 168 101 C143 88 96 88 76 101 Z" fill="rgba(255,255,255,0.14)" />
          <path d="M84 147 C93 143 103 144 110 149" fill="none" stroke={skinShadow} strokeWidth="2" strokeLinecap="round" />
          <path d="M130 149 C138 144 148 143 156 147" fill="none" stroke={skinShadow} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : null}

      <path d="M85 115 C94 109 104 109 112 115" fill="none" stroke={customer.hair} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
      <path d="M128 115 C136 109 146 109 155 115" fill="none" stroke={customer.hair} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
      <path d="M88 126 C96 121 105 121 112 126 C105 131 96 131 88 126 Z" fill="#fff8ee" opacity="0.92" />
      <path d="M128 126 C136 121 145 121 153 126 C145 131 136 131 128 126 Z" fill="#fff8ee" opacity="0.92" />
      <circle cx="101" cy="126" r="4.8" fill="#15100d" />
      <circle cx="140" cy="126" r="4.8" fill="#15100d" />
      <circle cx="103" cy="124" r="1.4" fill="#ffffff" opacity="0.9" />
      <circle cx="142" cy="124" r="1.4" fill="#ffffff" opacity="0.9" />
      <circle cx="91" cy="146" r="9" fill={customer.accent} opacity={cheekOpacity} />
      <circle cx="149" cy="146" r="9" fill={customer.accent} opacity={cheekOpacity} />
      <path d="M120 125 C116 137 112 144 114 149 C117 153 124 153 128 149" fill="none" stroke={skinShadow} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={mouthPath} fill="none" stroke="#3d1f16" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M80 156 C84 183 99 197 120 198 C141 197 156 183 160 156" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="2" strokeLinecap="round" />

      {customer.moustache ? (
        <path d="M100 148 C110 140 118 146 120 152 C122 146 130 140 140 148 C133 156 126 157 120 154 C114 157 107 156 100 148 Z" fill={customer.hair} />
      ) : null}
      {customer.glasses ? (
        <g fill="none" stroke="#2a211b" strokeWidth="4" strokeLinecap="round">
          <rect x="81" y="113" width="35" height="25" rx="10" />
          <rect x="124" y="113" width="35" height="25" rx="10" />
          <path d="M116 125 H124" />
          <path d="M81 124 L70 120 M159 124 L170 120" />
        </g>
      ) : null}
      {customer.earrings ? (
        <>
          <circle cx="61" cy="144" r="4" fill={customer.accent} />
          <circle cx="179" cy="144" r="4" fill={customer.accent} />
        </>
      ) : null}

      {isOlder ? (
        <g fill="none" stroke={skinShadow} strokeWidth="1.7" strokeLinecap="round" opacity="0.8">
          <path d="M91 134 C97 137 103 137 109 134" />
          <path d="M131 134 C137 137 143 137 149 134" />
          <path d="M99 169 C112 176 128 176 141 169" />
        </g>
      ) : null}
    </svg>
  );
}

function loadCustomerPlacements() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_PLACEMENT_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return CUSTOMER_SHOWCASE_DEFAULTS;
    return CUSTOMER_SHOWCASE_DEFAULTS.map((fallback, index) => {
      const item = saved[`customer-${index + 1}`];
      if (item?.position?.length >= 3) {
        return { position: normalizeCustomerPosition(item.position, fallback.position) };
      }
      if (item && Number.isFinite(item.left) && Number.isFinite(item.top)) {
        return { position: [item.left, item.top, Number.isFinite(item.z) ? item.z : 0, fallback.position[3]] };
      }
      return fallback;
    });
  } catch {
    return CUSTOMER_SHOWCASE_DEFAULTS;
  }
}

function CustomerShowcase() {
  const previewCustomers = CUSTOMER_SAMPLE_ASSETS.slice(0, CUSTOMER_PREVIEW_COUNT);
  const [placements, setPlacements] = useState(loadCustomerPlacements);
  const [customerEditing, setCustomerEditing] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const dragRef = useRef({ index: -1, offsetX: 0, offsetY: 0 });
  const coordinateText = useMemo(
    () =>
      JSON.stringify(
        Object.fromEntries(
          previewCustomers.map((customer, index) => [
            `customer-${index + 1}`,
            {
              id: customer.id,
              name: customer.name,
              group: customer.label,
              position: normalizeCustomerPosition(
                placements[index]?.position,
                CUSTOMER_SHOWCASE_DEFAULTS[index].position
              ).map((value) => roundValue(value)),
            },
          ])
        ),
        null,
        2
      ),
    [placements, previewCustomers]
  );
  const getCustomerCoordinate = (customer, index) => ({
    key: `customer-${index + 1}`,
    id: customer.id,
    name: customer.name,
    group: customer.label,
    position: normalizeCustomerPosition(
      placements[index]?.position,
      CUSTOMER_SHOWCASE_DEFAULTS[index].position
    ).map((value) => roundValue(value)),
  });

  const updatePlacement = (index, nextPlacement) => {
    setPlacements((current) => {
      const next = current.map((item, itemIndex) => (itemIndex === index ? nextPlacement : item));
      localStorage.setItem(
        CUSTOMER_PLACEMENT_STORAGE_KEY,
        JSON.stringify(
          Object.fromEntries(
            next.map((placement, itemIndex) => [
              `customer-${itemIndex + 1}`,
              { position: placement.position.map((value) => roundValue(value)) },
            ])
          )
        )
      );
      return next;
    });
  };

  const updatePlacementAxis = (index, axisIndex, value) => {
    const currentPosition = normalizeCustomerPosition(placements[index]?.position, CUSTOMER_SHOWCASE_DEFAULTS[index].position);
    const nextPosition = [...currentPosition];
    nextPosition[axisIndex] = axisIndex === 3 ? clampCustomerMask(value) : Number(value);
    updatePlacement(index, { position: nextPosition });
  };

  const startDrag = (event, index) => {
    if (!customerEditing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      index,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const dragCustomer = (event) => {
    const { index, offsetX, offsetY } = dragRef.current;
    if (!customerEditing || index < 0) return;
    const currentPosition = normalizeCustomerPosition(placements[index]?.position, CUSTOMER_SHOWCASE_DEFAULTS[index].position);
    const width = event.currentTarget.getBoundingClientRect().width;
    const left = Math.max(0, event.clientX - offsetX);
    const top = Math.max(0, event.clientY - offsetY);
    const nextX = Math.round(((left + width / 2) / Math.max(1, window.innerWidth)) * CUSTOMER_COORDINATE_DESIGN_WIDTH);
    const nextY = Math.round((top / Math.max(1, window.innerHeight)) * CUSTOMER_COORDINATE_DESIGN_HEIGHT);
    updatePlacement(index, {
      position: [
        nextX,
        nextY,
        currentPosition[2] || 0,
        currentPosition[3],
      ],
    });
  };

  const stopDrag = (event) => {
    dragRef.current.index = -1;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const copyCoordinates = async () => {
    await copyText(coordinateText);
    setCopyMessage("Copied customer coordinates.");
  };

  const copyCustomerCoordinate = async (customer, index) => {
    const coordinate = getCustomerCoordinate(customer, index);
    await copyText(JSON.stringify(coordinate, null, 2));
    setCopyMessage(`Copied ${coordinate.key}.`);
  };

  const saveAndLockCustomers = () => {
    localStorage.setItem(
      CUSTOMER_PLACEMENT_STORAGE_KEY,
      JSON.stringify(
        Object.fromEntries(
          placements.map((placement, itemIndex) => [
            `customer-${itemIndex + 1}`,
            { position: normalizeCustomerPosition(placement.position, CUSTOMER_SHOWCASE_DEFAULTS[itemIndex].position).map((value) => roundValue(value)) },
          ])
        )
      )
    );
    dragRef.current.index = -1;
    setCustomerEditing(false);
    setCopyMessage("Saved and locked customer positions.");
  };

  return (
    <>
      <div className="rm-customer-tools rm-customer-tools-editor">
        <span>Customer positioning</span>
        <small>{customerEditing ? "Unlocked: drag customers or edit values, then save and lock." : "Locked: positions are fixed for play."}</small>
        <div className="rm-customer-tool-actions">
          <button type="button" onClick={() => setCustomerEditing((value) => !value)}>
            {customerEditing ? "Lock" : "Unlock/Edit"}
          </button>
          <button type="button" onClick={saveAndLockCustomers}>Save & Lock</button>
          <button type="button" onClick={copyCoordinates}>Copy all</button>
        </div>
        <div className="rm-customer-position-editor">
          {previewCustomers.map((customer, index) => {
            const position = normalizeCustomerPosition(placements[index]?.position, CUSTOMER_SHOWCASE_DEFAULTS[index].position);
            return (
              <fieldset key={customer.id}>
                <legend>customer-{index + 1}</legend>
                {["X", "Y", "Z", "Mask"].map((axis, axisIndex) => (
                  <label key={axis}>
                    <span>{axis}</span>
                    <input
                      type="number"
                      step="1"
                      value={roundValue(position[axisIndex] || 0)}
                      onChange={(event) => updatePlacementAxis(index, axisIndex, event.target.value)}
                      aria-label={`customer-${index + 1} ${axis}`}
                    />
                  </label>
                ))}
              </fieldset>
            );
          })}
        </div>
        {copyMessage ? <small>{copyMessage}</small> : null}
      </div>
      <div className={`rm-customer-stage ${customerEditing ? "is-editing" : ""}`} aria-hidden={!customerEditing}>
        {previewCustomers.map((customer, index) => {
          const position = normalizeCustomerPosition(placements[index]?.position, CUSTOMER_SHOWCASE_DEFAULTS[index].position);
          return (
            <div
              className={`rm-scene-customer ${customerEditing ? "is-editing" : ""}`}
              key={customer.id}
              style={getResponsiveCustomerStyle(position)}
              onPointerDown={(event) => startDrag(event, index)}
              onPointerMove={dragCustomer}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              {customer.imagePath ? (
                <img className="rm-customer-image" src={customer.imagePath} alt="" draggable="false" />
              ) : (
                <RestaurantCustomerSvg customer={customer} />
              )}
              {customerEditing ? <span>customer-{index + 1}</span> : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

function makeRoundedPlateShape(width, depth, radius) {
  const x = -width / 2;
  const y = -depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + depth - radius);
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  shape.lineTo(x + radius, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  shape.closePath();
  return shape;
}

function makeRoundedPlateRingShape(width, depth, innerWidth, innerDepth, outerRadius, innerRadius) {
  const shape = makeRoundedPlateShape(width, depth, outerRadius);
  const hole = makeRoundedPlateShape(innerWidth, innerDepth, innerRadius);
  shape.holes.push(hole);
  return shape;
}

function loadSavedCustomerPath() {
  try {
    const defaultPath = localStorage.getItem(DEFAULT_CHARACTER_PATH_STORAGE_KEY);
    const saved = JSON.parse(defaultPath || "[]");
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return RESTAURANT_MANAGER_CONFIG.defaultCharacterPath || [];
  } catch {
    return RESTAURANT_MANAGER_CONFIG.defaultCharacterPath || [];
  }
}

const RESTAURANT_REMOVABLE_TABLE_PROP_PATTERN = /^(bottle\.\d+|bottle\.\d+_bar_atlas_0|Circle\.0(?:3\d|4\d|5[0-6])_glass_0)$/i;

function hideBuiltInRestaurantTableProps(root) {
  root.traverse((node) => {
    if (RESTAURANT_REMOVABLE_TABLE_PROP_PATTERN.test(node.name || "")) {
      node.visible = false;
    }
  });
}

function RestaurantSceneModel({ placement, onBoundsReady }) {
  const groupRef = useRef(null);
  const gltf = useGLTF(RESTAURANT_MANAGER_CONFIG.restaurantAssetPath);
  const { position, rotation, scale } = placement.restaurantTransform;
  const restaurantScene = useMemo(() => {
    const root = clone(gltf.scene);
    hideBuiltInRestaurantTableProps(root);
    return root;
  }, [gltf.scene]);

  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    onBoundsReady?.({
      size: [Number(size.x.toFixed(2)), Number(size.y.toFixed(2)), Number(size.z.toFixed(2))],
      center: [Number(center.x.toFixed(2)), Number(center.y.toFixed(2)), Number(center.z.toFixed(2))],
    });
  }, [restaurantScene, onBoundsReady, position, rotation, scale]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={restaurantScene} />
    </group>
  );
}

function normalizeStaticAsset(root, targetWidth) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const widest = Math.max(0.001, size.x, size.z);
  const scale = targetWidth / widest;

  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(root);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaledBounds.min.y;

  root.traverse((node) => {
    if (node.isMesh || node.isSkinnedMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = true;
    }

    const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    materials.forEach((material) => {
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      material.needsUpdate = true;
    });
  });

  return root;
}

function generateCroissantPileLayout(count) {
  const layout = [];
  const rings = [
    { count: 54, radiusX: 0.54, radiusZ: 0.36, y: 0.44, phase: 0.1 },
    { count: 62, radiusX: 0.49, radiusZ: 0.31, y: 0.55, phase: 0.46 },
    { count: 58, radiusX: 0.41, radiusZ: 0.25, y: 0.67, phase: 0.82 },
    { count: 48, radiusX: 0.32, radiusZ: 0.2, y: 0.79, phase: 0.24 },
    { count: 38, radiusX: 0.21, radiusZ: 0.13, y: 0.9, phase: 0.62 },
  ];

  rings.forEach((ring, ringIndex) => {
    for (let index = 0; index < ring.count && layout.length < count; index += 1) {
      const angle = ring.phase + (index / ring.count) * Math.PI * 2;
      const wobble = index % 2 === 0 ? 0.016 : -0.014;
      layout.push([
        Math.cos(angle) * ring.radiusX + wobble,
        ring.y + (index % 4) * 0.016,
        Math.sin(angle) * ring.radiusZ - ringIndex * 0.006,
        angle + Math.PI / 2 + (index % 4) * 0.22,
        ringIndex,
      ]);
    }
  });

  while (layout.length < count) {
    const index = layout.length;
    const angle = index * 2.3999632297;
    const radius = 0.08 + (index % 5) * 0.035;
    layout.push([
      Math.cos(angle) * radius,
      0.98 + (index % 4) * 0.018,
      Math.sin(angle) * radius * 0.68,
      angle,
      4,
    ]);
  }

  return layout;
}

function generateShelfStockLayout(stock) {
  const layout = [];
  const count = Math.max(0, stock.availableStock ?? stock.count ?? 1);
  const rowCount = Math.max(1, stock.rows || 4);
  const perRow = Math.max(1, stock.columns || Math.ceil(count / rowCount));
  const basePosition = stock.localPosition || [0, stock.y || 0, stock.z || 0];
  const cellWidth = stock.cellWidth || Math.max(0.28, stock.targetWidth * 1.45);
  const cellDepth = stock.cellDepth || Math.max(0.24, stock.targetWidth * 1.25);

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / perRow);
    const column = index % perRow;
    const x = basePosition[0] + (column - (perRow - 1) / 2) * cellWidth;
    const z = basePosition[2] + (row - (rowCount - 1) / 2) * cellDepth;
    const y = basePosition[1] + 0.024 + (index % 2) * 0.003;
    layout.push({
      id: `${stock.id}-serveable-${index + 1}`,
      key: `${stock.id}-${index}`,
      index: index + 1,
      position: [roundValue(x), roundValue(y), roundValue(z)],
      rotation: [
        index % 2 === 0 ? 0.02 : -0.02,
        roundValue((index % 5) * 0.18 - 0.36),
        index % 3 === 0 ? 0.04 : -0.03,
      ],
    });
  }

  return layout;
}

function LowPolyFoodTray({ stock }) {
  const width = stock.trayWidth || 0.98;
  const depth = stock.trayDepth || 0.68;
  const trayColor = stock.trayColor || "#fff1c2";

  return (
    <group name={`RealServingTray-${stock.id}`} position={[0, -0.032, 0]}>
      <mesh name={`FoodTrayBase-${stock.id}`} receiveShadow castShadow>
        <boxGeometry args={[width, 0.035, depth]} />
        <meshStandardMaterial color={trayColor} roughness={0.38} metalness={0.18} />
      </mesh>
      <mesh name="TrayInnerSurface" position={[0, 0.026, 0]}>
        <boxGeometry args={[width - 0.1, 0.01, depth - 0.1]} />
        <meshStandardMaterial color="#f2ddbf" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.07, depth / 2]}>
        <boxGeometry args={[width, 0.08, 0.055]} />
        <meshStandardMaterial color="#b99d78" roughness={0.34} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.07, -depth / 2]}>
        <boxGeometry args={[width, 0.08, 0.055]} />
        <meshStandardMaterial color="#b99d78" roughness={0.34} metalness={0.2} />
      </mesh>
      <mesh position={[width / 2, 0.07, 0]}>
        <boxGeometry args={[0.055, 0.08, depth]} />
        <meshStandardMaterial color="#b99d78" roughness={0.34} metalness={0.2} />
      </mesh>
      <mesh position={[-width / 2, 0.07, 0]}>
        <boxGeometry args={[0.055, 0.08, depth]} />
        <meshStandardMaterial color="#b99d78" roughness={0.34} metalness={0.2} />
      </mesh>
    </group>
  );
}

function getDefaultPriceTagPosition(stock) {
  const depth = stock.trayDepth || 0.68;
  const rotationY = Math.abs((stock.localRotation || [0, 0, 0])[1] || 0);
  const isQuarterTurned = Math.abs(rotationY - Math.PI / 2) < 0.18;
  const tagEdge = isQuarterTurned ? -1 : 1;
  return [0, 0.125, tagEdge * (depth / 2 + 0.04)];
}

function TrayPriceTag({ stock, parentRef, placementTool, onSelectStock, onTagTransformChange }) {
  const width = stock.trayWidth || 0.98;
  const label = stock.priceLabel || stock.name.replace(/s$/, "");
  const texture = useMemo(() => makeTrayPriceTexture(label, stock.price), [label, stock.price]);
  const dragRef = useRef({
    active: false,
    offset: new THREE.Vector3(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  });
  const position = stock.priceTagPosition || getDefaultPriceTagPosition(stock);
  const rotation = stock.priceTagRotation || [-0.42, 0, 0];
  const scale = stock.priceTagScale || 1;

  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;

  const handlePointerDown = (event) => {
    event.stopPropagation();
    onSelectStock?.(stock.id);
    if (placementTool === "locked" || !parentRef.current) return;
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      const worldPosition = new THREE.Vector3(...position).applyMatrix4(parentRef.current.matrixWorld);
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -worldPosition.y);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      const localHit = parentRef.current.worldToLocal(hit.clone());
      dragRef.current.offset.set(position[0] - localHit.x, 0, position[2] - localHit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked" || !parentRef.current) return;
    event.stopPropagation();
    if (placementTool === "resize") return;

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTagTransformChange?.(stock.id, {
        priceTagRotation: [
          roundValue(rotation[0] + deltaY * 0.012),
          roundValue(rotation[1] + deltaX * 0.012),
          rotation[2],
        ],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTagTransformChange?.(stock.id, {
        priceTagScale: roundValue(Math.max(0.35, Math.min(2.5, scale + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      const localHit = parentRef.current.worldToLocal(hit.clone());
      onTagTransformChange?.(stock.id, {
        priceTagPosition: [
          roundValue(localHit.x + dragRef.current.offset.x),
          position[1],
          roundValue(localHit.z + dragRef.current.offset.z),
        ],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <mesh castShadow>
        <boxGeometry args={[Math.max(0.46, width * 0.6), 0.025, 0.045]} />
        <meshStandardMaterial color="#9b7140" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.08, -0.006]}>
        <planeGeometry args={[Math.max(0.5, width * 0.72), 0.25]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RiceGrains({ color = "#f8f2df", area = [-0.22, -0.02, 0.34, 0.34], count = 48 }) {
  const [cx, cz, width, depth] = area;
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const col = index % 8;
        const row = Math.floor(index / 8);
        const x = cx + (col / 7 - 0.5) * width + ((index % 3) - 1) * 0.01;
        const z = cz + (row / 5 - 0.5) * depth + ((index % 4) - 1.5) * 0.008;
        return (
          <mesh key={index} position={[x, 0.05 + (index % 2) * 0.008, z]} rotation={[0.15, index * 0.37, 0.1]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function SaucePool({ color = "#a83f22", position = [0.2, 0.045, 0], scale = [0.34, 0.035, 0.26] }) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 20, 10]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.04} />
    </mesh>
  );
}

function Drumstick({ position = [0.1, 0.1, 0], rotation = [0, 0, 0] }) {
  const crustLumps = [
    [-0.19, 0.102, -0.07, 0.052, "#d9821f"],
    [-0.15, 0.145, 0.01, 0.04, "#f0a23a"],
    [-0.105, 0.078, 0.075, 0.034, "#c66a18"],
    [-0.06, 0.145, -0.105, 0.032, "#eda446"],
    [-0.025, 0.112, 0.102, 0.038, "#d77920"],
    [0.04, 0.142, -0.035, 0.03, "#f2b252"],
    [0.088, 0.088, 0.055, 0.033, "#c86917"],
    [0.145, 0.108, -0.025, 0.027, "#e08a27"],
    [0.205, 0.08, 0.035, 0.022, "#bf6118"],
    [0.255, 0.075, -0.018, 0.019, "#e19637"],
  ];
  const crispySpecks = [
    [-0.18, 0.168, -0.035],
    [-0.125, 0.164, 0.058],
    [-0.082, 0.096, -0.105],
    [-0.035, 0.172, 0.012],
    [0.025, 0.156, -0.072],
    [0.072, 0.104, 0.09],
    [0.13, 0.136, 0.012],
    [0.19, 0.097, -0.045],
    [0.245, 0.106, 0.024],
  ];

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-0.11, 0.09, -0.025]} rotation={[0.04, -0.05, -0.16]} scale={[0.24, 0.135, 0.18]}>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial color="#d98125" roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh position={[0.035, 0.078, 0.005]} rotation={[0.02, 0.06, -0.07]} scale={[0.16, 0.092, 0.125]}>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial color="#cf7620" roughness={0.82} metalness={0.02} />
      </mesh>
      <mesh position={[0.18, 0.07, 0.0]} rotation={[0, 0, Math.PI / 2]} scale={[0.07, 0.057, 0.145]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#c96c1d" roughness={0.86} />
      </mesh>
      <mesh position={[0.31, 0.064, 0.005]} rotation={[0, 0, Math.PI / 2]} scale={[0.045, 0.038, 0.105]}>
        <capsuleGeometry args={[1, 1.4, 6, 12]} />
        <meshStandardMaterial color="#e7b77b" roughness={0.58} />
      </mesh>
      <mesh position={[0.402, 0.064, 0.008]} rotation={[0, 0, -0.08]} scale={[0.047, 0.038, 0.047]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#efcf9e" roughness={0.54} />
      </mesh>
      <mesh position={[0.437, 0.066, 0.0]} rotation={[0, 0, 0.08]} scale={[0.035, 0.028, 0.035]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#efcf9e" roughness={0.54} />
      </mesh>
      <mesh position={[-0.09, 0.17, -0.018]} rotation={[0.08, -0.12, -0.14]} scale={[0.19, 0.018, 0.09]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color="#ffd176" roughness={0.55} transparent opacity={0.42} />
      </mesh>
      <mesh position={[-0.15, 0.105, -0.135]} rotation={[0.1, 0.2, -0.18]} scale={[0.12, 0.022, 0.044]}>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshStandardMaterial color="#8e3f13" roughness={0.82} transparent opacity={0.62} />
      </mesh>
      {crustLumps.map(([x, y, z, radius, color], index) => (
        <mesh key={`drumstick-crust-lump-${index}`} position={[x, y, z]} scale={[radius * 1.25, radius * 0.72, radius]}>
          <sphereGeometry args={[1, 10, 7]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
      {crispySpecks.map(([x, y, z], index) => (
        <mesh key={`drumstick-crispy-speck-${index}`} position={[x, y, z]} rotation={[0.25, index * 0.4, -0.2]} scale={[0.007, 0.006, 0.03]}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial color={index % 3 === 0 ? "#6e2d12" : "#f2b04a"} roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

function PlantainSlices({ start = [0.27, 0.075, 0.02], count = 4 }) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[start[0] + index * 0.055, start[1], start[2] + index * 0.045]} rotation={[0.2, index * 0.1, 0.22]}>
          <cylinderGeometry args={[0.055, 0.055, 0.025, 20]} />
          <meshStandardMaterial color="#d98a22" roughness={0.42} />
        </mesh>
      ))}
    </group>
  );
}

function MeatPieces({ color = "#7a3324", count = 5, center = [0.23, 0.09, -0.02] }) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[center[0] + ((index % 3) - 1) * 0.09, center[1], center[2] + (Math.floor(index / 3) - 0.5) * 0.11]} rotation={[0.2, index * 0.8, 0.1]}>
          <boxGeometry args={[0.09, 0.07, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.58} />
        </mesh>
      ))}
    </group>
  );
}

function Spaghetti({ position = [0, 0.075, 0] }) {
  return (
    <group position={position}>
      {Array.from({ length: 18 }, (_, index) => (
        <mesh key={index} position={[((index % 6) - 2.5) * 0.045, 0, (Math.floor(index / 6) - 1) * 0.055]} rotation={[Math.PI / 2, 0, index * 0.35]}>
          <torusGeometry args={[0.09 + (index % 3) * 0.012, 0.008, 8, 28]} />
          <meshStandardMaterial color="#e9c66f" roughness={0.62} />
        </mesh>
      ))}
      <SaucePool color="#b64024" position={[0.04, 0.018, 0.0]} scale={[0.27, 0.018, 0.2]} />
      {Array.from({ length: 4 }, (_, index) => (
        <mesh key={`ball-${index}`} position={[-0.08 + index * 0.055, 0.075, -0.02 + (index % 2) * 0.08]}>
          <sphereGeometry args={[0.055, 16, 10]} />
          <meshStandardMaterial color="#7a2d1d" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function SwallowBall({ color = "#f5ead8", position = [-0.22, 0.1, 0] }) {
  return (
    <mesh position={position} scale={[0.2, 0.16, 0.2]}>
      <sphereGeometry args={[1, 24, 14]} />
      <meshStandardMaterial color={color} roughness={0.44} />
    </mesh>
  );
}

function FishModel({ position = [0, 0.08, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[0.25, 0.075, 0.1]}>
        <sphereGeometry args={[1, 20, 10]} />
        <meshStandardMaterial color="#8a6b4a" roughness={0.45} metalness={0.06} />
      </mesh>
      <mesh position={[0.27, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.09, 0.14, 3]} />
        <meshStandardMaterial color="#70583e" roughness={0.5} />
      </mesh>
      <mesh position={[-0.18, 0.035, 0.025]}>
        <sphereGeometry args={[0.014, 8, 6]} />
        <meshStandardMaterial color="#101010" roughness={0.4} />
      </mesh>
    </group>
  );
}

function FriesPile({ position = [0.2, 0.085, 0.04], count = 12 }) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[((index % 5) - 2) * 0.035, (index % 3) * 0.012, (Math.floor(index / 5) - 1) * 0.04]} rotation={[0.15, index * 0.36, index * 0.22]}>
          <boxGeometry args={[0.025, 0.025, 0.19]} />
          <meshStandardMaterial color="#f0bd45" roughness={0.48} />
        </mesh>
      ))}
    </group>
  );
}

function Burger({ position = [-0.22, 0.085, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} scale={[0.2, 0.08, 0.2]}>
        <sphereGeometry args={[1, 24, 12]} />
        <meshStandardMaterial color="#d98b32" roughness={0.44} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.045, 24]} />
        <meshStandardMaterial color="#5b2b18" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 24]} />
        <meshStandardMaterial color="#f4c62e" roughness={0.42} />
      </mesh>
      <mesh position={[0, -0.035, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.045, 24]} />
        <meshStandardMaterial color="#c67b28" roughness={0.48} />
      </mesh>
    </group>
  );
}

function PizzaSlice({ position = [0, 0.07, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh scale={[0.16, 0.02, 0.26]}>
        <coneGeometry args={[1, 1, 3]} />
        <meshStandardMaterial color="#e7a22d" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.025, -0.02]} scale={[0.13, 0.012, 0.2]}>
        <coneGeometry args={[1, 1, 3]} />
        <meshStandardMaterial color="#f8d25c" roughness={0.42} />
      </mesh>
      {Array.from({ length: 4 }, (_, index) => (
        <mesh key={index} position={[((index % 2) - 0.5) * 0.08, 0.04, -0.05 + Math.floor(index / 2) * 0.08]}>
          <cylinderGeometry args={[0.018, 0.018, 0.008, 12]} />
          <meshStandardMaterial color="#c93922" roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function WholePizzaItem() {
  const toppings = [
    [-0.065, 0.049, -0.044, "#c84522", "meat"],
    [0.055, 0.05, -0.052, "#c84522", "meat"],
    [0.025, 0.05, 0.052, "#c84522", "meat"],
    [-0.085, 0.049, 0.048, "#6ebf3f", "pea"],
    [0.086, 0.049, 0.024, "#69ba3a", "pea"],
    [-0.018, 0.05, -0.092, "#79c747", "pea"],
    [0.072, 0.05, -0.004, "#efc942", "corn"],
    [-0.04, 0.05, 0.086, "#f0c53c", "corn"],
    [0.0, 0.051, 0.008, "#e06a2d", "chicken"],
    [-0.095, 0.05, -0.006, "#e06a2d", "chicken"],
    [0.112, 0.05, 0.068, "#8a4b25", "olive"],
    [-0.012, 0.052, 0.116, "#8a4b25", "olive"],
  ];

  return (
    <group>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.024, 48]} />
        <meshStandardMaterial color="#d3913c" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.152, 0.152, 0.012, 48]} />
        <meshStandardMaterial color="#d14822" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.037, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.005, 48]} />
        <meshStandardMaterial color="#f2cf6a" roughness={0.38} />
      </mesh>
      {[
        [-0.045, 0.043, -0.02, 0.052, 0.018],
        [0.048, 0.043, 0.044, 0.044, 0.014],
        [0.012, 0.044, -0.072, 0.036, 0.012],
      ].map(([x, y, z, sx, sz], index) => (
        <mesh key={`pizza-sauce-${index}`} position={[x, y, z]} scale={[sx, 0.004, sz]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshStandardMaterial color="#d84a22" roughness={0.48} transparent opacity={0.86} />
        </mesh>
      ))}
      {toppings.map(([x, y, z, color, type], index) => {
        const isSmall = type === "pea" || type === "corn" || type === "olive";
        return (
          <mesh
            key={index}
            position={[x, y, z]}
            rotation={[Math.PI / 2, index * 0.6, 0]}
            scale={type === "chicken" ? [1.18, 0.7, 1] : [1, 1, 1]}
          >
            {isSmall ? <sphereGeometry args={[0.012, 10, 7]} /> : <cylinderGeometry args={[0.017, 0.02, 0.009, 12]} />}
            <meshStandardMaterial color={color} roughness={0.44} />
          </mesh>
        );
      })}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <mesh key={`crust-${index}`} position={[Math.cos(angle) * 0.165, 0.034, Math.sin(angle) * 0.165]} scale={[0.026, 0.01, 0.026]}>
            <sphereGeometry args={[1, 10, 6]} />
            <meshStandardMaterial color="#d59a45" roughness={0.5} />
          </mesh>
        );
      })}
      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius = index % 2 === 0 ? 0.11 : 0.07;
        return (
          <mesh key={`cheese-spot-${index}`} position={[Math.cos(angle) * radius, 0.054, Math.sin(angle) * radius]} scale={[0.012, 0.003, 0.009]}>
            <sphereGeometry args={[1, 8, 5]} />
            <meshStandardMaterial color="#ffe28a" roughness={0.34} />
          </mesh>
        );
      })}
    </group>
  );
}

function PancakeStack() {
  return (
    <group>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[0, 0.055 + index * 0.025, 0]}>
          <cylinderGeometry args={[0.2, 0.21, 0.028, 32]} />
          <meshStandardMaterial color="#d89037" roughness={0.42} />
        </mesh>
      ))}
      <SaucePool color="#b56a19" position={[0.02, 0.15, 0.01]} scale={[0.15, 0.018, 0.13]} />
      {[
        [-0.07, 0.17, 0.02, "#d9363e"],
        [0.07, 0.17, -0.02, "#1f3d7a"],
        [0, 0.18, 0.08, "#f4df99"],
      ].map(([x, y, z, color], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function MeatPieItem() {
  return (
    <group>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.16, 0.17, 0.07, 32]} />
        <meshStandardMaterial color="#b86f2c" roughness={0.5} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.08, 0]} scale={[1, 0.25, 1]}>
        <torusGeometry args={[0.14, 0.025, 12, 36]} />
        <meshStandardMaterial color="#d8953e" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 32]} />
        <meshStandardMaterial color="#e5a750" roughness={0.47} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 4 }, (_, index) => (
        <mesh key={`lat-a-${index}`} position={[-0.055 + index * 0.037, 0.105, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.018, 0.018, 0.27]} />
          <meshStandardMaterial color="#f1c06a" roughness={0.42} />
        </mesh>
      ))}
      {Array.from({ length: 4 }, (_, index) => (
        <mesh key={`lat-b-${index}`} position={[-0.055 + index * 0.037, 0.111, 0]} rotation={[0, -Math.PI / 4, 0]}>
          <boxGeometry args={[0.018, 0.018, 0.27]} />
          <meshStandardMaterial color="#c87931" roughness={0.45} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <mesh key={`rim-${index}`} position={[Math.cos(angle) * 0.155, 0.1, Math.sin(angle) * 0.155]} scale={[0.026, 0.018, 0.026]}>
            <sphereGeometry args={[1, 10, 6]} />
            <meshStandardMaterial color="#cf812f" roughness={0.46} />
          </mesh>
        );
      })}
      {[
        [-0.045, 0.09, -0.015],
        [0.055, 0.092, 0.035],
        [0.015, 0.093, -0.06],
      ].map(([x, y, z], index) => (
        <mesh key={`filling-${index}`} position={[x, y, z]} scale={[0.025, 0.012, 0.025]}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial color="#8a4523" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function DoughnutItem({ variant = 0 }) {
  const icingColors = ["#f59ac8", "#45d5d9", "#7a3d25", "#f2eee2", "#f7b7cf"];
  const icingColor = icingColors[variant % icingColors.length];

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.112, 0.043, 16, 38]} />
        <meshStandardMaterial color="#d1903f" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <torusGeometry args={[0.112, 0.033, 16, 38]} />
        <meshStandardMaterial color={icingColor} roughness={0.31} metalness={0.02} />
      </mesh>
      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius = 0.078 + (index % 3) * 0.014;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0.066]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.02, 0.006, 0.006]} />
            <meshStandardMaterial color={["#5cc4ff", "#fff176", "#ef4444", "#22c55e"][index % 4]} roughness={0.48} />
          </mesh>
        );
      })}
    </group>
  );
}

function CheesePortionItem() {
  return (
    <group rotation={[0, Math.PI / 6, 0]}>
      <mesh position={[0, 0.04, 0]} scale={[0.16, 0.07, 0.13]}>
        <coneGeometry args={[1, 1, 3]} />
        <meshStandardMaterial color="#f5c542" roughness={0.42} />
      </mesh>
      {[
        [-0.03, 0.1, 0.015],
        [0.05, 0.082, -0.025],
        [0.08, 0.055, 0.035],
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]} scale={[0.018, 0.008, 0.018]}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial color="#d79b21" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function HotDogItem() {
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[-0.018, 0.045, -0.048]} rotation={[0.14, 0, Math.PI / 2]} scale={[1, 0.55, 0.78]}>
        <capsuleGeometry args={[0.045, 0.24, 10, 18]} />
        <meshStandardMaterial color="#f1c989" roughness={0.42} />
      </mesh>
      <mesh position={[0.018, 0.045, 0.048]} rotation={[-0.14, 0, Math.PI / 2]} scale={[1, 0.55, 0.78]}>
        <capsuleGeometry args={[0.045, 0.24, 10, 18]} />
        <meshStandardMaterial color="#f6d59a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.082, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.035, 0.23, 10, 18]} />
        <meshStandardMaterial color="#e76a45" roughness={0.34} />
      </mesh>
      <mesh position={[0.045, 0.118, 0.006]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.7, 1]}>
        <capsuleGeometry args={[0.007, 0.12, 6, 12]} />
        <meshStandardMaterial color="#fff1b0" roughness={0.46} />
      </mesh>
      <mesh position={[-0.055, 0.118, -0.008]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.7, 1]}>
        <capsuleGeometry args={[0.007, 0.1, 6, 12]} />
        <meshStandardMaterial color="#fff1b0" roughness={0.46} />
      </mesh>
    </group>
  );
}

function FriesCupItem() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.06, 0.075, 0.09, 4]} />
        <meshStandardMaterial color="#cf2d25" roughness={0.46} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh
          key={index}
          position={[((index % 4) - 1.5) * 0.022, 0.12 + (index % 2) * 0.012, (Math.floor(index / 4) - 0.5) * 0.025]}
          rotation={[0.12, index * 0.26, index % 2 ? 0.1 : -0.1]}
        >
          <boxGeometry args={[0.014, 0.11, 0.014]} />
          <meshStandardMaterial color="#f3c14b" roughness={0.48} />
        </mesh>
      ))}
      <mesh position={[0, 0.09, 0.001]}>
        <boxGeometry args={[0.09, 0.018, 0.006]} />
        <meshStandardMaterial color="#fff4d5" roughness={0.42} />
      </mesh>
    </group>
  );
}

function CupcakeItem({ variant = 0 }) {
  const frostingColors = ["#f7a8cf", "#f6f1e4", "#8b4b2c", "#7dd3fc", "#9ee7e2"];
  const wrapperColors = ["#7c3aed", "#f97316", "#16a34a", "#111827", "#ec4899"];
  return (
    <group>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.07, 18]} />
        <meshStandardMaterial color={wrapperColors[variant % wrapperColors.length]} roughness={0.52} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <mesh key={`wrapper-rib-${index}`} position={[Math.cos(angle) * 0.067, 0.04, Math.sin(angle) * 0.067]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.004, 0.054, 0.008]} />
            <meshStandardMaterial color="#f4d9a6" roughness={0.6} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.09, 0]} scale={[0.08, 0.045, 0.08]}>
        <sphereGeometry args={[1, 18, 10]} />
        <meshStandardMaterial color={frostingColors[variant % frostingColors.length]} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.128, 0]} scale={[0.042, 0.028, 0.042]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color={frostingColors[(variant + 2) % frostingColors.length]} roughness={0.32} />
      </mesh>
      {Array.from({ length: 11 }, (_, index) => {
        const angle = (index / 11) * Math.PI * 2;
        const radius = 0.026 + (index % 3) * 0.012;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, 0.138, Math.sin(angle) * radius]} rotation={[0, angle, 0.25]}>
            <boxGeometry args={[0.013, 0.004, 0.004]} />
            <meshStandardMaterial color={["#ef4444", "#22c55e", "#facc15", "#3b82f6", "#a855f7"][index % 5]} roughness={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

function ChickenDrumstickItem() {
  return <Drumstick position={[0, 0.075, 0]} rotation={[0.18, -0.6, 0.35]} />;
}

function SandwichItem({ variant = 0 }) {
  const layerOffset = (variant % 3) * 0.002;
  const sesame = [
    [-0.072, 0.126, -0.044],
    [-0.026, 0.13, 0.035],
    [0.028, 0.128, -0.018],
    [0.078, 0.126, 0.046],
  ];
  const crumbs = [
    [-0.09, 0.018, -0.057],
    [0.09, 0.02, 0.056],
    [-0.065, 0.13, 0.06],
    [0.06, 0.132, -0.06],
  ];

  return (
    <group rotation={[0, -0.18 + (variant % 2) * 0.08, 0]} scale={[1.04, 1, 1]}>
      <mesh position={[0, 0.026, 0]} rotation={[0, 0, 0.01]}>
        <boxGeometry args={[0.23, 0.026, 0.17]} />
        <meshStandardMaterial color="#9f6b37" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.045, 0.004]} rotation={[0, 0, -0.012]}>
        <boxGeometry args={[0.215, 0.012, 0.158]} />
        <meshStandardMaterial color="#4f8f28" roughness={0.58} />
      </mesh>
      <mesh position={[0.006, 0.058, -0.002]}>
        <boxGeometry args={[0.2, 0.014, 0.148]} />
        <meshStandardMaterial color="#f8f1c6" roughness={0.46} />
      </mesh>
      <mesh position={[0.002, 0.074, -0.003]}>
        <boxGeometry args={[0.212, 0.014, 0.152]} />
        <meshStandardMaterial color="#c8302b" roughness={0.48} />
      </mesh>
      <mesh position={[-0.006, 0.088, 0.002]}>
        <boxGeometry args={[0.212, 0.012, 0.156]} />
        <meshStandardMaterial color="#7b2f82" roughness={0.54} />
      </mesh>
      <mesh position={[0.006, 0.099, -0.004]}>
        <boxGeometry args={[0.218, 0.012, 0.154]} />
        <meshStandardMaterial color="#2f7d2b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.116 + layerOffset, 0]} rotation={[0, 0, -0.012]}>
        <boxGeometry args={[0.232, 0.03, 0.172]} />
        <meshStandardMaterial color="#b78349" roughness={0.64} />
      </mesh>
      <mesh position={[0, 0.135 + layerOffset, 0]} scale={[1, 0.24, 1]}>
        <boxGeometry args={[0.224, 0.025, 0.164]} />
        <meshStandardMaterial color="#d8aa66" roughness={0.58} />
      </mesh>
      {sesame.map(([x, y, z], index) => (
        <mesh key={`sandwich-sesame-${index}`} position={[x, y + layerOffset, z]} scale={[0.012, 0.0035, 0.006]} rotation={[0, index * 0.45, 0]}>
          <sphereGeometry args={[1, 8, 5]} />
          <meshStandardMaterial color="#f5dfad" roughness={0.52} />
        </mesh>
      ))}
      {crumbs.map(([x, y, z], index) => (
        <mesh key={`sandwich-crumb-${index}`} position={[x, y + layerOffset, z]} scale={[0.009, 0.006, 0.009]}>
          <sphereGeometry args={[1, 7, 5]} />
          <meshStandardMaterial color={index % 2 === 0 ? "#7a4b25" : "#eee2c1"} roughness={0.62} />
        </mesh>
      ))}
      {[-0.07, 0, 0.07].map((x, index) => (
        <mesh key={`sandwich-cheese-${index}`} position={[x, 0.111 + layerOffset, -0.083]} rotation={[0.25, 0, 0]} scale={[0.018, 0.011, 0.018]}>
          <sphereGeometry args={[1, 8, 5]} />
          <meshStandardMaterial color="#f5f0df" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function FruitCupItem({ variant = 0 }) {
  const fruitPieces = [
    { key: "pineapple-1", color: "#ffd84d", position: [-0.036, 0.046, -0.026], scale: [0.025, 0.016, 0.021], shape: "box" },
    { key: "pineapple-2", color: "#f7c948", position: [0.031, 0.05, 0.019], scale: [0.024, 0.016, 0.024], shape: "box" },
    { key: "pineapple-3", color: "#ffd24a", position: [0.004, 0.066, -0.04], scale: [0.022, 0.014, 0.02], shape: "box" },
    { key: "apple-1", color: "#8bd34e", position: [-0.002, 0.053, 0.04], scale: [0.025, 0.012, 0.019], shape: "box" },
    { key: "apple-2", color: "#c8ec73", position: [0.042, 0.072, -0.001], scale: [0.024, 0.012, 0.018], shape: "box" },
    { key: "banana-1", color: "#ffe07b", position: [-0.041, 0.068, 0.014], scale: [0.032, 0.01, 0.014], shape: "banana" },
    { key: "banana-2", color: "#f9cf5c", position: [0.014, 0.087, 0.032], scale: [0.03, 0.01, 0.014], shape: "banana" },
    { key: "watermelon-1", color: "#f25757", position: [-0.023, 0.086, -0.026], scale: [0.027, 0.015, 0.02], shape: "box" },
    { key: "watermelon-2", color: "#ee4b4b", position: [0.037, 0.1, -0.029], scale: [0.024, 0.015, 0.019], shape: "box" },
    { key: "strawberry-1", color: "#e83a3a", position: [-0.04, 0.107, 0.02], scale: [0.019, 0.025, 0.017], shape: "sphere" },
    { key: "strawberry-2", color: "#ff4b4b", position: [0.017, 0.115, -0.02], scale: [0.018, 0.025, 0.016], shape: "sphere" },
    { key: "strawberry-3", color: "#d92d35", position: [0.046, 0.124, 0.022], scale: [0.016, 0.022, 0.015], shape: "sphere" },
    { key: "orange-1", color: "#ff9f1c", position: [0.0, 0.099, 0.005], scale: [0.021, 0.014, 0.02], shape: "box" },
    { key: "orange-2", color: "#ffb238", position: [-0.035, 0.124, -0.014], scale: [0.02, 0.014, 0.018], shape: "box" },
    { key: "blueberry-1", color: "#2f3d8f", position: [-0.012, 0.132, -0.036], scale: [0.011, 0.011, 0.011], shape: "sphere" },
    { key: "blueberry-2", color: "#26347d", position: [0.036, 0.134, 0.034], scale: [0.01, 0.01, 0.01], shape: "sphere" },
    { key: "blueberry-3", color: "#202a65", position: [0.004, 0.142, 0.026], scale: [0.009, 0.009, 0.009], shape: "sphere" },
  ];
  const rotation = [0, (variant % 4) * 0.18 - 0.24, 0];

  return (
    <group rotation={rotation}>
      <mesh position={[0, 0.079, 0]}>
        <cylinderGeometry args={[0.066, 0.047, 0.128, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#e9fbff"
          roughness={0.04}
          metalness={0}
          transmission={0.68}
          transparent
          opacity={0.42}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.04, 0]} scale={[0.048, 0.012, 0.048]}>
        <sphereGeometry args={[1, 28, 8]} />
        <meshStandardMaterial color="#eef7fb" roughness={0.18} transparent opacity={0.32} />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.047, 0.01, 40]} />
        <meshStandardMaterial color="#f1f6f8" roughness={0.18} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0.145, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.073, 0.073, 0.009, 48]} />
        <meshStandardMaterial color="#f7fbff" roughness={0.12} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.151, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.074, 0.0065, 8, 44]} />
        <meshStandardMaterial color="#ffffff" roughness={0.12} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0.172, 0]} scale={[0.077, 0.032, 0.077]}>
        <sphereGeometry args={[1, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#f8fdff"
          roughness={0.035}
          transmission={0.72}
          transparent
          opacity={0.46}
          depthWrite={false}
        />
      </mesh>
      {[-0.048, 0.048].map((x, index) => (
        <mesh key={`fruit-cup-highlight-${index}`} position={[x, 0.09, 0.045]} rotation={[0.12, 0, index ? -0.18 : 0.18]} scale={[0.006, 0.058, 0.003]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.45} depthWrite={false} />
        </mesh>
      ))}
      {[0.032, 0.145].map((y, index) => (
        <mesh key={`fruit-cup-ring-${index}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[index === 0 ? 0.048 : 0.073, 0.0022, 6, 36]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} transparent opacity={index === 0 ? 0.24 : 0.42} />
        </mesh>
      ))}
      {fruitPieces.map((piece, index) => (
        <mesh
          key={piece.key}
          position={piece.position}
          rotation={[0.2 + index * 0.08, index * 0.55, index % 2 ? -0.18 : 0.18]}
          scale={piece.scale}
        >
          {piece.shape === "box" ? (
            <boxGeometry args={[1, 1, 1]} />
          ) : piece.shape === "banana" ? (
            <capsuleGeometry args={[0.42, 0.9, 5, 10]} />
          ) : (
            <sphereGeometry args={[1, 14, 10]} />
          )}
          <meshStandardMaterial color={piece.color} roughness={0.38} metalness={0.01} />
        </mesh>
      ))}
      {[-0.038, 0.0, 0.038].map((x, index) => (
        <mesh key={`fruit-cup-strawberry-seed-${index}`} position={[x, 0.136, -0.003]} scale={[0.0035, 0.0025, 0.0035]}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial color="#fff0a8" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function CroissantItem() {
  const segments = [
    { x: -0.13, z: 0.045, scale: [0.042, 0.032, 0.075], rot: -0.55, color: "#b86b2f" },
    { x: -0.075, z: 0.02, scale: [0.06, 0.04, 0.09], rot: -0.32, color: "#dc9646" },
    { x: -0.018, z: 0, scale: [0.07, 0.045, 0.1], rot: -0.12, color: "#efbd63" },
    { x: 0.042, z: 0.004, scale: [0.064, 0.042, 0.092], rot: 0.16, color: "#d98b3f" },
    { x: 0.098, z: 0.032, scale: [0.048, 0.035, 0.078], rot: 0.42, color: "#b86b2f" },
  ];

  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      {segments.map((segment, index) => (
        <mesh
          key={`croissant-body-${index}`}
          position={[segment.x, 0.045 + index * 0.002, segment.z]}
          rotation={[0.12, segment.rot, segment.rot * 0.5]}
          scale={segment.scale}
        >
          <sphereGeometry args={[1, 22, 12]} />
          <meshStandardMaterial color={segment.color} roughness={0.43} metalness={0.02} />
        </mesh>
      ))}
      {[-0.095, -0.035, 0.025, 0.08].map((x, index) => (
        <mesh
          key={`croissant-band-${index}`}
          position={[x, 0.075, Math.abs(x) * 0.28 + 0.006]}
          rotation={[0.18, index * 0.16 - 0.2, x * -3.1]}
          scale={[0.012, 0.012, 0.092 - index * 0.006]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#8f4d25" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[-0.17, 0.036, 0.075]} rotation={[0.14, -0.35, -0.78]} scale={[0.028, 0.024, 0.075]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color="#7d3f20" roughness={0.5} />
      </mesh>
      <mesh position={[0.165, 0.036, 0.072]} rotation={[0.14, 0.35, 0.78]} scale={[0.028, 0.024, 0.075]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color="#7d3f20" roughness={0.5} />
      </mesh>
      <mesh position={[-0.015, 0.086, 0.005]} rotation={[0.25, -0.18, -0.2]} scale={[0.17, 0.01, 0.025]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color="#f5d177" roughness={0.38} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function TrayFoodItem({ type, index = 0 }) {
  switch (type) {
    case "hamburger":
      return <Burger position={[0, 0.02, 0]} />;
    case "pizza":
      return <WholePizzaItem />;
    case "meatpie":
      return <MeatPieItem />;
    case "doughnut":
      return <DoughnutItem variant={index} />;
    case "cheese":
      return <CheesePortionItem />;
    case "croissant":
      return <CroissantItem />;
    case "hotdog":
      return <HotDogItem />;
    case "friesCup":
      return <FriesCupItem />;
    case "cupcake":
      return <CupcakeItem variant={index} />;
    case "chickenDrumstick":
      return <ChickenDrumstickItem />;
    case "fruitCup":
      return <FruitCupItem variant={index} />;
    default:
      return <Burger position={[0, 0.02, 0]} />;
  }
}

function generateTrayItemLayout(stock) {
  const count = Math.max(0, stock.availableStock ?? stock.count ?? 15);
  const columns = Math.max(1, stock.columns || 5);
  const rows = Math.max(1, stock.rows || Math.ceil(count / columns));
  const cellWidth = stock.cellWidth || Math.max(0.22, (stock.trayWidth || 1.55) / (columns + 0.6));
  const cellDepth = stock.cellDepth || Math.max(0.2, (stock.trayDepth || 0.95) / (rows + 0.7));

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      id: `${stock.id}-serveable-${index + 1}`,
      index: index + 1,
      position: [
        roundValue((column - (columns - 1) / 2) * cellWidth),
        0.078 + (index % 2) * 0.006,
        roundValue((row - (rows - 1) / 2) * cellDepth),
      ],
      rotation: [
        0,
        roundValue((index % 5) * 0.12 - 0.24),
        index % 2 === 0 ? 0.015 : -0.015,
      ],
    };
  });
}

function ProceduralMealFood({ type }) {
  switch (type) {
    case "jollofChicken":
      return (
        <>
          <RiceGrains color="#c85d17" area={[-0.18, -0.03, 0.34, 0.32]} count={44} />
          <Drumstick position={[0.16, 0.105, 0.02]} rotation={[0.12, -0.6, 0.2]} />
          <PlantainSlices start={[0.27, 0.08, -0.13]} />
        </>
      );
    case "friedRice":
      return (
        <>
          <RiceGrains color="#d8b86f" area={[0, 0, 0.65, 0.42]} count={72} />
          <MeatPieces color="#d69a55" count={6} center={[0.02, 0.09, 0]} />
        </>
      );
    case "riceBeef":
      return (
        <>
          <RiceGrains color="#f7f2df" area={[-0.22, 0, 0.32, 0.42]} count={54} />
          <SaucePool color="#9f331d" position={[0.19, 0.055, 0.0]} scale={[0.25, 0.035, 0.23]} />
          <MeatPieces color="#6b3023" count={5} center={[0.19, 0.1, 0]} />
        </>
      );
    case "spaghettiMeatballs":
      return <Spaghetti />;
    case "swallowSoup":
      return (
        <>
          <SwallowBall color="#f5ead8" />
          <SaucePool color="#8f7a22" position={[0.18, 0.055, 0]} scale={[0.24, 0.035, 0.23]} />
          <MeatPieces color="#7b4b26" count={3} center={[0.18, 0.1, 0.02]} />
        </>
      );
    case "amalaSoup":
      return (
        <>
          <SwallowBall color="#5a4034" />
          <SaucePool color="#245924" position={[0.17, 0.055, -0.02]} scale={[0.25, 0.035, 0.22]} />
          <MeatPieces color="#7f3c25" count={4} center={[0.18, 0.1, 0.02]} />
        </>
      );
    case "beansPlantain":
      return (
        <>
          <SaucePool color="#9a3f1e" position={[-0.1, 0.055, 0]} scale={[0.32, 0.035, 0.23]} />
          {Array.from({ length: 28 }, (_, index) => (
            <mesh key={index} position={[-0.23 + (index % 7) * 0.045, 0.09, -0.12 + Math.floor(index / 7) * 0.07]}>
              <sphereGeometry args={[0.022, 8, 6]} />
              <meshStandardMaterial color="#8f3c1e" roughness={0.55} />
            </mesh>
          ))}
          <PlantainSlices start={[0.19, 0.09, -0.13]} count={5} />
        </>
      );
    case "fishStew":
      return (
        <>
          <SaucePool color="#c45a22" position={[0, 0.055, 0]} scale={[0.34, 0.035, 0.24]} />
          <FishModel position={[0.02, 0.105, 0.02]} rotation={[0.05, 0.3, 0]} />
        </>
      );
    case "grilledFishFries":
      return (
        <>
          <FishModel position={[-0.13, 0.105, 0.02]} rotation={[0.05, -0.35, 0]} />
          <FriesPile position={[0.23, 0.09, 0.03]} />
        </>
      );
    case "burgerFries":
      return (
        <>
          <Burger />
          <FriesPile position={[0.23, 0.08, 0]} count={14} />
        </>
      );
    case "pizzaSlices":
      return (
        <>
          <PizzaSlice position={[-0.12, 0.08, 0.02]} rotationY={0.35} />
          <PizzaSlice position={[0.14, 0.08, 0.02]} rotationY={-0.35} />
        </>
      );
    case "pancakes":
      return <PancakeStack />;
    default:
      return <RiceGrains />;
  }
}

function ProceduralStockGroup({
  stock,
  parentRef,
  isSelected,
  selectedServeableItemId,
  placementTool,
  onSelectStock,
  onStockTransformChange,
  onSelectServeableItem,
}) {
  const stockGroupRef = useRef(null);
  const dragRef = useRef({
    active: false,
    offset: new THREE.Vector3(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  });
  const basePosition = stock.localPosition || [0, stock.y || 0, stock.z || 0];
  const localRotation = stock.localRotation || [0, 0, 0];
  const trayItems = useMemo(() => generateTrayItemLayout(stock), [stock]);

  const handlePointerDown = (event, item = trayItems[0]) => {
    event.stopPropagation();
    onSelectStock?.(stock.id);
    onSelectServeableItem?.({
      id: item.id,
      foodType: stock.id,
      foodName: stock.name,
      index: item.index,
      total: trayItems.length,
    });
    if (placementTool === "locked" || !parentRef.current) return;
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      const worldPosition = new THREE.Vector3(...basePosition).applyMatrix4(parentRef.current.matrixWorld);
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -worldPosition.y);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      const localHit = parentRef.current.worldToLocal(hit.clone());
      dragRef.current.offset.set(basePosition[0] - localHit.x, 0, basePosition[2] - localHit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked" || !parentRef.current) return;
    event.stopPropagation();
    if (placementTool === "resize") return;

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onStockTransformChange?.(stock.id, {
        localRotation: [
          localRotation[0],
          roundValue(localRotation[1] + deltaX * 0.012),
          localRotation[2],
        ],
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      const localHit = parentRef.current.worldToLocal(hit.clone());
      onStockTransformChange?.(stock.id, {
        localPosition: [
          roundValue(localHit.x + dragRef.current.offset.x),
          basePosition[1],
          roundValue(localHit.z + dragRef.current.offset.z),
        ],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      ref={stockGroupRef}
      name={`ProceduralServeableTray-${stock.id}`}
      position={basePosition}
      rotation={localRotation}
      userData={{
        serveableTray: true,
        foodType: stock.id,
        foodName: stock.name,
        serveableTotal: trayItems.length,
      }}
      onPointerDown={(event) => handlePointerDown(event)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <LowPolyFoodTray stock={stock} />
      <TrayPriceTag
        stock={stock}
        parentRef={stockGroupRef}
        placementTool={placementTool}
        onSelectStock={onSelectStock}
        onTagTransformChange={onStockTransformChange}
      />
      {trayItems.map((item) => (
        <group
          key={item.id}
          name={`ServeableFoodItem-${item.id}`}
          position={item.position}
          rotation={item.rotation}
          scale={stock.itemScale || 1}
          userData={{
            serveable: true,
            foodType: stock.id,
            foodName: stock.name,
            serveableId: item.id,
            serveableIndex: item.index,
            serveableTotal: trayItems.length,
          }}
          onPointerDown={(event) => handlePointerDown(event, item)}
        >
          <TrayFoodItem type={stock.proceduralType} index={item.index} />
          {placementTool !== "locked" && selectedServeableItemId === item.id ? (
            <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.16, 0.006, 8, 32]} />
              <meshBasicMaterial color="#22c55e" transparent opacity={0.9} />
            </mesh>
          ) : null}
        </group>
      ))}
      {placementTool !== "locked" && isSelected ? (
        <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.max(0.38, (stock.trayWidth || 0.98) * 0.46), 0.006, 8, 64]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
        </mesh>
      ) : null}
      {placementTool !== "locked" && isSelected ? (
        <Html center position={[0, 0.24, 0]}>
          <div className="rm-anchor-label">{stock.name}</div>
        </Html>
      ) : null}
    </group>
  );
}

function GltfStockGroup({
  stock,
  parentRef,
  isSelected,
  selectedServeableItemId,
  placementTool,
  onSelectStock,
  onStockTransformChange,
  onSelectServeableItem,
}) {
  const stockGroupRef = useRef(null);
  const dragRef = useRef({
    active: false,
    offset: new THREE.Vector3(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  });
  const gltf = useGLTF(stock.path);
  const basePosition = stock.localPosition || [0, stock.y || 0, stock.z || 0];
  const localRotation = stock.localRotation || [0, 0, 0];
  const stockItems = useMemo(
    () =>
      generateShelfStockLayout(stock).map((item) => {
        const root = clone(gltf.scene);
        normalizeStaticAsset(root, stock.targetWidth);
        const itemPosition = [
          roundValue(item.position[0] - basePosition[0]),
          roundValue(item.position[1] - basePosition[1]),
          roundValue(item.position[2] - basePosition[2]),
        ];
        return {
          ...item,
          position: itemPosition,
          root,
        };
      }),
    [basePosition, gltf.scene, stock]
  );

  const handlePointerDown = (event) => {
    event.stopPropagation();
    onSelectStock?.(stock.id);
    if (placementTool === "locked" || !parentRef.current) return;
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      const worldPosition = new THREE.Vector3(...basePosition).applyMatrix4(parentRef.current.matrixWorld);
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -worldPosition.y);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      const localHit = parentRef.current.worldToLocal(hit.clone());
      dragRef.current.offset.set(basePosition[0] - localHit.x, 0, basePosition[2] - localHit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked" || !parentRef.current) return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onStockTransformChange?.(stock.id, {
        localRotation: [
          localRotation[0],
          roundValue(localRotation[1] + deltaX * 0.012),
          localRotation[2],
        ],
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      const localHit = parentRef.current.worldToLocal(hit.clone());
      onStockTransformChange?.(stock.id, {
        localPosition: [
          roundValue(localHit.x + dragRef.current.offset.x),
          basePosition[1],
          roundValue(localHit.z + dragRef.current.offset.z),
        ],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      ref={stockGroupRef}
      name={`ShelfStock-${stock.id}`}
      position={basePosition}
      rotation={localRotation}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <LowPolyFoodTray stock={stock} />
      <TrayPriceTag
        stock={stock}
        parentRef={stockGroupRef}
        placementTool={placementTool}
        onSelectStock={onSelectStock}
        onTagTransformChange={onStockTransformChange}
      />
      {stockItems.map((item) => (
        <group
          key={item.key}
          name={item.id}
          position={item.position}
          rotation={item.rotation}
          userData={{
            serveable: true,
            foodType: stock.id,
            foodName: stock.name,
            serveableId: item.id,
            serveableIndex: item.index,
          }}
          onPointerDown={(event) => {
            handlePointerDown(event);
            onSelectStock?.(stock.id);
            onSelectServeableItem?.({
              id: item.id,
              foodType: stock.id,
              foodName: stock.name,
              index: item.index,
              total: stock.count,
            });
          }}
        >
          <primitive object={item.root} />
          {placementTool !== "locked" && selectedServeableItemId === item.id ? (
            <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[Math.max(0.06, stock.targetWidth * 0.48), 0.005, 8, 32]} />
              <meshBasicMaterial color="#22c55e" transparent opacity={0.9} />
            </mesh>
          ) : null}
        </group>
      ))}
      {placementTool !== "locked" && isSelected ? (
        <Html center position={[0, 0.18, 0]}>
          <div className="rm-anchor-label">{stock.name}</div>
        </Html>
      ) : null}
    </group>
  );
}

function ShelfStockGroup(props) {
  if (!props.stock.path) return <ProceduralStockGroup {...props} />;
  return <GltfStockGroup {...props} />;
}

function CroissantBasket({ placement, basketTool, onBasketTransformChange }) {
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  const transform = placement.foodBasketTransform;
  const basketGltf = useGLTF(RESTAURANT_MANAGER_CONFIG.basketAssetPath);
  const croissantGltf = useGLTF(RESTAURANT_MANAGER_CONFIG.croissantAssetPath);
  const croissantLayout = useMemo(() => generateCroissantPileLayout(transform.croissantCount), [transform.croissantCount]);

  const basket = useMemo(() => {
    const root = clone(basketGltf.scene);
    return normalizeStaticAsset(root, transform.basketWidth);
  }, [basketGltf.scene, transform.basketWidth]);

  const croissants = useMemo(
    () =>
      croissantLayout.map(([, , , rotation, layer], index) => {
        const root = clone(croissantGltf.scene);
        normalizeStaticAsset(root, transform.croissantWidth * (layer >= 3 ? 0.92 : 1));
        root.rotation.set(-0.08 + layer * 0.02, rotation + index * 0.07, index % 2 === 0 ? 0.1 : -0.08);
        return root;
      }),
    [croissantGltf.scene, croissantLayout, transform.croissantWidth]
  );

  if (!transform.visibleInPreview) return null;

  const handlePointerDown = (event) => {
    if (basketTool === "locked") return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (basketTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || basketTool === "locked") return;
    event.stopPropagation();

    if (basketTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onBasketTransformChange?.({
        rotation: [
          transform.rotation[0],
          roundValue(transform.rotation[1] + deltaX * 0.012),
          transform.rotation[2],
        ],
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onBasketTransformChange?.({
        position: [
          roundValue(hit.x + dragRef.current.offset.x),
          transform.position[1],
          roundValue(hit.z + dragRef.current.offset.z),
        ],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name="CroissantBasketSet"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <primitive object={basket} />
      {croissants.map((croissant, index) => {
        const [x, y, z] = croissantLayout[index];
        return (
          <group key={`croissant-${index}`} position={[x, y, z]}>
            <primitive object={croissant} />
          </group>
        );
      })}
    </group>
  );
}

function TableSurfaceOverlay({ placement, placementTool, onTransformChange }) {
  const transform = placement.tableOverlayTransform;
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });

  if (!transform?.visibleInPreview) return null;

  const handlePointerDown = (event) => {
    if (placementTool === "locked") return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.({
        rotation: [
          transform.rotation[0],
          roundValue(transform.rotation[1] + deltaX * 0.012),
          transform.rotation[2],
        ],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTransformChange?.({
        size: [
          roundValue(Math.max(0.2, transform.size[0] + deltaX * 0.012)),
          transform.size[1],
          roundValue(Math.max(0.2, transform.size[2] - deltaY * 0.012)),
        ],
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.({
        position: [
          roundValue(hit.x + dragRef.current.offset.x),
          transform.position[1],
          roundValue(hit.z + dragRef.current.offset.z),
        ],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name="EditableTableSurfaceOverlay"
      position={transform.position}
      rotation={transform.rotation}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <mesh receiveShadow>
        <boxGeometry args={transform.size} />
        <meshStandardMaterial color={transform.color || "#2b1208"} roughness={transform.roughness ?? 0.72} metalness={0.02} />
      </mesh>
    </group>
  );
}

function BrownServingPlate({ transform, index, packIndex }) {
  const colors = transform.colors || {};
  const width = transform.plateWidth || 0.68;
  const depth = transform.plateDepth || 0.48;
  const depthSetting = Number.isFinite(transform.plateHeight) ? transform.plateHeight : 0.032;
  const height = Math.max(0.004, depthSetting);
  const radius = Math.min(width, depth) * 0.18;
  const rimWidth = Math.min(width, depth) * 0.14;
  const wellWidth = width * 0.54;
  const wellDepth = depth * 0.47;
  const bodyGeometry = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(makeRoundedPlateShape(width, depth, radius), {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: Math.min(0.026, height * 0.36),
      bevelThickness: Math.min(0.018, height * 0.24),
      curveSegments: 16,
    });
    geometry.center();
    return geometry;
  }, [depth, height, radius, width]);
  const rimGeometry = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(
      makeRoundedPlateRingShape(
        width * 0.96,
        depth * 0.93,
        width * 0.96 - rimWidth * 2,
        depth * 0.93 - rimWidth * 2,
        radius * 0.86,
        Math.max(0.02, radius * 0.48)
      ),
      {
        depth: height * 0.48,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: Math.min(0.014, height * 0.18),
        bevelThickness: Math.min(0.01, height * 0.14),
        curveSegments: 16,
      }
    );
    geometry.center();
    return geometry;
  }, [depth, height, radius, rimWidth, width]);
  const bowlWallGeometry = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(
      makeRoundedPlateRingShape(width * 0.7, depth * 0.62, wellWidth, wellDepth, radius * 0.5, radius * 0.32),
      {
        depth: height * 0.56,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize: Math.min(0.012, height * 0.14),
        bevelThickness: Math.min(0.01, height * 0.12),
        curveSegments: 16,
      }
    );
    geometry.center();
    return geometry;
  }, [depth, height, radius, wellDepth, wellWidth, width]);
  const wellGeometry = useMemo(() => new THREE.ShapeGeometry(makeRoundedPlateShape(wellWidth, wellDepth, radius * 0.32), 16), [radius, wellDepth, wellWidth]);
  const yOffset = index * (transform.spacing || Math.max(0.014, height * 0.9));
  const sideReveal = index * 0.003;
  const packNumber = packIndex + 1;
  const plateNumber = index + 1;

  useEffect(() => () => {
    bodyGeometry.dispose();
    rimGeometry.dispose();
    bowlWallGeometry.dispose();
    wellGeometry.dispose();
  }, [bodyGeometry, bowlWallGeometry, rimGeometry, wellGeometry]);

  return (
    <group
      name={`RestaurantPlatePack-${packNumber}-Plate-${plateNumber}`}
      position={[sideReveal, yOffset, -sideReveal * 0.6]}
      userData={{ platePack: packNumber, plateIndex: plateNumber, serveablePlate: true }}
    >
      <mesh name={`RestaurantBrownPlateBody-Pack${packNumber}-${plateNumber}`} geometry={bodyGeometry} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={colors.body || "#a88f6f"} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh name={`RestaurantBrownPlateLowerShadow-Pack${packNumber}-${plateNumber}`} geometry={bodyGeometry} position={[0, -height * 0.18, depth * 0.035]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.015, 1.02, 1]}>
        <meshStandardMaterial color={colors.shadow || "#735b40"} roughness={0.62} metalness={0.04} />
      </mesh>
      <mesh name={`RestaurantBrownPlateRim-Pack${packNumber}-${plateNumber}`} geometry={rimGeometry} position={[0, height * 0.84, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={colors.rim || "#c2ad8d"} roughness={0.42} metalness={0.08} />
      </mesh>
      <mesh name={`RestaurantBrownPlateSoupBowlWall-Pack${packNumber}-${plateNumber}`} geometry={bowlWallGeometry} position={[0, height * 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={colors.rim || "#c2ad8d"} roughness={0.48} metalness={0.06} />
      </mesh>
      <mesh name={`RestaurantBrownPlateDeepSoupWell-Pack${packNumber}-${plateNumber}`} geometry={wellGeometry} position={[0, height * 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color={colors.well || "#b69f7f"} roughness={0.68} metalness={0.03} />
      </mesh>
      {index === (transform.count || 10) - 1 ? (
        <mesh name={`RestaurantBrownPlateTopHighlight-Pack${packNumber}`} position={[-width * 0.14, height * 1.28, -depth * 0.12]} rotation={[-Math.PI / 2, 0, -0.08]}>
          <planeGeometry args={[width * 0.38, depth * 0.055]} />
          <meshBasicMaterial color={colors.highlight || "#e0cfb3"} transparent opacity={0.38} />
        </mesh>
      ) : null}
    </group>
  );
}

function getPlatePackTransform(transform, packIndex, packCount) {
  const savedPack = transform.packTransforms?.[packIndex];
  const packGap = transform.packGap || 0.86;
  return {
    position: savedPack?.position || [(packIndex - (packCount - 1) / 2) * packGap, 0, 0],
    rotation: savedPack?.rotation || [0, 0, 0],
    scale: savedPack?.scale ?? 1,
  };
}

function PlatePackGroup({ transform, packIndex, packCount, platesPerPack, placementTool, parentRef, onPackTransformChange }) {
  const packTransform = getPlatePackTransform(transform, packIndex, packCount);
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });

  const handlePointerDown = (event) => {
    if (placementTool === "locked" || !parentRef.current) return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      const worldPosition = new THREE.Vector3(...packTransform.position).applyMatrix4(parentRef.current.matrixWorld);
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -worldPosition.y);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      const localHit = parentRef.current.worldToLocal(hit.clone());
      dragRef.current.offset.set(packTransform.position[0] - localHit.x, 0, packTransform.position[2] - localHit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked" || !parentRef.current) return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onPackTransformChange?.(packIndex, {
        rotation: [packTransform.rotation[0], roundValue(packTransform.rotation[1] + deltaX * 0.012), packTransform.rotation[2]],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onPackTransformChange?.(packIndex, {
        scale: roundValue(Math.max(0.45, Math.min(2.4, (packTransform.scale || 1) + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      const localHit = parentRef.current.worldToLocal(hit.clone());
      onPackTransformChange?.(packIndex, {
        position: [
          roundValue(localHit.x + dragRef.current.offset.x),
          packTransform.position[1],
          roundValue(localHit.z + dragRef.current.offset.z),
        ],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name={`RestaurantPlatePack-${packIndex + 1}`}
      position={packTransform.position}
      rotation={packTransform.rotation}
      scale={packTransform.scale}
      userData={{ platePack: packIndex + 1, platesPerPack, individuallyMoveablePack: true }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {Array.from({ length: platesPerPack }, (_, plateIndex) => (
        <BrownServingPlate
          key={plateIndex}
          transform={transform}
          index={plateIndex}
          packIndex={packIndex}
        />
      ))}
    </group>
  );
}

function ServingPlateStack({ placement, placementTool, onTransformChange }) {
  const transform = placement.plateStackTransform;
  const stackRef = useRef(null);
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  if (!transform?.visibleInPreview) return null;

  const platesPerPack = Math.max(1, transform.count || 10);
  const packCount = Math.max(1, transform.packCount || 2);
  const totalPlateCount = platesPerPack * packCount;

  const updatePackTransform = (packIndex, patch) => {
    const packTransforms = Array.from({ length: packCount }, (_, index) => ({
      ...getPlatePackTransform(transform, index, packCount),
    }));
    packTransforms[packIndex] = {
      ...packTransforms[packIndex],
      ...patch,
    };
    onTransformChange?.({ packTransforms });
  };

  const handlePointerDown = (event) => {
    if (placementTool === "locked") return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.({
        rotation: [transform.rotation[0], roundValue(transform.rotation[1] + deltaX * 0.012), transform.rotation[2]],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTransformChange?.({
        scale: roundValue(Math.max(0.45, Math.min(2.4, (transform.scale || 1) + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.({
        position: [roundValue(hit.x + dragRef.current.offset.x), transform.position[1], roundValue(hit.z + dragRef.current.offset.z)],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name="RestaurantBrownPlateStack"
      ref={stackRef}
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      userData={{ plateStack: true, packCount, platesPerPack, plateCount: totalPlateCount }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {Array.from({ length: packCount }, (_, packIndex) => (
        <PlatePackGroup
          key={packIndex}
          transform={transform}
          packIndex={packIndex}
          packCount={packCount}
          platesPerPack={platesPerPack}
          placementTool={placementTool}
          parentRef={stackRef}
          onPackTransformChange={updatePackTransform}
        />
      ))}
    </group>
  );
}

function ReceiptPrinterProps({ placement, placementTool, onTransformChange }) {
  const transform = placement.receiptPrinterTransform;
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  const receiptTexture = useMemo(() => makeReceiptPaperTexture(), []);

  useEffect(() => () => receiptTexture?.dispose?.(), [receiptTexture]);

  if (!transform?.visibleInPreview) return null;

  const handlePointerDown = (event) => {
    if (placementTool === "locked") return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.({
        rotation: [transform.rotation[0], roundValue(transform.rotation[1] + deltaX * 0.012), transform.rotation[2]],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTransformChange?.({
        scale: roundValue(Math.max(0.45, Math.min(2.2, (transform.scale || 1) + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.({
        position: [roundValue(hit.x + dragRef.current.offset.x), transform.position[1], roundValue(hit.z + dragRef.current.offset.z)],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name="EditableReceiptPrinter"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      userData={{ receiptPrinter: true }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <mesh name="ReceiptPrinterBase" position={[0, 0.058, 0]} scale={[0.36, 0.116, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_COLOR} roughness={0.48} metalness={0.08} />
      </mesh>
      <mesh name="ReceiptPrinterTopBevel" position={[0, 0.134, -0.026]} scale={[0.33, 0.044, 0.245]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.44} metalness={0.08} />
      </mesh>
      <mesh name="ReceiptPrinterPaperBay" position={[-0.03, 0.159, 0.03]} scale={[0.235, 0.014, 0.17]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.38} metalness={0.08} />
      </mesh>
      <mesh name="ReceiptPrinterReceiptSlotBezel" position={[-0.035, 0.168, 0.055]} scale={[0.235, 0.01, 0.035]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_DEEP_BROWN_LIGHT} roughness={0.38} metalness={0.08} />
      </mesh>
      <mesh name="ReceiptPrinterFrontSlot" position={[-0.018, 0.149, 0.162]} scale={[0.24, 0.014, 0.015]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.36} metalness={0.08} />
      </mesh>
      <mesh name="ReceiptPrinterBackHousing" position={[0.155, 0.112, -0.005]} scale={[0.055, 0.16, 0.29]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.44} metalness={0.08} />
      </mesh>
      <mesh name="ReceiptPrinterPaperSlip" position={[-0.035, 0.238, 0.08]} rotation={[-0.37, 0, 0]} castShadow userData={{ animatedReceiptSlip: true }}>
        <planeGeometry args={[0.2, 0.34]} />
        <meshStandardMaterial map={receiptTexture} color="#ffffff" roughness={0.62} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <group name="ReceiptPrinterButtonStrip" position={[0.126, 0.178, 0.036]} rotation={[-0.55, 0, 0]}>
        {["#2f77ab", CHECKOUT_DEEP_BROWN_LIGHT, CHECKOUT_DEEP_BROWN_LIGHT].map((color, index) => (
          <mesh key={color + index} position={[0, 0.002, -0.055 + index * 0.048]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.012, 18]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>
      <mesh name="ReceiptPrinterFrontPort" position={[-0.112, 0.034, 0.159]} scale={[0.052, 0.03, 0.012]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.4} metalness={0.06} />
      </mesh>
    </group>
  );
}

function WhitePlateStack({ placement, placementTool, pendingServeItem, onPlacePendingFood, onTransformChange }) {
  const transform = placement.whitePlateStackTransform;
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });

  if (!transform?.visibleInPreview) return null;

  const plateCount = Math.max(1, transform.count || 10);
  const spacing = transform.spacing || 0.018;
  const plateRadius = transform.radius || 0.17;

  const handlePointerDown = (event) => {
    if (placementTool === "locked") {
      if (pendingServeItem) {
        event.stopPropagation();
        onPlacePendingFood?.();
      }
      return;
    }
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.({
        rotation: [transform.rotation[0], roundValue(transform.rotation[1] + deltaX * 0.012), transform.rotation[2]],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTransformChange?.({
        scale: roundValue(Math.max(0.45, Math.min(2.4, (transform.scale || 1) + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.({
        position: [roundValue(hit.x + dragRef.current.offset.x), transform.position[1], roundValue(hit.z + dragRef.current.offset.z)],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name="EditableWhiteRoundPlateStack"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      userData={{ whitePlateStack: true, plateCount }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {Array.from({ length: plateCount }, (_, index) => (
        <group
          key={index}
          name={`WhiteRoundPlate-${index + 1}`}
          position={[index * 0.0014, index * spacing, -index * 0.0008]}
          userData={{ serveableWhitePlate: true, plateIndex: index + 1 }}
        >
          <mesh name={`WhiteRoundPlateBody-${index + 1}`} position={[0, 0.004, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[plateRadius * 0.96, plateRadius, 0.014, 64]} />
            <meshStandardMaterial color="#f5f1e8" roughness={0.48} metalness={0.02} />
          </mesh>
          <mesh name={`WhiteRoundPlateFlatLip-${index + 1}`} position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[plateRadius * 0.76, plateRadius * 0.94, 64]} />
            <meshStandardMaterial color="#fffdf7" roughness={0.42} metalness={0.02} side={THREE.DoubleSide} />
          </mesh>
          <mesh name={`WhiteRoundPlateCenter-${index + 1}`} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[plateRadius * 0.7, 64]} />
            <meshStandardMaterial color="#ded9cf" roughness={0.68} metalness={0.01} />
          </mesh>
        </group>
      ))}
      <mesh name="WhiteRoundPlateStackSideShadow" position={[0.008, spacing * plateCount * 0.5, plateRadius * 0.92]} scale={[plateRadius * 1.55, 0.23, 0.018]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#b8b1a5" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function MilkyServingTray({
  placement,
  placementTool,
  selectedItems = [],
  pendingServeItem,
  onPlacePendingFood,
  onReturnSelectedFood,
  onDeliverSelectedFood,
  onTransformChange,
}) {
  const transform = placement.servingTrayTransform;
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  const servingFoodDragRef = useRef({ active: false, foodId: null, distance: 0 });

  if (!transform?.visibleInPreview) return null;

  const handlePointerDown = (event) => {
    if (placementTool === "locked") {
      if (pendingServeItem) {
        event.stopPropagation();
        onPlacePendingFood?.();
      }
      return;
    }
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.({
        rotation: [transform.rotation[0], roundValue(transform.rotation[1] + deltaX * 0.012), transform.rotation[2]],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTransformChange?.({
        scale: roundValue(Math.max(0.45, Math.min(2.2, (transform.scale || 1) + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.({
        position: [roundValue(hit.x + dragRef.current.offset.x), transform.position[1], roundValue(hit.z + dragRef.current.offset.z)],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name="EditableMilkyServingTray"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      userData={{ servingTray: true, animatableProp: "serving-tray" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <mesh name="MilkyServingTrayFlatBase" castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.016, 0.42]} />
        <meshStandardMaterial color="#efe8d6" roughness={0.5} metalness={0.03} />
      </mesh>
      <mesh name="MilkyServingTrayFlatWell" position={[0, 0.014, 0]}>
        <boxGeometry args={[0.54, 0.006, 0.32]} />
        <meshStandardMaterial color="#fff7e8" roughness={0.58} metalness={0.02} />
      </mesh>
      <mesh name="MilkyServingTrayFrontLip" position={[0, 0.027, 0.21]} castShadow>
        <boxGeometry args={[0.64, 0.022, 0.024]} />
        <meshStandardMaterial color="#d9ceb8" roughness={0.48} metalness={0.04} />
      </mesh>
      <mesh name="MilkyServingTrayBackLip" position={[0, 0.027, -0.21]} castShadow>
        <boxGeometry args={[0.64, 0.022, 0.024]} />
        <meshStandardMaterial color="#d9ceb8" roughness={0.48} metalness={0.04} />
      </mesh>
      <mesh name="MilkyServingTrayLeftLip" position={[-0.32, 0.027, 0]} castShadow>
        <boxGeometry args={[0.024, 0.022, 0.42]} />
        <meshStandardMaterial color="#d9ceb8" roughness={0.48} metalness={0.04} />
      </mesh>
      <mesh name="MilkyServingTrayRightLip" position={[0.32, 0.027, 0]} castShadow>
        <boxGeometry args={[0.024, 0.022, 0.42]} />
        <meshStandardMaterial color="#d9ceb8" roughness={0.48} metalness={0.04} />
      </mesh>
      {selectedItems.map((item, index) => {
        const column = index % 4;
        const row = Math.floor(index / 4);
        return (
          <group
            key={`${item.id}-${index}`}
            name={`SelectedServingTrayFood-${item.id}-${index + 1}`}
            position={[-0.21 + column * 0.14, 0.055, -0.1 + row * 0.13]}
            scale={item.itemScale || 0.7}
            userData={{ selectedServingFood: true, foodType: item.id }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.target.setPointerCapture?.(event.pointerId);
              servingFoodDragRef.current = { active: true, foodId: item.id, distance: 0 };
            }}
            onPointerMove={(event) => {
              if (!servingFoodDragRef.current.active || servingFoodDragRef.current.foodId !== item.id) return;
              event.stopPropagation();
              const movementX = event.nativeEvent?.movementX || 0;
              const movementY = event.nativeEvent?.movementY || 0;
              servingFoodDragRef.current.distance += Math.abs(movementX) + Math.abs(movementY);
            }}
            onPointerUp={(event) => {
              if (!servingFoodDragRef.current.active || servingFoodDragRef.current.foodId !== item.id) return;
              event.stopPropagation();
              event.target.releasePointerCapture?.(event.pointerId);
              const draggedEnough = servingFoodDragRef.current.distance > 6;
              servingFoodDragRef.current = { active: false, foodId: null, distance: 0 };
              if (draggedEnough) {
                onDeliverSelectedFood?.(item.id);
                return;
              }
              onReturnSelectedFood?.(item.id);
            }}
            onPointerCancel={(event) => {
              event.stopPropagation();
              servingFoodDragRef.current = { active: false, foodId: null, distance: 0 };
            }}
          >
            <TrayFoodItem type={item.proceduralType} index={index + 1} />
          </group>
        );
      })}
    </group>
  );
}

function CheckoutCounterProps({ placement, placementTool, onTransformChange }) {
  const transform = placement.checkoutPropsTransform;
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  const displayDragRef = useRef({ active: false });
  const screenTexture = useMemo(() => makeMoneyMachineScreenTexture(0), []);
  const keyTextures = useMemo(
    () =>
      MONEY_MACHINE_KEY_LABELS.map((label) => {
        const operatorColor = ["+", "-", "x", "/", "="].includes(label) ? "#265f7a" : CHECKOUT_DEEP_BROWN;
        const actionColor = label === "OK" ? "#247244" : label === "C" || label === "DEL" ? "#8a4031" : operatorColor;
        return makeMoneyMachineKeyTexture(label, actionColor);
      }),
    []
  );

  if (!transform?.visibleInPreview) return null;
  const displayTilt = transform.displayTilt ?? MONEY_MACHINE_SCREEN_TILT_DEFAULT;

  const handlePointerDown = (event) => {
    if (placementTool === "locked") return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.({
        rotation: [transform.rotation[0], roundValue(transform.rotation[1] + deltaX * 0.012), transform.rotation[2]],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTransformChange?.({
        scale: roundValue(Math.max(0.35, Math.min(2.2, transform.scale + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.({
        position: [roundValue(hit.x + dragRef.current.offset.x), transform.position[1], roundValue(hit.z + dragRef.current.offset.z)],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  const handleDisplayPointerDown = (event) => {
    if (placementTool === "locked") return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    displayDragRef.current.active = true;
  };

  const handleDisplayPointerMove = (event) => {
    if (!displayDragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();
    const deltaY = event.nativeEvent?.movementY || 0;
    onTransformChange?.({
      displayTilt: clampMoneyMachineScreenTilt(displayTilt - deltaY * 0.004),
    });
  };

  const handleDisplayPointerUp = (event) => {
    if (!displayDragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    displayDragRef.current.active = false;
  };

  const keys = MONEY_MACHINE_KEY_LABELS;

  return (
    <group
      name="EditableMoneyMachine"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <mesh name="MoneyMachineShadowBase" position={[0, 0.018, 0.02]} scale={[0.82, 0.035, 0.64]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.58} metalness={0.06} />
      </mesh>
      <mesh name="MoneyMachineMainBody" position={[0, 0.07, 0.035]} scale={[0.76, 0.105, 0.58]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_COLOR} roughness={0.48} metalness={0.08} />
      </mesh>
      <mesh name="MoneyMachineFrontLip" position={[0, 0.128, 0.337]} scale={[0.78, 0.035, 0.045]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.44} metalness={0.08} />
      </mesh>
      <mesh name="MoneyMachineBackHinge" position={[0, 0.132, -0.234]} scale={[0.64, 0.045, 0.055]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.42} metalness={0.08} />
      </mesh>
      <mesh name="MoneyMachineLeftBevel" position={[-0.404, 0.09, 0.032]} scale={[0.035, 0.092, 0.52]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_LIGHT} roughness={0.5} metalness={0.06} />
      </mesh>
      <mesh name="MoneyMachineRightBevel" position={[0.404, 0.09, 0.032]} scale={[0.035, 0.092, 0.52]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.5} metalness={0.08} />
      </mesh>

      <group
        name="MoneyMachineDisplay"
        position={[0, 0.265, -0.24]}
        rotation={[displayTilt, 0, 0]}
        onPointerDown={handleDisplayPointerDown}
        onPointerMove={handleDisplayPointerMove}
        onPointerUp={handleDisplayPointerUp}
        onPointerCancel={handleDisplayPointerUp}
      >
        <mesh name="MoneyMachineScreenBezel" scale={[0.52, 0.045, 0.265]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.42} metalness={0.08} />
        </mesh>
        <mesh name="MoneyMachineScreenGlass" position={[0, 0.024, 0.001]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.43, 0.19]} />
          <meshStandardMaterial
            map={screenTexture}
            color="#ffffff"
            emissive="#17385a"
            emissiveIntensity={0.55}
            roughness={0.18}
            metalness={0.02}
          />
        </mesh>
        <mesh name="MoneyMachineScreenHighlight" position={[-0.135, 0.027, -0.073]} rotation={[-Math.PI / 2, 0, -0.1]}>
          <planeGeometry args={[0.17, 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      </group>

      <group name="MoneyMachineKeypadPanel" position={[0, 0.151, 0.095]} rotation={[-0.16, 0, 0]}>
        <mesh name="MoneyMachineKeypadDeck" position={[0, -0.015, 0.065]} scale={[0.66, 0.03, 0.405]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.44} metalness={0.08} />
        </mesh>
        {keys.map((label, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          const x = -0.235 + col * 0.155;
          const z = -0.094 + row * 0.074;
          return (
            <mesh key={label} name={`MoneyMachineKey-${label}`} position={[x, 0.014, z]} scale={[0.112, 0.022, 0.051]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                map={keyTextures[index]}
                color="#ffffff"
                roughness={0.32}
                metalness={0.08}
              />
            </mesh>
          );
        })}
      </group>

      <group name="MoneyMachineSideControls" position={[0.452, 0.16, 0.082]} rotation={[-0.16, 0, 0]}>
        {["#315a72", "#315a72", "#8a4031"].map((color, index) => (
          <mesh key={color + index} position={[0, 0.012, -0.065 + index * 0.082]} scale={[0.045, 0.018, 0.05]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.08} />
          </mesh>
        ))}
      </group>

      <group name="MoneyMachineCardReader" position={[-0.398, 0.174, 0.102]} rotation={[-0.16, 0, 0]}>
        <mesh scale={[0.055, 0.026, 0.185]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.38} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0]} scale={[0.034, 0.006, 0.148]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={CHECKOUT_DEEP_BROWN_LIGHT} roughness={0.32} metalness={0.06} />
        </mesh>
      </group>

      <group name="MoneyMachineReceiptSlot" position={[0, 0.158, 0.285]} rotation={[-0.08, 0, 0]}>
        <mesh scale={[0.44, 0.014, 0.018]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.38} metalness={0.08} />
        </mesh>
      </group>

      <group name="MoneyMachineRubberFeet" position={[0, 0.002, 0]}>
        {[[-0.25, -0.16], [0.25, -0.16], [-0.25, 0.19], [0.25, 0.19]].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.012, 18]} />
            <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.5} metalness={0.06} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CashDrawerProps({ placement, placementTool, onTransformChange }) {
  const transform = placement.cashDrawerTransform;
  const noteRackTilt = Number.isFinite(transform.noteRackTilt) ? transform.noteRackTilt : 0.77;
  const noteStackTilt = Number.isFinite(transform.noteStackTilt) ? transform.noteStackTilt : 0.77;
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  const noteTextures = useLoader(THREE.TextureLoader, CASH_DRAWER_NOTES.map((note) => note.imagePath));
  const coinTextures = useLoader(THREE.TextureLoader, CASH_DRAWER_COINS.map((coin) => coin.imagePath));
  useMemo(() => {
    [...noteTextures, ...coinTextures].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    });
  }, [coinTextures, noteTextures]);

  if (!transform?.visibleInPreview) return null;

  const handlePointerDown = (event) => {
    if (placementTool === "locked") return;
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -transform.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(transform.position[0] - hit.x, 0, transform.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.({
        rotation: [transform.rotation[0], roundValue(transform.rotation[1] + deltaX * 0.012), transform.rotation[2]],
      });
      return;
    }

    if (placementTool === "resize") {
      const deltaX = event.nativeEvent?.movementX || 0;
      const deltaY = event.nativeEvent?.movementY || 0;
      onTransformChange?.({
        scale: roundValue(Math.max(0.45, Math.min(2.4, (transform.scale || 1) + (deltaX - deltaY) * 0.008))),
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.({
        position: [roundValue(hit.x + dragRef.current.offset.x), transform.position[1], roundValue(hit.z + dragRef.current.offset.z)],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      name="EditableCashDrawer"
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      userData={{ cashDrawer: true, notes: CASH_DRAWER_NOTES.length, coins: CASH_DRAWER_COINS.length }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <mesh name="CashDrawerBase" position={[0, 0.035, 0]} scale={[1.28, 0.07, 0.56]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_COLOR} roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh name="CashDrawerInnerTray" position={[0, 0.082, -0.012]} scale={[1.2, 0.035, 0.47]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_LIGHT} roughness={0.55} metalness={0.05} />
      </mesh>
      <group name="CashDrawerSlantedNoteRack" position={[0, 0.124, -0.106]} rotation={[noteRackTilt, 0, 0]}>
        <mesh name="CashDrawerNoteRackDeck" position={[0, -0.018, 0]} scale={[1.24, 0.018, 0.36]} receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.52} metalness={0.06} />
        </mesh>
        {[-0.485, -0.365, -0.245, -0.125, -0.005, 0.115, 0.235].map((x, index) => (
          <mesh key={index} name={`CashDrawerDivider-${index + 1}`} position={[x, 0.034, 0]} scale={[0.014, 0.1, 0.35]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.42} metalness={0.06} />
          </mesh>
        ))}
        {CASH_DRAWER_NOTES.map((note, index) => {
          const x = -0.54 + index * 0.12;
          const texture = noteTextures[index];
          return (
            <group key={note.id} name={`CashDrawerNoteStack-${note.id}`} position={[x, 0.072, 0.018]} rotation={[noteStackTilt, 0, 0]} userData={{ cashType: "note-stack", value: note.id }}>
              {Array.from({ length: CASH_DRAWER_NOTE_STACK_COUNT }, (_, stackIndex) => (
                <group
                  key={stackIndex}
                  name={`CashDrawerNote-${note.id}-${stackIndex + 1}`}
                  position={[0, stackIndex * 0.006, stackIndex * 0.002]}
                  rotation={[0, 0, (stackIndex - 2) * 0.006]}
                  userData={{ cashType: "note", value: note.id, stackIndex: stackIndex + 1 }}
                >
                  <mesh position={[0, -0.012, 0]} scale={[0.112, 0.007, 0.286]} castShadow receiveShadow>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.44} metalness={0.06} />
                  </mesh>
                  <mesh name={`CashDrawerNoteFace-${note.id}-${stackIndex + 1}`} position={[0, -0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.106, 0.272]} />
                  <meshStandardMaterial map={texture} color="#ffffff" roughness={0.48} metalness={0.01} side={THREE.DoubleSide} />
                  </mesh>
                </group>
              ))}
            </group>
          );
        })}
      </group>
      {CASH_DRAWER_COINS.map((coin, index) => {
        const x = -0.48 + index * 0.16;
        const texture = coinTextures[index];
        return (
          <group key={coin.id} name={`CashDrawerCoinStack-${coin.id}`} position={[x, 0.138, 0.18]} userData={{ cashType: "coin-stack", value: coin.label }}>
            <mesh name={`CashDrawerCoinWell-${coin.id}`} position={[0, -0.035, 0]} scale={[0.142, 0.018, 0.136]} receiveShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.46} metalness={0.06} />
            </mesh>
            <mesh name={`CashDrawerCoinWellBack-${coin.id}`} position={[0, -0.002, -0.076]} scale={[0.142, 0.028, 0.009]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.42} metalness={0.06} />
            </mesh>
            <mesh name={`CashDrawerCoinWellFront-${coin.id}`} position={[0, -0.002, 0.076]} scale={[0.142, 0.028, 0.009]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.42} metalness={0.06} />
            </mesh>
            <mesh name={`CashDrawerCoinWellLeft-${coin.id}`} position={[-0.08, -0.002, 0]} scale={[0.009, 0.028, 0.136]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.42} metalness={0.06} />
            </mesh>
            <mesh name={`CashDrawerCoinWellRight-${coin.id}`} position={[0.08, -0.002, 0]} scale={[0.009, 0.028, 0.136]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={CHECKOUT_DEEP_BROWN} roughness={0.42} metalness={0.06} />
            </mesh>
            {Array.from({ length: CASH_DRAWER_COIN_STACK_COUNT }, (_, stackIndex) => (
              <group
                key={stackIndex}
                name={`CashDrawerCoin-${coin.id}-${stackIndex + 1}`}
                position={[0, stackIndex * 0.014, stackIndex * 0.001]}
                rotation={[0, (stackIndex - 1.5) * 0.05, 0]}
                userData={{ cashType: "coin", value: coin.label, stackIndex: stackIndex + 1 }}
              >
                <mesh name={`CashDrawerCoinFace-${coin.id}-${stackIndex + 1}`} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
                  <circleGeometry args={[0.066, 48]} />
                  <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
      <mesh name="CashDrawerFrontLip" position={[0, 0.142, 0.315]} scale={[1.3, 0.075, 0.04]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={CHECKOUT_BODY_DARK} roughness={0.44} metalness={0.08} />
      </mesh>
    </group>
  );
}

function FoodTrayStationAsset({
  asset,
  selectedStockId,
  selectedServeableItemId,
  placementTool,
  onSelectStock,
  onStockTransformChange,
  onSelectServeableItem,
}) {
  const assetGroupRef = useRef(null);

  return (
    <group
      ref={assetGroupRef}
      name={`FoodTrayStation-${asset.id}`}
      position={asset.position}
      rotation={asset.rotation}
      scale={asset.scale}
    >
      {asset.shelfStock?.map((stock) => (
        <ShelfStockGroup
          key={stock.id}
          stock={stock}
          parentRef={assetGroupRef}
          isSelected={selectedStockId === stock.id}
          selectedServeableItemId={selectedServeableItemId}
          placementTool={placementTool}
          onSelectStock={onSelectStock}
          onStockTransformChange={onStockTransformChange}
          onSelectServeableItem={onSelectServeableItem}
        />
      ))}
    </group>
  );
}

function PlaceableModelAsset({
  asset,
  isSelected,
  selectedStockId,
  selectedServeableItemId,
  placementTool,
  onSelect,
  onTransformChange,
  onSelectStock,
  onStockTransformChange,
  onSelectServeableItem,
}) {
  const assetGroupRef = useRef(null);
  const dragRef = useRef({ active: false, offset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  const loadedAsset = useGLTF(asset.path);
  const model = useMemo(() => {
    const root = clone(loadedAsset.scene);
    return normalizeStaticAsset(root, asset.targetWidth);
  }, [asset.targetWidth, loadedAsset.scene]);

  const handlePointerDown = (event) => {
    event.stopPropagation();
    onSelect?.(asset.id);
    if (placementTool === "locked") return;
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current.active = true;

    if (placementTool === "move") {
      dragRef.current.plane.set(new THREE.Vector3(0, 1, 0), -asset.position[1]);
      const hit = new THREE.Vector3();
      event.ray.intersectPlane(dragRef.current.plane, hit);
      dragRef.current.offset.set(asset.position[0] - hit.x, 0, asset.position[2] - hit.z);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active || placementTool === "locked") return;
    event.stopPropagation();

    if (placementTool === "rotate") {
      const deltaX = event.nativeEvent?.movementX || 0;
      onTransformChange?.(asset.id, {
        rotation: [
          asset.rotation[0],
          roundValue(asset.rotation[1] + deltaX * 0.012),
          asset.rotation[2],
        ],
      });
      return;
    }

    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragRef.current.plane, hit)) {
      onTransformChange?.(asset.id, {
        position: [
          roundValue(hit.x + dragRef.current.offset.x),
          asset.position[1],
          roundValue(hit.z + dragRef.current.offset.z),
        ],
      });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.active) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  return (
    <group
      ref={assetGroupRef}
      name={`PlaceableDisplayAsset-${asset.id}`}
      position={asset.position}
      rotation={asset.rotation}
      scale={asset.scale}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {asset.hideModel ? null : <primitive object={model} />}
      {asset.shelfStock?.map((stock) => (
        <ShelfStockGroup
          key={stock.id}
          stock={stock}
          parentRef={assetGroupRef}
          isSelected={selectedStockId === stock.id}
          selectedServeableItemId={selectedServeableItemId}
          placementTool={placementTool}
          onSelectStock={onSelectStock}
          onStockTransformChange={onStockTransformChange}
          onSelectServeableItem={onSelectServeableItem}
        />
      ))}
      {isSelected ? (
        <>
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[asset.hideModel ? 1.95 : Math.max(0.22, asset.targetWidth * 0.6), 0.012, 8, 64]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.86} />
          </mesh>
          <Html center position={[0, asset.hideModel ? 0.42 : Math.max(0.36, asset.targetWidth * 0.55), 0]}>
            <div className="rm-anchor-label">{asset.name}</div>
          </Html>
        </>
      ) : null}
    </group>
  );
}

function PlaceableDisplayAsset(props) {
  if (props.asset.hideModel) {
    return <FoodTrayStationAsset {...props} />;
  }

  return <PlaceableModelAsset {...props} />;
}

function FoodDisplayAssets({
  placement,
  selectedAssetId,
  selectedStockId,
  selectedServeableItemId,
  placementTool,
  onSelectAsset,
  onAssetTransformChange,
  onSelectStock,
  onStockTransformChange,
  onSelectServeableItem,
}) {
  return (
    <group name="RestaurantFoodDisplayAssets">
      {placement.foodDisplayAssets.map((asset) => (
        <PlaceableDisplayAsset
          key={asset.id}
          asset={asset}
          isSelected={selectedAssetId === asset.id}
          selectedStockId={selectedAssetId === asset.id ? selectedStockId : ""}
          selectedServeableItemId={selectedServeableItemId}
          placementTool={placementTool}
          onSelect={onSelectAsset}
          onTransformChange={onAssetTransformChange}
          onSelectStock={onSelectStock}
          onStockTransformChange={(stockId, patch) => onStockTransformChange(asset.id, stockId, patch)}
          onSelectServeableItem={onSelectServeableItem}
        />
      ))}
    </group>
  );
}

function alignCharacterToGround(root, targetHeight) {
  root.updateMatrixWorld(true);
  const initialBounds = new THREE.Box3().setFromObject(root);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  const scale = targetHeight / Math.max(0.001, initialSize.y);

  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(root);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaledBounds.min.y;

  return {
    scale: Number(scale.toFixed(4)),
    originalHeight: Number(initialSize.y.toFixed(2)),
    targetHeight,
  };
}

function getPathPosition(point) {
  return new THREE.Vector3(point.position[0], point.position[1], point.position[2]);
}

function getPathSegmentTransform(startPoint, endPoint, floorY) {
  const start = new THREE.Vector3(startPoint.position[0], floorY, startPoint.position[2]);
  const end = new THREE.Vector3(endPoint.position[0], floorY, endPoint.position[2]);
  const delta = end.clone().sub(start);
  const length = Math.max(0.001, delta.length());
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const angle = Math.atan2(delta.x, delta.z);
  return { midpoint, length, angle };
}

function PathSegmentBoundary({ startPoint, endPoint, floorY }) {
  const { midpoint, length, angle } = useMemo(
    () => getPathSegmentTransform(startPoint, endPoint, floorY),
    [endPoint, floorY, startPoint]
  );
  const pathWidth = RESTAURANT_MANAGER_CONFIG.pathEditor.pathWidth;
  const railOffset = pathWidth / 2;

  return (
    <group position={[midpoint.x, floorY + 0.018, midpoint.z]} rotation={[0, angle, 0]}>
      <mesh name="BoundedWalkingPathSurface" receiveShadow>
        <boxGeometry args={[pathWidth, 0.018, length]} />
        <meshStandardMaterial color="#fff4a8" transparent opacity={0.16} roughness={0.84} />
      </mesh>
      {[-railOffset, railOffset].map((offset) => (
        <mesh key={offset} name="WalkingPathSideBoundary" position={[offset, 0.034, 0]}>
          <boxGeometry args={[0.055, 0.05, length]} />
          <meshStandardMaterial color="#facc15" emissive="#b45309" emissiveIntensity={0.08} roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function RestaurantWalkingCharacter({ placement, customerPath, onCharacterReady }) {
  const config = placement.walkingCharacterTransform;
  const loadedFbx = useLoader(FBXLoader, RESTAURANT_MANAGER_CONFIG.walkingCharacterAssetPath);
  const groupRef = useRef(null);
  const mixerRef = useRef(null);
  const actionRef = useRef(null);
  const pathStateRef = useRef({ index: 0, wait: 0, turn: 0, turnTarget: 0, completed: false });
  const [routeVisible, setRouteVisible] = useState(true);
  const hasUsablePath = customerPath.length > 1;
  const pathKey = useMemo(
    () => customerPath.map((point) => `${point.id}:${point.type}:${point.position.join(",")}`).join("|"),
    [customerPath]
  );

  const model = useMemo(() => {
    const root = clone(loadedFbx);
    root.traverse((node) => {
      if (node.isMesh || node.isSkinnedMesh) {
        node.castShadow = true;
        node.receiveShadow = false;
        node.frustumCulled = true;
      }

      const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
      materials.forEach((material) => {
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
        if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        material.needsUpdate = true;
      });
    });

    const alignment = alignCharacterToGround(root, config.targetHeight);
    return { root, alignment };
  }, [config.targetHeight, loadedFbx]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(model.root);
    mixerRef.current = mixer;

    const clips = loadedFbx.animations || [];
    const walkingClip = clips.find((clip) => /walk|walking/i.test(clip.name)) || clips[0];
    if (walkingClip) {
      const action = mixer.clipAction(walkingClip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = config.playbackSpeed;
      action.play();
      actionRef.current = action;
    }

    onCharacterReady?.({
      assetPath: RESTAURANT_MANAGER_CONFIG.walkingCharacterAssetPath,
      clipNames: clips.map((clip) => clip.name),
      activeClip: walkingClip?.name || "none",
      alignment: model.alignment,
      transform: config,
    });

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model.root);
      mixerRef.current = null;
      actionRef.current = null;
    };
  }, [config, loadedFbx.animations, model, onCharacterReady]);

  useEffect(() => {
    pathStateRef.current = { index: 0, wait: 0, turn: 0, turnTarget: 0, completed: false };
    setRouteVisible(true);
    if (groupRef.current && hasUsablePath) {
      groupRef.current.position.copy(getPathPosition(customerPath[0]));
      groupRef.current.rotation.y = config.rotation[1] || 0;
    }
  }, [config.rotation, customerPath, hasUsablePath, pathKey]);

  useFrame((_, delta) => {
    mixerRef.current?.update(Math.min(delta, 0.05));

    if (!groupRef.current) return;

    if (!hasUsablePath) {
      if (actionRef.current) actionRef.current.timeScale = config.playbackSpeed;
      groupRef.current.position.fromArray(config.position);
      groupRef.current.rotation.y = config.rotation[1] || 0;
      return;
    }

    const state = pathStateRef.current;
    if (state.completed) {
      if (actionRef.current) actionRef.current.timeScale = 0;
      return;
    }

    if (state.turn > 0) {
      state.turn = Math.max(0, state.turn - delta);
      if (actionRef.current) actionRef.current.timeScale = 0;

      const angleDiff = state.turnTarget - groupRef.current.rotation.y;
      const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      groupRef.current.rotation.y += normalizedDiff * Math.min(1, delta * 7);

      if (state.turn === 0) {
        groupRef.current.rotation.y = state.turnTarget;
        state.wait = RESTAURANT_MANAGER_CONFIG.pathEditor.orderStopSeconds;
      }
      return;
    }

    const currentPoint = customerPath[state.index] || customerPath[0];
    const nextPoint = customerPath[state.index + 1];
    const currentPosition = getPathPosition(currentPoint);

    if (!nextPoint) {
      groupRef.current.position.copy(currentPosition);
      state.completed = true;
      setRouteVisible(false);
      return;
    }

    if (state.wait > 0) {
      state.wait -= delta;
      if (actionRef.current) actionRef.current.timeScale = 0;
      return;
    }

    if (actionRef.current) actionRef.current.timeScale = config.playbackSpeed;

    const targetPosition = getPathPosition(nextPoint);
    const direction = targetPosition.clone().sub(groupRef.current.position);
    const distance = direction.length();
    const speed = RESTAURANT_MANAGER_CONFIG.pathEditor.walkSpeed;

    if (distance < 0.05) {
      groupRef.current.position.copy(targetPosition);
      state.index += 1;
      if (state.index >= customerPath.length - 1) {
        state.completed = true;
        setRouteVisible(false);
        return;
      }
      if (nextPoint.type === "order") {
        state.turn = RESTAURANT_MANAGER_CONFIG.pathEditor.orderTurnSeconds;
        state.turnTarget = groupRef.current.rotation.y - Math.PI / 2;
        state.wait = 0;
      } else {
        state.wait = 0;
      }
      return;
    }

    direction.normalize();
    groupRef.current.position.addScaledVector(direction, Math.min(distance, speed * delta));
    const targetAngle = Math.atan2(direction.x, direction.z);
    let angleDiff = targetAngle - groupRef.current.rotation.y;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    groupRef.current.rotation.y += angleDiff * Math.min(1, delta * 8);
  });

  if (!routeVisible) return null;

  return (
    <group
      ref={groupRef}
      name="RestaurantWalkingCharacter"
      position={hasUsablePath ? customerPath[0].position : config.position}
      rotation={config.rotation}
    >
      <primitive object={model.root} />
    </group>
  );
}

function BarServiceCounterAnchor({ placement }) {
  const anchor = placement.barServiceCounterAnchor;
  if (!anchor.visibleInPreview) return null;

  return (
    <group position={anchor.position} rotation={anchor.rotation} name="FutureEdibleAssetBarAnchor">
      <mesh>
        <boxGeometry args={anchor.size} />
        <meshStandardMaterial color="#facc15" transparent opacity={0.34} emissive="#f59e0b" emissiveIntensity={0.12} />
      </mesh>
      <Html center position={[0, 0.18, 0]}>
        <div className="rm-anchor-label">Future food table</div>
      </Html>
    </group>
  );
}

function FloatingGuideRing() {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.elapsedTime * 0.22;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <torusGeometry args={[3.2, 0.025, 8, 96]} />
      <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.22} />
    </mesh>
  );
}

function FixedRestaurantCamera() {
  const { camera } = useThree();
  const cameraView = useMemo(loadLockedCameraView, []);

  useEffect(() => {
    camera.position.fromArray(cameraView.position);
    camera.lookAt(...cameraView.target);
    camera.updateProjectionMatrix();
  }, [camera, cameraView.position, cameraView.target]);

  return null;
}

function CustomerPathLayer({ points }) {
  const floorY = RESTAURANT_MANAGER_CONFIG.pathEditor.floorY;
  const pathSegments = useMemo(
    () => points.slice(0, -1).map((point, index) => ({ startPoint: point, endPoint: points[index + 1] })),
    [points]
  );
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points.map((point) => new THREE.Vector3(point.position[0], floorY + 0.09, point.position[2])));
    return geometry;
  }, [floorY, points]);

  useEffect(() => () => lineGeometry.dispose(), [lineGeometry]);

  return (
    <group name="DefaultCustomerPathPreview">
      {pathSegments.map(({ startPoint, endPoint }, index) => (
        <PathSegmentBoundary
          key={`${startPoint.id || index}-${endPoint.id || index + 1}`}
          startPoint={startPoint}
          endPoint={endPoint}
          floorY={floorY}
        />
      ))}

      {points.length > 1 ? (
        <line geometry={lineGeometry}>
          <lineBasicMaterial color="#fff4a8" linewidth={3} transparent opacity={0.95} />
        </line>
      ) : null}

      {points.map((point, index) => {
        const style = PATH_POINT_STYLES[point.type] || PATH_POINT_STYLES.walk;
        return (
          <group key={point.id} position={point.position}>
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[RESTAURANT_MANAGER_CONFIG.pathEditor.pointRadius, 18, 12]} />
              <meshStandardMaterial color={style.color} emissive={style.emissive} emissiveIntensity={0.35} />
            </mesh>
            {point.type === "order" ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <torusGeometry args={[0.38, 0.025, 8, 48]} />
                <meshStandardMaterial color={style.color} emissive={style.emissive} emissiveIntensity={0.28} />
              </mesh>
            ) : null}
          </group>
        );
      })}

    </group>
  );
}

function RestaurantSceneCustomer({ customer }) {
  const sourceTexture = useLoader(THREE.TextureLoader, customer.imagePath);
  const texture = useMemo(() => {
    const cloned = sourceTexture.clone();
    cloned.colorSpace = THREE.SRGBColorSpace;
    cloned.wrapS = THREE.ClampToEdgeWrapping;
    cloned.wrapT = THREE.ClampToEdgeWrapping;
    cloned.repeat.set(1, customer.visibleFraction);
    cloned.offset.set(0, 1 - customer.visibleFraction);
    cloned.needsUpdate = true;
    return cloned;
  }, [customer.visibleFraction, sourceTexture]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={customer.position} scale={customer.scale} renderOrder={7}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function RestaurantSceneCustomers() {
  return (
    <group name="RestaurantSceneCustomers">
      {RESTAURANT_SCENE_CUSTOMERS.map((customer) => (
        <RestaurantSceneCustomer customer={customer} key={customer.id} />
      ))}
    </group>
  );
}

function RestaurantSceneContent({
  placement,
  basketTool,
  selectedAssetId,
  selectedStockId,
  selectedServeableItemId,
  selectedServingItems,
  pendingServeItem,
  onBasketTransformChange,
  onSelectAsset,
  onAssetTransformChange,
  onSelectStock,
  onStockTransformChange,
  onSelectServeableItem,
  onPlacePendingFood,
  onReturnSelectedFood,
  onDeliverSelectedFood,
  onBoundsReady,
  onTableOverlayTransformChange,
  onCheckoutPropsTransformChange,
  onCashDrawerTransformChange,
  onReceiptPrinterTransformChange,
  onWhitePlateStackTransformChange,
  onServingTrayTransformChange,
  onPlateStackTransformChange,
}) {
  return (
    <>
      <RestaurantSceneModel placement={placement} onBoundsReady={onBoundsReady} />
      <TableSurfaceOverlay
        placement={placement}
        placementTool={basketTool}
        onTransformChange={onTableOverlayTransformChange}
      />
      <CheckoutCounterProps
        placement={placement}
        placementTool={basketTool}
        onTransformChange={onCheckoutPropsTransformChange}
      />
      <CashDrawerProps
        placement={placement}
        placementTool={basketTool}
        onTransformChange={onCashDrawerTransformChange}
      />
      <ReceiptPrinterProps
        placement={placement}
        placementTool={basketTool}
        onTransformChange={onReceiptPrinterTransformChange}
      />
      <WhitePlateStack
        placement={placement}
        placementTool={basketTool}
        pendingServeItem={pendingServeItem}
        onPlacePendingFood={onPlacePendingFood}
        onTransformChange={onWhitePlateStackTransformChange}
      />
      <MilkyServingTray
        placement={placement}
        placementTool={basketTool}
        selectedItems={selectedServingItems}
        pendingServeItem={pendingServeItem}
        onPlacePendingFood={onPlacePendingFood}
        onReturnSelectedFood={onReturnSelectedFood}
        onDeliverSelectedFood={onDeliverSelectedFood}
        onTransformChange={onServingTrayTransformChange}
      />
      <ServingPlateStack
        placement={placement}
        placementTool={basketTool}
        onTransformChange={onPlateStackTransformChange}
      />
      <FoodDisplayAssets
        placement={placement}
        selectedAssetId={selectedAssetId}
        selectedStockId={selectedStockId}
        selectedServeableItemId={selectedServeableItemId}
        placementTool={basketTool}
        onSelectAsset={onSelectAsset}
        onAssetTransformChange={onAssetTransformChange}
        onSelectStock={onSelectStock}
        onStockTransformChange={onStockTransformChange}
        onSelectServeableItem={onSelectServeableItem}
      />
      <BarServiceCounterAnchor placement={placement} />
    </>
  );
}

function RestaurantScene({
  placement,
  autoFrame,
  basketTool,
  selectedAssetId,
  selectedStockId,
  selectedServeableItemId,
  selectedServingItems,
  pendingServeItem,
  onBasketTransformChange,
  onSelectAsset,
  onAssetTransformChange,
  onSelectStock,
  onStockTransformChange,
  onSelectServeableItem,
  onPlacePendingFood,
  onReturnSelectedFood,
  onDeliverSelectedFood,
  onBoundsReady,
  onTableOverlayTransformChange,
  onCheckoutPropsTransformChange,
  onCashDrawerTransformChange,
  onReceiptPrinterTransformChange,
  onWhitePlateStackTransformChange,
  onServingTrayTransformChange,
  onPlateStackTransformChange,
}) {
  const config = RESTAURANT_MANAGER_CONFIG;

  return (
    <>
      <color attach="background" args={["#9bdcff"]} />
      <fog attach="fog" args={["#bfe9ff", 12, 42]} />
      <hemisphereLight args={["#fff4cc", "#7c3f1d", config.lighting.ambientIntensity]} />
      <directionalLight
        position={config.lighting.sunPosition}
        intensity={config.lighting.sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {autoFrame ? (
        <Bounds fit clip observe margin={1.25}>
          <RestaurantSceneContent
            placement={placement}
            basketTool={basketTool}
            selectedAssetId={selectedAssetId}
            selectedStockId={selectedStockId}
            selectedServeableItemId={selectedServeableItemId}
            selectedServingItems={selectedServingItems}
            pendingServeItem={pendingServeItem}
            onBasketTransformChange={onBasketTransformChange}
            onSelectAsset={onSelectAsset}
            onAssetTransformChange={onAssetTransformChange}
            onSelectStock={onSelectStock}
            onStockTransformChange={onStockTransformChange}
            onSelectServeableItem={onSelectServeableItem}
            onPlacePendingFood={onPlacePendingFood}
            onReturnSelectedFood={onReturnSelectedFood}
            onDeliverSelectedFood={onDeliverSelectedFood}
            onBoundsReady={onBoundsReady}
            onTableOverlayTransformChange={onTableOverlayTransformChange}
            onCheckoutPropsTransformChange={onCheckoutPropsTransformChange}
            onCashDrawerTransformChange={onCashDrawerTransformChange}
            onReceiptPrinterTransformChange={onReceiptPrinterTransformChange}
            onWhitePlateStackTransformChange={onWhitePlateStackTransformChange}
            onServingTrayTransformChange={onServingTrayTransformChange}
            onPlateStackTransformChange={onPlateStackTransformChange}
          />
        </Bounds>
      ) : (
        <RestaurantSceneContent
          placement={placement}
          basketTool={basketTool}
          selectedAssetId={selectedAssetId}
          selectedStockId={selectedStockId}
          selectedServeableItemId={selectedServeableItemId}
          selectedServingItems={selectedServingItems}
          pendingServeItem={pendingServeItem}
          onBasketTransformChange={onBasketTransformChange}
          onSelectAsset={onSelectAsset}
          onAssetTransformChange={onAssetTransformChange}
          onSelectStock={onSelectStock}
          onStockTransformChange={onStockTransformChange}
          onSelectServeableItem={onSelectServeableItem}
          onPlacePendingFood={onPlacePendingFood}
          onReturnSelectedFood={onReturnSelectedFood}
          onDeliverSelectedFood={onDeliverSelectedFood}
          onBoundsReady={onBoundsReady}
          onTableOverlayTransformChange={onTableOverlayTransformChange}
          onCheckoutPropsTransformChange={onCheckoutPropsTransformChange}
          onCashDrawerTransformChange={onCashDrawerTransformChange}
          onReceiptPrinterTransformChange={onReceiptPrinterTransformChange}
          onWhitePlateStackTransformChange={onWhitePlateStackTransformChange}
          onServingTrayTransformChange={onServingTrayTransformChange}
          onPlateStackTransformChange={onPlateStackTransformChange}
        />
      )}
      <FloatingGuideRing />
      <ContactShadows position={[0, -0.02, 0]} opacity={0.34} scale={16} blur={2.8} far={6} />
      <FixedRestaurantCamera />
    </>
  );
}

function LoadingRestaurant() {
  return (
    <Html center>
      <div className="rm-loader">
        <Sparkles size={22} />
        Loading restaurant...
      </div>
    </Html>
  );
}

function PlacementVectorEditor({ label, values, step = 0.1, onChange }) {
  return (
    <label className="rm-placement-row">
      <span>{label}</span>
      {["X", "Y", "Z"].map((axis, index) => (
        <input
          key={axis}
          type="number"
          step={step}
          value={roundValue(values[index] || 0)}
          aria-label={`${label} ${axis}`}
          onChange={(event) => onChange(updateVector(values, index, event.target.value))}
        />
      ))}
    </label>
  );
}

function PlacementNumberEditor({ label, value, step = 0.1, onChange }) {
  return (
    <label className="rm-placement-row rm-placement-row-single">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={roundValue(value)}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

const HOW_TO_PLAY_STEPS = [
  "Choose class and difficulty",
  "Serve only the requested food",
  "Solve the active maths task",
  "Complete before patience runs out",
];

function MiniFoodIconScene({ type }) {
  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight position={[2, 4, 3]} intensity={2.1} />
      <group position={[0, -0.08, 0]} rotation={[0.58, -0.42, 0]} scale={2.15}>
        <TrayFoodItem type={type} index={1} />
      </group>
    </>
  );
}

function FoodIcon({ type, label }) {
  return (
    <span className="rm-food-icon rm-food-icon-3d" aria-hidden="true" data-food-type={type} title={label || type}>
      <Canvas
        className="rm-food-icon-canvas"
        orthographic
        camera={{ position: [0, 2.25, 3.2], zoom: 72 }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <MiniFoodIconScene type={type} />
      </Canvas>
    </span>
  );
}

function FoodOrderItem({ item, index, compact = false }) {
  const iconType = item.proceduralType || item.image;
  return (
    <span className={`rm-order-food-item ${compact ? "is-compact" : ""}`} data-food-item-id={`${item.image}-${index}`}>
      <FoodIcon type={iconType} label={item.name} />
      <b>x{item.quantity}</b>
    </span>
  );
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function RestaurantGameHud({ onBackToHub, level, timeLeft, score, streak, served, generated, paused, onTogglePause }) {
  const classLabel = CLASS_LEVELS.find((item) => item.id === level.classLevel)?.label || "Basic 4";
  const difficultyLabel = DIFFICULTY_SETTINGS[level.difficulty]?.label || "Easy";
  const stats = [
    {
      label: `${classLabel} ${difficultyLabel}`,
      value: `${score.toLocaleString()} / ${level.scoringTarget.toLocaleString()}`,
      icon: Star,
      tone: "gold",
      progress: Math.min(100, (score / level.scoringTarget) * 100),
    },
    { label: "Time Left", value: formatTime(timeLeft), icon: Clock3 },
    { label: "Customers Served", value: `${served} / ${level.totalCustomers}`, icon: Users },
    { label: "Score", value: score.toLocaleString(), icon: Coins, tone: "gold" },
    { label: "Streak", value: String(streak), icon: Flame, tone: "hot" },
  ];

  return (
    <header className="rm-game-hud" aria-label="Restaurant game status">
      <button type="button" className="rm-hud-icon-button" onClick={onBackToHub} aria-label="Back to games">
        <ArrowLeft size={22} />
      </button>
      {stats.map(({ label, value, icon: Icon, tone, progress }) => (
        <section className={`rm-hud-card ${tone ? `rm-hud-card-${tone}` : ""}`} key={label}>
          <Icon size={28} />
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
          {Number.isFinite(progress) ? (
            <i aria-hidden="true"><b style={{ width: `${progress}%` }} /></i>
          ) : null}
        </section>
      ))}
      <div className="rm-hud-actions">
        <button type="button" aria-label={paused ? "Resume" : "Pause"} onClick={onTogglePause}><Pause size={25} /></button>
        <button type="button" aria-label="Sound"><Volume2 size={25} /></button>
      </div>
      <span className="rm-generated-count">Queued {generated}/{level.totalCustomers}</span>
    </header>
  );
}

function CurrentOrderPanel({ activeCustomer, selectedFood, onReturnFood }) {
  const order = activeCustomer?.order || [];
  const patience = activeCustomer?.patience ?? 100;
  const mood = getMoodFromPatience(patience);
  return (
    <aside className="rm-current-order" aria-label="Current order">
      <h2>Current Order</h2>
      <div className="rm-order-ticket">
        <div className="rm-order-customer-frame">
          {activeCustomer ? <img src={activeCustomer.imagePath} alt="" /> : null}
        </div>
        <div className="rm-order-ticket-items">
          {order.length ? order.map((item, index) => {
            const selected = selectedFood[item.id] || 0;
            const complete = selected === item.quantity;
            return (
              <button
                type="button"
                className={`rm-order-progress ${complete ? "is-complete" : ""}`}
                key={item.id}
                onClick={() => onReturnFood(item.id)}
                disabled={!selected}
              >
                <FoodOrderItem compact item={item} index={index} />
                <small>{selected}/{item.quantity}</small>
              </button>
            );
          }) : <span className="rm-no-customer">Waiting...</span>}
        </div>
      </div>
      <h3>Customer Patience</h3>
      <div className={`rm-mood-meter is-${mood}`}>
        <Smile size={34} />
        <span><b style={{ width: `${patience}%` }} /></span>
      </div>
    </aside>
  );
}

function CustomerOrderBubble({ customer }) {
  return (
    <div className="rm-order-bubble" data-customer-id={customer.id}>
      {customer.order.map((item, itemIndex) => (
        <FoodOrderItem
          item={item}
          index={itemIndex}
          key={`${customer.id}-${item.name}`}
        />
      ))}
    </div>
  );
}

function CustomerMoodBar({ mood, patience }) {
  return (
    <div className={`rm-customer-mood-bar is-${mood}`} data-mood={mood}>
      <Smile size={30} />
      <span><b style={{ width: `${patience}%` }} /></span>
    </div>
  );
}

function CustomerQueueOverlay({ customers, maxCustomers }) {
  const slots = Array.from({ length: 4 }, (_, index) => customers[index] || null);
  return (
    <div className="rm-customer-queue" aria-label="Waiting customer queue">
      {slots.map((customer, index) => (
        <section
          className={`rm-queue-customer ${customer ? "is-occupied" : "is-empty"} ${index === 0 && customer ? "is-active" : ""} ${index >= maxCustomers ? "is-disabled" : ""}`}
          data-customer-id={customer?.id || `empty-${index}`}
          key={customer?.id || `empty-${index}`}
        >
          {customer ? (
            <>
              <CustomerOrderBubble customer={customer} />
              <div className="rm-queue-customer-body">
                <img src={customer.imagePath} alt="" draggable="false" />
              </div>
              <CustomerMoodBar mood={getMoodFromPatience(customer.patience)} patience={customer.patience} />
            </>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function FoodSelectionOverlay({ stock, onSelectFood }) {
  return (
    <div className="rm-food-click-overlay" aria-label="Selectable food pieces">
      {FOOD_CATALOG.flatMap((food) => {
        const zone = FOOD_CLICK_ZONES[food.id];
        if (!zone) return [];
        const count = Math.max(0, Math.min(stock[food.id] ?? food.initialStock ?? 0, food.initialStock ?? 10));
        const columns = Math.max(1, zone.columns || 1);
        const rows = Math.max(1, zone.rows || Math.ceil(count / columns));
        return Array.from({ length: count }, (_, index) => {
          const column = index % columns;
          const row = Math.floor(index / columns);
          const cellWidth = zone.width / columns;
          const cellHeight = zone.height / rows;
          return (
            <button
              type="button"
              className="rm-food-click-target"
              aria-label={`Select ${food.name} ${index + 1}`}
              key={`${food.id}-${index}`}
              style={{
                left: `${zone.left + column * cellWidth}%`,
                top: `${zone.top + row * cellHeight}%`,
                width: `${cellWidth}%`,
                height: `${cellHeight}%`,
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelectFood(food.id);
              }}
            />
          );
        });
      })}
    </div>
  );
}

function normalizeFoodMatchValue(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findMatchingOrderItem(orderedItems = [], foodId) {
  const pickedFood = FOOD_CATALOG.find((item) => item.id === foodId);
  const pickedValues = new Set([
    normalizeFoodMatchValue(foodId),
    normalizeFoodMatchValue(pickedFood?.id),
    normalizeFoodMatchValue(pickedFood?.name),
    normalizeFoodMatchValue(pickedFood?.plural),
    normalizeFoodMatchValue(pickedFood?.proceduralType),
    normalizeFoodMatchValue(pickedFood?.image),
  ]);

  return orderedItems.find((item) =>
    [
      item.id,
      item.name,
      item.plural,
      item.proceduralType,
      item.image,
    ].some((value) => pickedValues.has(normalizeFoodMatchValue(value)))
  );
}

function ServingInteractionOverlay({
  selectedItems,
  pendingServeItem,
  onPlacePendingFood,
  onReturnSelectedFood,
  onDeliverSelectedFood,
}) {
  const dragRef = useRef({ active: false, foodId: null, distance: 0 });
  const firstSelectedItem = selectedItems[0] || null;

  const startPlateDrag = (event) => {
    if (pendingServeItem) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = { active: false, foodId: null, distance: 0 };
      onPlacePendingFood();
      return;
    }
    if (!firstSelectedItem) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { active: true, foodId: firstSelectedItem.id, distance: 0 };
  };

  const movePlateDrag = (event) => {
    if (!dragRef.current.active) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.distance += Math.abs(event.movementX || 0) + Math.abs(event.movementY || 0);
  };

  const finishPlateDrag = (event) => {
    if (!dragRef.current.active || !dragRef.current.foodId) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const foodId = dragRef.current.foodId;
    dragRef.current = { active: false, foodId: null, distance: 0 };
    onDeliverSelectedFood(foodId);
  };

  return (
    <div className="rm-serving-click-overlay" aria-label="Serving plate interactions">
      <button
        type="button"
        className="rm-serving-plate-target"
        aria-label="Place selected food on serving plate"
        disabled={!pendingServeItem}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onPlacePendingFood();
        }}
      />
      <button
        type="button"
        className={`rm-serving-visual-plate ${selectedItems.length ? "has-food" : ""} ${pendingServeItem ? "is-adding-food" : ""}`}
        aria-label={pendingServeItem ? "Add selected food to serving plate" : "Drag serving plate to customer"}
        disabled={!selectedItems.length && !pendingServeItem}
        onPointerDown={startPlateDrag}
        onPointerMove={movePlateDrag}
        onPointerUp={finishPlateDrag}
        onPointerCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragRef.current = { active: false, foodId: null, distance: 0 };
        }}
      >
        {selectedItems.map((item, index) => {
          const food = FOOD_CATALOG.find((catalogItem) => catalogItem.id === item.id);
          return (
            <span
              className="rm-serving-visual-food"
              key={`${item.id}-${index}`}
              style={{
                "--food-offset-x": `${(index % 4) * 44 - Math.min(selectedItems.length - 1, 3) * 22}px`,
                "--food-offset-y": `${Math.floor(index / 4) * 34 - Math.max(0, Math.ceil(selectedItems.length / 4) - 1) * 17}px`,
              }}
            >
              <FoodIcon type={item.proceduralType} label={food?.name || item.id} />
            </span>
          );
        })}
      </button>
    </div>
  );
}

function LegacyQuestionPanel() {
  const keypad = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "⌫"];
  return (
    <aside className="rm-question-panel" aria-label="Calculate the total">
      <h2><Calculator size={18} /> Calculate The Total</h2>
      <p>What is the total amount the customer should pay?</p>
      <div className="rm-sum-lines">
        {CURRENT_ORDER_ITEMS.map((item) => (
          <div key={item.name}>
            <span>{item.quantity} x {item.name} (N{item.price})</span>
            <b>= ?</b>
          </div>
        ))}
        <strong><span>Total</span><b>= ?</b></strong>
      </div>
      <input aria-label="Answer" placeholder="Enter your answer..." inputMode="numeric" readOnly />
      <div className="rm-keypad">
        {keypad.map((key) => <button type="button" key={key}>{key}</button>)}
      </div>
      <button type="button" className="rm-submit-answer">Submit Answer</button>
    </aside>
  );
}

function LegacyBottomGamePanels() {
  return (
    <footer className="rm-bottom-panels">
      <div className="rm-game-actions">
        <button type="button"><Lightbulb size={30} /> Hint</button>
        <button type="button"><SkipForward size={30} /> Skip <small>N1</small></button>
      </div>
    </footer>
  );
}

function LegacyRestaurantLaunchInstructions() {
  return (
    <div className="rm-launch-instructions" aria-label="Restaurant Manager instructions">
      <section className="rm-how-to-play">
        <h2>How To Play</h2>
        <div>
          {HOW_TO_PLAY_STEPS.map((step, index) => (
            <span key={step}><b>{index + 1}</b>{step}</span>
          ))}
        </div>
      </section>
      <section className="rm-bonus-targets">
        <h2>Bonus Targets</h2>
        <div>
          {BONUS_TARGETS.map(({ title, icon: Icon }) => (
            <span key={title}><Icon size={28} />{title}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function LegacyRestaurantGameOverlay({ onBackToHub }) {
  return (
    <>
      <RestaurantGameHud onBackToHub={onBackToHub} />
      <CurrentOrderPanel />
      <CustomerQueueOverlay />
      <div className="rm-question-side-band" aria-label="Question controls">
        <QuestionPanel />
        <BottomGamePanels />
      </div>
    </>
  );
}

function QuestionPanel({ activeCustomer, answerInput, feedback, submitting, selectedFood, onKeypad, onSubmitAnswer, onCompleteCustomer }) {
  const question = activeCustomer?.question;
  const needsAnswer = question?.answer !== null;
  const foodCheck = question ? validateFoodSelection(question, selectedFood) : { ok: false };
  const canCompleteQuantity = question?.questionType === "quantity" && foodCheck.ok;
  const canSubmit = Boolean(question && needsAnswer && answerInput && !submitting);
  const keypad = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "C", "backspace"];
  const deliveryLabel = canCompleteQuantity ? "Drag Food To Customer" : "Place Food On Plate";

  return (
    <aside className="rm-question-panel" aria-label={question?.heading || "Question panel"}>
      <h2><Calculator size={18} /> {question?.heading || "Waiting For Customer"}</h2>
      <p>{question?.prompt || "A customer will enter shortly."}</p>
      <div className="rm-sum-lines">
        {question?.orderedItems?.map((item) => (
          <div key={item.id}>
            <span>{item.quantity} x {item.name} ({formatNaira(item.price)})</span>
            <b>{question.questionType === "quantity" ? `${selectedFood[item.id] || 0}/${item.quantity}` : "= ?"}</b>
          </div>
        ))}
        {question?.questionType === "change" ? (
          <div><span>Paid</span><b>{formatNaira(question.amountPaid)}</b></div>
        ) : null}
        {question?.questionType !== "quantity" ? (
          <strong><span>{question?.questionType === "change" ? "Change" : "Answer"}</span><b>= ?</b></strong>
        ) : (
          <strong><span>Food selected</span><b>{foodCheck.ok ? "Ready" : "Not yet"}</b></strong>
        )}
      </div>
      {needsAnswer ? (
        <>
          <input aria-label="Answer" value={answerInput ? formatNaira(Number(answerInput)) : ""} placeholder="Enter your answer..." inputMode="numeric" readOnly />
          <div className="rm-keypad">
            {keypad.map((key) => (
              <button type="button" key={key} onClick={() => onKeypad(key)}>{key === "backspace" ? "⌫" : key}</button>
            ))}
          </div>
          <button type="button" className="rm-submit-answer" disabled={!canSubmit} onClick={onSubmitAnswer}>Submit Answer</button>
        </>
      ) : (
        <button type="button" className="rm-submit-answer" disabled={!canCompleteQuantity} onClick={onCompleteCustomer}>{deliveryLabel}</button>
      )}
      {feedback ? <p className={`rm-question-feedback is-${feedback.type}`}>{feedback.message}</p> : null}
    </aside>
  );
}

function BottomGamePanels({ skipsLeft, onHint, onSkip }) {
  return (
    <footer className="rm-bottom-panels">
      <div className="rm-game-actions">
        <button type="button" onClick={onHint}><Lightbulb size={30} /> Hint</button>
        <button type="button" onClick={onSkip} disabled={skipsLeft <= 0}><SkipForward size={30} /> Skip <small>{skipsLeft}</small></button>
      </div>
    </footer>
  );
}

function RestaurantLaunchInstructions({ selectedClass, selectedDifficulty, onClassChange, onDifficultyChange, level }) {
  return (
    <div className="rm-launch-instructions" aria-label="Restaurant Manager instructions">
      <section className="rm-mode-picker" aria-label="Class">
        <h2>Choose Class</h2>
        <div>
          {CLASS_LEVELS.map((classLevel) => (
            <button
              type="button"
              className={selectedClass === classLevel.id ? "is-selected" : ""}
              key={classLevel.id}
              onClick={() => onClassChange(classLevel.id)}
            >
              <b>{classLevel.label}</b>
              <small>{classLevel.subtitle}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="rm-mode-picker" aria-label="Difficulty">
        <h2>Choose Difficulty</h2>
        <div>
          {Object.values(DIFFICULTY_SETTINGS).map((difficulty) => (
            <button
              type="button"
              className={selectedDifficulty === difficulty.id ? "is-selected" : ""}
              key={difficulty.id}
              onClick={() => onDifficultyChange(difficulty.id)}
            >
              <b>{difficulty.label}</b>
              <small>{difficulty.maxCustomersInside} customers max</small>
            </button>
          ))}
        </div>
      </section>
      <section className="rm-how-to-play">
        <h2>How To Play</h2>
        <div>
          {HOW_TO_PLAY_STEPS.map((step, index) => (
            <span key={step}><b>{index + 1}</b>{step}</span>
          ))}
        </div>
      </section>
      <section className="rm-bonus-targets">
        <h2>Bonus Targets</h2>
        <div>
          <span><Star size={28} />Serve {level.totalCustomers} customers</span>
          <span><Coins size={28} />Earn {formatNaira(level.scoringTarget)}</span>
          <span><Award size={28} />Reach {level.accuracyTarget}% accuracy</span>
        </div>
      </section>
    </div>
  );
}

function LevelCompleteOverlay({ stats, level, onReplay }) {
  if (!stats.complete) return null;
  const stars = getLevelStars({ accuracy: stats.accuracy, served: stats.served, target: level.totalCustomers, hintsUsed: stats.hintsUsed });
  return (
    <div className="rm-level-complete" role="dialog" aria-label="Level complete">
      <section>
        <h2>Level Complete</h2>
        <strong>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</strong>
        <p>Score {stats.score.toLocaleString()} | Accuracy {stats.accuracy}%</p>
        <div>
          <span>Served: {stats.served}</span>
          <span>Lost: {stats.lost}</span>
          <span>Correct: {stats.correct}</span>
          <span>Incorrect: {stats.incorrect}</span>
          <span>Best streak: {stats.bestStreak}</span>
          <span>Hints: {stats.hintsUsed}</span>
        </div>
        <button type="button" onClick={onReplay}>Play Again</button>
      </section>
    </div>
  );
}

function RestaurantGameOverlay({
  onBackToHub,
  level,
  customers,
  selectedFood,
  answerInput,
  feedback,
  submitting,
  timeLeft,
  score,
  streak,
  served,
  generated,
  paused,
  skipsLeft,
  completeStats,
  onTogglePause,
  onKeypad,
  onSubmitAnswer,
  onCompleteCustomer,
  onReturnFood,
  onHint,
  onSkip,
  onReplay,
}) {
  const activeCustomer = customers[0] || null;
  return (
    <>
      <RestaurantGameHud
        onBackToHub={onBackToHub}
        level={level}
        timeLeft={timeLeft}
        score={score}
        streak={streak}
        served={served}
        generated={generated}
        paused={paused}
        onTogglePause={onTogglePause}
      />
      <CurrentOrderPanel activeCustomer={activeCustomer} selectedFood={selectedFood} onReturnFood={onReturnFood} />
      <CustomerQueueOverlay customers={customers} maxCustomers={level.maxCustomersInside} />
      <div className="rm-question-side-band" aria-label="Question controls">
        <QuestionPanel
          activeCustomer={activeCustomer}
          answerInput={answerInput}
          feedback={feedback}
          submitting={submitting}
          selectedFood={selectedFood}
          onKeypad={onKeypad}
          onSubmitAnswer={onSubmitAnswer}
          onCompleteCustomer={onCompleteCustomer}
        />
        <BottomGamePanels skipsLeft={skipsLeft} onHint={onHint} onSkip={onSkip} />
      </div>
      <LevelCompleteOverlay stats={completeStats} level={level} onReplay={onReplay} />
    </>
  );
}

function normalizeRestaurantClassLevel(classLevel) {
  if (classLevel === "basic-4" || classLevel === "basic4") return "basic4";
  if (classLevel === "basic-5" || classLevel === "basic5") return "basic5";
  if (classLevel === "basic-6" || classLevel === "basic6") return "basic6";
  return "basic4";
}

export default function RestaurantManagerGame({ initialClassLevel = "basic4", onBackToHub }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [placement, setPlacement] = useState(loadSavedPlacement);
  const [panelPosition, setPanelPosition] = useState(loadPlacementPanelPosition);
  const [autoFrame, setAutoFrame] = useState(false);
  const [basketTool, setBasketTool] = useState("locked");
  const [selectedAssetId, setSelectedAssetId] = useState(RESTAURANT_MANAGER_CONFIG.foodDisplayAssets[0]?.id || "");
  const [selectedStockId, setSelectedStockId] = useState(
    RESTAURANT_MANAGER_CONFIG.foodDisplayAssets[0]?.shelfStock?.[0]?.id || ""
  );
  const [selectedServeableItem, setSelectedServeableItem] = useState(null);
  const [selectedClass, setSelectedClass] = useState(() => normalizeRestaurantClassLevel(initialClassLevel));
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const level = useMemo(() => createLevelConfig(selectedClass, selectedDifficulty), [selectedClass, selectedDifficulty]);
  const [customers, setCustomers] = useState([]);
  const [generatedCustomers, setGeneratedCustomers] = useState(0);
  const [stock, setStock] = useState(createInitialStock);
  const [plateStock, setPlateStock] = useState(DEFAULT_WHITE_PLATE_COUNT);
  const [selectedFood, setSelectedFood] = useState({});
  const [pendingServeItem, setPendingServeItem] = useState(null);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(level.levelTimeSeconds);
  const [score, setScore] = useState(0);
  const [served, setServed] = useState(0);
  const [lost, setLost] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [skipsLeft, setSkipsLeft] = useState(level.skipCount);
  const [paused, setPaused] = useState(false);
  const [completeStats, setCompleteStats] = useState({
    complete: false,
    score: 0,
    served: 0,
    lost: 0,
    accuracy: 0,
    correct: 0,
    incorrect: 0,
    bestStreak: 0,
    hintsUsed: 0,
  });
  const [saveMessage, setSaveMessage] = useState("");
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const panelDragRef = useRef({ active: false, offsetX: 0, offsetY: 0 });
  const selectedServeableKeyRef = useRef("");
  const serveableTapCountRef = useRef(0);
  const refillTimersRef = useRef({ food: {}, plates: null });
  const transform = placement.restaurantTransform;
  const foodBasketTransform = placement.foodBasketTransform;
  const tableOverlayTransform = placement.tableOverlayTransform;
  const checkoutPropsTransform = placement.checkoutPropsTransform;
  const cashDrawerTransform = placement.cashDrawerTransform;
  const receiptPrinterTransform = placement.receiptPrinterTransform;
  const whitePlateStackTransform = placement.whitePlateStackTransform;
  const servingTrayTransform = placement.servingTrayTransform;
  const plateStackTransform = placement.plateStackTransform;
  const transformText = useMemo(() => {
    const p = transform.position.join(", ");
    const r = transform.rotation.join(", ");
    return `position [${p}] | rotation [${r}] | scale ${transform.scale}`;
  }, [transform.position, transform.rotation, transform.scale]);
  const foodBasketText = useMemo(() => {
    const p = foodBasketTransform.position.join(", ");
    const r = foodBasketTransform.rotation.join(", ");
    return `position [${p}] | rotation [${r}] | scale ${foodBasketTransform.scale}`;
  }, [foodBasketTransform.position, foodBasketTransform.rotation, foodBasketTransform.scale]);
  const scenePlacement = useMemo(
    () => ({
      ...placement,
      whitePlateStackTransform: {
        ...placement.whitePlateStackTransform,
        count: plateStock,
      },
      foodDisplayAssets: placement.foodDisplayAssets.map((asset) => ({
        ...asset,
        shelfStock: asset.shelfStock?.map((tray) => ({
          ...tray,
          availableStock: stock[tray.id] ?? tray.count ?? 0,
        })),
      })),
    }),
    [placement, plateStock, stock]
  );
  const selectedServingItems = useMemo(
    () =>
      Object.entries(selectedFood).flatMap(([foodId, quantity]) => {
        const food = FOOD_CATALOG.find((catalogItem) => catalogItem.id === foodId);
        if (!food) return [];
        return Array.from({ length: quantity }, () => ({
          id: food.id,
          proceduralType: food.proceduralType,
          itemScale: 0.68,
        }));
      }),
    [selectedFood]
  );
  const selectedAsset = placement.foodDisplayAssets.find((asset) => asset.id === selectedAssetId) || placement.foodDisplayAssets[0];
  const selectedStock =
    selectedAsset?.shelfStock?.find((stock) => stock.id === selectedStockId) ||
    selectedAsset?.shelfStock?.[0] ||
    null;
  const priceTagCoordinatesText = useMemo(
    () =>
      JSON.stringify(
        Object.fromEntries(
          placement.foodDisplayAssets.flatMap((asset) =>
            (asset.shelfStock || []).map((stock) => [
              stock.id,
              {
                name: stock.name,
                priceTagPosition: stock.priceTagPosition || getDefaultPriceTagPosition(stock),
                priceTagRotation: stock.priceTagRotation || [-0.42, 0, 0],
                priceTagScale: stock.priceTagScale || 1,
              },
            ])
          )
        ),
        null,
        2
      ),
    [placement.foodDisplayAssets]
  );
  const tableOverlayCoordinatesText = useMemo(
    () => JSON.stringify(tableOverlayTransform, null, 2),
    [tableOverlayTransform]
  );
  const checkoutPropsCoordinatesText = useMemo(
    () => JSON.stringify(checkoutPropsTransform, null, 2),
    [checkoutPropsTransform]
  );
  const cashDrawerCoordinatesText = useMemo(
    () => JSON.stringify(cashDrawerTransform, null, 2),
    [cashDrawerTransform]
  );
  const receiptPrinterCoordinatesText = useMemo(
    () => JSON.stringify(receiptPrinterTransform, null, 2),
    [receiptPrinterTransform]
  );
  const whitePlateStackCoordinatesText = useMemo(
    () => JSON.stringify(whitePlateStackTransform, null, 2),
    [whitePlateStackTransform]
  );
  const servingTrayCoordinatesText = useMemo(
    () => JSON.stringify(servingTrayTransform, null, 2),
    [servingTrayTransform]
  );
  const plateStackCoordinatesText = useMemo(
    () => JSON.stringify(plateStackTransform, null, 2),
    [plateStackTransform]
  );

  const updatePlacement = (section, patch) => {
    setPlacement((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch,
      },
    }));
    setAutoFrame(false);
    setSaveMessage("Unsaved placement changes");
  };

  const updateBasketTransform = (patch) => {
    updatePlacement("foodBasketTransform", patch);
  };

  const updateTableOverlayTransform = (patch) => {
    updatePlacement("tableOverlayTransform", patch);
  };

  const updateCheckoutPropsTransform = (patch) => {
    updatePlacement("checkoutPropsTransform", patch);
  };

  const updateCashDrawerTransform = (patch) => {
    updatePlacement("cashDrawerTransform", patch);
  };

  const updateReceiptPrinterTransform = (patch) => {
    updatePlacement("receiptPrinterTransform", patch);
  };

  const updateWhitePlateStackTransform = (patch) => {
    updatePlacement("whitePlateStackTransform", patch);
  };

  const updateServingTrayTransform = (patch) => {
    updatePlacement("servingTrayTransform", patch);
  };

  const updatePlateStackTransform = (patch) => {
    updatePlacement("plateStackTransform", patch);
  };

  const updatePlatePackTransform = (packIndex, patch) => {
    const packCount = Math.max(1, plateStackTransform.packCount || 2);
    const packTransforms = Array.from({ length: packCount }, (_, index) => ({
      ...getPlatePackTransform(plateStackTransform, index, packCount),
    }));
    packTransforms[packIndex] = {
      ...packTransforms[packIndex],
      ...patch,
    };
    updatePlateStackTransform({ packTransforms });
  };

  const clearRefillTimers = () => {
    Object.values(refillTimersRef.current.food).forEach((timer) => {
      if (timer) window.clearTimeout(timer);
    });
    if (refillTimersRef.current.plates) window.clearTimeout(refillTimersRef.current.plates);
    refillTimersRef.current = { food: {}, plates: null };
  };

  useEffect(() => () => clearRefillTimers(), []);

  const updateDisplayAssetTransform = (assetId, patch) => {
    setPlacement((current) => ({
      ...current,
      foodDisplayAssets: current.foodDisplayAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              ...patch,
            }
          : asset
      ),
    }));
    setAutoFrame(false);
    setSaveMessage("Unsaved placement changes");
  };

  const updateShelfStockTransform = (assetId, stockId, patch) => {
    setPlacement((current) => ({
      ...current,
      foodDisplayAssets: current.foodDisplayAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              shelfStock: asset.shelfStock?.map((stock) =>
                stock.id === stockId
                  ? {
                      ...stock,
                      ...patch,
                    }
                  : stock
              ),
            }
          : asset
      ),
    }));
    setAutoFrame(false);
    setSaveMessage("Unsaved shelf stock changes");
  };

  const selectServeableItem = (item) => {
    serveableTapCountRef.current += 1;
    setSelectedServeableItem({ ...item, tapId: serveableTapCountRef.current });
  };

  const resetRoundState = () => {
    setSelectedFood({});
    setPendingServeItem(null);
    setAnswerCorrect(false);
    setSelectedServeableItem(null);
    selectedServeableKeyRef.current = "";
    setAnswerInput("");
    setFeedback(null);
    setSubmitting(false);
    selectedServeableKeyRef.current = "";
  };

  const buildCompletionStats = (nextServed = served, nextLost = lost, nextScore = score) => {
    const attempts = correctAnswers + incorrectAnswers;
    const accuracy = attempts ? Math.round((correctAnswers / attempts) * 100) : 100;
    return {
      complete: true,
      score: nextScore,
      served: nextServed,
      lost: nextLost,
      accuracy,
      correct: correctAnswers,
      incorrect: incorrectAnswers,
      bestStreak,
      hintsUsed,
    };
  };

  const finishLevel = (nextStats = buildCompletionStats()) => {
    setCompleteStats(nextStats);
    setPaused(true);
  };

  const admitCustomer = (currentCustomers = customers, currentGenerated = generatedCustomers, currentStock = stock) => {
    if (!canAdmitCustomer(currentCustomers, level, currentGenerated, paused || completeStats.complete)) return;
    const nextCustomer = createCustomer(level, currentGenerated, currentStock);
    setCustomers(promoteQueue([...currentCustomers, nextCustomer]));
    setGeneratedCustomers(currentGenerated + 1);
  };

  const startLevel = async () => {
    clearRefillTimers();
    const initialStock = createInitialStock();
    const firstCustomer = createCustomer(level, 0, initialStock);
    setStock(initialStock);
    setPlateStock(DEFAULT_WHITE_PLATE_COUNT);
    setCustomers([firstCustomer]);
    setGeneratedCustomers(1);
    setSelectedFood({});
    setPendingServeItem(null);
    setAnswerCorrect(false);
    setAnswerInput("");
    setFeedback(null);
    setSubmitting(false);
    setTimeLeft(level.levelTimeSeconds);
    setScore(0);
    setServed(0);
    setLost(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setHintsUsed(0);
    setSkipsLeft(level.skipCount);
    setPaused(false);
    setCompleteStats({
      complete: false,
      score: 0,
      served: 0,
      lost: 0,
      accuracy: 0,
      correct: 0,
      incorrect: 0,
      bestStreak: 0,
      hintsUsed: 0,
    });
  };

  const completeActiveCustomer = ({ skipped = false, failed = false } = {}) => {
    const activeCustomer = customers[0];
    if (!activeCustomer) return;

    const nextStock = failed || skipped
      ? Object.fromEntries(
          Object.entries(restoreTemporaryFood(stock, selectedFood)).map(([foodId, quantity]) => [
            foodId,
            Math.min(quantity, createInitialStock()[foodId] || quantity),
          ])
        )
      : stock;
    const remainingCustomers = promoteQueue(customers.slice(1));
    const nextServed = failed || skipped ? served : served + 1;
    const nextLost = failed ? lost + 1 : lost;
    const nextStreak = failed || skipped || activeCustomer.mistakes > 0 ? 0 : streak + 1;
    const nextBestStreak = Math.max(bestStreak, nextStreak);
    const earnedScore = failed || skipped
      ? 0
      : calculateQuestionScore(activeCustomer.question, activeCustomer.mistakes, activeCustomer.hintsUsed, activeCustomer.patience);
    const nextScore = score + earnedScore;

    setStock(nextStock);
    setCustomers(remainingCustomers);
    setServed(nextServed);
    setLost(nextLost);
    setStreak(nextStreak);
    setBestStreak(nextBestStreak);
    setScore(nextScore);
    resetRoundState();

    if (nextServed + nextLost >= level.totalCustomers || (generatedCustomers >= level.totalCustomers && remainingCustomers.length === 0)) {
      finishLevel({
        ...buildCompletionStats(nextServed, nextLost, nextScore),
        bestStreak: nextBestStreak,
      });
      return;
    }

    window.setTimeout(() => admitCustomer(remainingCustomers, generatedCustomers, nextStock), 700);
  };

  const applyMistake = (message, penalty = PATIENCE_RULES.wrongAnswerPenalty) => {
    setCustomers((current) =>
      current.map((customer, index) =>
        index === 0
          ? {
              ...customer,
              mistakes: customer.mistakes + 1,
              patience: Math.max(0, customer.patience - penalty),
            }
          : customer
      )
    );
    setIncorrectAnswers((value) => value + 1);
    setStreak(0);
    setFeedback({ type: "error", message });
  };

  const scheduleFoodRestock = (foodId, quantityAfterSelection) => {
    if (quantityAfterSelection > LOW_STOCK_REFILL_THRESHOLD || refillTimersRef.current.food[foodId]) return;
    refillTimersRef.current.food[foodId] = window.setTimeout(() => {
      const fullStock = createInitialStock()[foodId] || 10;
      setStock((current) => ({
        ...current,
        [foodId]: Math.max(current[foodId] || 0, fullStock),
      }));
      refillTimersRef.current.food[foodId] = null;
    }, 550);
  };

  const usePlateFromStack = () => {
    setPlateStock((current) => {
      const next = Math.max(0, current - 1);
      if (next <= LOW_STOCK_REFILL_THRESHOLD && !refillTimersRef.current.plates) {
        refillTimersRef.current.plates = window.setTimeout(() => {
          setPlateStock(DEFAULT_WHITE_PLATE_COUNT);
          refillTimersRef.current.plates = null;
        }, 550);
      }
      return next;
    });
  };

  const selectFoodForActiveCustomer = (foodId) => {
    const activeCustomer = customers[0];
    if (!gameStarted || paused || completeStats.complete || !activeCustomer?.question?.foodSelectionRequired) return;
    const requiredItem = findMatchingOrderItem(activeCustomer.question.orderedItems, foodId);
    if (!requiredItem) {
      const pickedFood = FOOD_CATALOG.find((item) => item.id === foodId);
      applyMistake(`Check the customer's order. You picked ${pickedFood?.name || "the wrong food"}.`, PATIENCE_RULES.wrongFoodPenalty);
      return;
    }
    const selectedQuantity = selectedFood[requiredItem.id] || 0;
    if (selectedQuantity >= requiredItem.quantity) {
      applyMistake(`The customer ordered ${requiredItem.quantity}, but you selected ${selectedQuantity + 1}. Return one.`, PATIENCE_RULES.wrongQuantityPenalty);
      return;
    }
    if ((stock[foodId] || 0) <= 0) {
      setFeedback({ type: "warning", message: "That tray is empty. Choose another valid item." });
      return;
    }
    setPendingServeItem({
      id: requiredItem.id,
      stockId: foodId,
      name: requiredItem.name,
      proceduralType: requiredItem.proceduralType,
      quantity: requiredItem.quantity,
    });
    setFeedback({ type: "info", message: `${requiredItem.name} picked. Click the serving plate to place it.` });
  };

  const placePendingFoodOnPlate = () => {
    const activeCustomer = customers[0];
    if (!activeCustomer || !pendingServeItem) {
      setFeedback({ type: "info", message: "Click a food item first, then click the serving plate." });
      return;
    }
    const stockFoodId = pendingServeItem.stockId || pendingServeItem.id;
    const requiredItem = findMatchingOrderItem(activeCustomer.question.orderedItems, stockFoodId) ||
      activeCustomer.question.orderedItems.find((item) => item.id === pendingServeItem.id);
    if (!requiredItem) {
      setPendingServeItem(null);
      applyMistake("Check the customer's order.", PATIENCE_RULES.wrongFoodPenalty);
      return;
    }
    const selectedQuantity = selectedFood[pendingServeItem.id] || 0;
    if (selectedQuantity >= requiredItem.quantity) {
      setPendingServeItem(null);
      applyMistake(`The customer ordered ${requiredItem.quantity}, but the plate already has ${selectedQuantity}.`, PATIENCE_RULES.wrongQuantityPenalty);
      return;
    }
    if ((stock[stockFoodId] || 0) <= 0) {
      setPendingServeItem(null);
      setFeedback({ type: "warning", message: "That tray is empty. Choose another valid item." });
      return;
    }
    if (plateStock <= 0) {
      setFeedback({ type: "warning", message: "The serving plates are being replaced. Try again in a moment." });
      return;
    }
    const nextStockQuantity = Math.max(0, (stock[stockFoodId] || 0) - 1);
    setSelectedFood((current) => ({ ...current, [pendingServeItem.id]: (current[pendingServeItem.id] || 0) + 1 }));
    setStock((current) => applyFoodSelection(current, stockFoodId, 1));
    usePlateFromStack();
    scheduleFoodRestock(stockFoodId, nextStockQuantity);
    setPendingServeItem(null);
    setFeedback({ type: "success", message: `${requiredItem.name} moved to the serving plate. Drag it to the customer when ready.` });
    setCustomers((current) =>
      current.map((customer, index) =>
        index === 0
          ? { ...customer, patience: Math.min(100, customer.patience + PATIENCE_RULES.correctActionRecovery) }
          : customer
      )
    );
  };

  const returnSelectedFood = (foodId) => {
    if (!selectedFood[foodId]) return;
    setSelectedFood((current) => {
      const next = { ...current, [foodId]: current[foodId] - 1 };
      if (next[foodId] <= 0) delete next[foodId];
      return next;
    });
    setStock((current) => ({ ...current, [foodId]: (current[foodId] || 0) + 1 }));
    setFeedback({ type: "info", message: "Returned one item to its tray." });
  };

  const deliverSelectedFoodToCustomer = (foodId) => {
    const activeCustomer = customers[0];
    if (!activeCustomer || submitting || !selectedFood[foodId]) return;
    const question = activeCustomer.question;
    const foodCheck = validateFoodSelection(question, selectedFood);
    if (!foodCheck.ok) {
      const firstMissing = foodCheck.missing[0];
      setFeedback({
        type: "warning",
        message: firstMissing
          ? `Place ${firstMissing.missing} more item on the plate before serving.`
          : "Return the extra item before serving.",
      });
      return;
    }
    if (question.answer !== null && !answerCorrect) {
      setFeedback({ type: "info", message: "The food is ready. Solve the maths question before handing it to the customer." });
      return;
    }
    if (question.questionType === "quantity") {
      setCorrectAnswers((value) => value + 1);
      setFeedback({ type: "success", message: "Correct order delivered." });
    } else {
      setFeedback({ type: "success", message: question.changeRequired ? "Correct change. Transaction complete." : "Correct order delivered." });
    }
    setSubmitting(true);
    window.setTimeout(() => completeActiveCustomer(), 500);
  };

  const submitAnswer = () => {
    const activeCustomer = customers[0];
    if (!activeCustomer || submitting) return;
    const question = activeCustomer.question;
    if (answerCorrect && question.foodSelectionRequired) {
      setFeedback({ type: "info", message: "Answer accepted. Drag the order from the serving plate to the customer." });
      return;
    }
    const foodCheck = validateFoodSelection(question, selectedFood);
    if (question.foodSelectionRequired && !foodCheck.ok) {
      const firstMissing = foodCheck.missing[0];
      if (firstMissing) {
        applyMistake(`The customer ordered ${firstMissing.required}, but you selected ${firstMissing.selected}. Add ${firstMissing.missing} more.`, PATIENCE_RULES.wrongQuantityPenalty);
      } else {
        applyMistake("Return the extra item before serving.", PATIENCE_RULES.wrongQuantityPenalty);
      }
      return;
    }
    setSubmitting(true);
    if (validateNumericAnswer(question, answerInput)) {
      setCorrectAnswers((value) => value + 1);
      setAnswerCorrect(true);
      setSubmitting(false);
      if (question.foodSelectionRequired) {
        setFeedback({ type: "success", message: "Correct. Now drag the order from the serving plate to the customer." });
        return;
      }
      setFeedback({ type: "success", message: question.changeRequired ? "Correct change. Transaction complete." : "Correct. The order is ready." });
      window.setTimeout(() => completeActiveCustomer(), 650);
      return;
    }
    const attempts = activeCustomer.mistakes + 1;
    const hint = attempts >= 3 ? `${getHintForQuestion(question, 1)} The answer is ${formatNaira(question.answer)}.` : getHintForQuestion(question, attempts - 1);
    applyMistake(hint, question.changeRequired ? PATIENCE_RULES.wrongChangePenalty : PATIENCE_RULES.wrongAnswerPenalty);
    setSubmitting(false);
  };

  const completeQuantityCustomer = () => {
    const activeCustomer = customers[0];
    if (!activeCustomer) return;
    const foodCheck = validateFoodSelection(activeCustomer.question, selectedFood);
    if (!foodCheck.ok) {
      applyMistake("Check the quantity before serving.", PATIENCE_RULES.wrongQuantityPenalty);
      return;
    }
    setFeedback({ type: "info", message: "Drag the order from the serving plate to the customer." });
  };

  const requestHint = () => {
    const activeCustomer = customers[0];
    if (!activeCustomer) return;
    setHintsUsed((value) => value + 1);
    setCustomers((current) =>
      current.map((customer, index) =>
        index === 0
          ? {
              ...customer,
              hintsUsed: customer.hintsUsed + 1,
              patience: Math.max(0, customer.patience - PATIENCE_RULES.hintPenalty),
            }
          : customer
      )
    );
    setFeedback({ type: "info", message: getHintForQuestion(activeCustomer.question, activeCustomer.hintsUsed) });
  };

  const skipCustomer = () => {
    const activeCustomer = customers[0];
    if (!activeCustomer || skipsLeft <= 0) return;
    setSkipsLeft((value) => value - 1);
    setStreak(0);
    setFeedback({ type: "warning", message: `${getHintForQuestion(activeCustomer.question, 1)} Answer: ${activeCustomer.question.answer === null ? "serve the exact order" : formatNaira(activeCustomer.question.answer)}.` });
    window.setTimeout(() => completeActiveCustomer({ skipped: true }), 850);
  };

  const handleGameKeypad = (key) => {
    const allowDecimal = selectedClass !== "basic4";
    setAnswerInput((current) => handleKeypadInput(current, key, { allowDecimal }));
  };

  const copyPriceTagCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(priceTagCoordinatesText);
      setSaveMessage("Copied price tag placement coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = priceTagCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied price tag placement coordinates.");
    }
  };

  const copyTableOverlayCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(tableOverlayCoordinatesText);
      setSaveMessage("Copied table overlay coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = tableOverlayCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied table overlay coordinates.");
    }
  };

  const copyCheckoutPropsCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(checkoutPropsCoordinatesText);
      setSaveMessage("Copied checkout props coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = checkoutPropsCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied checkout props coordinates.");
    }
  };

  const copyCashDrawerCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(cashDrawerCoordinatesText);
      setSaveMessage("Copied cash drawer coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = cashDrawerCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied cash drawer coordinates.");
    }
  };

  const copyReceiptPrinterCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(receiptPrinterCoordinatesText);
      setSaveMessage("Copied receipt printer coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = receiptPrinterCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied receipt printer coordinates.");
    }
  };

  const copyWhitePlateStackCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(whitePlateStackCoordinatesText);
      setSaveMessage("Copied white plate coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = whitePlateStackCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied white plate coordinates.");
    }
  };

  const copyServingTrayCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(servingTrayCoordinatesText);
      setSaveMessage("Copied serving tray coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = servingTrayCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied serving tray coordinates.");
    }
  };

  const copyPlateStackCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(plateStackCoordinatesText);
      setSaveMessage("Copied plate stack coordinates.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = plateStackCoordinatesText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setSaveMessage("Copied plate stack coordinates.");
    }
  };

  const savePlacement = () => {
    localStorage.setItem(
      PLACEMENT_STORAGE_KEY,
      JSON.stringify({
        foodTrayLayoutVersion: RESTAURANT_MANAGER_CONFIG.foodTrayLayoutVersion,
        foodBasketTransform: placement.foodBasketTransform,
        tableOverlayTransform: placement.tableOverlayTransform,
        checkoutPropsTransform: placement.checkoutPropsTransform,
        cashDrawerTransform: placement.cashDrawerTransform,
        receiptPrinterTransform: placement.receiptPrinterTransform,
        whitePlateStackTransform: placement.whitePlateStackTransform,
        servingTrayTransform: placement.servingTrayTransform,
        plateStackTransform: placement.plateStackTransform,
        foodDisplayAssets: placement.foodDisplayAssets,
      })
    );
    setAutoFrame(false);
    setSaveMessage("Saved. Food tray and price tag positions will load permanently after refresh.");
  };

  const resetPlacement = () => {
    const fresh = clonePlacementConfig();
    localStorage.removeItem(PLACEMENT_STORAGE_KEY);
    setPlacement((current) => ({
      ...current,
      foodBasketTransform: fresh.foodBasketTransform,
      tableOverlayTransform: fresh.tableOverlayTransform,
      checkoutPropsTransform: fresh.checkoutPropsTransform,
      cashDrawerTransform: fresh.cashDrawerTransform,
      receiptPrinterTransform: fresh.receiptPrinterTransform,
      whitePlateStackTransform: fresh.whitePlateStackTransform,
      servingTrayTransform: fresh.servingTrayTransform,
      plateStackTransform: fresh.plateStackTransform,
      foodDisplayAssets: fresh.foodDisplayAssets,
    }));
    setAutoFrame(false);
    setSaveMessage("Food trays and price tags reset to code defaults.");
  };

  const movePlacementPanel = (clientX, clientY) => {
    const next = {
      left: Math.max(8, Math.min(window.innerWidth - 180, Math.round(clientX - panelDragRef.current.offsetX))),
      top: Math.max(8, Math.min(window.innerHeight - 100, Math.round(clientY - panelDragRef.current.offsetY))),
    };
    setPanelPosition(next);
    localStorage.setItem(PLACEMENT_PANEL_STORAGE_KEY, JSON.stringify(next));
  };

  const startPanelDrag = (event) => {
    const panel = event.currentTarget.closest(".rm-dev-panel");
    if (!panel) return;
    event.preventDefault();
    panelDragRef.current.active = true;
    const rect = panel.getBoundingClientRect();
    panelDragRef.current.offsetX = event.clientX - rect.left;
    panelDragRef.current.offsetY = event.clientY - rect.top;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const dragPlacementPanel = (event) => {
    if (!panelDragRef.current.active) return;
    movePlacementPanel(event.clientX, event.clientY);
  };

  const stopPanelDrag = (event) => {
    if (!panelDragRef.current.active) return;
    panelDragRef.current.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const resizeGameStage = () => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const styles = window.getComputedStyle(container);
    const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
    const availableWidth = Math.max(1, container.clientWidth - paddingLeft - paddingRight);
    const availableHeight = Math.max(1, container.clientHeight - paddingTop - paddingBottom);
    const scale = Math.min(
      availableWidth / GAME_STAGE_DESIGN_WIDTH,
      availableHeight / GAME_STAGE_DESIGN_HEIGHT
    );
    const scaledWidth = GAME_STAGE_DESIGN_WIDTH * scale;
    const scaledHeight = GAME_STAGE_DESIGN_HEIGHT * scale;

    stage.style.transform = `scale(${scale})`;
    stage.style.position = "absolute";
    stage.style.left = `${paddingLeft + Math.max(0, (availableWidth - scaledWidth) / 2)}px`;
    stage.style.top = `${paddingTop + Math.max(0, (availableHeight - scaledHeight) / 2)}px`;
  };

  const startGame = async () => {
    const gameStage = containerRef.current;

    await startLevel();
    setGameStarted(true);
    window.setTimeout(resizeGameStage, 0);
    window.setTimeout(resizeGameStage, 250);

    try {
      if (gameStage?.requestFullscreen) {
        await gameStage.requestFullscreen({ navigationUI: "hide" });
      }

      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch (error) {
      console.warn("Fullscreen or orientation lock is unavailable:", error);
    }
  };

  useEffect(() => {
    document.body.classList.add("rm-game-active");
    return () => {
      document.body.classList.remove("rm-game-active");
    };
  }, []);

  useEffect(() => {
    resizeGameStage();
    const handleResize = () => resizeGameStage();
    const handleFullscreenChange = () => window.setTimeout(resizeGameStage, 0);

    window.setTimeout(resizeGameStage, 0);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) {
      setTimeLeft(level.levelTimeSeconds);
      setSkipsLeft(level.skipCount);
    }
  }, [gameStarted, level.levelTimeSeconds, level.skipCount]);

  useEffect(() => {
    if (!gameStarted || paused || completeStats.complete) return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          finishLevel(buildCompletionStats(served, lost, score));
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [buildCompletionStats, completeStats.complete, gameStarted, lost, paused, score, served]);

  useEffect(() => {
    if (!gameStarted || paused || completeStats.complete) return undefined;
    const timer = window.setInterval(() => {
      setCustomers((current) => updateCustomerPatience(current, selectedDifficulty));
    }, PATIENCE_RULES.tickIntervalMs);
    return () => window.clearInterval(timer);
  }, [completeStats.complete, gameStarted, paused, selectedDifficulty]);

  useEffect(() => {
    if (!gameStarted || paused || completeStats.complete) return;
    if (customers[0]?.patience <= 0) {
      setFeedback({ type: "warning", message: "The customer waited too long. Serve the next customer more quickly." });
      completeActiveCustomer({ failed: true });
    }
  }, [completeStats.complete, customers, gameStarted, paused]);

  useEffect(() => {
    if (!gameStarted || paused || completeStats.complete) return undefined;
    if (!canAdmitCustomer(customers, level, generatedCustomers)) return undefined;
    const settings = DIFFICULTY_SETTINGS[selectedDifficulty] || DIFFICULTY_SETTINGS.easy;
    const delay = Math.round((settings.arrivalIntervalMin + settings.arrivalIntervalMax) / 2);
    const timer = window.setTimeout(() => admitCustomer(customers, generatedCustomers, stock), delay);
    return () => window.clearTimeout(timer);
  }, [completeStats.complete, customers, gameStarted, generatedCustomers, level, paused, selectedDifficulty, stock]);

  useEffect(() => {
    if (!selectedServeableItem?.foodType) return;
    const key = `${selectedServeableItem.id}-${selectedServeableItem.index}-${selectedServeableItem.tapId || 0}`;
    if (selectedServeableKeyRef.current === key) return;
    selectedServeableKeyRef.current = key;
    selectFoodForActiveCustomer(selectedServeableItem.foodType);
  }, [selectedServeableItem]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!gameStarted || paused || completeStats.complete) return;
      if (/^\d$/.test(event.key)) {
        handleGameKeypad(event.key);
        return;
      }
      if (event.key === "Backspace") {
        handleGameKeypad("backspace");
        return;
      }
      if (event.key === "Enter") {
        submitAnswer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completeStats.complete, gameStarted, paused, submitAnswer]);

  return (
    <main className={`fullscreen-game-container ${gameStarted ? "is-started" : "is-launching"}`} ref={containerRef}>
      {!gameStarted ? (
        <div className="rm-game-launch" aria-label="Restaurant Manager launch screen">
          <div className="rm-game-launch-card">
            <span className="rm-game-launch-kicker">Pro Tutors Hub</span>
            <h1>Restaurant Manager</h1>
            <p>For the best experience, play in landscape mode.</p>
            <RestaurantLaunchInstructions
              selectedClass={selectedClass}
              selectedDifficulty={selectedDifficulty}
              onClassChange={setSelectedClass}
              onDifficultyChange={setSelectedDifficulty}
              level={level}
            />
            <button type="button" onClick={startGame}>Play Game</button>
          </div>
        </div>
      ) : null}
      <div className="rotate-device-overlay" aria-hidden="true">
        <div className="rotate-phone-icon"><span /></div>
        <p>Please rotate your phone to landscape to play</p>
      </div>
    <section
      className="rm-game"
      id="game-stage"
      ref={stageRef}
      aria-label="Restaurant Manager"
      style={{ width: GAME_STAGE_DESIGN_WIDTH, height: GAME_STAGE_DESIGN_HEIGHT }}
    >
      <RestaurantGameOverlay
        onBackToHub={onBackToHub}
        level={level}
        customers={customers}
        selectedFood={selectedFood}
        answerInput={answerInput}
        feedback={feedback}
        submitting={submitting}
        timeLeft={timeLeft}
        score={score}
        streak={streak}
        served={served}
        generated={generatedCustomers}
        paused={paused}
        skipsLeft={skipsLeft}
        completeStats={completeStats}
        onTogglePause={() => setPaused((value) => !value)}
        onKeypad={handleGameKeypad}
        onSubmitAnswer={submitAnswer}
        onCompleteCustomer={completeQuantityCustomer}
        onReturnFood={returnSelectedFood}
        onHint={requestHint}
        onSkip={skipCustomer}
        onReplay={startLevel}
      />

      <Canvas
        className="rm-canvas"
        camera={{ position: RESTAURANT_MANAGER_CONFIG.camera.position, fov: 51 }}
        shadows
        dpr={[1, 1.75]}
      >
        <Suspense fallback={<LoadingRestaurant />}>
          <RestaurantScene
            placement={scenePlacement}
            autoFrame={autoFrame}
            basketTool="locked"
            selectedAssetId={selectedAssetId}
            selectedStockId={selectedStockId}
            selectedServeableItemId={selectedServeableItem?.id || ""}
            selectedServingItems={selectedServingItems}
            pendingServeItem={pendingServeItem}
            onBasketTransformChange={updateBasketTransform}
            onSelectAsset={setSelectedAssetId}
            onAssetTransformChange={updateDisplayAssetTransform}
            onSelectStock={setSelectedStockId}
            onStockTransformChange={updateShelfStockTransform}
            onSelectServeableItem={selectServeableItem}
            onPlacePendingFood={placePendingFoodOnPlate}
            onReturnSelectedFood={returnSelectedFood}
            onDeliverSelectedFood={deliverSelectedFoodToCustomer}
            onBoundsReady={setBounds}
            onTableOverlayTransformChange={updateTableOverlayTransform}
            onCheckoutPropsTransformChange={updateCheckoutPropsTransform}
            onCashDrawerTransformChange={updateCashDrawerTransform}
            onReceiptPrinterTransformChange={updateReceiptPrinterTransform}
            onWhitePlateStackTransformChange={updateWhitePlateStackTransform}
            onServingTrayTransformChange={updateServingTrayTransform}
            onPlateStackTransformChange={updatePlateStackTransform}
          />
        </Suspense>
      </Canvas>

      <FoodSelectionOverlay stock={stock} onSelectFood={selectFoodForActiveCustomer} />
      <ServingInteractionOverlay
        selectedItems={selectedServingItems}
        pendingServeItem={pendingServeItem}
        onPlacePendingFood={placePendingFoodOnPlate}
        onReturnSelectedFood={returnSelectedFood}
        onDeliverSelectedFood={deliverSelectedFoodToCustomer}
      />

      {false ? (
      <aside className="rm-dev-panel" style={{ left: panelPosition.left, top: panelPosition.top }}>
        <div
          className="rm-dev-panel-title"
          onPointerDown={startPanelDrag}
          onPointerMove={dragPlacementPanel}
          onPointerUp={stopPanelDrag}
          onPointerCancel={stopPanelDrag}
        >
          <span><Move3D size={18} /> Food placement</span>
          <small>Drag panel</small>
        </div>
        <strong>Locked restaurant: {transformText}</strong>
        <strong>Locked camera: position [{RESTAURANT_MANAGER_CONFIG.camera.position.join(", ")}]</strong>
        <strong>Legacy basket hidden. Croissants are now served from a tray.</strong>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>Price tag placement coordinates</span>
            <button type="button" onClick={copyPriceTagCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="Price tag placement coordinates"
            value={priceTagCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>Table overlay coordinates</span>
            <button type="button" onClick={copyTableOverlayCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="Table overlay coordinates"
            value={tableOverlayCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>Money machine coordinates</span>
            <button type="button" onClick={copyCheckoutPropsCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="Money machine coordinates"
            value={checkoutPropsCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>Cash drawer coordinates</span>
            <button type="button" onClick={copyCashDrawerCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="Cash drawer coordinates"
            value={cashDrawerCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>Receipt printer coordinates</span>
            <button type="button" onClick={copyReceiptPrinterCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="Receipt printer coordinates"
            value={receiptPrinterCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>White plate coordinates</span>
            <button type="button" onClick={copyWhitePlateStackCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="White plate coordinates"
            value={whitePlateStackCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>Serving tray coordinates</span>
            <button type="button" onClick={copyServingTrayCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="Serving tray coordinates"
            value={servingTrayCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        <div className="rm-coordinate-copy">
          <div className="rm-coordinate-copy-header">
            <span>Plate stack coordinates</span>
            <button type="button" onClick={copyPlateStackCoordinates}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            aria-label="Plate stack coordinates"
            value={plateStackCoordinatesText}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        {bounds ? <p>Model size: {bounds.size.join(" x ")} | center: {bounds.center.join(", ")}</p> : <p>Measuring model...</p>}
        <div className="rm-placement-editor">
          <div className="rm-basket-tools" role="group" aria-label="Basket placement mode">
            <button
              type="button"
              className={basketTool === "move" ? "is-active" : ""}
              onClick={() => setBasketTool("move")}
            >
              Drag
            </button>
            <button
              type="button"
              className={basketTool === "rotate" ? "is-active" : ""}
              onClick={() => setBasketTool("rotate")}
            >
              Rotate
            </button>
            <button
              type="button"
              className={basketTool === "resize" ? "is-active" : ""}
              onClick={() => setBasketTool("resize")}
            >
              Resize
            </button>
            <button
              type="button"
              className={basketTool === "locked" ? "is-active" : ""}
              onClick={() => setBasketTool("locked")}
            >
              Lock
            </button>
          </div>
          <p>
            {basketTool === "move"
              ? "Drag any complete food tray, price tag, table overlay, serving tray, money machine, cash drawer, receipt printer, white plates, or plate stack directly in the restaurant scene."
              : basketTool === "rotate"
                ? "Drag left/right on the table overlay, serving tray, money machine, cash drawer, receipt printer, white plates, plate stack, or a tray to rotate it. Drag a price tag in any direction to rotate it."
                : basketTool === "resize"
                  ? "Drag a price tag, serving tray, money machine, cash drawer, receipt printer, white plates, or plate stack to scale it, or drag the table overlay to expand and shrink its width/depth."
                  : "Direct editing is locked. Use Save when the position is right."}
          </p>
          {selectedAsset ? (
            <>
              <label className="rm-placement-row rm-placement-row-single">
                <span>Editable item</span>
                <select
                  value={selectedAsset.id}
                  aria-label="Editable restaurant display item"
                  onChange={(event) => {
                    const nextAssetId = event.target.value;
                    const nextAsset = placement.foodDisplayAssets.find((asset) => asset.id === nextAssetId);
                    setSelectedAssetId(nextAssetId);
                    setSelectedStockId(nextAsset?.shelfStock?.[0]?.id || "");
                  }}
                >
                  {placement.foodDisplayAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <PlacementVectorEditor
                label="Item position"
                values={selectedAsset.position}
                onChange={(position) => updateDisplayAssetTransform(selectedAsset.id, { position })}
              />
              <PlacementVectorEditor
                label="Item rotation"
                values={selectedAsset.rotation}
                step={0.05}
                onChange={(rotation) => updateDisplayAssetTransform(selectedAsset.id, { rotation })}
              />
              <PlacementNumberEditor
                label="Item scale"
                value={selectedAsset.scale}
                step={0.05}
                onChange={(scale) => updateDisplayAssetTransform(selectedAsset.id, { scale })}
              />
              <PlacementVectorEditor
                label="Overlay position"
                values={tableOverlayTransform.position}
                step={0.03}
                onChange={(position) => updateTableOverlayTransform({ position })}
              />
              <PlacementVectorEditor
                label="Overlay rotation"
                values={tableOverlayTransform.rotation}
                step={0.05}
                onChange={(rotation) => updateTableOverlayTransform({ rotation })}
              />
              <PlacementVectorEditor
                label="Overlay size"
                values={tableOverlayTransform.size}
                step={0.05}
                onChange={(size) =>
                  updateTableOverlayTransform({
                    size: [
                      Math.max(0.2, size[0]),
                      Math.max(0.005, size[1]),
                      Math.max(0.2, size[2]),
                    ],
                  })
                }
              />
              <PlacementVectorEditor
                label="Money machine position"
                values={checkoutPropsTransform.position}
                step={0.03}
                onChange={(position) => updateCheckoutPropsTransform({ position })}
              />
              <PlacementVectorEditor
                label="Money machine rotation"
                values={checkoutPropsTransform.rotation}
                step={0.05}
                onChange={(rotation) => updateCheckoutPropsTransform({ rotation })}
              />
              <PlacementNumberEditor
                label="Money machine scale"
                value={checkoutPropsTransform.scale}
                step={0.05}
                onChange={(scale) => updateCheckoutPropsTransform({ scale: Math.max(0.35, scale || 1) })}
              />
              <PlacementNumberEditor
                label="Money machine screen tilt"
                value={checkoutPropsTransform.displayTilt ?? MONEY_MACHINE_SCREEN_TILT_DEFAULT}
                step={0.03}
                onChange={(displayTilt) =>
                  updateCheckoutPropsTransform({
                    displayTilt: clampMoneyMachineScreenTilt(displayTilt),
                  })
                }
              />
              <PlacementVectorEditor
                label="Cash drawer position"
                values={cashDrawerTransform.position}
                step={0.03}
                onChange={(position) => updateCashDrawerTransform({ position })}
              />
              <PlacementVectorEditor
                label="Cash drawer rotation"
                values={cashDrawerTransform.rotation}
                step={0.05}
                onChange={(rotation) => updateCashDrawerTransform({ rotation })}
              />
              <PlacementNumberEditor
                label="Cash drawer scale"
                value={cashDrawerTransform.scale}
                step={0.05}
                onChange={(scale) => updateCashDrawerTransform({ scale: Math.max(0.45, scale || 1) })}
              />
              <PlacementNumberEditor
                label="Cash note rack tilt"
                value={cashDrawerTransform.noteRackTilt ?? 0.77}
                step={0.03}
                onChange={(noteRackTilt) => updateCashDrawerTransform({ noteRackTilt })}
              />
              <PlacementNumberEditor
                label="Cash note stack tilt"
                value={cashDrawerTransform.noteStackTilt ?? 0.77}
                step={0.03}
                onChange={(noteStackTilt) => updateCashDrawerTransform({ noteStackTilt })}
              />
              <PlacementVectorEditor
                label="Receipt printer position"
                values={receiptPrinterTransform.position}
                step={0.03}
                onChange={(position) => updateReceiptPrinterTransform({ position })}
              />
              <PlacementVectorEditor
                label="Receipt printer rotation"
                values={receiptPrinterTransform.rotation}
                step={0.05}
                onChange={(rotation) => updateReceiptPrinterTransform({ rotation })}
              />
              <PlacementNumberEditor
                label="Receipt printer scale"
                value={receiptPrinterTransform.scale}
                step={0.05}
                onChange={(scale) => updateReceiptPrinterTransform({ scale: Math.max(0.45, scale || 1) })}
              />
              <PlacementVectorEditor
                label="White plates position"
                values={whitePlateStackTransform.position}
                step={0.03}
                onChange={(position) => updateWhitePlateStackTransform({ position })}
              />
              <PlacementVectorEditor
                label="White plates rotation"
                values={whitePlateStackTransform.rotation}
                step={0.05}
                onChange={(rotation) => updateWhitePlateStackTransform({ rotation })}
              />
              <PlacementNumberEditor
                label="White plates scale"
                value={whitePlateStackTransform.scale}
                step={0.05}
                onChange={(scale) => updateWhitePlateStackTransform({ scale: Math.max(0.45, scale || 1) })}
              />
              <PlacementNumberEditor
                label="White plate count"
                value={whitePlateStackTransform.count}
                step={1}
                onChange={(count) => updateWhitePlateStackTransform({ count: Math.max(1, Math.round(count || 1)) })}
              />
              <PlacementNumberEditor
                label="White plate spacing"
                value={whitePlateStackTransform.spacing}
                step={0.005}
                onChange={(spacing) => updateWhitePlateStackTransform({ spacing: Math.max(0.005, spacing || 0.026) })}
              />
              <PlacementVectorEditor
                label="Serving tray position"
                values={servingTrayTransform.position}
                step={0.03}
                onChange={(position) => updateServingTrayTransform({ position })}
              />
              <PlacementVectorEditor
                label="Serving tray rotation"
                values={servingTrayTransform.rotation}
                step={0.05}
                onChange={(rotation) => updateServingTrayTransform({ rotation })}
              />
              <PlacementNumberEditor
                label="Serving tray scale"
                value={servingTrayTransform.scale}
                step={0.05}
                onChange={(scale) => updateServingTrayTransform({ scale: Math.max(0.45, scale || 1) })}
              />
              <PlacementVectorEditor
                label="Plate stack position"
                values={plateStackTransform.position}
                step={0.03}
                onChange={(position) => updatePlateStackTransform({ position })}
              />
              <PlacementVectorEditor
                label="Plate stack rotation"
                values={plateStackTransform.rotation}
                step={0.05}
                onChange={(rotation) => updatePlateStackTransform({ rotation })}
              />
              <PlacementNumberEditor
                label="Plate stack scale"
                value={plateStackTransform.scale}
                step={0.05}
                onChange={(scale) => updatePlateStackTransform({ scale: Math.max(0.45, scale || 1) })}
              />
              <PlacementNumberEditor
                label="Plates per pack"
                value={plateStackTransform.count}
                step={1}
                onChange={(count) => updatePlateStackTransform({ count: Math.max(1, Math.round(count || 1)) })}
              />
              <PlacementNumberEditor
                label="Plate pack count"
                value={plateStackTransform.packCount}
                step={1}
                onChange={(packCount) => updatePlateStackTransform({ packCount: Math.max(1, Math.round(packCount || 1)) })}
              />
              <PlacementNumberEditor
                label="Plate pack gap"
                value={plateStackTransform.packGap}
                step={0.03}
                onChange={(packGap) => updatePlateStackTransform({ packGap: Math.max(0.2, packGap || 0.86) })}
              />
              <PlacementNumberEditor
                label="Plate depth"
                value={plateStackTransform.plateHeight}
                step={0.01}
                onChange={(plateHeight) => updatePlateStackTransform({ plateHeight: Number.isFinite(plateHeight) ? plateHeight : 0 })}
              />
              {Array.from({ length: Math.max(1, plateStackTransform.packCount || 2) }, (_, packIndex) => {
                const packTransform = getPlatePackTransform(
                  plateStackTransform,
                  packIndex,
                  Math.max(1, plateStackTransform.packCount || 2)
                );
                return (
                  <div className="rm-placement-editor" key={packIndex}>
                    <strong>Plate pack {packIndex + 1}</strong>
                    <PlacementVectorEditor
                      label={`Pack ${packIndex + 1} position`}
                      values={packTransform.position}
                      step={0.03}
                      onChange={(position) => updatePlatePackTransform(packIndex, { position })}
                    />
                    <PlacementVectorEditor
                      label={`Pack ${packIndex + 1} rotation`}
                      values={packTransform.rotation}
                      step={0.05}
                      onChange={(rotation) => updatePlatePackTransform(packIndex, { rotation })}
                    />
                    <PlacementNumberEditor
                      label={`Pack ${packIndex + 1} scale`}
                      value={packTransform.scale}
                      step={0.05}
                      onChange={(scale) => updatePlatePackTransform(packIndex, { scale: Math.max(0.45, scale || 1) })}
                    />
                  </div>
                );
              })}
              {selectedAsset.shelfStock?.length ? (
                <>
                  <label className="rm-placement-row rm-placement-row-single">
                    <span>Food tray</span>
                    <select
                      value={selectedStock?.id || ""}
                      aria-label="Editable food tray"
                      onChange={(event) => setSelectedStockId(event.target.value)}
                    >
                      {selectedAsset.shelfStock.map((stock) => (
                        <option key={stock.id} value={stock.id}>{stock.name}</option>
                      ))}
                    </select>
                  </label>
                  {selectedStock ? (
                    <>
                      <PlacementVectorEditor
                        label="Tray position"
                        values={selectedStock.localPosition || [0, selectedStock.y || 0, selectedStock.z || 0]}
                        step={0.03}
                        onChange={(localPosition) =>
                          updateShelfStockTransform(selectedAsset.id, selectedStock.id, { localPosition })
                        }
                      />
                      <PlacementVectorEditor
                        label="Tray rotation"
                        values={selectedStock.localRotation || [0, 0, 0]}
                        step={0.05}
                        onChange={(localRotation) =>
                          updateShelfStockTransform(selectedAsset.id, selectedStock.id, { localRotation })
                        }
                      />
                      <div className="rm-tray-orientation-tools" role="group" aria-label="Selected tray orientation">
                        <button
                          type="button"
                          onClick={() => {
                            const currentRotation = selectedStock.localRotation || [0, 0, 0];
                            updateShelfStockTransform(selectedAsset.id, selectedStock.id, {
                              localRotation: [currentRotation[0], 0, currentRotation[2]],
                            });
                          }}
                        >
                          Horizontal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentRotation = selectedStock.localRotation || [0, 0, 0];
                            updateShelfStockTransform(selectedAsset.id, selectedStock.id, {
                              localRotation: [currentRotation[0], roundValue(Math.PI / 2), currentRotation[2]],
                            });
                          }}
                        >
                          Vertical
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentRotation = selectedStock.localRotation || [0, 0, 0];
                            updateShelfStockTransform(selectedAsset.id, selectedStock.id, {
                              localRotation: [
                                currentRotation[0],
                                roundValue(currentRotation[1] + Math.PI / 2),
                                currentRotation[2],
                              ],
                            });
                          }}
                        >
                          Turn 90
                        </button>
                      </div>
                      <PlacementVectorEditor
                        label="Tag position"
                        values={selectedStock.priceTagPosition || getDefaultPriceTagPosition(selectedStock)}
                        step={0.02}
                        onChange={(priceTagPosition) =>
                          updateShelfStockTransform(selectedAsset.id, selectedStock.id, { priceTagPosition })
                        }
                      />
                      <PlacementVectorEditor
                        label="Tag rotation"
                        values={selectedStock.priceTagRotation || [-0.42, 0, 0]}
                        step={0.03}
                        onChange={(priceTagRotation) =>
                          updateShelfStockTransform(selectedAsset.id, selectedStock.id, { priceTagRotation })
                        }
                      />
                      <PlacementNumberEditor
                        label="Tag size"
                        value={selectedStock.priceTagScale || 1}
                        step={0.05}
                        onChange={(priceTagScale) =>
                          updateShelfStockTransform(selectedAsset.id, selectedStock.id, {
                            priceTagScale: Math.max(0.35, Math.min(2.5, priceTagScale || 1)),
                          })
                        }
                      />
                      {selectedStock.path ? (
                        <>
                          <PlacementNumberEditor
                            label="Food size"
                            value={selectedStock.targetWidth}
                            step={0.01}
                            onChange={(targetWidth) =>
                              updateShelfStockTransform(selectedAsset.id, selectedStock.id, { targetWidth })
                            }
                          />
                          <PlacementNumberEditor
                            label="Clone count"
                            value={selectedStock.count}
                            step={1}
                            onChange={(count) =>
                              updateShelfStockTransform(selectedAsset.id, selectedStock.id, {
                                count: Math.max(1, Math.round(count || 1)),
                              })
                            }
                          />
                          <PlacementNumberEditor
                            label="Row spread"
                            value={selectedStock.rowWidth}
                            step={0.03}
                            onChange={(rowWidth) =>
                              updateShelfStockTransform(selectedAsset.id, selectedStock.id, { rowWidth })
                            }
                          />
                        </>
                      ) : null}
                      <PlacementNumberEditor
                        label="Tray width"
                        value={selectedStock.trayWidth}
                        step={0.05}
                        onChange={(trayWidth) =>
                          updateShelfStockTransform(selectedAsset.id, selectedStock.id, { trayWidth })
                        }
                      />
                      <PlacementNumberEditor
                        label="Tray depth"
                        value={selectedStock.trayDepth}
                        step={0.05}
                        onChange={(trayDepth) =>
                          updateShelfStockTransform(selectedAsset.id, selectedStock.id, { trayDepth })
                        }
                      />
                    </>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          <div className="rm-placement-actions">
            <button type="button" onClick={savePlacement}><Save size={15} /> Save</button>
            <button type="button" onClick={resetPlacement}><RotateCcw size={15} /> Reset</button>
          </div>
          {saveMessage ? <p className="rm-save-message">{saveMessage}</p> : null}
        </div>
        <p>The restaurant and camera are locked. Food trays, serving tray, checkout props, and price tags are editable now.</p>
      </aside>
      ) : null}
    </section>
    </main>
  );
}

useGLTF.preload(RESTAURANT_MANAGER_CONFIG.restaurantAssetPath);
useGLTF.preload(RESTAURANT_MANAGER_CONFIG.basketAssetPath);
useGLTF.preload(RESTAURANT_MANAGER_CONFIG.croissantAssetPath);
RESTAURANT_MANAGER_CONFIG.foodDisplayAssets.forEach((asset) => {
  if (asset.path) useGLTF.preload(asset.path);
  asset.shelfStock?.forEach((stock) => {
    if (stock.path) useGLTF.preload(stock.path);
  });
});
