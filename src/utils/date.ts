export function formatDateForDisplay(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

export function formatStoredDateValue(value?: string) {
  return formatDateForDisplay(parseStoredDate(value));
}

export function parseStoredDate(value?: string) {
  if (!value) {
    return new Date();
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const displayMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (displayMatch) {
    const [, month, day, year] = displayMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  return new Date();
}

export function getDateSortValue(value?: string) {
  return parseStoredDate(value).getTime();
}

export function isDateOnOrBeforeToday(value?: string) {
  const inputDate = parseStoredDate(value);
  const today = new Date();
  const normalizedInput = new Date(
    inputDate.getFullYear(),
    inputDate.getMonth(),
    inputDate.getDate(),
  );
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return normalizedInput.getTime() <= normalizedToday.getTime();
}
