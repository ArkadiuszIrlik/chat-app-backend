const dayInMs = 24 * 60 * 60 * 1000;

function getDateWithoutHours(date: Date) {
  const nextDate = new Date(Math.floor(date.getTime() / dayInMs) * dayInMs);

  return nextDate;
}

function getDateHourOffset(date: Date) {
  const offset =
    date.getTime() / dayInMs - Math.floor(date.getTime() / dayInMs);

  return offset;
}

function setDateHourOffset(date: Date, offset: number) {
  let sanitizedOffset = 0;
  if (offset >= 0 && offset < 1) {
    sanitizedOffset = offset;
  }

  const nextDate =
    (Math.floor(date.getTime() / dayInMs) + sanitizedOffset) * dayInMs;
  return nextDate;
}

export { getDateWithoutHours, getDateHourOffset, setDateHourOffset };
