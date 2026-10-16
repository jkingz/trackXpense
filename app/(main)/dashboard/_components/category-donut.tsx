"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { usd } from "@/lib/money";

import { categoryColor, categoryLabel } from "./category-helpers";

/** Month spend as a donut. The legend carries every value, so the chart is decoration-proof. */
export function CategoryDonut({
  slices,
  total,
  monthName,
}: {
  slices: { key: string; amount: number }[];
  total: number;
  monthName: string;
}) {
  if (total === 0) {
    return (
      <section aria-labelledby="donut-heading" className="flex h-full flex-col glass-panel p-5">
        <h2
          id="donut-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Where {monthName} went
        </h2>
        <p className="py-10 text-center text-sm text-muted-foreground">
          No spending recorded this month.
        </p>
      </section>
    );
  }

  const data = slices.map((slice) => ({
    ...slice,
    label: categoryLabel(slice.key),
    color: categoryColor(slice.key),
  }));

  return (
    <section aria-labelledby="donut-heading" className="flex h-full flex-col glass-panel p-5">
      <header>
        <h2
          id="donut-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Where {monthName} went
        </h2>
      </header>

      <div className="relative mx-auto mt-2 h-40 w-full max-w-55">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value) => `$${usd(Number(value))}`}
              contentStyle={{
                backgroundColor: "color-mix(in oklab, var(--color-card) 85%, transparent)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Pie
              data={data}
              dataKey="amount"
              nameKey="label"
              innerRadius="68%"
              outerRadius="92%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-center">
        <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
          ${usd(total)}
        </span>{" "}
        <span className="text-xs text-muted-foreground">spent</span>
      </p>

      <ul className="mt-4 space-y-2.5">
        {data.map((slice) => (
          <li key={slice.key} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-card-foreground">{slice.label}</span>
            </span>
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              ${usd(slice.amount)}
              <span className="ml-2 text-xs opacity-70">
                {total > 0 ? ((slice.amount / total) * 100).toFixed(0) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
