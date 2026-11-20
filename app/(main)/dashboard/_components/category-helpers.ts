import { defaultCategories } from "@/data/categories";

const names = new Map(defaultCategories.map((category) => [category.id, category.name]));

export function categoryLabel(id: string): string {
  if (id === "__rest") return "Everything else";
  return names.get(id) ?? id;
}
