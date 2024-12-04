import moment from 'moment';

const calculateStartdateAndEnddateOfOutcomes = (semesterStartDate, semesterEndDate, outcomeCount) => {
  const start = moment(semesterStartDate, "YYYY-MM-DD");
  const end = moment(semesterEndDate, "YYYY-MM-DD");
  
  const totalDuration = end.diff(start, 'days') + 1; 
  const partDuration = Math.floor(totalDuration / 10); // Dividing the semester into 10 parts

  // Reserved period for group creation and topic finalization (2 parts)
  const reservedStart = start.clone();
  const reservedEnd = reservedStart.clone().add(partDuration * 2 - 1, 'days');
  
  // Allocate the remaining 8 parts for outcomes
  const outcomes = {};
  let currentStart = reservedEnd.clone().add(1, 'days');
  let remainingDays = totalDuration - partDuration * 2; // 8 parts * 7 =56 days

  for (let i = 1; i <= outcomeCount; i++) {
    // Distribute remainingDays as evenly as possible
    const daysForThisOutcome = Math.ceil(remainingDays / (outcomeCount - i +1));
    const outcomeEnd = currentStart.clone().add(daysForThisOutcome -1, 'days');
    outcomes[`outcome${i}`] = {
      startDate: currentStart.format("YYYY-MM-DD"),
      endDate: outcomeEnd.format("YYYY-MM-DD"),
    };
    currentStart = outcomeEnd.clone().add(1, 'days');
    remainingDays -= daysForThisOutcome;
  }

  return outcomes;
};

export default calculateStartdateAndEnddateOfOutcomes;
