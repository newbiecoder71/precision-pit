export const chassisBuilderOptions = [
  "Generic Dirt Modified",
  "GRT Modified",
  "J2 Race Cars",
  "Hoffman Race Cars",
  "Concept Chassis",
] as const;

export type ChassisBuilderOption = (typeof chassisBuilderOptions)[number];

export type ChassisBuilderBaseline = {
  rideHeightLf: string;
  rideHeightRf: string;
  rideHeightLr: string;
  rideHeightRr: string;
  crossweightWedge: string;
  leftSidePercentage: string;
  rearPercentage: string;
  ballastLocation: string;
  wheelbaseNotes: string;
  frameAttitude: string;
};

const genericBaseline: ChassisBuilderBaseline = {
  rideHeightLf: "5.75",
  rideHeightRf: "5.50",
  rideHeightLr: "6.25",
  rideHeightRr: "6.00",
  crossweightWedge: "52.5",
  leftSidePercentage: "54.0",
  rearPercentage: "58.0",
  ballastLocation: "Record ballast weight and exact mounting location.",
  wheelbaseNotes: "Record wheelbase split, indexing, and left/right measurements.",
  frameAttitude: "Record rake, nose attitude, and what the scales showed.",
};

export const chassisBuilderBaselines: Record<ChassisBuilderOption, ChassisBuilderBaseline> = {
  "Generic Dirt Modified": genericBaseline,
  "GRT Modified": {
    rideHeightLf: "5.75",
    rideHeightRf: "5.50",
    rideHeightLr: "6.25",
    rideHeightRr: "6.00",
    crossweightWedge: "52.5",
    leftSidePercentage: "54.0",
    rearPercentage: "58.0",
    ballastLocation: "Use the team's GRT ballast location notes from the builder baseline.",
    wheelbaseNotes: "Start from the builder wheelbase baseline, then record split and indexing.",
    frameAttitude: "Use the builder's baseline rake/frame attitude and record changes from there.",
  },
  "J2 Race Cars": genericBaseline,
  "Hoffman Race Cars": genericBaseline,
  "Concept Chassis": {
    rideHeightLf: "5.50",
    rideHeightRf: "5.25",
    rideHeightLr: "6.00",
    rideHeightRr: "5.75",
    crossweightWedge: "52.0",
    leftSidePercentage: "54.0",
    rearPercentage: "57.5",
    ballastLocation: "Record the Concept ballast recommendation and your actual mounted weight.",
    wheelbaseNotes: "Record wheelbase split and any birdcage or pull-bar indexing notes.",
    frameAttitude: "Track rake and deck stance from your Concept baseline.",
  },
};
