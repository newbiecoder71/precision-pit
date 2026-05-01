export const trackTypeOptions = [
  "Dirt Oval",
  "Asphalt Oval",
  "Asphalt Road Course",
  "Dirt Road Course",
  "Drag Racing",
  "Karting",
] as const;

export type TrackType = (typeof trackTypeOptions)[number];

export const racingTypeOptionsByTrackType: Record<TrackType, string[]> = {
  "Dirt Oval": [
    "Pure Stock",
    "Street Stock",
    "Super Stock",
    "Front Wheel Drive (FWD)",
    "Legends",
    "Modified",
    "Late Model",
    "Sprint Car",
    "Midget",
    "Sport Mod",
    "Factory Stock",
  ],
  "Asphalt Oval": [
    "Street Stock",
    "Super Stock",
    "Front Wheel Drive (FWD)",
    "Legends",
    "Modified",
    "Late Model",
    "Bandolero",
  ],
  "Asphalt Road Course": [
    "Touring Car",
    "GT",
    "Prototype",
    "Club Racing Sedan",
  ],
  "Dirt Road Course": ["Rally Car", "Buggy", "UTV", "Off-Road Truck"],
  "Drag Racing": ["Bracket Car", "Super Comp", "Top Dragster", "Top Sportsman", "Pro Mod"],
  Karting: ["Wing Kart", "Flat Kart", "Sprint Kart", "Shifter Kart", "Kid Kart", "LO206"],
};

export const carClassOptionsByRacingType: Record<string, string[]> = {
  "Pure Stock": ["Pure Stock"],
  "Street Stock": ["Street Stock", "Stock V8"],
  "Super Stock": ["Super Stock A", "Super Stock B"],
  "Front Wheel Drive (FWD)": ["Hornet", "FWD Stock", "FWD Modified"],
  Legends: ["Asphalt Legends", "Dirt Legends"],
  Modified: [
    "A-Mod",
    "B-Mod",
    "Midwest Mod-A",
    "Midwest Mod-B",
    "IMCA Modified",
    "UMP Modified",
  ],
  "Late Model": ["Crate Late Model", "Super Late Model", "Dirt Late Model"],
  "Sprint Car": [
    "Wing Sprint 305",
    "Wing Sprint 360",
    "Wing Sprint 410",
    "Non-Wing Sprint 305",
    "Non-Wing Sprint 360",
    "Non-Wing Sprint 410",
  ],
  Midget: ["Wing Midget", "Non-Wing Midget"],
  "Sport Mod": ["Sport Mod"],
  "Factory Stock": ["Factory Stock"],
  Hornet: ["Hornet"],
  Bandolero: ["Bandolero"],
  "Touring Car": ["Touring Car"],
  GT: ["GT4", "GT3"],
  Prototype: ["Prototype"],
  "Club Racing Sedan": ["Club Racing Sedan"],
  "Rally Car": ["Rally Car"],
  Buggy: ["Buggy"],
  UTV: ["UTV"],
  "Off-Road Truck": ["Pro 2", "Pro 4", "Off-Road Truck"],
  "Bracket Car": ["Bracket Car"],
  "Super Comp": ["Super Comp"],
  "Top Dragster": ["Top Dragster"],
  "Top Sportsman": ["Top Sportsman"],
  "Pro Mod": ["Pro Mod"],
  "Wing Kart": ["Wing Kart"],
  "Flat Kart": ["Flat Kart"],
  "Sprint Kart": ["Sprint Kart"],
  "Shifter Kart": ["Shifter Kart"],
  "Kid Kart": ["Kid Kart"],
  LO206: ["LO206"],
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
    title: "Suspension",
    items: [
      "Front springs",
      "Front shocks",
      "Camber",
      "Caster",
      "Toe",
      "Travel / bump stops",
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
];

const sprintCarSetupSections: SetupSection[] = [
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
    items: [
      "Front springs",
      "Front shocks",
      "Camber",
      "Caster",
      "Toe",
      "Travel / bump stops",
    ],
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
      "Tire temps",
      "Stagger",
      "Circumference",
      "Wheel offsets",
      "Tread / wear notes",
    ],
  },
  {
    title: "Driveline",
    items: [
      "Ring and pinion",
      "Quick-change gears",
      "Final drive ratio",
      "Rear-end notes",
    ],
  },
];

const genericSetupSectionsByRacingType: Partial<Record<string, SetupSection[]>> = {
  "Late Model": dirtOvalSetupSections,
  Modified: dirtOvalSetupSections,
  "Sport Mod": dirtOvalSetupSections,
  "Pure Stock": dirtOvalSetupSections,
  "Street Stock": dirtOvalSetupSections,
  "Super Stock": dirtOvalSetupSections,
  "Factory Stock": dirtOvalSetupSections,
  Hornet: dirtOvalSetupSections,
  Midget: dirtOvalSetupSections,
  Legends: [
    { title: "Alignment", items: ["Camber", "Caster", "Toe", "Ride heights", "Crossweight"] },
    { title: "Springs & Shocks", items: ["LF spring", "RF spring", "Rear springs", "Shock package"] },
    { title: "Track Notes", items: ["Grip level", "Temperature", "Rubber build-up", "Handling notes"] },
  ],
  "Touring Car": [
    { title: "Alignment", items: ["Camber", "Caster", "Toe", "Corner weights", "Ride heights"] },
    { title: "Aero & Balance", items: ["Wing / splitter", "Brake bias", "ARB settings", "Differential notes"] },
    { title: "Session Notes", items: ["Track temp", "Tire wear", "Lap times", "Driver comments"] },
  ],
  GT: [
    { title: "Alignment", items: ["Camber", "Caster", "Toe", "Corner weights", "Ride heights"] },
    { title: "Aero & Balance", items: ["Wing / splitter", "Brake bias", "ARB settings", "Differential notes"] },
    { title: "Session Notes", items: ["Track temp", "Tire wear", "Lap times", "Driver comments"] },
  ],
  Prototype: [
    { title: "Alignment", items: ["Camber", "Caster", "Toe", "Corner weights", "Ride heights"] },
    { title: "Aero & Balance", items: ["Wing / splitter", "Brake bias", "ARB settings", "Differential notes"] },
    { title: "Session Notes", items: ["Track temp", "Tire wear", "Lap times", "Driver comments"] },
  ],
  "Club Racing Sedan": [
    { title: "Alignment", items: ["Camber", "Caster", "Toe", "Corner weights", "Ride heights"] },
    { title: "Aero & Balance", items: ["Wing / splitter", "Brake bias", "ARB settings", "Differential notes"] },
    { title: "Session Notes", items: ["Track temp", "Tire wear", "Lap times", "Driver comments"] },
  ],
  "Rally Car": [
    { title: "Suspension", items: ["Ride heights", "Spring package", "Shock valving", "Bump settings"] },
    { title: "Driveline", items: ["Gear ratio", "Diff settings", "Axle notes", "Power delivery"] },
    { title: "Course Notes", items: ["Surface changes", "Ruts", "Jumps", "Handling feedback"] },
  ],
  Buggy: [
    { title: "Suspension", items: ["Ride heights", "Spring package", "Shock valving", "Bump settings"] },
    { title: "Driveline", items: ["Gear ratio", "Diff settings", "Axle notes", "Power delivery"] },
    { title: "Course Notes", items: ["Surface changes", "Ruts", "Jumps", "Handling feedback"] },
  ],
  UTV: [
    { title: "Suspension", items: ["Ride heights", "Spring package", "Shock valving", "Bump settings"] },
    { title: "Driveline", items: ["Gear ratio", "Diff settings", "Axle notes", "Power delivery"] },
    { title: "Course Notes", items: ["Surface changes", "Ruts", "Jumps", "Handling feedback"] },
  ],
  "Off-Road Truck": [
    { title: "Suspension", items: ["Ride heights", "Spring package", "Shock valving", "Bump settings"] },
    { title: "Driveline", items: ["Gear ratio", "Diff settings", "Axle notes", "Power delivery"] },
    { title: "Course Notes", items: ["Surface changes", "Ruts", "Jumps", "Handling feedback"] },
  ],
  "Bracket Car": [
    { title: "Launch", items: ["Tire pressure", "Shock clicks", "Wheelie bar", "Converter / clutch notes"] },
    { title: "Driveline", items: ["Rear gear", "Transmission settings", "Engine tune baseline"] },
    { title: "Run Notes", items: ["Track temp", "60-foot", "ET / MPH", "Lane prep", "Driver notes"] },
  ],
  "Super Comp": [
    { title: "Launch", items: ["Tire pressure", "Shock clicks", "Wheelie bar", "Converter / clutch notes"] },
    { title: "Driveline", items: ["Rear gear", "Transmission settings", "Engine tune baseline"] },
    { title: "Run Notes", items: ["Track temp", "60-foot", "ET / MPH", "Lane prep", "Driver notes"] },
  ],
  "Top Dragster": [
    { title: "Launch", items: ["Tire pressure", "Shock clicks", "Wheelie bar", "Converter / clutch notes"] },
    { title: "Driveline", items: ["Rear gear", "Transmission settings", "Engine tune baseline"] },
    { title: "Run Notes", items: ["Track temp", "60-foot", "ET / MPH", "Lane prep", "Driver notes"] },
  ],
  "Top Sportsman": [
    { title: "Launch", items: ["Tire pressure", "Shock clicks", "Wheelie bar", "Converter / clutch notes"] },
    { title: "Driveline", items: ["Rear gear", "Transmission settings", "Engine tune baseline"] },
    { title: "Run Notes", items: ["Track temp", "60-foot", "ET / MPH", "Lane prep", "Driver notes"] },
  ],
  "Pro Mod": [
    { title: "Launch", items: ["Tire pressure", "Shock clicks", "Wheelie bar", "Converter / clutch notes"] },
    { title: "Driveline", items: ["Rear gear", "Transmission settings", "Engine tune baseline"] },
    { title: "Run Notes", items: ["Track temp", "60-foot", "ET / MPH", "Lane prep", "Driver notes"] },
  ],
  "Wing Kart": [
    { title: "Chassis", items: ["Front width", "Rear width", "Seat position", "Torsion bars"] },
    { title: "Tires", items: ["Cold pressures", "Hot pressures", "Compound", "Stagger"] },
    { title: "Track Notes", items: ["Grip level", "Rubber", "Driver comments", "Lap times"] },
  ],
  "Flat Kart": [
    { title: "Chassis", items: ["Front width", "Rear width", "Seat position", "Torsion bars"] },
    { title: "Tires", items: ["Cold pressures", "Hot pressures", "Compound", "Stagger"] },
    { title: "Track Notes", items: ["Grip level", "Rubber", "Driver comments", "Lap times"] },
  ],
  "Sprint Kart": [
    { title: "Chassis", items: ["Front width", "Rear width", "Seat position", "Torsion bars"] },
    { title: "Tires", items: ["Cold pressures", "Hot pressures", "Compound", "Stagger"] },
    { title: "Track Notes", items: ["Grip level", "Rubber", "Driver comments", "Lap times"] },
  ],
  "Shifter Kart": [
    { title: "Chassis", items: ["Front width", "Rear width", "Seat position", "Torsion bars"] },
    { title: "Tires", items: ["Cold pressures", "Hot pressures", "Compound", "Stagger"] },
    { title: "Track Notes", items: ["Grip level", "Rubber", "Driver comments", "Lap times"] },
  ],
  "Kid Kart": [
    { title: "Chassis", items: ["Front width", "Rear width", "Seat position", "Torsion bars"] },
    { title: "Tires", items: ["Cold pressures", "Hot pressures", "Compound", "Stagger"] },
    { title: "Track Notes", items: ["Grip level", "Rubber", "Driver comments", "Lap times"] },
  ],
  LO206: [
    { title: "Chassis", items: ["Front width", "Rear width", "Seat position", "Torsion bars"] },
    { title: "Tires", items: ["Cold pressures", "Hot pressures", "Compound", "Stagger"] },
    { title: "Track Notes", items: ["Grip level", "Rubber", "Driver comments", "Lap times"] },
  ],
};

export function getRacingTypeOptions(trackType?: string) {
  if (!trackType || !isTrackType(trackType)) {
    return [];
  }

  return racingTypeOptionsByTrackType[trackType];
}

export function getRaceCarTypeOptions(racingType?: string) {
  if (!racingType) {
    return [];
  }

  return carClassOptionsByRacingType[racingType] ?? [];
}

export function isTrackType(value?: string): value is TrackType {
  return !!value && trackTypeOptions.includes(value as TrackType);
}

export function getSetupSectionsForRacingType(racingType?: string) {
  if (!racingType) {
    return [
      {
        title: "Set Team Defaults",
        items: [
          "Choose a track type in Settings",
          "Choose a racing type in Settings",
          "Choose a car class in Settings",
        ],
      },
    ];
  }

  if (racingType === "Sprint Car") {
    return sprintCarSetupSections;
  }

  return (
    genericSetupSectionsByRacingType[racingType] ?? [
      { title: "Baseline Setup", items: ["Track notes", "Chassis notes", "Driver comments"] },
    ]
  );
}

export function usesDirtOvalTrackLibrary(trackType?: string) {
  return trackType === "Dirt Oval";
}
