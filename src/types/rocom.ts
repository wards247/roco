export interface RocomLocalizedName {
  zh: {
    name: string;
  };
}

export interface RocomType {
  id: number;
  name: string;
  localized: {
    zh: string;
  };
}

export interface RocomBreedingProfile {
  pet_base_id: number | null;
  egg_groups: number[];
  proportion_male: number | null;
  male_rate: number | null;
  female_rate: number | null;
}

export interface RocomWorldProfile {
  type_desc: string | null;
  description_habitat: string | null;
  introduction: string | null;
  refresh_locations: string[];
  movement_type: string | null;
  classis_id: number | null;
  classis_name: string | null;
  handbook_area_ids: number[];
}

export interface RocomEvolutionNode {
  id: number;
  name: string;
  form: string;
  localized: RocomLocalizedName;
  is_leader_form: boolean;
  main_type: RocomType;
  sub_type: RocomType | null;
  evolution_conditions: string[];
}

export interface RocomEvolutionStage {
  depth: number;
  is_leader_stage?: boolean;
  monsters: RocomEvolutionNode[];
}

export interface RocomEvolutionTree {
  stages: RocomEvolutionStage[];
  max_depth: number;
  total_unique_monsters: number;
  species_id: number;
  current_monster_id: number;
}

export interface RocomPetIndex {
  id: number;
  name: string;
  form: string;
  main_type: RocomType;
  sub_type: RocomType | null;
  default_legacy_type: RocomType;
  leader_potential: boolean;
  is_leader_form: boolean;
  preferred_attack_style: string;
  localized: RocomLocalizedName;
  implemented: boolean;
  base_hp: number;
  base_phy_atk: number;
  base_mag_atk: number;
  base_phy_def: number;
  base_mag_def: number;
  base_spd: number;
  evolves_from_id: number | null;
  breeding_profile?: RocomBreedingProfile | null;
}

export interface RocomPetDetail extends RocomPetIndex {
  species: {
    id: number;
    name: string;
    localized: {
      zh: string;
    };
  };
  trait: {
    id: number;
    name: string;
    description: string;
    localized: {
      zh: {
        name: string;
        description: string;
      };
    };
  } | null;
  move_pool: RocomMove[];
  move_stones: RocomMove[];
  legacy_moves: Array<{
    monster_id: number;
    type_id: number;
    move_id: number;
  }>;
  evolution_tree: RocomEvolutionTree;
  world_profile?: RocomWorldProfile | null;
  breeding?: {
    hatch_data: number | null;
    weight_low: number | null;
    weight_high: number | null;
    height_low: number | null;
    height_high: number | null;
  } | null;
}

export interface RocomMove {
  id: number;
  name: string;
  move_type: RocomType | null;
  localized: {
    zh: {
      name: string;
      description: string;
    };
  };
  move_category: string;
  energy_cost: number;
  power: number | null;
  description: string;
}

export interface RocomPetCard {
  id: number;
  name: string;
  assetName: string;
  typeName: string;
  eggGroupIds: number[];
  implemented: boolean;
  avatarUrl: string;
  bodyUrl: string;
  totalStats: number;
}
