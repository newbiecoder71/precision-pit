import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";
import { formatDateForDisplay, parseStoredDate } from "../utils/date";

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlanks = firstDay.getDay();
  const days = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export default function DatePickerModal({
  visible,
  initialDate,
  scheduledDates = [],
  onClose,
  onSelectDate,
}: {
  visible: boolean;
  initialDate?: string;
  scheduledDates?: string[];
  onClose: () => void;
  onSelectDate: (date: string) => void;
}) {
  const parsedInitialDate = parseStoredDate(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(parsedInitialDate.getFullYear(), parsedInitialDate.getMonth(), 1),
  );

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const scheduledDateSet = useMemo(() => new Set(scheduledDates), [scheduledDates]);
  const todayValue = formatDateForDisplay(new Date());
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              style={styles.monthButton}
            >
              <Text style={styles.monthButtonText}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              onPress={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              style={styles.monthButton}
            >
              <Text style={styles.monthButtonText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((date, index) =>
              date ? (
                (() => {
                  const formattedDate = formatDateForDisplay(date);
                  const isSelected = formattedDate === initialDate;
                  const isScheduled = scheduledDateSet.has(formattedDate);
                  const isToday = formattedDate === todayValue;

                  return (
                    <Pressable
                      key={date.toISOString()}
                      onPress={() => {
                        onSelectDate(formattedDate);
                        onClose();
                      }}
                      style={styles.dayCell}
                    >
                      <View
                        style={[
                          styles.dayInner,
                          isScheduled ? styles.dayInnerScheduled : undefined,
                          isToday ? styles.dayInnerToday : undefined,
                          isSelected ? styles.dayInnerActive : undefined,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isScheduled ? styles.dayTextScheduled : undefined,
                            isToday ? styles.dayTextToday : undefined,
                            isSelected ? styles.dayTextActive : undefined,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })()
              ) : (
                <View key={`blank-${index}`} style={styles.dayCell} />
              ),
            )}
          </View>

          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Close</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSelectDate(formatDateForDisplay(new Date()));
                onClose();
              }}
              style={[styles.footerButton, styles.footerPrimary]}
            >
              <Text style={styles.footerPrimaryText}>Today</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: spacing(2),
  },
  modalCard: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 20,
    padding: spacing(2),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(1.5),
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthButtonText: {
    color: "#8ED4FF",
    fontSize: 24,
    fontWeight: "800",
  },
  monthLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: spacing(1),
  },
  weekLabel: {
    width: "14.2857%",
    textAlign: "center",
    color: "#87AFCB",
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: spacing(0.75),
  },
  dayInner: {
    alignItems: "center",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  dayInnerScheduled: {
    borderColor: "#8ED4FF",
    borderWidth: 1.5,
  },
  dayInnerToday: {
    backgroundColor: "#1780D4",
    borderColor: "#1780D4",
    borderWidth: 1.5,
  },
  dayInnerActive: {
    backgroundColor: "#1780D4",
    borderColor: "#1780D4",
    borderWidth: 1.5,
  },
  dayText: {
    color: "#DDEFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dayTextScheduled: {
    color: "#DDEFFF",
  },
  dayTextToday: {
    color: "#F3FAFF",
  },
  dayTextActive: {
    color: "#F3FAFF",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing(1),
    marginTop: spacing(1),
  },
  footerButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#21486A",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerPrimary: {
    backgroundColor: "#1780D4",
    borderColor: "#1780D4",
  },
  footerButtonText: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
  },
  footerPrimaryText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

