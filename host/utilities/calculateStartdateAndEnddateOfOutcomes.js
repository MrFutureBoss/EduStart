import moment from 'moment';

export const calculateStartdateAndEnddateOfOutcomes = (semesterStartDate, semesterEndDate, outcomes) => {
  if (!outcomes || outcomes.length === 0) {
    console.log("[CALCULATE OUTCOMES] No outcomes to calculate.");
    return {};
  }

  const outcomeCount = outcomes.length;
  const start = moment(semesterStartDate, "YYYY-MM-DD");
  const end = moment(semesterEndDate, "YYYY-MM-DD");
  const totalDuration = end.diff(start, "days") + 1;
  const partDuration = Math.floor(totalDuration / 10);
  const reservedStart = start.clone();
  const reservedEnd = reservedStart.clone().add(partDuration * 2 - 1, "days");
  const calculatedOutcomes = {};
  let currentStart = reservedEnd.clone().add(1, "days");

  outcomes.forEach((outcome, index) => {
    const outcomeEnd = currentStart.clone().add(partDuration * (8 / outcomeCount) - 1, "days");
    calculatedOutcomes[outcome._id] = {
      name: outcome.name,
      startDate: currentStart.format("YYYY-MM-DD"),
      endDate: outcomeEnd.format("YYYY-MM-DD"),
    };
    currentStart = outcomeEnd.clone().add(1, "days");
  });

  return calculatedOutcomes;
};
