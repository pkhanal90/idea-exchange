const AVATAR_GRADIENTS = [
  "from-indigo-500 to-indigo-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
  "from-blue-500 to-blue-700",
  "from-fuchsia-500 to-fuchsia-700",
  "from-teal-500 to-teal-700",
  "from-violet-500 to-violet-700",
];

export function avatarGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}
