// Re'start 公開API のレスポンス型
// Ref: https://restart2.restart-reboot.com/docs/api

// ============================================================
// 認証
// ============================================================

export interface TokenResponse {
  token_type: "Bearer";
  access_token: string;
  expires_in: number;
  user_id: string;
}

export interface TokenMeta {
  user_id: string;
  /** Unix 秒でのトークン失効時刻 */
  expires_at: number;
}

// ============================================================
// 共通エラー
// ============================================================

export interface ApiErrorBody {
  error: string;
  [key: string]: unknown;
}

export interface RateLimitErrorBody extends ApiErrorBody {
  error: "rate limit exceeded";
  limit: number;
  window_seconds: number;
  retry_after_seconds: number;
}

// ============================================================
// アイテム / 素材 / スキル (同じ形)
// ============================================================

export interface Item {
  item_id: number;
  item_name: string;
  count: number;
}
export interface ItemsResponse {
  user_id: string;
  items: Item[];
}
export interface ItemCountResponse {
  user_id: string;
  item_id: number;
  item_name: string;
  count: number;
}

export interface Material {
  material_id: number;
  material_name: string;
  count: number;
}
export interface MaterialsResponse {
  user_id: string;
  materials: Material[];
}
export interface MaterialCountResponse {
  user_id: string;
  material_id: number;
  material_name: string;
  count: number;
}

export interface Skill {
  skill_id: number;
  skill_name: string;
  count: number;
}
export interface SkillsResponse {
  user_id: string;
  skills: Skill[];
}
export interface SkillCountResponse {
  user_id: string;
  skill_id: number;
  skill_name: string;
  count: number;
}

export interface SetSkillResponse {
  user_id: string;
  equipped_skill_id: number;
  status: "ok";
  removed: boolean;
}

// ============================================================
// 武器
// ============================================================

export interface WeaponCategory {
  weapon_id: number;
  weapon_name: string;
  count: number;
}
export interface WeaponCategoriesResponse {
  user_id: string;
  weapon_categories: WeaponCategory[];
}

export interface WeaponInstance {
  weapon_number: number;
  weapon_name: string;
  is_equipped: boolean;
  proficiency: number;
  nbt: string;
  shortcut_id: number;
  enchant_count: number;
}
export interface WeaponCategoryDetailResponse {
  user_id: string;
  weapons: WeaponInstance[];
}

export interface WeaponDetailResponse {
  user_id: string;
  weapon_number: number;
  weapon_name: string;
  weapon_id: number;
  is_equipped: boolean;
  proficiency: number;
  nbt: string;
  shortcut_id: number;
  enchant_count: number;
  enchantments: number[];
  enchantments_names: string[];
}

export interface SetWeaponResponse {
  user_id: string;
  equipped_weapon_number: number;
  status: "ok";
  removed: boolean;
}

// ============================================================
// ツール
// ============================================================

export interface SetToolResponse {
  user_id: string;
  equipped_item_id: number;
  status: "ok";
  removed: boolean;
}

// ============================================================
// ペット
// ============================================================

export interface PetSkill {
  id: number;
  percent: number;
  name: string;
  description?: string;
}

export interface Pet {
  pet_id: number;
  enemy_id: number;
  ability_id: number;
  atk_percent: number;
  experience: number;
  battle: boolean;
  nbt: string;
  img: string;
  name: string;
  ability_name: string;
  skills: PetSkill[];
}

export interface PetsResponse {
  user_id: string;
  pets: Pet[];
}

export interface PetDetailResponse {
  user_id: string;
  pet: Pet;
}

export interface SetPetResponse {
  user_id: string;
  equipped_pet_id: number;
  status: "ok";
  removed: boolean;
}

export interface SetBattlePetsResponse {
  user_id: string;
  equipped_pet_ids: number[];
  status: "ok";
}

// ============================================================
// プレイヤー
// ============================================================

export interface ExpResponse {
  user_id: string;
  exp: number;
  level: number;
}
