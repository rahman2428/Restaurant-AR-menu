import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  TorusGeometry
} from "three";
import type { MenuDish } from "@/lib/menu/types";

function createPhysicalMaterial(color: string, roughness = 0.42, transmission = 0) {
  return new MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0.04,
    transmission,
    thickness: transmission > 0 ? 0.25 : 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.28
  });
}

function createPlate() {
  const plate = new Mesh(
    new CylinderGeometry(1.22, 1.28, 0.08, 64),
    createPhysicalMaterial("#fbf6ee", 0.2)
  );
  plate.receiveShadow = true;
  plate.position.y = 0.02;
  return plate;
}

function createHerbScatter(color: string, count: number, radius: number, y = 0.12) {
  const garnish = new Group();
  const geometry = new SphereGeometry(0.045, 16, 16);
  const material = createPhysicalMaterial(color, 0.6);

  for (let index = 0; index < count; index += 1) {
    const leaf = new Mesh(geometry, material);
    const angle = (Math.PI * 2 * index) / count;
    const distance = radius * (0.45 + (index % 3) * 0.16);
    leaf.position.set(Math.cos(angle) * distance, y, Math.sin(angle) * distance);
    leaf.scale.set(1.2, 0.45, 1);
    leaf.rotation.x = MathUtils.degToRad(80);
    leaf.castShadow = true;
    garnish.add(leaf);
  }

  return garnish;
}

function createSalad() {
  const salad = new Group();
  const bowl = new Mesh(
    new CylinderGeometry(0.82, 0.58, 0.28, 48, 1, true),
    createPhysicalMaterial("#fcf9f1", 0.2)
  );
  bowl.position.y = 0.18;
  salad.add(bowl);
  salad.add(createHerbScatter("#7cad52", 12, 0.6, 0.28));
  salad.add(createHerbScatter("#d9a056", 6, 0.42, 0.31));
  return salad;
}

function createPizza() {
  const pizza = new Group();
  const crust = new Mesh(
    new CylinderGeometry(0.9, 0.9, 0.08, 48),
    createPhysicalMaterial("#d09154", 0.52)
  );
  const sauce = new Mesh(
    new CylinderGeometry(0.8, 0.8, 0.04, 48),
    createPhysicalMaterial("#b9513e", 0.54)
  );
  const cheese = new Mesh(
    new CylinderGeometry(0.74, 0.74, 0.03, 48),
    createPhysicalMaterial("#f6d493", 0.38)
  );

  crust.position.y = 0.08;
  sauce.position.y = 0.11;
  cheese.position.y = 0.13;

  pizza.add(crust, sauce, cheese, createHerbScatter("#5f8a41", 10, 0.62, 0.17));
  return pizza;
}

function createPasta() {
  const pasta = new Group();
  const bowl = new Mesh(
    new CylinderGeometry(0.8, 0.56, 0.25, 48, 1, true),
    createPhysicalMaterial("#f7f3ec", 0.22)
  );
  bowl.position.y = 0.16;

  for (let index = 0; index < 7; index += 1) {
    const strand = new Mesh(
      new TorusGeometry(0.38 + index * 0.025, 0.03, 12, 48),
      createPhysicalMaterial("#e7cd8e", 0.45)
    );
    strand.rotation.x = Math.PI / 2;
    strand.rotation.z = index * 0.34;
    strand.position.y = 0.24 + index * 0.01;
    strand.castShadow = true;
    pasta.add(strand);
  }

  pasta.add(bowl);
  pasta.add(createHerbScatter("#6c9251", 6, 0.3, 0.34));
  return pasta;
}

function createDumplings() {
  const dumplings = new Group();

  for (let index = 0; index < 6; index += 1) {
    const dumpling = new Mesh(
      new SphereGeometry(0.19, 24, 24),
      createPhysicalMaterial("#f1e6d6", 0.38)
    );
    const angle = (Math.PI * 2 * index) / 6;
    dumpling.position.set(Math.cos(angle) * 0.4, 0.18, Math.sin(angle) * 0.4);
    dumpling.scale.set(1.15, 0.76, 0.92);
    dumpling.castShadow = true;
    dumplings.add(dumpling);
  }

  const dip = new Mesh(
    new CylinderGeometry(0.18, 0.14, 0.07, 32),
    createPhysicalMaterial("#9c352a", 0.32)
  );
  dip.position.y = 0.06;
  dumplings.add(dip);

  return dumplings;
}

function createPlatter() {
  const platter = new Group();

  for (let index = 0; index < 5; index += 1) {
    const chunk = new Mesh(
      new SphereGeometry(0.24, 24, 24),
      createPhysicalMaterial(index % 2 === 0 ? "#bf7445" : "#8f5330", 0.48)
    );
    const angle = (Math.PI * 2 * index) / 5;
    chunk.position.set(Math.cos(angle) * 0.34, 0.18 + (index % 2) * 0.03, Math.sin(angle) * 0.32);
    chunk.scale.set(1.25, 0.82, 0.9);
    chunk.castShadow = true;
    platter.add(chunk);
  }

  platter.add(createHerbScatter("#6c8d4f", 8, 0.62, 0.12));
  return platter;
}

function createBurger() {
  const burger = new Group();
  const bunBottom = new Mesh(
    new CylinderGeometry(0.42, 0.46, 0.14, 36),
    createPhysicalMaterial("#d8a35d", 0.46)
  );
  const patty = new Mesh(
    new CylinderGeometry(0.4, 0.42, 0.12, 36),
    createPhysicalMaterial("#66361f", 0.65)
  );
  const cheese = new Mesh(
    new CylinderGeometry(0.44, 0.44, 0.03, 4),
    createPhysicalMaterial("#efc25f", 0.3)
  );
  const bunTop = new Mesh(
    new SphereGeometry(0.46, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    createPhysicalMaterial("#d79d58", 0.42)
  );

  bunBottom.position.y = 0.14;
  patty.position.y = 0.28;
  cheese.position.y = 0.36;
  bunTop.position.y = 0.45;

  burger.add(bunBottom, patty, cheese, bunTop);

  const friesMaterial = createPhysicalMaterial("#efc05d", 0.5);
  for (let index = 0; index < 9; index += 1) {
    const fry = new Mesh(new CylinderGeometry(0.03, 0.03, 0.35, 6), friesMaterial);
    fry.position.set(0.6 + index * 0.02, 0.18 + (index % 3) * 0.06, -0.18 + index * 0.04);
    fry.rotation.z = MathUtils.degToRad(22 + index * 4);
    burger.add(fry);
  }

  return burger;
}

function createDessert() {
  const dessert = new Group();
  const glass = new Mesh(
    new CylinderGeometry(0.34, 0.26, 0.6, 48, 1, true),
    createPhysicalMaterial("#fef8f1", 0.08, 0.76)
  );
  const cream = new Mesh(
    new CylinderGeometry(0.28, 0.28, 0.22, 48),
    createPhysicalMaterial("#f5e2c6", 0.34)
  );
  const caramel = new Mesh(
    new TorusGeometry(0.18, 0.05, 12, 40),
    createPhysicalMaterial("#a45a34", 0.44)
  );
  const biscuit = new Mesh(
    new CylinderGeometry(0.28, 0.24, 0.1, 36),
    createPhysicalMaterial("#b88756", 0.6)
  );

  cream.position.y = 0.19;
  caramel.position.y = 0.33;
  caramel.rotation.x = Math.PI / 2;
  biscuit.position.y = 0.03;

  dessert.add(glass, cream, caramel, biscuit);
  dessert.add(createHerbScatter("#f8f0dc", 5, 0.1, 0.45));
  return dessert;
}

export function createProceduralDish(dish: MenuDish) {
  const group = new Group();
  const accent = new Color(dish.visual.accentColor);
  const plate = createPlate();
  const shadow = new Mesh(
    new CircleGeometry(1.04, 48),
    new MeshPhysicalMaterial({
      color: accent.lerp(new Color("#2b1208"), 0.78),
      transparent: true,
      opacity: 0.16,
      roughness: 1,
      side: DoubleSide
    })
  );

  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.041;

  group.add(plate, shadow);

  switch (dish.visual.fallbackKind) {
    case "salad":
      group.add(createSalad());
      break;
    case "pizza":
      group.add(createPizza());
      break;
    case "pasta":
      group.add(createPasta());
      break;
    case "dumplings":
      group.add(createDumplings());
      break;
    case "platter":
      group.add(createPlatter());
      break;
    case "burger":
      group.add(createBurger());
      break;
    case "dessert":
      group.add(createDessert());
      break;
  }

  group.rotation.y = MathUtils.degToRad(dish.visual.baseRotationDeg);
  return group;
}
