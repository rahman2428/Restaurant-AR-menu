# Lumiere Table AR

A cinematic restaurant menu built with Next.js and a capability-driven rendering pipeline:

- `webxr` on supported Android browsers for immersive AR
- `quick-look` on iPhone/iPad when matching USDZ assets are present
- `viewer` fallback everywhere else with premium 3D interaction

## Scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`

## Folder Structure

```text
src/
  app/                     Next.js app router entrypoints and global styles
  components/
    menu/                  Premium shell, category navigation, metadata panels
    rendering/             Shared stage component used by all render engines
  hooks/                   Device capability hooks
  lib/
    ar/                    Capability detection, asset selection, engine resolution, Three.js core
    menu/                  Menu catalog and typed metadata
public/
  models/                  GLB assets for viewer + WebXR
  models/usdz/             Expected USDZ files for Apple Quick Look
```

## Asset Pipeline

Each dish is defined once in `src/lib/menu/catalog.ts` and maps to:

- `assets.glb` for WebXR and the 3D viewer
- `assets.usdz` for Apple Quick Look
- a procedural fallback if the GLB is missing or still in production

The current project already includes real GLB files for:

- Garden Citrus Salad
- Stone Oven Pizza
- Roasted Chicken Platter
- Oven Grilled Chicken
- Smokehouse Burger
- Crispy Burger & Fries
- Creamy Herb Spaghetti
- Momo Basket

`Caramel Dessert Cup` is intentionally shipped as a procedural placeholder so the experience remains complete while production assets are prepared.

## iOS Quick Look

The Quick Look bridge is already wired in, but native iPhone AR only becomes launchable when matching USDZ files are added under `public/models/usdz/`.

Example:

```text
public/models/usdz/garden-citrus-salad.usdz
public/models/usdz/stone-oven-pizza.usdz
public/models/usdz/momo-basket.usdz
```

Once `usdzReady` is flipped to `true` for a dish in `src/lib/menu/catalog.ts`, the iOS CTA automatically changes from a prepared state to a live Quick Look launcher.





<!-- run shear link

 & "C:\Users\Abadur\Downloads\cloudflared.exe" tunnel --url http://localhost:3000 --protocol http2   
 
 -->

