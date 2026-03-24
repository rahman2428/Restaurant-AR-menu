import { MenuExperience } from "@/components/menu/menu-experience";
import { restaurantMenu } from "@/lib/menu/catalog";

export default function HomePage() {
  return <MenuExperience menu={restaurantMenu} />;
}

