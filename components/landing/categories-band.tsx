import { categoryColors, defaultCategories } from "@/data/categories";
import { cn } from "@/lib/utils";

const income = defaultCategories.filter((category) => category.type === "INCOME");
const expense = defaultCategories.filter((category) => category.type === "EXPENSE");

function Row({
  items,
  reverse,
  decorated,
}: {
  items: typeof defaultCategories;
  reverse?: boolean;
  decorated?: boolean;
}) {
  return (
    <div className="relative overflow-hidden">
      {/* Two identical copies and a -50% translate: the loop is seamless. */}
      <div className={cn("flex w-max", reverse ? "--marquee-track-reverse" : "--marquee-track")}>
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center justify-around gap-10 px-5"
          >
            {items.map((category) => (
              <li
                key={`${copy}-${category.id}`}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-2xl font-medium tracking-tight text-muted-foreground md:text-3xl"
              >
                {decorated && (
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: categoryColors[category.id] }}
                  />
                )}
                {category.name}
              </li>
            ))}
          </ul>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

/**
 * The real category list, both kinds, scrolling in opposite directions — the
 * ledger's vocabulary as typography rather than a feature bullet.
 */
function CategoriesBand() {
  return (
    <section id="categories" aria-label="Categories included" className="space-y-4 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <p className="max-w-xl text-sm text-muted-foreground">
          Every entry carries one of these. {income.length} ways money arrives, {expense.length}{" "}
          ways it leaves.
        </p>
      </div>
      <Row items={income} />
      <Row items={expense} reverse decorated />
    </section>
  );
}

export default CategoriesBand;
