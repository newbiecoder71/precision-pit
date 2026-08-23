export type RaceNightChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  checkedByName?: string;
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
      { id: "crossweight", label: "Crossweight / wedge set" },
      { id: "left-side", label: "Left side percentage set" },
      { id: "rear-percentage", label: "Rear percentage set" },
      { id: "wing-slider", label: "Wing angle / slider set" },
      { id: "nose-wing", label: "Nose wing set" },
      { id: "frame-height", label: "Frame height / attitude checked" },
      { id: "torsion-bars", label: "Torsion bars installed / set" },
      { id: "seat-mounts", label: "Seat mounts checked" },
      { id: "nerf-bars", label: "Nerf bars tight" },
      { id: "bumpers", label: "Bumpers secure" },
      { id: "body-panels", label: "Body panels secure" },
      { id: "spoiler", label: "Spoiler / wicker set" },
      { id: "fuel-cell-mounts", label: "Fuel cell mounts checked" },
    ],
  },
  {
    id: "tires",
    title: "Tires & Wheels",
    items: [
      { id: "pressures", label: "Pressures set" },
      { id: "circumferences", label: "Circumferences verified" },
      { id: "stagger", label: "Stagger checked" },
      { id: "wheel-offsets", label: "Wheel offsets verified" },
      { id: "lug-nuts", label: "Lug nuts torqued" },
      { id: "beadlocks", label: "Beadlock bolts torqued" },
      { id: "valve-stems", label: "Valve stems / caps checked" },
      { id: "tire-temps", label: "Tire temps recorded" },
      { id: "tire-compounds", label: "Tire compounds verified" },
      { id: "tire-marks", label: "Tires marked for position" },
      { id: "wheel-cracks", label: "Wheels inspected for cracks" },
      { id: "wheel-cleaning", label: "Mud / debris cleaned from wheels" },
      { id: "air-gauge", label: "Air gauge ready" },
      { id: "spare-tire", label: "Spare tire ready" },
    ],
  },
  {
    id: "driveline",
    title: "Driveline",
    items: [
      { id: "gear", label: "Gear ratio confirmed" },
      { id: "ring-pinion", label: "Ring / pinion checked" },
      { id: "quick-change", label: "Quick-change gears installed" },
      { id: "fluids", label: "Fluids checked" },
      { id: "driveshaft", label: "Driveshaft / rear-end inspected" },
      { id: "u-joints", label: "U-joints checked" },
      { id: "rear-end-oil", label: "Rear-end oil level checked" },
      { id: "trans-fluid", label: "Transmission fluid checked" },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      { id: "belts", label: "Belts and seat checked" },
      { id: "window-net", label: "Window net secure" },
      { id: "seat-mount-safety", label: "Seat mounts tight" },
      { id: "fire", label: "Fire bottle / extinguisher ready" },
      { id: "helmet", label: "Driver gear ready" },
      { id: "neck-restraint", label: "Hans / neck restraint ready" },
      { id: "driver-suit", label: "Driver suit ready" },
      { id: "gloves", label: "Gloves ready" },
      { id: "shoes", label: "Shoes ready" },
      { id: "arm-restraints", label: "Arm restraints ready" },
      { id: "fuel-shutoff", label: "Fuel shutoff working" },
      { id: "brake-pedal", label: "Brake pedal firm" },
      { id: "throttle-return", label: "Throttle return spring checked" },
      { id: "kill-switch", label: "Kill switch working" },
    ],
  },
  {
    id: "electrical",
    title: "Electronics",
    items: [
      { id: "radio", label: "Radio / communication checked" },
      { id: "battery", label: "Battery secure" },
      { id: "battery-charged", label: "Battery charged" },
      { id: "transponder", label: "Transponder installed" },
      { id: "transponder-charged", label: "Transponder charged" },
      { id: "data-logger", label: "Data logger powered" },
      { id: "gauges", label: "Gauges working" },
      { id: "starter", label: "Starter charged" },
      { id: "ignition", label: "Ignition switch checked" },
      { id: "wiring", label: "Wiring inspected" },
      { id: "lap-timer", label: "Lap timer ready" },
      { id: "camera-mount", label: "Camera / mount secure" },
    ],
  },
  {
    id: "fluids",
    title: "Fluids",
    items: [
      { id: "fuel-level", label: "Fuel level checked" },
      { id: "engine-oil", label: "Engine oil checked" },
      { id: "water-level", label: "Water level checked" },
      { id: "power-steering", label: "Power steering fluid checked" },
      { id: "brake-fluid", label: "Brake fluid checked" },
      { id: "fuel-mix", label: "Fuel mixed / ready" },
      { id: "fuel-jugs", label: "Fuel jugs loaded" },
    ],
  },
  {
    id: "tools-spares",
    title: "Tools & Spares",
    items: [
      { id: "torque-wrench", label: "Torque wrench packed" },
      { id: "tire-gauge", label: "Tire gauge packed" },
      { id: "air-tank", label: "Air tank / compressor ready" },
      { id: "spare-gears", label: "Spare gears packed" },
      { id: "spare-shocks", label: "Spare shocks / springs packed" },
      { id: "spare-rods", label: "Spare rods / heims packed" },
      { id: "spare-wheels", label: "Spare wheels / tires packed" },
      { id: "chargers", label: "Chargers packed" },
      { id: "jack-stands", label: "Jack / stands loaded" },
    ],
  },
  {
    id: "race-day-pit",
    title: "Race Day / Pit",
    items: [
      { id: "mylaps", label: "MyLaps / registration handled" },
      { id: "pill-draw", label: "Pill draw completed" },
      { id: "driver-checkin", label: "Driver checked in" },
      { id: "fuel-can", label: "Fuel can labeled" },
      { id: "pit-cart", label: "Pit cart loaded" },
      { id: "setup-sheets", label: "Setup sheets printed / saved" },
      { id: "weather-check", label: "Weather checked" },
      { id: "track-crew-notes", label: "Track crew notes ready" },
    ],
  },
  {
    id: "karting-chassis",
    title: "Karting: Chassis",
    items: [
      { id: "kart-seat-struts", label: "Seat struts / mounts checked" },
      { id: "kart-front-width", label: "Front width verified" },
      { id: "kart-rear-width", label: "Rear width verified" },
      { id: "kart-ride-height", label: "Ride height / rake checked" },
      { id: "kart-torsion-bars", label: "Torsion bars installed / set" },
      { id: "kart-nerf-bars", label: "Nerf bars secure" },
      { id: "kart-bumpers", label: "Front / rear bumpers secure" },
      { id: "kart-spindles", label: "Spindles / kingpins checked" },
    ],
  },
  {
    id: "karting-tires",
    title: "Karting: Tires & Wheels",
    items: [
      { id: "kart-pressures", label: "Pressures set" },
      { id: "kart-circumferences", label: "Circumferences verified" },
      { id: "kart-stagger", label: "Stagger checked" },
      { id: "kart-wheel-offsets", label: "Wheel offsets verified" },
      { id: "kart-lug-nuts", label: "Lug nuts torqued" },
      { id: "kart-wheel-hubs", label: "Wheel hubs / keys secure" },
      { id: "kart-tire-temps", label: "Tire temps recorded" },
      { id: "kart-spare-tire", label: "Spare tire ready" },
    ],
  },
  {
    id: "karting-driveline",
    title: "Karting: Driveline",
    items: [
      { id: "kart-gearing", label: "Rear / clutch sprocket gearing confirmed" },
      { id: "kart-chain-alignment", label: "Chain alignment checked" },
      { id: "kart-chain-tension", label: "Chain tension set" },
      { id: "kart-clutch", label: "Clutch checked" },
      { id: "kart-axle-bearings", label: "Axle bearings checked" },
      { id: "kart-sprocket-guard", label: "Sprocket guard secure" },
    ],
  },
  {
    id: "karting-safety",
    title: "Karting: Safety",
    items: [
      { id: "kart-helmet", label: "Helmet ready" },
      { id: "kart-suit", label: "Suit / jacket ready" },
      { id: "kart-neck-collar", label: "Neck collar / restraint ready" },
      { id: "kart-gloves", label: "Gloves ready" },
      { id: "kart-shoes", label: "Shoes ready" },
      { id: "kart-rib-protector", label: "Rib protector ready" },
      { id: "kart-throttle", label: "Throttle return checked" },
      { id: "kart-brake", label: "Brake pedal firm" },
    ],
  },
  {
    id: "karting-electrical",
    title: "Karting: Electronics",
    items: [
      { id: "kart-transponder", label: "Transponder installed" },
      { id: "kart-transponder-charge", label: "Transponder charged" },
      { id: "kart-data-logger", label: "Data logger / MyChron ready" },
      { id: "kart-battery-charge", label: "Starter battery charged" },
      { id: "kart-camera-mount", label: "Camera / mount secure" },
    ],
  },
  {
    id: "karting-fluids",
    title: "Karting: Fluids",
    items: [
      { id: "kart-fuel", label: "Fuel level checked" },
      { id: "kart-fuel-mix", label: "Fuel mix ready" },
      { id: "kart-oil", label: "Engine oil checked" },
      { id: "kart-coolant", label: "Coolant / water checked" },
    ],
  },
  {
    id: "karting-tools-spares",
    title: "Karting: Tools & Spares",
    items: [
      { id: "kart-tire-gauge", label: "Tire gauge packed" },
      { id: "kart-air-tank", label: "Air tank / compressor ready" },
      { id: "kart-spare-sprockets", label: "Spare sprockets packed" },
      { id: "kart-spare-chain", label: "Spare chain packed" },
      { id: "kart-spare-axle", label: "Spare axle / hubs packed" },
      { id: "kart-spare-wheels", label: "Spare wheels / tires packed" },
    ],
  },
  {
    id: "karting-race-day-pit",
    title: "Karting: Race Day / Pit",
    items: [
      { id: "kart-registration", label: "Registration / check-in completed" },
      { id: "kart-driver-band", label: "Driver band / waiver handled" },
      { id: "kart-pit-space", label: "Pit space set up" },
      { id: "kart-weather", label: "Weather checked" },
      { id: "kart-notes", label: "Track / setup notes ready" },
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
