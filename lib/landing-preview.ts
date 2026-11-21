const previewExpenses = [
  { amount: 180, description: "Weekend coffee", category: "Food", day: 5 },
  { amount: 485.75, description: "Market groceries", category: "Groceries", day: 3 },
  { amount: 245.5, description: "Ride home", category: "Transport", day: 1 },
] as const;

const priorSpending = [220, 380, 260, 410, 350, 430, 130];

export const landingPreviews = previewExpenses.map((expense) => {
  const spending = priorSpending.map((total, day) =>
    day === expense.day ? total + expense.amount : total,
  );

  return {
    ...expense,
    balance: 18_630 - expense.amount,
    budgetLeft: 4_820 - expense.amount,
    spending,
    weekTotal: spending.reduce((total, amount) => total + amount, 0),
  };
});

export const previewIntervalMs = 4_200;
