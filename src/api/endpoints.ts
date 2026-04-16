// Re'start API の各エンドポイントを薄くラップした関数群。
// TanStack Query から呼び出される想定。

import { ApiClient } from "./client";
import type {
  ExpResponse,
  ItemCountResponse,
  ItemsResponse,
  MaterialCountResponse,
  MaterialsResponse,
  PetDetailResponse,
  PetsResponse,
  SetBattlePetsResponse,
  SetPetResponse,
  SetSkillResponse,
  SetToolResponse,
  SetWeaponResponse,
  SkillCountResponse,
  SkillsResponse,
  WeaponCategoriesResponse,
  WeaponCategoryDetailResponse,
  WeaponDetailResponse,
} from "./types";

export class RestartApi {
  constructor(private client: ApiClient) {}

  // -- 認証 --
  /** 現在のトークンを即座に無効化する */
  logout() {
    return this.client.post<{ status: "ok" }>("/public/auth/logout");
  }

  // -- プレイヤー --
  exp() {
    return this.client.get<ExpResponse>("/public/me/exp");
  }

  // -- アイテム --
  items() {
    return this.client.get<ItemsResponse>("/public/me/items");
  }
  item(id: number) {
    return this.client.get<ItemCountResponse>(`/public/me/items/${id}`);
  }

  // -- 素材 --
  materials() {
    return this.client.get<MaterialsResponse>("/public/me/materials");
  }
  material(id: number) {
    return this.client.get<MaterialCountResponse>(`/public/me/materials/${id}`);
  }

  // -- スキル --
  skills() {
    return this.client.get<SkillsResponse>("/public/me/skills");
  }
  skill(id: number) {
    return this.client.get<SkillCountResponse>(`/public/me/skills/${id}`);
  }
  /** skill_id=0 で解除 */
  setSkill(id: number) {
    return this.client.post<SetSkillResponse>(`/public/me/skill/${id}/set`);
  }

  // -- 武器 --
  weaponCategories() {
    return this.client.get<WeaponCategoriesResponse>(
      "/public/me/weapon_categories",
    );
  }
  weaponsInCategory(weaponId: number) {
    return this.client.get<WeaponCategoryDetailResponse>(
      `/public/me/weapon_categories/${weaponId}`,
    );
  }
  weapon(weaponNumber: number) {
    return this.client.get<WeaponDetailResponse>(
      `/public/me/weapons/${weaponNumber}`,
    );
  }
  /** weapon_number=0 で解除 */
  setWeapon(weaponNumber: number) {
    return this.client.post<SetWeaponResponse>(
      `/public/me/weapons/${weaponNumber}/set`,
    );
  }

  // -- ツール --
  /** tool_id=0 で解除 */
  setTool(toolId: number) {
    return this.client.post<SetToolResponse>(`/public/me/tool/${toolId}/set`);
  }

  // -- ペット --
  pets() {
    return this.client.get<PetsResponse>("/public/me/pets");
  }
  battlePets() {
    return this.client.get<PetsResponse>("/public/me/pets/battle");
  }
  pet(petId: number) {
    return this.client.get<PetDetailResponse>(`/public/me/pets/${petId}`);
  }
  /** トグル: 参加中→解除 / 未参加→参加 */
  togglePet(petId: number) {
    return this.client.post<SetPetResponse>(`/public/me/pets/${petId}/set`);
  }
  /** 戦闘参加ペットを一括置換 */
  setBattlePets(petIds: number[]) {
    return this.client.post<SetBattlePetsResponse>(
      "/public/me/pets/battle/set",
      { pet_ids: petIds },
    );
  }
  /** 全ペットを戦闘から解除 */
  removeAllBattlePets() {
    return this.client.post<{ user_id: number; status: "ok" }>(
      "/public/me/pets/battle/remove",
    );
  }
}
