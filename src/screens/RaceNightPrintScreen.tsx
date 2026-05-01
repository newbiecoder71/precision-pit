import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import AppPressable from "../components/AppPressable";
import {
  RaceNight,
  RaceNightStageData,
  RaceNightStageKey,
  raceNightStageLabels,
  raceNightStageOrder,
  useAppStore,
} from "../store/useAppStore";
import { colors, spacing } from "../theme";
import { formatStoredDateValue } from "../utils/date";
import { formatGearRatio, calculateGearRatio } from "../utils/gears";
import { normalizeFractionMeasurementInput } from "../utils/measurementInputs";
import { formatMeasurementValue, calculateStaggerValue } from "../utils/tireMeasurements";

function formatOrdinal(value: string) {
  const numericValue = Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return value.trim() || "-";
  }

  const mod100 = numericValue % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${numericValue}th`;
  }

  switch (numericValue % 10) {
    case 1:
      return `${numericValue}st`;
    case 2:
      return `${numericValue}nd`;
    case 3:
      return `${numericValue}rd`;
    default:
      return `${numericValue}th`;
  }
}

function displayValue(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : "-";
}

function displayMeasurementValue(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? normalizeFractionMeasurementInput(trimmed) : "-";
}

function formatAverageTireTemp(values: string[]) {
  const numericValues = values
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return "-";
  }

  const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  return Number.isInteger(average) ? `${average}` : average.toFixed(1);
}

function stageHasMeaningfulContent(stage: RaceNightStageData) {
  return (
    stage.started ||
    Boolean(stage.weatherZipCode.trim()) ||
    Boolean(stage.trackNotes.trim()) ||
    Boolean(stage.driverNotes.trim()) ||
    Boolean(stage.crewNotes.trim()) ||
    Boolean(stage.setupAdjustments.notes.trim()) ||
    Boolean(stage.totalLaps.trim()) ||
    Boolean(stage.startPosition.trim()) ||
    Boolean(stage.finishPosition.trim())
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fieldRow(label: string, value?: string) {
  if (!value || value.trim() === "") {
    return "";
  }

  return `<div class="row"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(
    value,
  )}</div></div>`;
}

function buildStageHtml(stageKey: RaceNightStageKey, stage: RaceNightStageData) {
  const frontStaggerValue = calculateStaggerValue(
    stage.setupAdjustments.tires.lfCircumference,
    stage.setupAdjustments.tires.rfCircumference,
  );
  const rearStaggerValue = calculateStaggerValue(
    stage.setupAdjustments.tires.lrCircumference,
    stage.setupAdjustments.tires.rrCircumference,
  );
  const gearRatio = formatGearRatio(
    calculateGearRatio(
      stage.setupAdjustments.gears.ringTeeth,
      stage.setupAdjustments.gears.pinionTeeth,
      stage.setupAdjustments.gears.quickChangeTopTeeth,
      stage.setupAdjustments.gears.quickChangeBottomTeeth,
    ),
  );

  return `
    <section class="stage">
      <div class="stage-title">${escapeHtml(raceNightStageLabels[stageKey])}</div>
      <div class="stage-grid">
        <div class="card">
          <div class="card-title">Weather</div>
          ${fieldRow("ZIP", stage.weatherZipCode)}
          ${fieldRow("Temperature", stage.weatherTemperature)}
          ${fieldRow("Humidity", stage.humidity)}
          ${fieldRow("Wind", stage.windCondition)}
          ${fieldRow("Sky", stage.skyCondition)}
          ${fieldRow("Precipitation", stage.precipitation)}
          ${fieldRow("Weather Notes", stage.weatherNotes)}
        </div>
        <div class="card">
          <div class="card-title">Track</div>
          ${fieldRow("Track Temp", stage.trackTemperature)}
          ${fieldRow("Track Type", stage.trackType)}
          ${fieldRow("Banking", stage.trackBanking)}
          ${fieldRow("Length", stage.trackLength)}
          ${fieldRow("Surface", stage.trackSurface)}
          ${fieldRow("Moisture", stage.moistureState)}
          ${fieldRow("Track Notes", stage.trackNotes)}
        </div>
        <div class="card">
          <div class="card-title">Results</div>
          ${fieldRow("Total Laps", stage.totalLaps)}
          ${fieldRow("Start Position", formatOrdinal(stage.startPosition))}
          ${fieldRow("Finish Position", formatOrdinal(stage.finishPosition))}
          ${fieldRow("Setup Notes", stage.setupAdjustments.notes)}
          ${fieldRow("Driver Notes", stage.driverNotes)}
          ${fieldRow("Crew Notes", stage.crewNotes)}
        </div>
      </div>

      <div class="setup-block">
        <div class="setup-title">Setups</div>
        <div class="setup-grid">
          <div class="card">
            <div class="card-title">Chassis</div>
            ${fieldRow("LF Ride Height", normalizeFractionMeasurementInput(stage.setupAdjustments.chassis.rideHeightLf))}
            ${fieldRow("RF Ride Height", normalizeFractionMeasurementInput(stage.setupAdjustments.chassis.rideHeightRf))}
            ${fieldRow("LR Ride Height", normalizeFractionMeasurementInput(stage.setupAdjustments.chassis.rideHeightLr))}
            ${fieldRow("RR Ride Height", normalizeFractionMeasurementInput(stage.setupAdjustments.chassis.rideHeightRr))}
            ${fieldRow("Top Wing Angle", stage.setupAdjustments.chassis.topWingAngle)}
            ${fieldRow("Slider Position", stage.setupAdjustments.chassis.sliderPosition)}
            ${fieldRow("Wicker Bill Size", stage.setupAdjustments.chassis.wickerBillSize)}
            ${fieldRow("Nose Wing Angle", stage.setupAdjustments.chassis.noseWingAngle)}
            ${fieldRow("Crossweight / Wedge %", stage.setupAdjustments.chassis.crossweightWedge)}
            ${fieldRow("Left Side %", stage.setupAdjustments.chassis.leftSidePercentage)}
            ${fieldRow("Rear %", stage.setupAdjustments.chassis.rearPercentage)}
            ${fieldRow("Ballast Location", stage.setupAdjustments.chassis.ballastLocation)}
            ${fieldRow("Wheelbase Notes", stage.setupAdjustments.chassis.wheelbaseNotes)}
            ${fieldRow("Frame Attitude", stage.setupAdjustments.chassis.frameAttitude)}
          </div>
          <div class="card">
            <div class="card-title">Tires & Wheels</div>
            ${fieldRow("LF Circumference", stage.setupAdjustments.tires.lfCircumference)}
            ${fieldRow("RF Circumference", stage.setupAdjustments.tires.rfCircumference)}
            ${fieldRow("LR Circumference", stage.setupAdjustments.tires.lrCircumference)}
            ${fieldRow("RR Circumference", stage.setupAdjustments.tires.rrCircumference)}
            ${fieldRow(
              "Front Stagger",
              frontStaggerValue == null ? "" : formatMeasurementValue(frontStaggerValue, "fraction"),
            )}
            ${fieldRow(
              "Rear Stagger",
              rearStaggerValue == null ? "" : formatMeasurementValue(rearStaggerValue, "fraction"),
            )}
            ${fieldRow("LF Pressure", stage.setupAdjustments.tires.lfPressure)}
            ${fieldRow("RF Pressure", stage.setupAdjustments.tires.rfPressure)}
            ${fieldRow("LR Pressure", stage.setupAdjustments.tires.lrPressure)}
            ${fieldRow("RR Pressure", stage.setupAdjustments.tires.rrPressure)}
            ${fieldRow("LF Wheel Offset", normalizeFractionMeasurementInput(stage.setupAdjustments.tires.lfWheelOffset))}
            ${fieldRow("RF Wheel Offset", normalizeFractionMeasurementInput(stage.setupAdjustments.tires.rfWheelOffset))}
            ${fieldRow("LR Wheel Offset", normalizeFractionMeasurementInput(stage.setupAdjustments.tires.lrWheelOffset))}
            ${fieldRow("RR Wheel Offset", normalizeFractionMeasurementInput(stage.setupAdjustments.tires.rrWheelOffset))}
            ${fieldRow("LF Temp Inner", stage.setupAdjustments.tires.lfTempInner)}
            ${fieldRow("LF Temp Middle", stage.setupAdjustments.tires.lfTempMiddle)}
            ${fieldRow("LF Temp Outer", stage.setupAdjustments.tires.lfTempOuter)}
            ${fieldRow(
              "LF Temp Avg",
              displayValue(
                formatAverageTireTemp([
                  stage.setupAdjustments.tires.lfTempInner,
                  stage.setupAdjustments.tires.lfTempMiddle,
                  stage.setupAdjustments.tires.lfTempOuter,
                ]),
              ),
            )}
            ${fieldRow("RF Temp Inner", stage.setupAdjustments.tires.rfTempInner)}
            ${fieldRow("RF Temp Middle", stage.setupAdjustments.tires.rfTempMiddle)}
            ${fieldRow("RF Temp Outer", stage.setupAdjustments.tires.rfTempOuter)}
            ${fieldRow(
              "RF Temp Avg",
              displayValue(
                formatAverageTireTemp([
                  stage.setupAdjustments.tires.rfTempInner,
                  stage.setupAdjustments.tires.rfTempMiddle,
                  stage.setupAdjustments.tires.rfTempOuter,
                ]),
              ),
            )}
            ${fieldRow("LR Temp Inner", stage.setupAdjustments.tires.lrTempInner)}
            ${fieldRow("LR Temp Middle", stage.setupAdjustments.tires.lrTempMiddle)}
            ${fieldRow("LR Temp Outer", stage.setupAdjustments.tires.lrTempOuter)}
            ${fieldRow(
              "LR Temp Avg",
              displayValue(
                formatAverageTireTemp([
                  stage.setupAdjustments.tires.lrTempInner,
                  stage.setupAdjustments.tires.lrTempMiddle,
                  stage.setupAdjustments.tires.lrTempOuter,
                ]),
              ),
            )}
            ${fieldRow("RR Temp Inner", stage.setupAdjustments.tires.rrTempInner)}
            ${fieldRow("RR Temp Middle", stage.setupAdjustments.tires.rrTempMiddle)}
            ${fieldRow("RR Temp Outer", stage.setupAdjustments.tires.rrTempOuter)}
            ${fieldRow(
              "RR Temp Avg",
              displayValue(
                formatAverageTireTemp([
                  stage.setupAdjustments.tires.rrTempInner,
                  stage.setupAdjustments.tires.rrTempMiddle,
                  stage.setupAdjustments.tires.rrTempOuter,
                ]),
              ),
            )}
          </div>
          <div class="card">
            <div class="card-title">Suspension</div>
            ${fieldRow("Front Springs", stage.setupAdjustments.suspension.frontSprings)}
            ${fieldRow("Front Shocks", stage.setupAdjustments.suspension.frontShocks)}
            ${fieldRow("Camber", stage.setupAdjustments.suspension.camber)}
            ${fieldRow("Caster", stage.setupAdjustments.suspension.caster)}
            ${fieldRow("Toe", stage.setupAdjustments.suspension.toe)}
            ${fieldRow("Travel / Bump Stops", stage.setupAdjustments.suspension.travelBumpStops)}
            ${fieldRow("Rear Springs", stage.setupAdjustments.suspension.rearSprings)}
            ${fieldRow("Rear Shocks", stage.setupAdjustments.suspension.rearShocks)}
            ${fieldRow("Trailing Arm Angles", stage.setupAdjustments.suspension.trailingArmAngles)}
            ${fieldRow("Pull Bar / Lift Arm", stage.setupAdjustments.suspension.pullBarLiftArm)}
            ${fieldRow("J-Bar / Panhard Height", stage.setupAdjustments.suspension.jBarPanhardHeight)}
            ${fieldRow(
              "Birdcage / Indexing Notes",
              stage.setupAdjustments.suspension.birdcageIndexingNotes,
            )}
          </div>
          <div class="card">
            <div class="card-title">Driveline</div>
            ${fieldRow("Ring Teeth", stage.setupAdjustments.gears.ringTeeth)}
            ${fieldRow("Pinion Teeth", stage.setupAdjustments.gears.pinionTeeth)}
            ${fieldRow("Top Quick-Change Gear", stage.setupAdjustments.gears.quickChangeTopTeeth)}
            ${fieldRow("Bottom Quick-Change Gear", stage.setupAdjustments.gears.quickChangeBottomTeeth)}
            ${fieldRow("Final Drive Ratio", gearRatio)}
            ${fieldRow("Gear Notes", stage.setupAdjustments.gears.notes)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildRaceNightReportHtml(raceNight: RaceNight) {
  const stageMarkup = raceNightStageOrder
    .filter((stageKey) => stageHasMeaningfulContent(raceNight.stageSessions[stageKey]))
    .map((stageKey) => buildStageHtml(stageKey, raceNight.stageSessions[stageKey]))
    .join("");

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; padding: 28px; }
        .header { border-bottom: 3px solid #1d4f91; padding-bottom: 14px; margin-bottom: 18px; }
        .eyebrow { color: #1d4f91; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        h1 { margin: 6px 0 8px; font-size: 28px; }
        .meta { color: #334155; font-size: 14px; margin-bottom: 4px; }
        .stage { page-break-inside: avoid; margin-bottom: 24px; }
        .stage-title { background: #0f2947; color: white; padding: 10px 14px; font-size: 18px; font-weight: 700; border-radius: 10px; margin-bottom: 12px; }
        .stage-grid, .setup-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .setup-block { margin-top: 12px; }
        .setup-title { font-size: 16px; font-weight: 700; color: #0f2947; margin: 10px 0; }
        .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }
        .card-title { color: #1d4f91; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
        .row { display: flex; gap: 12px; padding: 4px 0; border-top: 1px solid #e2e8f0; }
        .row:first-of-type { border-top: 0; }
        .label { width: 42%; color: #475569; font-size: 12px; font-weight: 700; }
        .value { flex: 1; color: #0f172a; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="eyebrow">Precision Pit Race Night Report</div>
        <h1>${escapeHtml(raceNight.eventTitle)}</h1>
        <div class="meta">${escapeHtml(raceNight.trackName)}</div>
        <div class="meta">${escapeHtml(formatStoredDateValue(raceNight.eventDate))}</div>
        <div class="meta">Status: ${escapeHtml(raceNight.status)}</div>
      </div>
      ${stageMarkup}
    </body>
  </html>`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function PreviewCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  const visibleRows = rows.filter((row) => row.value.trim() && row.value.trim() !== "-");
  if (!visibleRows.length) {
    return null;
  }

  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewCardTitle}>{title}</Text>
      {visibleRows.map((row) => (
        <SummaryRow key={`${title}-${row.label}`} label={row.label} value={row.value} />
      ))}
    </View>
  );
}

export default function RaceNightPrintScreen({ route }: any) {
  const raceNightId = route.params?.raceNightId as string;
  const raceNight = useAppStore((state) => state.raceNights.find((entry) => entry.id === raceNightId));

  const reportHtml = useMemo(() => (raceNight ? buildRaceNightReportHtml(raceNight) : ""), [raceNight]);

  const handlePrint = async () => {
    if (!reportHtml) {
      return;
    }

    try {
      await Print.printAsync({ html: reportHtml });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open the print dialog.";
      Alert.alert("Print failed", message);
    }
  };

  const handleSavePdf = async () => {
    if (!reportHtml) {
      return;
    }

    try {
      const { uri } = await Print.printToFileAsync({ html: reportHtml });
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert("PDF saved", `PDF created at:\n${uri}`);
        return;
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: "Save or share race night PDF",
        mimeType: "application/pdf",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the PDF.";
      Alert.alert("PDF failed", message);
    }
  };

  if (!raceNight) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Race Night Printout</Text>
        <Text style={styles.emptyText}>The selected race night could not be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Race Night Printout</Text>
      <Text style={styles.subtitle}>
        Review the organized report below, then print it or save it as a PDF.
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{raceNight.eventTitle}</Text>
        <Text style={styles.heroMeta}>{raceNight.trackName}</Text>
        <Text style={styles.heroMeta}>{formatStoredDateValue(raceNight.eventDate)}</Text>
      </View>

      <View style={styles.actionsRow}>
        <AppPressable onPress={handlePrint} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Print</Text>
        </AppPressable>
        <AppPressable onPress={handleSavePdf} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Save as PDF</Text>
        </AppPressable>
      </View>

      {raceNightStageOrder
        .filter((stageKey) => stageHasMeaningfulContent(raceNight.stageSessions[stageKey]))
        .map((stageKey) => {
          const stage = raceNight.stageSessions[stageKey];
          const frontStaggerValue = calculateStaggerValue(
            stage.setupAdjustments.tires.lfCircumference,
            stage.setupAdjustments.tires.rfCircumference,
          );
          const rearStaggerValue = calculateStaggerValue(
            stage.setupAdjustments.tires.lrCircumference,
            stage.setupAdjustments.tires.rrCircumference,
          );
          const gearRatio = formatGearRatio(
            calculateGearRatio(
              stage.setupAdjustments.gears.ringTeeth,
              stage.setupAdjustments.gears.pinionTeeth,
              stage.setupAdjustments.gears.quickChangeTopTeeth,
              stage.setupAdjustments.gears.quickChangeBottomTeeth,
            ),
          );

          return (
            <View key={stageKey} style={styles.stageSection}>
              <Text style={styles.stageTitle}>{raceNightStageLabels[stageKey]}</Text>

              <PreviewCard
                title="Weather"
                rows={[
                  { label: "ZIP", value: displayValue(stage.weatherZipCode) },
                  { label: "Temperature", value: displayValue(stage.weatherTemperature) },
                  { label: "Humidity", value: displayValue(stage.humidity) },
                  { label: "Wind", value: displayValue(stage.windCondition) },
                  { label: "Sky", value: displayValue(stage.skyCondition) },
                  { label: "Precipitation", value: displayValue(stage.precipitation) },
                ]}
              />

              <PreviewCard
                title="Track"
                rows={[
                  { label: "Track Temp", value: displayValue(stage.trackTemperature) },
                  { label: "Track Type", value: displayValue(stage.trackType) },
                  { label: "Banking", value: displayValue(stage.trackBanking) },
                  { label: "Length", value: displayValue(stage.trackLength) },
                  { label: "Surface", value: displayValue(stage.trackSurface) },
                  { label: "Moisture", value: displayValue(stage.moistureState) },
                ]}
              />

              <PreviewCard
                title="Results"
                rows={[
                  { label: "Total Laps", value: displayValue(stage.totalLaps) },
                  { label: "Start Position", value: formatOrdinal(stage.startPosition) },
                  { label: "Finish Position", value: formatOrdinal(stage.finishPosition) },
                  { label: "Setup Notes", value: displayValue(stage.setupAdjustments.notes) },
                  { label: "Driver Notes", value: displayValue(stage.driverNotes) },
                  { label: "Crew Notes", value: displayValue(stage.crewNotes) },
                ]}
              />

              <PreviewCard
                title="Chassis"
                rows={[
                  { label: "LF Ride Height", value: displayMeasurementValue(stage.setupAdjustments.chassis.rideHeightLf) },
                  { label: "RF Ride Height", value: displayMeasurementValue(stage.setupAdjustments.chassis.rideHeightRf) },
                  { label: "LR Ride Height", value: displayMeasurementValue(stage.setupAdjustments.chassis.rideHeightLr) },
                  { label: "RR Ride Height", value: displayMeasurementValue(stage.setupAdjustments.chassis.rideHeightRr) },
                  { label: "Top Wing Angle", value: displayValue(stage.setupAdjustments.chassis.topWingAngle) },
                  { label: "Slider Position", value: displayValue(stage.setupAdjustments.chassis.sliderPosition) },
                  { label: "Wicker Bill Size", value: displayValue(stage.setupAdjustments.chassis.wickerBillSize) },
                  { label: "Nose Wing Angle", value: displayValue(stage.setupAdjustments.chassis.noseWingAngle) },
                  {
                    label: "Crossweight / Wedge %",
                    value: displayValue(stage.setupAdjustments.chassis.crossweightWedge),
                  },
                  {
                    label: "Left Side %",
                    value: displayValue(stage.setupAdjustments.chassis.leftSidePercentage),
                  },
                  { label: "Rear %", value: displayValue(stage.setupAdjustments.chassis.rearPercentage) },
                ]}
              />

              <PreviewCard
                title="Tires & Wheels"
                rows={[
                  { label: "LF Circumference", value: displayValue(stage.setupAdjustments.tires.lfCircumference) },
                  { label: "RF Circumference", value: displayValue(stage.setupAdjustments.tires.rfCircumference) },
                  { label: "LR Circumference", value: displayValue(stage.setupAdjustments.tires.lrCircumference) },
                  { label: "RR Circumference", value: displayValue(stage.setupAdjustments.tires.rrCircumference) },
                  {
                    label: "Front Stagger",
                    value:
                      frontStaggerValue == null ? "-" : formatMeasurementValue(frontStaggerValue, "fraction"),
                  },
                  {
                    label: "Rear Stagger",
                    value:
                      rearStaggerValue == null ? "-" : formatMeasurementValue(rearStaggerValue, "fraction"),
                  },
                  { label: "LF Pressure", value: displayValue(stage.setupAdjustments.tires.lfPressure) },
                  { label: "RF Pressure", value: displayValue(stage.setupAdjustments.tires.rfPressure) },
                  { label: "LR Pressure", value: displayValue(stage.setupAdjustments.tires.lrPressure) },
                  { label: "RR Pressure", value: displayValue(stage.setupAdjustments.tires.rrPressure) },
                  { label: "LF Wheel Offset", value: displayMeasurementValue(stage.setupAdjustments.tires.lfWheelOffset) },
                  { label: "RF Wheel Offset", value: displayMeasurementValue(stage.setupAdjustments.tires.rfWheelOffset) },
                  { label: "LR Wheel Offset", value: displayMeasurementValue(stage.setupAdjustments.tires.lrWheelOffset) },
                  { label: "RR Wheel Offset", value: displayMeasurementValue(stage.setupAdjustments.tires.rrWheelOffset) },
                  { label: "LF Temp Inner", value: displayValue(stage.setupAdjustments.tires.lfTempInner) },
                  { label: "LF Temp Middle", value: displayValue(stage.setupAdjustments.tires.lfTempMiddle) },
                  { label: "LF Temp Outer", value: displayValue(stage.setupAdjustments.tires.lfTempOuter) },
                  {
                    label: "LF Temp Avg",
                    value: displayValue(
                      formatAverageTireTemp([
                        stage.setupAdjustments.tires.lfTempInner,
                        stage.setupAdjustments.tires.lfTempMiddle,
                        stage.setupAdjustments.tires.lfTempOuter,
                      ]),
                    ),
                  },
                  { label: "RF Temp Inner", value: displayValue(stage.setupAdjustments.tires.rfTempInner) },
                  { label: "RF Temp Middle", value: displayValue(stage.setupAdjustments.tires.rfTempMiddle) },
                  { label: "RF Temp Outer", value: displayValue(stage.setupAdjustments.tires.rfTempOuter) },
                  {
                    label: "RF Temp Avg",
                    value: displayValue(
                      formatAverageTireTemp([
                        stage.setupAdjustments.tires.rfTempInner,
                        stage.setupAdjustments.tires.rfTempMiddle,
                        stage.setupAdjustments.tires.rfTempOuter,
                      ]),
                    ),
                  },
                  { label: "LR Temp Inner", value: displayValue(stage.setupAdjustments.tires.lrTempInner) },
                  { label: "LR Temp Middle", value: displayValue(stage.setupAdjustments.tires.lrTempMiddle) },
                  { label: "LR Temp Outer", value: displayValue(stage.setupAdjustments.tires.lrTempOuter) },
                  {
                    label: "LR Temp Avg",
                    value: displayValue(
                      formatAverageTireTemp([
                        stage.setupAdjustments.tires.lrTempInner,
                        stage.setupAdjustments.tires.lrTempMiddle,
                        stage.setupAdjustments.tires.lrTempOuter,
                      ]),
                    ),
                  },
                  { label: "RR Temp Inner", value: displayValue(stage.setupAdjustments.tires.rrTempInner) },
                  { label: "RR Temp Middle", value: displayValue(stage.setupAdjustments.tires.rrTempMiddle) },
                  { label: "RR Temp Outer", value: displayValue(stage.setupAdjustments.tires.rrTempOuter) },
                  {
                    label: "RR Temp Avg",
                    value: displayValue(
                      formatAverageTireTemp([
                        stage.setupAdjustments.tires.rrTempInner,
                        stage.setupAdjustments.tires.rrTempMiddle,
                        stage.setupAdjustments.tires.rrTempOuter,
                      ]),
                    ),
                  },
                ]}
              />

              <PreviewCard
                title="Suspension"
                rows={[
                  { label: "Front Springs", value: displayValue(stage.setupAdjustments.suspension.frontSprings) },
                  { label: "Front Shocks", value: displayValue(stage.setupAdjustments.suspension.frontShocks) },
                  { label: "Camber", value: displayValue(stage.setupAdjustments.suspension.camber) },
                  { label: "Caster", value: displayValue(stage.setupAdjustments.suspension.caster) },
                  { label: "Toe", value: displayValue(stage.setupAdjustments.suspension.toe) },
                  {
                    label: "Travel / Bump Stops",
                    value: displayValue(stage.setupAdjustments.suspension.travelBumpStops),
                  },
                  { label: "Rear Springs", value: displayValue(stage.setupAdjustments.suspension.rearSprings) },
                  { label: "Rear Shocks", value: displayValue(stage.setupAdjustments.suspension.rearShocks) },
                ]}
              />

              <PreviewCard
                title="Driveline"
                rows={[
                  { label: "Ring Teeth", value: displayValue(stage.setupAdjustments.gears.ringTeeth) },
                  { label: "Pinion Teeth", value: displayValue(stage.setupAdjustments.gears.pinionTeeth) },
                  {
                    label: "Top Quick-Change Gear",
                    value: displayValue(stage.setupAdjustments.gears.quickChangeTopTeeth),
                  },
                  {
                    label: "Bottom Quick-Change Gear",
                    value: displayValue(stage.setupAdjustments.gears.quickChangeBottomTeeth),
                  },
                  { label: "Final Drive Ratio", value: displayValue(gearRatio) },
                  { label: "Gear Notes", value: displayValue(stage.setupAdjustments.gears.notes) },
                ]}
              />
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing(2),
    paddingBottom: spacing(3),
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing(2),
  },
  title: {
    color: "#F3FAFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing(0.75),
    textAlign: "center",
  },
  subtitle: {
    color: "#A9C7DD",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing(1.5),
    textAlign: "center",
  },
  heroCard: {
    backgroundColor: "#102947",
    borderColor: "#1E5B94",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(1.5),
    padding: spacing(2),
  },
  heroTitle: {
    color: "#F3FAFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: spacing(0.5),
    textAlign: "center",
  },
  heroMeta: {
    color: "#CBE7FA",
    fontSize: 15,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing(1),
    marginBottom: spacing(2),
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.bg,
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#D7EEFF",
    fontSize: 15,
    fontWeight: "800",
  },
  stageSection: {
    marginBottom: spacing(2),
  },
  stageTitle: {
    color: "#8ED4FF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing(1),
    textAlign: "center",
    textTransform: "uppercase",
  },
  previewCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(1),
    padding: spacing(1.5),
  },
  previewCardTitle: {
    color: "#8ED4FF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing(0.75),
    textTransform: "uppercase",
  },
  summaryRow: {
    borderTopColor: "rgba(135,175,203,0.18)",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: {
    color: "#8AAEC6",
    fontSize: 13,
    fontWeight: "700",
    width: "42%",
  },
  summaryValue: {
    color: "#EAF7FF",
    flex: 1,
    fontSize: 13,
    textAlign: "right",
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
