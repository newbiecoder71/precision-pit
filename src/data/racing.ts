export const racingTypeOptions = [
  "Dirt Oval",
  "Asphalt Oval",
  "Asphalt Road Course",
  "Dirt Road Course",
  "Drag Racing",
  "Karting",
] as const;

export type RacingType = (typeof racingTypeOptions)[number];

export const raceCarTypeOptionsByRacingType: Record<RacingType, string[]> = {
  "Dirt Oval": [
    "Pure Stock",
    "Super Stock",
    "Modified",
    "Late Model",
    "Sport Mod",
    "Street Stock",
    "Sprint Car",
    "Midget",
    "Factory Stock",
    "Hornet",
  ],
  "Asphalt Oval": [
    "Street Stock",
    "Super Stock",
    "Late Model",
    "Super Late Model",
    "Modified",
    "Legends",
    "Bandolero",
  ],
  "Asphalt Road Course": [
    "Spec Miata",
    "GT4",
    "Touring Car",
    "Trans Am",
    "Prototype",
    "Club Racing Sedan",
  ],
  "Dirt Road Course": [
    "Pro 2",
    "Pro 4",
    "UTV",
    "Buggy",
    "Rally Car",
    "Off-Road Truck",
  ],
  "Drag Racing": [
    "Bracket Car",
    "Super Comp",
    "Top Dragster",
    "Top Sportsman",
    "Pro Mod",
    "Junior Dragster",
  ],
  Karting: [
    "Wing Kart",
    "Flat Kart",
    "Sprint Kart",
    "Shifter Kart",
    "Kid Kart",
    "LO206",
  ],
};

export type SetupSection = {
  title: string;
  items: string[];
};

const dirtOvalSetupSections: SetupSection[] = [
  {
    title: "Chassis",
    items: [
      "Ride heights",
      "Crossweight / wedge",
      "Left-side percentage",
      "Ballast location",
      "Wheelbase notes",
      "Frame attitude",
    ],
  },
  {
    title: "Front Suspension",
    items: ["Springs", "Shocks", "Camber", "Caster", "Toe", "Travel / bump stops"],
  },
  {
    title: "Rear Suspension",
    items: [
      "Rear springs",
      "Rear shocks",
      "Trailing arm angles",
      "Pull bar / lift arm",
      "J-bar / Panhard height",
      "Birdcage / indexing notes",
    ],
  },
  {
    title: "Tires & Wheels",
    items: [
      "Cold pressures",
      "Hot pressures",
      "Tire compound",
      "Stagger",
      "Wheel offsets",
      "Tread / wear notes",
    ],
  },
  {
    title: "Driveline",
    items: [
      "Gear ratio",
      "Transmission / quick-change notes",
      "Driveshaft notes",
      "Rear-end setup",
    ],
  },
  {
    title: "Track Condition",
    items: [
      "Track surface state",
      "Cushion location",
      "Moisture level",
      "Rough spots / bumps",
      "Weather",
    ],
  },
  {
    title: "Handling Notes",
    items: [
      "Entry balance",
      "Center balance",
      "Exit balance",
      "Driver comments",
      "Change after feature / heat",
    ],
  },
  {
    title: "Session Info",
    items: ["Track", "Date", "Event", "Practice / heat / feature", "Finish", "Lap notes"],
  },
];

const genericSetupSectionsByRacingType: Partial<Record<RacingType, SetupSection[]>> = {
  "Asphalt Oval": [
    { title: "Alignment", items: ["Camber", "Caster", "Toe", "Ride heights", "Crossweight"] },
    { title: "Springs & Shocks", items: ["LF spring", "RF spring", "Rear springs", "Shock package"] },
    { title: "Track Notes", items: ["Grip level", "Temperature", "Rubber build-up", "Handling notes"] },
  ],
  "Asphalt Road Course": [
    { title: "Alignment", items: ["Camber", "Caster", "Toe", "Corner weights", "Ride heights"] },
    { title: "Aero & Balance", items: ["Wing / splitter", "Brake bias", "ARB settings", "Differential notes"] },
    { title: "Session Notes", items: ["Track temp", "Tire wear", "Lap times", "Driver comments"] },
  ],
  "Dirt Road Course": [
    { title: "Suspension", items: ["Ride heights", "Spring package", "Shock valving", "Bump settings"] },
    { title: "Driveline", items: ["Gear ratio", "Diff settings", "Axle notes", "Power delivery"] },
    { title: "Course Notes", items: ["Surface changes", "Ruts", "Jumps", "Handling feedback"] },
  ],
  "Drag Racing": [
    { title: "Launch", items: ["Tire pressure", "Shock clicks", "Wheelie bar", "Converter / clutch notes"] },
    { title: "Driveline", items: ["Rear gear", "Transmission settings", "Engine tune baseline"] },
    { title: "Run Notes", items: ["Track temp", "60-foot", "ET / MPH", "Lane prep", "Driver notes"] },
  ],
  Karting: [
    { title: "Chassis", items: ["Front width", "Rear width", "Seat position", "Torsion bars"] },
    { title: "Tires", items: ["Cold pressures", "Hot pressures", "Compound", "Stagger"] },
    { title: "Track Notes", items: ["Grip level", "Rubber", "Driver comments", "Lap times"] },
  ],
};

export function getRaceCarTypeOptions(racingType?: string) {
  if (!racingType || !isRacingType(racingType)) {
    return [];
  }

  return raceCarTypeOptionsByRacingType[racingType];
}

export function isRacingType(value?: string): value is RacingType {
  return !!value && racingTypeOptions.includes(value as RacingType);
}

export function getSetupSectionsForRacingType(racingType?: string) {
  if (racingType === "Dirt Oval") {
    return dirtOvalSetupSections;
  }

  if (racingType && isRacingType(racingType)) {
    return (
      genericSetupSectionsByRacingType[racingType] ?? [
        { title: "Baseline Setup", items: ["Track notes", "Chassis notes", "Driver comments"] },
      ]
    );
  }

  return [
    {
      title: "Set Team Defaults",
      items: [
        "Choose a racing type in Settings",
        "Choose a race car type in Settings",
        "Use those defaults to shape your setup templates",
      ],
    },
  ];
}
