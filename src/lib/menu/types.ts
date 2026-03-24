export type MenuCategory = "veg" | "non-veg" | "veg-non-veg" | "dessert";

export type FallbackDishKind =
  | "salad"
  | "pizza"
  | "pasta"
  | "dumplings"
  | "platter"
  | "burger"
  | "dessert";

export interface DishAssetSet {
  glb?: string;
  usdz?: string;
  usdzReady: boolean;
}

export interface DishVisualConfig {
  targetSize: number;
  arScale: number;
  pedestalHeight: number;
  baseRotationDeg: number;
  fallbackKind: FallbackDishKind;
  accentColor: string;
}

export interface MenuDish {
  id: string;
  slug: string;
  name: string;
  category: MenuCategory;
  tagline: string;
  description: string;
  priceInr: number;
  calories: number;
  ingredients: string[];
  assets: DishAssetSet;
  visual: DishVisualConfig;
}

export interface MenuCategoryDefinition {
  id: MenuCategory;
  label: string;
  eyebrow: string;
  description: string;
}

export interface RestaurantMenu {
  brand: string;
  headline: string;
  subheadline: string;
  categories: MenuCategoryDefinition[];
  dishes: MenuDish[];
}

