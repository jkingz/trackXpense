const steps = [
  {
    title: "Add the details",
    description: "Type the amount or use a receipt photo to fill in the entry.",
  },
  {
    id: "categories",
    title: "Give it a category",
    description:
      "Choose the account you paid from and a category like Food, Groceries, or Transport.",
  },
  {
    title: "See the new balance",
    description: "Save the expense to update the account and see what’s left in the budget.",
  },
];

export default function LandingFlow() {
  return (
    <section id="flow" aria-labelledby="flow-title" className="border-t">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 md:py-24 lg:px-16">
        <h2
          id="flow-title"
          className="max-w-xl text-4xl leading-none font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
        >
          From checkout to checked off.
        </h2>
        <ol className="mt-9 grid gap-7 md:grid-cols-3 lg:gap-10">
          {steps.map(({ id, title, description }) => (
            <li key={title} id={id} className="border-t pt-5">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 max-w-xs leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
