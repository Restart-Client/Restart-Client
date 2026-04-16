// TanStack Query のクエリキーを一箇所に集約する。
// これにより「どのキャッシュを無効化すればよいか」が型として明示される。

export const qk = {
  exp: () => ["exp"] as const,
  items: () => ["items"] as const,
  materials: () => ["materials"] as const,
  skills: () => ["skills"] as const,
  weaponCategories: () => ["weapon-categories"] as const,
  weaponsInCategory: (weaponId: number) =>
    ["weapons-in-category", weaponId] as const,
  weapon: (weaponNumber: number) => ["weapon", weaponNumber] as const,
  pets: () => ["pets"] as const,
  battlePets: () => ["battle-pets"] as const,
  pet: (petId: number) => ["pet", petId] as const,
} as const;
