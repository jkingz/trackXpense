import { renderToStaticMarkup } from "react-dom/server";
import EmailTemplate from "../emails/template";

const html = renderToStaticMarkup(
  EmailTemplate({
    userName: "Demo User",
    type: "monthly-report",
    data: {
      month: "October 2026",
      stats: { totalIncome: 5000, totalExpenses: 3200, byCategory: { groceries: 400, rent: 1500 } },
      insights: ["Spending is within budget.", "Rent is the largest category."],
    },
  }),
);

console.log(html);
