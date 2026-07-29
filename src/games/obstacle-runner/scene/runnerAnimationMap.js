const REQUIRED_STATES = [
  "Idle",
  "Run",
  "JumpStart",
  "JumpLoop",
  "Land",
  "Slide",
  "LaneLeft",
  "LaneRight",
  "Stumble",
  "Hit",
  "Celebrate",
];

const ALIASES = {
  Idle: ["idle", "standing", "breathing"],
  Run: ["run", "running", "jog", "sprint", "mixamo.com"],
  JumpStart: ["jumpstart", "jump start", "jump_begin", "jumpbegin", "jump"],
  JumpLoop: ["jumploop", "jump loop", "airborne", "falling"],
  Land: ["land", "landing"],
  Slide: ["slide", "sliding", "roll"],
  LaneLeft: ["laneleft", "lane left", "strafeleft", "strafe left", "left"],
  LaneRight: ["laneright", "lane right", "straferight", "strafe right", "right"],
  Stumble: ["stumble", "trip", "hitreaction", "hit reaction"],
  Hit: ["hit", "impact", "damage"],
  Celebrate: ["celebrate", "victory", "happy", "cheer"],
};

export function normalizeClipName(name = "") {
  return String(name)
    .replace(/^.*\|/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function mapAnimationClips(clips = [], options = {}) {
  const includeFallbacks = options.includeFallbacks !== false;
  const mappings = {};
  const normalized = clips.map((clip) => ({
    clip,
    name: normalizeClipName(clip.name),
  }));

  REQUIRED_STATES.forEach((state) => {
    const aliases = ALIASES[state] || [];
    const match = normalized.find((entry) => aliases.some((alias) => entry.name === alias || entry.name.includes(alias)));
    if (match) mappings[state] = match.clip;
  });

  if (includeFallbacks) {
    if (!mappings.Run && clips[0]) mappings.Run = clips[0];
    if (!mappings.Idle) mappings.Idle = mappings.Run;
    ["JumpStart", "JumpLoop", "Land", "Slide", "LaneLeft", "LaneRight", "Stumble", "Hit", "Celebrate"].forEach((state) => {
      if (!mappings[state]) mappings[state] = mappings.Run;
    });
  }

  return mappings;
}
