import { categoryColors, defaultCategories } from "@/data/categories";

const names = new Map(defaultCategories.map((category) => [category.id, category.name]));

export function categoryLabel(id: string): string {
  if (id === "__rest") return "Everything else";
  return names.get(id) ?? id;
}

export function categoryColor(id: string): string {
  if (id === "__rest") return "var(--color-muted-foreground)";
  return categoryColors[id] ?? "var(--color-brand-deep)";
}
