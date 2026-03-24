"use client";

import type { MenuCategory, MenuCategoryDefinition } from "@/lib/menu/types";

interface CategoryTabsProps {
  categories: MenuCategoryDefinition[];
  selectedCategory: MenuCategory;
  onSelectCategory: (category: MenuCategory) => void;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory
}: CategoryTabsProps) {
  return (
    <div className="category-tabs" aria-label="Menu categories" role="tablist">
      {categories.map((category) => {
        const isActive = category.id === selectedCategory;

        return (
          <button
            aria-selected={isActive}
            key={category.id}
            className={`category-tab${isActive ? " is-active" : ""}`}
            onClick={() => onSelectCategory(category.id)}
            role="tab"
            type="button"
          >
            <span className="category-tab__eyebrow">{category.eyebrow}</span>
            <span className="category-tab__label">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
