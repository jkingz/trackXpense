'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DATE_RANGES = {
  '7D': { label: 'Last 7 Days', days: 7 },
  '1M': { label: 'Last Month', days: 30 },
  '3M': { label: 'Last 3 Months', days: 90 },
  '6M': { label: 'Last 6 Months', days: 180 },
  ALL: { label: 'All Time', days: null },
};

const AccountChart = ({ transactions }) => {
  console.log('transactions', transactions);
  const [dateRange, setDateRange] = useState('1M');

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();

    // calculate start date based on date range
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    console.log('startDate', startDate, 'endDate', endOfDay(now));

    // filter transactions within date  range
    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    // group transactions by date and sum amounts
    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), 'MMM dd');
      // create new object if date doesn't exist in accumulator
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }

      // add transaction amount to existing object
      if (transaction.type === 'INCOME') {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    // convert grouped object to array of objects
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
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
      { income: 0, expense: 0 }
    );
  }, [filteredData]);
  return (
    <div className="pb-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-normal">
            Transaction Overview
          </CardTitle>
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
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
              <p className="text-lg font-bold text-green-500">
                ${totals.income.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Total Expenses</p>
              <p className="text-lg font-bold text-red-500">
                ${totals.expense.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Net</p>
              <p
                className={`text-lg font-bold ${
                  totals.income > totals.expense
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                ${(totals.income - totals.expense).toFixed(2)}
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
                  name={'Income'}
                  fill="#14b8a6"
                  barSize={12}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name={'Expense'}
                  fill="#ef4444"
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
