"use client";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signedUsd, usd } from "@/lib/money";
import { cn } from "@/lib/utils";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

type ChartTransaction = {
  date: Date;
  type: string;
  amount: number;
};

type DailyGroup = {
  date: string;
  income: number;
  expense: number;
};

const AccountChart = ({ transactions }: { transactions: ChartTransaction[] }) => {
  const [dateRange, setDateRange] = useState("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange as keyof typeof DATE_RANGES];
    const now = new Date();

    // calculate start date based on date range
    const startDate = range.days ? startOfDay(subDays(now, range.days)) : startOfDay(new Date(0));

    // filter transactions within date  range
    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now),
    );

    // group transactions by date and sum amounts
    const grouped = filtered.reduce<Record<string, DailyGroup>>((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");
      // create new object if date doesn't exist in accumulator
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }

      // add transaction amount to existing object
      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    // convert grouped object to array of objects
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [transactions, dateRange]);

  // calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => {
        acc.income += day.income;
        acc.expense += day.expense;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [filteredData]);
  return (
    <div className="pb-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-normal">Transaction Overview</CardTitle>
          <Select defaultValue={dateRange} onValueChange={(value) => setDateRange(value ?? "1M")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around mb-6 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Total Income</p>
              <p className="font-mono text-lg font-bold text-income tabular-nums">
                ${usd(totals.income)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Total Expenses</p>
              <p className="font-mono text-lg font-bold text-expense tabular-nums">
                ${usd(totals.expense)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Net</p>
              <p
                className={cn(
                  "font-mono text-lg font-bold tabular-nums",
                  totals.income > totals.expense ? "text-income" : "text-expense",
                )}
              >
                {signedUsd(totals.income - totals.expense)}
              </p>
            </div>
          </div>
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis
                  font-size={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip formatter={(value) => [`$${value}`, undefined]} />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="var(--color-income)"
                  barSize={12}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="var(--color-expense)"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountChart;
