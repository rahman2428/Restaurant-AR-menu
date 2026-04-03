import {
  ACESFilmicToneMapping,
  Box3,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Scene,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { gltfAssetCache } from "./asset-cache";
import { createProceduralDish } from "./procedural-dish";
import type { PerformanceTier } from "./capabilities";
import type { MenuDish } from "@/lib/menu/types";

const sharedPrototypeResolved = new Map<string, Object3D>();
const sharedPrototypePending = new Map<string, Promise<Object3D>>();

type AnchorHandle = {
  anchorSpace?: XRSpace;
  delete?: () => void;
};

type XRHitTestResultWithAnchor = XRHitTestResult & {
  createAnchor?: () => Promise<AnchorHandle>;
};

interface ThreeStageCallbacks {
  onError?: (message: string | null) => void;
  onSessionStateChange?: (active: boolean) => void;
}

interface StageRenderProfile {
  performanceTier: PerformanceTier;
  prefersReducedMotion: boolean;
  presentationMode?: "stage" | "camera";
}

export class ThreeStageController {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(34, 1, 0.01, 60);
  private readonly renderer: WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly pmremGenerator: PMREMGenerator;
  private readonly environmentTarget: WebGLRenderTarget;
  private readonly previewRig = new Group();
  private readonly previewDishMount = new Group();
  private readonly xrPlacementGroup = new Group();
  private readonly reticle: Mesh;
  private readonly pedestal: Mesh;
  private readonly aura: Mesh;
  private readonly controller: Group;
  private readonly resizeObserver: ResizeObserver;
  private readonly callbacks: ThreeStageCallbacks;

  private currentDish: MenuDish | null = null;
  private activePrototype: Object3D | null = null;
  private activePreviewObject: Object3D | null = null;
  private activePlacedObject: Object3D | null = null;
  private loadVersion = 0;
  private userIsControlling = false;
  private xrSession: XRSession | null = null;
  private hitTestSource: XRHitTestSource | null = null;
  private latestHit: XRHitTestResult | null = null;
  private hitTestRequested = false;
  private anchor: AnchorHandle | null = null;
  private hasPlacedDish = false;
  private anchorRequestVersion = 0;
  private readonly scratchMatrix = new Matrix4();
  private readonly scratchPosition = new Vector3();
  private readonly scratchQuaternion = new Quaternion();
  private readonly scratchScale = new Vector3();
  private readonly stablePosition = new Vector3();
  private readonly stableQuaternion = new Quaternion();
  private readonly horizontalForward = new Vector3(0, 0, -1);
  private readonly worldUp = new Vector3(0, 1, 0);
  private readonly alignedQuaternion = new Quaternion();
  private hasStablePose = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly capabilities: StageRenderProfile,
    callbacks?: ThreeStageCallbacks
  ) {
    this.callbacks = callbacks ?? {};

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: capabilities.performanceTier !== "constrained",
      powerPreference: "high-performance"
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = capabilities.performanceTier !== "constrained";
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, capabilities.performanceTier === "high" ? 2 : 1.5)
    );
    this.renderer.domElement.className = "stage-canvas";

    this.pmremGenerator = new PMREMGenerator(this.renderer);
    this.environmentTarget = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04);

    this.camera.position.set(0, 1.28, 4.1);
    this.scene.environment = this.environmentTarget.texture;

    this.removeStaleStageCanvases();
    this.container.appendChild(this.renderer.domElement);

    this.pedestal = this.createPedestal();
    this.aura = this.createAura();
    this.reticle = this.createReticle();
    this.controller = this.renderer.xr.getController(0);
    (
      this.controller as Group & {
        addEventListener: (type: string, listener: () => void) => void;
      }
    ).addEventListener("select", () => {
      void this.placeCurrentDish();
    });

    this.xrPlacementGroup.visible = false;
    this.scene.add(this.previewRig, this.xrPlacementGroup, this.reticle, this.controller);
    this.previewRig.add(this.pedestal, this.aura, this.previewDishMount);
    this.applyPreviewRigModeVisibility(false);

    this.setupLights();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2.35;
    this.controls.maxDistance = 5.6;
    this.controls.minPolarAngle = 0.9;
    this.controls.maxPolarAngle = 1.45;
    this.controls.target.set(0, 0.62, 0);
    this.controls.addEventListener("start", () => {
      this.userIsControlling = true;
    });
    this.controls.addEventListener("end", () => {
      this.userIsControlling = false;
    });

    this.configurePresentationMode();

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.container);

    this.resize();
    this.renderer.setAnimationLoop((time, frame) => {
      this.renderFrame(time, frame);
    });
  }

  preloadDish(dish: MenuDish) {
    if (dish.assets.glb) {
      gltfAssetCache.preload(dish.assets.glb);
    }

    this.preloadPrototype(dish);
  }

  async setDish(dish: MenuDish) {
    if (this.currentDish?.id === dish.id && this.activePrototype) {
      this.callbacks.onError?.(null);
      this.applyAccent(dish);
      return;
    }

    this.currentDish = dish;
    this.callbacks.onError?.(null);
    this.applyAccent(dish);

    const requestId = this.loadVersion + 1;
    this.loadVersion = requestId;

    const prototype = await this.getPrototypeForDish(dish);

    if (requestId !== this.loadVersion) {
      return;
    }

    this.activePrototype = prototype;
    if (!this.xrSession) {
      this.mountPreviewClone();
    }

    if (this.activePlacedObject) {
      this.replacePlacedClone();
    }
  }

  async enterImmersiveAr() {
    if (!navigator.xr) {
      this.callbacks.onError?.("WebXR is unavailable on this device.");
      return false;
    }

    if (this.currentDish && !this.activePrototype) {
      try {
        this.activePrototype = await this.getPrototypeForDish(this.currentDish);
      } catch {
        this.callbacks.onError?.("Model is still preparing. Please try AR again.");
        return false;
      }
    }

    try {
      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["anchors", "dom-overlay", "light-estimation", "plane-detection"],
        domOverlay: {
          root: this.container
        } as never
      });

      this.xrSession = session;
      this.renderer.xr.enabled = true;
      this.renderer.xr.setReferenceSpaceType("local");
      await this.renderer.xr.setSession(session);

      this.removeForeignStageCanvases();
      if (this.previewRig.parent === this.scene) {
        this.scene.remove(this.previewRig);
      }
      this.previewRig.visible = false;
      this.applyPreviewRigModeVisibility(true);
      this.xrPlacementGroup.visible = false;
      this.xrPlacementGroup.clear();
      this.activePlacedObject = null;
      this.reticle.visible = false;
      this.controls.enabled = false;
      this.hitTestRequested = false;
      this.latestHit = null;
      this.hasPlacedDish = false;
      this.anchorRequestVersion += 1;
      this.hasStablePose = false;
      this.anchor?.delete?.();
      this.anchor = null;

      session.addEventListener("end", this.handleSessionEnd);
      this.callbacks.onError?.(null);
      this.callbacks.onSessionStateChange?.(true);

      return true;
    } catch {
      this.callbacks.onError?.(
        "Unable to start the AR session. The cinematic viewer is still available."
      );
      return false;
    }
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.resizeObserver.disconnect();
    this.hitTestSource?.cancel();
    this.anchorRequestVersion += 1;
    this.anchor?.delete?.();
    this.environmentTarget.dispose();
    this.pmremGenerator.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  private createPedestal() {
    const pedestal = new Mesh(
      new CircleGeometry(1.55, 64),
      new MeshStandardMaterial({
        color: "#160d09",
        transparent: true,
        opacity: 0.42,
        roughness: 0.95,
        metalness: 0
      })
    );
    pedestal.rotation.x = -Math.PI / 2;
    pedestal.position.y = 0.02;
    pedestal.receiveShadow = true;
    return pedestal;
  }

  private removeStaleStageCanvases() {
    this.container.querySelectorAll("canvas.stage-canvas").forEach((canvas) => {
      canvas.remove();
    });
  }

  private removeForeignStageCanvases() {
    if (typeof document === "undefined") {
      return;
    }

    document.querySelectorAll("canvas.stage-canvas").forEach((canvas) => {
      if (canvas !== this.renderer.domElement) {
        canvas.remove();
      }
    });
  }

  private applyPreviewRigModeVisibility(immersiveArActive: boolean) {
    if (immersiveArActive) {
      this.previewDishMount.visible = false;
      this.pedestal.visible = false;
      this.aura.visible = false;
      return;
    }

    this.previewDishMount.visible = true;
    const showStageChrome = this.capabilities.presentationMode !== "camera";
    this.pedestal.visible = showStageChrome;
    this.aura.visible = showStageChrome;
  }

  private createAura() {
    const aura = new Mesh(
      new SphereGeometry(1.45, 28, 28),
      new MeshBasicMaterial({
        color: "#d5a05f",
        transparent: true,
        opacity: 0.08
      })
    );
    aura.position.set(0, 0.62, -0.45);
    aura.scale.set(1.35, 0.92, 0.5);
    return aura;
  }

  private createReticle() {
    const reticle = new Mesh(
      new CircleGeometry(0.16, 36),
      new MeshBasicMaterial({
        color: "#f1d09a",
        transparent: true,
        opacity: 0.78
      })
    );
    reticle.rotation.x = -Math.PI / 2;
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    return reticle;
  }

  private setupLights() {
    const hemisphere = new HemisphereLight("#f7d8b3", "#120703", 1.45);
    const key = new DirectionalLight("#f5d8b2", 2.65);
    const rim = new DirectionalLight("#8eb2ff", 1.15);
    const fill = new SpotLight("#ffe4bc", 2.3, 14, Math.PI / 5, 0.45, 1.6);

    key.position.set(2.6, 4.6, 3.1);
    key.castShadow = this.capabilities.performanceTier !== "constrained";
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0002;

    rim.position.set(-3.2, 2.1, -2.6);
    fill.position.set(-2.1, 3.4, 2.6);
    fill.target = this.previewDishMount;

    this.scene.add(hemisphere, key, rim, fill, fill.target);
  }

  private configurePresentationMode() {
    if (this.capabilities.presentationMode !== "camera") {
      return;
    }

    this.pedestal.visible = false;
    this.aura.visible = false;
    this.previewRig.position.y = -0.18;
    this.camera.position.set(0, 0.92, 3.2);
    this.controls.minDistance = 1.85;
    this.controls.maxDistance = 4.4;
    this.controls.minPolarAngle = 0.7;
    this.controls.maxPolarAngle = 1.62;
    this.controls.target.set(0, 0.42, 0);
    this.controls.update();
  }

  private resize() {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private async buildPrototype(dish: MenuDish) {
    const source = await this.loadDishSource(dish);
    this.prepareMaterials(source);

    const box = new Box3().setFromObject(source);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    source.position.sub(center);
    source.position.y += size.y / 2;
    source.rotation.y += MathUtils.degToRad(dish.visual.baseRotationDeg);

    const wrapper = new Group();
    wrapper.add(source);

    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const normalisedScale = dish.visual.targetSize / maxAxis;
    wrapper.scale.setScalar(normalisedScale);
    wrapper.position.y = dish.visual.pedestalHeight;

    return wrapper;
  }

  private preloadPrototype(dish: MenuDish) {
    if (sharedPrototypeResolved.has(dish.id) || sharedPrototypePending.has(dish.id)) {
      return;
    }

    const request = this.buildPrototype(dish)
      .then((prototype) => {
        sharedPrototypeResolved.set(dish.id, prototype);
        sharedPrototypePending.delete(dish.id);
        return prototype;
      })
      .catch((error) => {
        sharedPrototypePending.delete(dish.id);
        throw error;
      });

    sharedPrototypePending.set(dish.id, request);
  }

  private async getPrototypeForDish(dish: MenuDish) {
    if (sharedPrototypeResolved.has(dish.id)) {
      return sharedPrototypeResolved.get(dish.id)!;
    }

    if (sharedPrototypePending.has(dish.id)) {
      return sharedPrototypePending.get(dish.id)!;
    }

    const request = this.buildPrototype(dish)
      .then((prototype) => {
        sharedPrototypeResolved.set(dish.id, prototype);
        sharedPrototypePending.delete(dish.id);
        return prototype;
      })
      .catch((error) => {
        sharedPrototypePending.delete(dish.id);
        throw error;
      });

    sharedPrototypePending.set(dish.id, request);

    return request;
  }

  private async loadDishSource(dish: MenuDish) {
    if (!dish.assets.glb) {
      return createProceduralDish(dish);
    }

    try {
      const asset = await gltfAssetCache.load(dish.assets.glb);
      return cloneSkeleton(asset.scene);
    } catch {
      return createProceduralDish(dish);
    }
  }

  private prepareMaterials(object: Object3D) {
    object.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if ("envMapIntensity" in material) {
          material.envMapIntensity = 1.75;
        }

        if ("roughness" in material) {
          material.roughness = Math.min(material.roughness ?? 0.85, 0.92);
        }
      });
    });
  }

  private applyAccent(dish: MenuDish) {
    const accent = new Color(dish.visual.accentColor);
    (this.aura.material as MeshBasicMaterial).color = accent;
    this.pedestal.scale.setScalar(1 + dish.visual.targetSize * 0.08);
  }

  private mountPreviewClone() {
    if (!this.activePrototype) {
      return;
    }

    if (this.activePreviewObject) {
      this.previewDishMount.remove(this.activePreviewObject);
    }

    this.activePreviewObject = cloneSkeleton(this.activePrototype);
    this.previewDishMount.add(this.activePreviewObject);
  }

  private replacePlacedClone() {
    if (!this.activePrototype) {
      return;
    }

    this.xrPlacementGroup.clear();
    this.activePlacedObject = cloneSkeleton(this.activePrototype);
    this.xrPlacementGroup.add(this.activePlacedObject);
    this.enforceSinglePlacedInstance();
  }

  private async placeCurrentDish() {
    if (!this.currentDish || !this.activePrototype || !this.reticle.visible || this.hasPlacedDish) {
      return;
    }

    this.scratchMatrix.copy(this.reticle.matrix);

    this.replacePlacedClone();

    this.xrPlacementGroup.visible = true;
    this.applyStabilizedPlacement(this.scratchMatrix, true);
    this.xrPlacementGroup.scale.setScalar(this.currentDish.visual.arScale);
    this.hasPlacedDish = true;
    this.reticle.visible = false;
    this.enforceSinglePlacedInstance();

    const hitWithAnchor = this.latestHit as XRHitTestResultWithAnchor | null;
    if (hitWithAnchor?.createAnchor) {
      const requestVersion = ++this.anchorRequestVersion;
      try {
        this.anchor?.delete?.();
        this.anchor = null;

        const nextAnchor = await hitWithAnchor.createAnchor();
        if (requestVersion !== this.anchorRequestVersion || !this.xrSession) {
          nextAnchor?.delete?.();
          return;
        }

        this.anchor = nextAnchor ?? null;
      } catch {
        if (requestVersion === this.anchorRequestVersion) {
          this.anchor = null;
        }
      }
    }
  }

  private renderFrame(time: number, frame?: XRFrame) {
    const seconds = time * 0.001;

    if (this.xrSession && frame) {
      if (this.previewRig.parent === this.scene) {
        this.scene.remove(this.previewRig);
      }
      this.applyPreviewRigModeVisibility(true);
      this.enforceSinglePlacedInstance();
      this.updateHitTest(frame);
      this.updateAnchor(frame);
    } else {
      this.controls.update();

      if (!this.capabilities.prefersReducedMotion && !this.userIsControlling) {
        this.previewRig.rotation.y = Math.sin(seconds * 0.28) * 0.12;
        this.previewRig.position.y = 0.02 + Math.sin(seconds * 1.1) * 0.025;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateHitTest(frame: XRFrame) {
    const session = this.xrSession;
    const referenceSpace = this.renderer.xr.getReferenceSpace();

    if (!session || !referenceSpace) {
      return;
    }

    if (!this.hitTestRequested) {
      const requestHitTestSource = session.requestHitTestSource?.bind(session);

      if (!requestHitTestSource) {
        this.callbacks.onError?.("Surface detection is unavailable in this browser.");
        return;
      }

      this.hitTestRequested = true;

      void session
        .requestReferenceSpace("viewer")
        .then((space) => requestHitTestSource({ space }))
        .then((source) => {
          this.hitTestSource = source ?? null;
        })
        .catch(() => {
          this.callbacks.onError?.("Surface detection is unavailable in this browser.");
        });
    }

    if (!this.hitTestSource) {
      return;
    }

    if (this.hasPlacedDish) {
      this.reticle.visible = false;
      return;
    }

    const hits = frame.getHitTestResults(this.hitTestSource);

    if (hits.length === 0) {
      this.latestHit = null;
      this.reticle.visible = false;
      return;
    }

    this.latestHit = hits[0];
    const pose = this.latestHit.getPose(referenceSpace);

    if (!pose) {
      this.reticle.visible = false;
      return;
    }

    this.reticle.visible = true;
    this.reticle.matrix.fromArray(pose.transform.matrix);
  }

  private updateAnchor(frame: XRFrame) {
    const referenceSpace = this.renderer.xr.getReferenceSpace();

    if (!referenceSpace || !this.anchor?.anchorSpace) {
      return;
    }

    const pose = frame.getPose(this.anchor.anchorSpace, referenceSpace);

    if (!pose) {
      return;
    }

    this.scratchMatrix.fromArray(pose.transform.matrix);
    this.applyStabilizedPlacement(this.scratchMatrix);
  }

  private applyStabilizedPlacement(matrix: Matrix4, snapToSurface = false) {
    matrix.decompose(this.scratchPosition, this.scratchQuaternion, this.scratchScale);

    this.horizontalForward.set(0, 0, -1).applyQuaternion(this.scratchQuaternion);
    this.horizontalForward.y = 0;

    if (this.horizontalForward.lengthSq() > 0.000001) {
      this.horizontalForward.normalize();
      const yaw = Math.atan2(this.horizontalForward.x, this.horizontalForward.z);
      this.alignedQuaternion.setFromAxisAngle(this.worldUp, yaw);
    } else if (!this.hasStablePose) {
      this.alignedQuaternion.identity();
    } else {
      this.alignedQuaternion.copy(this.stableQuaternion);
    }

    if (!this.hasStablePose || snapToSurface) {
      this.stablePosition.copy(this.scratchPosition);
      this.stableQuaternion.copy(this.alignedQuaternion);
      this.hasStablePose = true;
    } else {
      const positionDelta = this.stablePosition.distanceTo(this.scratchPosition);
      const angleDelta = this.stableQuaternion.angleTo(this.alignedQuaternion);

      // Ignore tiny pose noise and softly ease larger corrections.
      if (positionDelta >= 0.0016 || angleDelta >= MathUtils.degToRad(0.3)) {
        const positionAlpha = Math.min(0.4, 0.12 + positionDelta * 4.8);
        const rotationAlpha = Math.min(0.34, 0.08 + angleDelta * 1.3);

        this.stablePosition.lerp(this.scratchPosition, positionAlpha);
        this.stableQuaternion.slerp(this.alignedQuaternion, rotationAlpha);
      }
    }

    this.xrPlacementGroup.position.copy(this.stablePosition);
    this.xrPlacementGroup.quaternion.copy(this.stableQuaternion);
  }

  private enforceSinglePlacedInstance() {
    if (this.xrPlacementGroup.children.length <= 1) {
      return;
    }

    const survivor = this.xrPlacementGroup.children[this.xrPlacementGroup.children.length - 1];
    this.xrPlacementGroup.clear();
    this.xrPlacementGroup.add(survivor);
    this.activePlacedObject = survivor;
  }

  private handleSessionEnd = () => {
    this.xrSession?.removeEventListener("end", this.handleSessionEnd);
    this.xrSession = null;
    this.hitTestSource?.cancel();
    this.hitTestSource = null;
    this.latestHit = null;
    this.hitTestRequested = false;
    this.anchorRequestVersion += 1;
    this.anchor?.delete?.();
    this.anchor = null;
    this.hasPlacedDish = false;
    this.hasStablePose = false;
    this.reticle.visible = false;
    if (this.previewRig.parent !== this.scene) {
      this.scene.add(this.previewRig);
    }
    this.applyPreviewRigModeVisibility(false);
    this.previewRig.visible = true;
    this.xrPlacementGroup.visible = false;
    this.xrPlacementGroup.clear();
    this.activePlacedObject = null;
    this.renderer.xr.enabled = false;
    this.mountPreviewClone();
    this.controls.enabled = true;
    this.callbacks.onSessionStateChange?.(false);
  };
}
