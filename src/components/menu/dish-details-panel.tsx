"use client";

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/ar/assets";
import type { MenuDish } from "@/lib/menu/types";

interface DishDetailsPanelProps {
  dish: MenuDish;
}

export function DishDetailsPanel({ dish }: DishDetailsPanelProps) {
  return (
    <motion.aside
      key={dish.id}
      className="glass-panel details-panel"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="panel-header">
        <span className="eyebrow">Dish Details</span>
        <h3>{dish.name}</h3>
      </div>

      <div className="details-grid">
        <div className="detail-tile">
          <span className="detail-tile__label">Calories</span>
          <strong>{dish.calories} kcal</strong>
        </div>
        <div className="detail-tile">
          <span className="detail-tile__label">Price</span>
          <strong>{formatPrice(dish.priceInr)}</strong>
        </div>
      </div>

      <p className="details-copy">{dish.description}</p>

      <div className="detail-section">
        <span className="detail-section__label">Ingredients</span>
        <ul className="ingredient-list">
          {dish.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </div>
    </motion.aside>
  );
}

