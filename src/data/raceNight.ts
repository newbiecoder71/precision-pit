export type RaceNightChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type RaceNightChecklistSection = {
  id: string;
  title: string;
  items: RaceNightChecklistItem[];
};

const checklistBlueprint: Array<{
  id: string;
  title: string;
  items: Array<{ id: string; label: string }>;
}> = [
  {
    id: "chassis",
    title: "Chassis",
    items: [
      { id: "ride-heights", label: "Ride heights verified" },
      { id: "ballast", label: "Ballast secured" },
      { id: "wheelbase", label: "Wheelbase checked" },
    ],
  },
  {
    id: "tires",
    title: "Tires & Wheels",
    items: [
      { id: "pressures", label: "Pressures set" },
      { id: "stagger", label: "Stagger checked" },
      { id: "lug-nuts", label: "Lug nuts torqued" },
    ],
  },
  {
    id: "driveline",
    title: "Driveline",
    items: [
      { id: "gear", label: "Gear ratio confirmed" },
      { id: "fluids", label: "Fluids checked" },
      { id: "driveshaft", label: "Driveshaft / rear-end inspected" },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      { id: "belts", label: "Belts and seat checked" },
      { id: "fire", label: "Fire bottle / extinguisher ready" },
      { id: "helmet", label: "Driver gear ready" },
    ],
  },
  {
    id: "electrical",
    title: "Electronics",
    items: [
      { id: "radio", label: "Radio / communication checked" },
      { id: "battery", label: "Battery secure" },
      { id: "transponder", label: "Transponder installed" },
    ],
  },
];

export function createDefaultChecklistSections(): RaceNightChecklistSection[] {
  return checklistBlueprint.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.items.map((item) => ({
      id: item.id,
      label: item.label,
      checked: false,
    })),
  }));
}
