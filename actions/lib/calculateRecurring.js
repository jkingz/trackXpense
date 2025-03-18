// Helper function to calculate next recurring date
export const calculateNextRecurringDate = (startDate, interval) => {
  const date = new Date(startDate);

  switch (interval) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
};
