export const springSoft = {
  type: "spring",
  stiffness: 400,
  damping: 32,
  mass: 0.8,
} as const;

export const springSnappy = {
  type: "spring",
  stiffness: 600,
  damping: 30,
} as const;

export const springFluid = {
  type: "spring",
  stiffness: 430,
  damping: 34,
  mass: 0.82,
} as const;

export const springPlayful = {
  type: "spring",
  stiffness: 520,
  damping: 25,
  mass: 0.72,
} as const;

export const staggerFast = {
  staggerChildren: 0.035,
  delayChildren: 0.025,
} as const;

export const quickEase = {
  duration: 0.18,
  ease: [0.2, 0.8, 0.2, 1],
} as const;
