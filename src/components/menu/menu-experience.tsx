"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { formatPrice, getAdjacentDishes, resolveDishAssets } from "@/lib/ar/assets";
import { resolveRenderEngine } from "@/lib/ar/engines/resolve-engine";
import { openQuickLook } from "@/lib/ar/quick-look";
import type { MenuCategory, RestaurantMenu } from "@/lib/menu/types";
import { useArCapabilities } from "@/hooks/use-ar-capabilities";
import { CameraArModal } from "@/components/rendering/camera-ar-modal";
import { RenderStage, type RenderStageHandle } from "@/components/rendering/render-stage";
import { CategoryTabs } from "./category-tabs";
import { DishDetailsPanel } from "./dish-details-panel";

interface MenuExperienceProps {
  menu: RestaurantMenu;
}

function buildInitialIndexes(menu: RestaurantMenu) {
  return menu.categories.reduce<Record<MenuCategory, number>>((indexes, category) => {
    indexes[category.id] = 0;
    return indexes;
  }, {} as Record<MenuCategory, number>);
}

export function MenuExperience({ menu }: MenuExperienceProps) {
  const capabilities = useArCapabilities();
  const stageRef = useRef<RenderStageHandle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>(menu.categories[0].id);
  const [indexByCategory, setIndexByCategory] = useState<Record<MenuCategory, number>>(
    buildInitialIndexes(menu)
  );
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [launchState, setLaunchState] = useState<"idle" | "launching">("idle");

  const categoryMeta =
    menu.categories.find((category) => category.id === selectedCategory) ?? menu.categories[0];
  const filteredDishes = menu.dishes.filter((dish) => dish.category === selectedCategory);
  const rawIndex = indexByCategory[selectedCategory] ?? 0;
  const currentIndex = rawIndex % filteredDishes.length;
  const currentDish = filteredDishes[currentIndex];
  const preloadDishes = getAdjacentDishes(filteredDishes, currentIndex);
  const engine = resolveRenderEngine(capabilities, currentDish);
  const assetSelection = resolveDishAssets(currentDish, filteredDishes, currentIndex, capabilities);
  const dishCountLabel = `${String(currentIndex + 1).padStart(2, "0")} / ${String(
    filteredDishes.length
  ).padStart(2, "0")}`;
  const hasCameraFallback =
    capabilities.ready &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const hasNativeAr =
    engine.kind === "webxr"
      ? engine.canLaunch
      : Boolean(
          engine.kind === "quick-look" &&
            assetSelection.quickLookUsdz &&
            assetSelection.quickLookReady
        );
  const canOpenArView = hasNativeAr || hasCameraFallback;
  const categorySections = menu.categories.map((category) => ({
    category,
    dishes: menu.dishes.filter((dish) => dish.category === category.id)
  }));

  function cycleDish(direction: 1 | -1) {
    setIndexByCategory((current) => ({
      ...current,
      [selectedCategory]:
        (current[selectedCategory] + direction + filteredDishes.length) % filteredDishes.length
    }));
  }

  function selectCategory(category: MenuCategory) {
    setSelectedCategory(category);
  }

  function selectCategoryDish(category: MenuCategory, dishIndex: number) {
    setSelectedCategory(category);
    setIndexByCategory((current) => ({
      ...current,
      [category]: dishIndex
    }));
  }

  async function launchPrimaryExperience() {
    if (launchState === "launching") {
      return;
    }

    if (engine.kind === "webxr") {
      setLaunchState("launching");
      await stageRef.current?.enterImmersiveAr();
      setLaunchState("idle");
      return;
    }

    if (
      engine.kind === "quick-look" &&
      assetSelection.quickLookUsdz &&
      assetSelection.quickLookReady
    ) {
      openQuickLook(assetSelection.quickLookUsdz, currentDish.name);
      return;
    }

    if (hasCameraFallback) {
      setCameraModalOpen(true);
    }
  }

  const capabilityCopy = capabilities.ready
    ? capabilities.supportsWebXR
      ? "Live WebXR AR ready"
      : capabilities.supportsQuickLook
        ? assetSelection.quickLookReady
          ? "Native iPhone AR ready"
          : "Camera AR preview ready"
        : hasCameraFallback
          ? "Camera AR preview ready"
          : "3D preview active"
    : "Checking device";
  const arButtonLabel =
    launchState === "launching"
      ? "Opening AR..."
      : canOpenArView
        ? "Open AR View"
        : "AR unavailable";

  return (
    <main className="app-shell">
      <div className="page-glow page-glow--left" />
      <div className="page-glow page-glow--right" />

      <header className="topbar glass-panel">
        <div className="topbar__brand">
          <span className="eyebrow">Professional AR Menu</span>
          <strong>{menu.brand}</strong>
        </div>

        <div className="topbar__actions">
          <div className="topbar__meta">
            <span className="capability-pill">{capabilityCopy}</span>
            <span className="capability-pill capability-pill--warm">{engine.badge}</span>
          </div>

          <button
            className="primary-button topbar__ar-button"
            disabled={!canOpenArView || launchState === "launching"}
            onClick={() => {
              void launchPrimaryExperience();
            }}
            type="button"
          >
            {arButtonLabel}
          </button>
        </div>
      </header>

      <section className="hero-grid hero-grid--professional">
        <div className="glass-panel info-panel">
          <div className="panel-header panel-header--row">
            <div>
              <span className="eyebrow">{categoryMeta.eyebrow}</span>
              <h2>{currentDish.name}</h2>
            </div>
            <span className="dish-index">{dishCountLabel}</span>
          </div>

          <p className="panel-copy">{currentDish.tagline}</p>

          <div className="meta-row">
            <span className="stat-chip">{formatPrice(currentDish.priceInr)}</span>
            <span className="stat-chip">{currentDish.calories} kcal</span>
            <span className="stat-chip">{categoryMeta.label}</span>
          </div>

          <CategoryTabs
            categories={menu.categories}
            selectedCategory={selectedCategory}
            onSelectCategory={selectCategory}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDish.id}
              className="dish-hero"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className="dish-kicker-row">
                <span className="dish-tag">{engine.headline}</span>
                <span className="dish-index">{menu.brand}</span>
              </div>

              <p className="dish-description">{currentDish.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="stage-column">
          <RenderStage
            ref={stageRef}
            capabilities={capabilities}
            dish={currentDish}
            engine={engine}
            onNext={() => cycleDish(1)}
            onPrevious={() => cycleDish(-1)}
            preloadDishes={preloadDishes}
          />
        </div>

        <div className="details-column">
          <AnimatePresence mode="wait">
            <DishDetailsPanel dish={currentDish} key={currentDish.id} />
          </AnimatePresence>
        </div>
      </section>

      <section className="category-section-grid" aria-label="All menu categories">
        {categorySections.map(({ category, dishes }) => {
          const isActive = selectedCategory === category.id;

          return (
            <article
              className={`glass-panel category-section-card${isActive ? " is-active" : ""}`}
              key={category.id}
            >
              <button
                className="category-section-card__top"
                aria-pressed={isActive}
                onClick={() => selectCategory(category.id)}
                type="button"
              >
                <div>
                  <span className="eyebrow">{category.eyebrow}</span>
                  <h3>{category.label}</h3>
                </div>
                <span className="category-section-card__count">
                  {String(dishes.length).padStart(2, "0")} dishes
                </span>
              </button>

              <p className="category-section-card__description">{category.description}</p>

              <div className="category-section-card__list">
                {dishes.map((dish, dishIndex) => {
                  const isDishActive = isActive && currentDish.id === dish.id;

                  return (
                    <button
                      className={`category-section-card__dish${isDishActive ? " is-active" : ""}`}
                      aria-pressed={isDishActive}
                      key={dish.id}
                      onClick={() => selectCategoryDish(category.id, dishIndex)}
                      type="button"
                    >
                      <span className="category-section-card__dish-name">{dish.name}</span>
                      <span className="category-section-card__dish-meta">
                        {formatPrice(dish.priceInr)} / {dish.calories} kcal
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      <CameraArModal
        capabilities={capabilities}
        dish={currentDish}
        onClose={() => setCameraModalOpen(false)}
        open={cameraModalOpen}
      />
    </main>
  );
}
