export interface EggGroup {
  group_id: number;
  group_display: string;
  description: string;
  member_count: number;
  hatchable_member_count: number;
}

export interface Pokemon {
  base_id: number;
  display_name: string;
  page_name: string;
  avatar_url: string;
  body_url: string;
  class_name: string;
  type_name: string;
  hatch_status_text: string;
  family_chain: string;
  family_key: string;
  member_count: number;
  can_hatch_member_count: number;
  egg_group_id: number;
}

export interface MyPokemon {
  base_id: number;
  egg_group_id: number;
  egg_group_ids?: number[];
  can_hatch?: boolean;
  gender: Gender;
  is_mine: boolean;
  display_name?: string;
  avatar_url?: string;
}

export interface EggGroupData {
  group: EggGroup;
  cards: Pokemon[];
}

export type Gender = 'male' | 'female' | 'unknown';
