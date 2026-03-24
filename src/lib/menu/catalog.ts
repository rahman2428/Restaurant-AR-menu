import type { RestaurantMenu } from "./types";

export const restaurantMenu: RestaurantMenu = {
  brand: "Lumiere Table",
  headline: "A cinematic AR tasting room for every table.",
  subheadline:
    "Swipe through signature dishes, inspect every finish in 3D, and place the plate in your space with the best engine your device can support.",
  categories: [
    {
      id: "veg",
      label: "Veg",
      eyebrow: "Botanical",
      description: "Bright produce, elegant plating, and garden-led textures."
    },
    {
      id: "non-veg",
      label: "Non-Veg",
      eyebrow: "Fire & Smoke",
      description: "Roasted proteins and indulgent mains staged like a luxury shoot."
    },
    {
      id: "veg-non-veg",
      label: "Veg + Non-Veg",
      eyebrow: "Shared Favorites",
      description: "Flexible crowd-pleasers that work across the whole table."
    },
    {
      id: "dessert",
      label: "Dessert",
      eyebrow: "Finale",
      description: "Decadent finishes designed for a dramatic reveal."
    }
  ],
  dishes: [
    {
      id: "garden-citrus-salad",
      slug: "garden-citrus-salad",
      name: "Garden Citrus Salad",
      category: "veg",
      tagline: "Crisp greens, citrus pearls, and a chilled herb finish.",
      description:
        "A fresh starter designed to read beautifully in AR with layered greens, translucent dressing highlights, and a real-world footprint that feels table-ready.",
      priceInr: 540,
      calories: 280,
      ingredients: ["Baby lettuce", "Orange segments", "Feta crumble", "Mint oil"],
      assets: {
        glb: "/models/garden-citrus-salad/garden-citrus-salad.glb",
        usdz: "/models/usdz/garden-citrus-salad.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 1.05,
        arScale: 0.22,
        pedestalHeight: 0.12,
        baseRotationDeg: -14,
        fallbackKind: "salad",
        accentColor: "#bfdc84"
      }
    },
    {
      id: "stone-oven-pizza",
      slug: "stone-oven-pizza",
      name: "Stone Oven Pizza",
      category: "veg",
      tagline: "Charred crust, molten cheese, and premium overhead presence.",
      description:
        "An immersive hero plate tuned for top-down framing and close inspection, with a generous silhouette that benefits from the larger AR footprint.",
      priceInr: 760,
      calories: 690,
      ingredients: ["Slow dough", "Buffalo mozzarella", "Roasted tomato", "Basil ash"],
      assets: {
        glb: "/models/stone-oven-pizza/stone-oven-pizza.glb",
        usdz: "/models/usdz/stone-oven-pizza.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 1.2,
        arScale: 0.26,
        pedestalHeight: 0.14,
        baseRotationDeg: 8,
        fallbackKind: "pizza",
        accentColor: "#f0a35d"
      }
    },
    {
      id: "roasted-chicken-platter",
      slug: "roasted-chicken-platter",
      name: "Roasted Chicken Platter",
      category: "non-veg",
      tagline: "Slow-roasted textures with cinematic golden highlights.",
      description:
        "Built to feel substantial in your room, this platter uses a wider stance and dramatic specular response to mimic a polished campaign shot.",
      priceInr: 890,
      calories: 870,
      ingredients: ["Roasted chicken", "Charred vegetables", "Butter jus", "Rosemary"],
      assets: {
        glb: "/models/roasted-chicken-platter/roasted-chicken-platter.glb",
        usdz: "/models/usdz/roasted-chicken-platter.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 1.18,
        arScale: 0.24,
        pedestalHeight: 0.14,
        baseRotationDeg: -6,
        fallbackKind: "platter",
        accentColor: "#d99a6d"
      }
    },
    {
      id: "oven-grilled-chicken",
      slug: "oven-grilled-chicken",
      name: "Oven Grilled Chicken",
      category: "non-veg",
      tagline: "Lean grill marks and smoky glaze with premium lighting response.",
      description:
        "Optimized for side-angle framing, this protein-forward dish reads well across both preview mode and immersive AR placement.",
      priceInr: 820,
      calories: 640,
      ingredients: ["Chicken breast", "Herb glaze", "Pepper jus", "Microgreens"],
      assets: {
        glb: "/models/oven-grilled-chicken/oven-grilled-chicken.glb",
        usdz: "/models/usdz/oven-grilled-chicken.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 1.05,
        arScale: 0.23,
        pedestalHeight: 0.12,
        baseRotationDeg: 12,
        fallbackKind: "platter",
        accentColor: "#cc8c63"
      }
    },
    {
      id: "smokehouse-burger",
      slug: "smokehouse-burger",
      name: "Smokehouse Burger",
      category: "non-veg",
      tagline: "Stacked indulgence with glossy buns and dramatic height.",
      description:
        "A compact but tall silhouette that works beautifully with pinch zoom and detail inspection, especially on smaller handsets.",
      priceInr: 710,
      calories: 780,
      ingredients: ["Potato bun", "Aged cheddar", "Beef patty", "Pickled onion"],
      assets: {
        glb: "/models/smokehouse-burger/smokehouse-burger.glb",
        usdz: "/models/usdz/smokehouse-burger.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 0.98,
        arScale: 0.21,
        pedestalHeight: 0.1,
        baseRotationDeg: 0,
        fallbackKind: "burger",
        accentColor: "#d6a05f"
      }
    },
    {
      id: "crispy-burger-fries",
      slug: "crispy-burger-fries",
      name: "Crispy Burger & Fries",
      category: "veg-non-veg",
      tagline: "A comfort-food centerpiece with generous volume and texture.",
      description:
        "This bundle-style presentation performs like a showroom item in the viewer and scales naturally on real-world surfaces during AR placement.",
      priceInr: 760,
      calories: 910,
      ingredients: ["Sesame bun", "Crisp fries", "Signature sauce", "House slaw"],
      assets: {
        glb: "/models/crispy-burger-fries/crispy-burger-fries.glb",
        usdz: "/models/usdz/crispy-burger-fries.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 1.14,
        arScale: 0.24,
        pedestalHeight: 0.12,
        baseRotationDeg: 10,
        fallbackKind: "burger",
        accentColor: "#e0af63"
      }
    },
    {
      id: "creamy-herb-spaghetti",
      slug: "creamy-herb-spaghetti",
      name: "Creamy Herb Spaghetti",
      category: "veg-non-veg",
      tagline: "Silky ribbons, soft gloss, and close-up surface detail.",
      description:
        "A bowl-led dish with layered highlights and subtle garnish contrast, ideal for slow rotation and intimate tabletop visualization.",
      priceInr: 680,
      calories: 590,
      ingredients: ["Fresh spaghetti", "Parmesan cream", "Herb oil", "Pepper crumb"],
      assets: {
        glb: "/models/creamy-herb-spaghetti/creamy-herb-spaghetti.glb",
        usdz: "/models/usdz/creamy-herb-spaghetti.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 1.04,
        arScale: 0.22,
        pedestalHeight: 0.12,
        baseRotationDeg: -8,
        fallbackKind: "pasta",
        accentColor: "#ead09e"
      }
    },
    {
      id: "momo-basket",
      slug: "momo-basket",
      name: "Momo Basket",
      category: "veg-non-veg",
      tagline: "Soft folds, steam-basket warmth, and shareable presentation.",
      description:
        "Designed as a tactile, social dish with clustered forms that feel inviting in both preview mode and a full AR tabletop placement.",
      priceInr: 520,
      calories: 430,
      ingredients: ["Dumplings", "Sesame oil", "Scallion", "Chili dip"],
      assets: {
        glb: "/models/momo-basket/momo-basket.glb",
        usdz: "/models/usdz/momo-basket.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 1,
        arScale: 0.2,
        pedestalHeight: 0.11,
        baseRotationDeg: 18,
        fallbackKind: "dumplings",
        accentColor: "#efe7d1"
      }
    },
    {
      id: "caramel-dessert-cup",
      slug: "caramel-dessert-cup",
      name: "Caramel Dessert Cup",
      category: "dessert",
      tagline: "Layered glass, soft caramel ribbons, and a late-night glow.",
      description:
        "A premium dessert placeholder with a bespoke procedural model, ready to swap to production GLB and USDZ assets when the final scans arrive.",
      priceInr: 430,
      calories: 410,
      ingredients: ["Caramel mousse", "Mascarpone", "Biscuit crumb", "Sea salt"],
      assets: {
        usdz: "/models/usdz/caramel-dessert-cup.usdz",
        usdzReady: false
      },
      visual: {
        targetSize: 0.94,
        arScale: 0.18,
        pedestalHeight: 0.1,
        baseRotationDeg: -10,
        fallbackKind: "dessert",
        accentColor: "#d9b58c"
      }
    }
  ]
};

