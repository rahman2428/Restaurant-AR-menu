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

interface MenuExperienceProps {
  menu: RestaurantMenu;
}

function buildInitialIndexes(menu: RestaurantMenu) {
  return menu.categories.reduce<Record<MenuCategory, number>>((indexes, category) => {
    indexes[category.id] = 0;
    return indexes;
  }, {} as Record<MenuCategory, number>);
}

function deriveHalfPlatePrice(fullPlatePriceInr: number) {
  return Math.max(120, Math.round((fullPlatePriceInr * 0.62) / 10) * 10);
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
  const selectedCategoryDishes =
    selectedCategory === "all"
      ? menu.dishes
      : menu.dishes.filter((dish) => dish.category === selectedCategory);
  const filteredDishes = selectedCategoryDishes.length > 0 ? selectedCategoryDishes : menu.dishes;
  const rawIndex = indexByCategory[selectedCategory] ?? 0;
  const currentIndex = rawIndex % filteredDishes.length;
  const currentDish = filteredDishes[currentIndex];
  const fullPlatePrice = currentDish.priceInr;
  const halfPlatePrice = deriveHalfPlatePrice(currentDish.priceInr);
  const selectedCategoryIndex = menu.categories.findIndex((entry) => entry.id === selectedCategory);
  const activeCategoryIndex = selectedCategoryIndex < 0 ? 0 : selectedCategoryIndex;
  const categoryPositionLabel = `${String(activeCategoryIndex + 1).padStart(2, "0")} / ${String(
    menu.categories.length
  ).padStart(2, "0")}`;
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
  const dishNameParts = currentDish.name.split(" ");
  const dishLeadWord = dishNameParts[0] ?? currentDish.name;
  const dishTrailingWords = dishNameParts.slice(1).join(" ");

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

  function cycleCategory(direction: 1 | -1) {
    const nextCategoryIndex =
      (activeCategoryIndex + direction + menu.categories.length) % menu.categories.length;
    setSelectedCategory(menu.categories[nextCategoryIndex].id);
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
      ? "Preparing AR..."
      : canOpenArView
        ? "AR On Mobile"
        : "3D Preview Active";

  return (
    <main className="experience-shell">
      <div className="experience-aura experience-aura--left" />
      <div className="experience-aura experience-aura--right" />

      <header className="experience-header">
        <div className="brand-block">
          <strong>{menu.brand.toUpperCase()}</strong>
          <span>Immersive dining preview</span>
        </div>

        <div className="experience-header__center">
          <CategoryTabs
            categories={menu.categories}
            selectedCategory={selectedCategory}
            onSelectCategory={selectCategory}
          />
        </div>

        <span className="interactive-pill">3D Interactive</span>
      </header>

      <section className="experience-stage">
        <RenderStage
          ref={stageRef}
          capabilities={capabilities}
          currentIndex={currentIndex}
          dish={currentDish}
          engine={engine}
          onNext={() => cycleDish(1)}
          onPrevious={() => cycleDish(-1)}
          preloadDishes={preloadDishes}
          totalCount={filteredDishes.length}
        />
      </section>

      <section className="dish-summary">
        <AnimatePresence mode="wait">
          <motion.article
            key={currentDish.id}
            className="dish-summary__card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <span className="dish-summary__index">{dishCountLabel}</span>

            <h1 className="dish-summary__title">
              <span>{dishLeadWord}</span>
              {dishTrailingWords ? <em>{` ${dishTrailingWords}`}</em> : null}
            </h1>

            <p className="dish-summary__subtitle">{currentDish.tagline}</p>
            <p className="dish-summary__description">{currentDish.description}</p>

            <div className="dish-summary__metrics">
              <div>
                <span>Price</span>
                <strong>{formatPrice(currentDish.priceInr)}</strong>
              </div>
              <div>
                <span>Calories</span>
                <strong>{currentDish.calories} kcal</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{categoryMeta.label}</strong>
              </div>
            </div>

            <div className="dish-summary__plate-pricing">
              <span className="dish-summary__plate-pricing-label">Plate Pricing</span>
              <div className="dish-summary__plate-pricing-values">
                <p>
                  Full Plate <strong>{formatPrice(fullPlatePrice)}</strong>
                </p>
                <p>
                  Half Plate <strong>{formatPrice(halfPlatePrice)}</strong>
                </p>
              </div>
            </div>

            <p className="dish-summary__ingredients">{currentDish.ingredients.join(" | ")}</p>
            <p className="dish-summary__status">
              {capabilityCopy} | {engine.headline}
            </p>
          </motion.article>
        </AnimatePresence>
      </section>

      <footer className="experience-footer">
        <button
          className="experience-footer__launch"
          disabled={!canOpenArView || launchState === "launching"}
          onClick={() => {
            void launchPrimaryExperience();
          }}
          type="button"
        >
          {arButtonLabel}
        </button>

        <div className="experience-footer__quick-controls">
          <button
            aria-label="Previous category"
            className="experience-footer__round-button"
            onClick={() => cycleCategory(-1)}
            type="button"
          >
            {"<"}
          </button>
          <button
            aria-label="Next category"
            className="experience-footer__round-button"
            onClick={() => cycleCategory(1)}
            type="button"
          >
            {">"}
          </button>
        </div>

        <span className="experience-footer__collection">{categoryPositionLabel} Collections</span>
      </footer>

      <CameraArModal
        capabilities={capabilities}
        dish={currentDish}
        onClose={() => setCameraModalOpen(false)}
        open={cameraModalOpen}
      />
    </main>
  );
}
