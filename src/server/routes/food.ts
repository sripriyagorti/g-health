import { Hono } from "hono";

const food = new Hono();

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

interface NutrientEntry { nutrientName?: string; nutrientNumber?: string; value?: number; unitName?: string }
interface USDAFood {
  fdcId: number;
  description: string;
  dataType?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: NutrientEntry[];
}

function findNutrient(food: USDAFood, names: string[]): number | undefined {
  if (!food.foodNutrients) return undefined;
  for (const n of food.foodNutrients) {
    const name = (n.nutrientName || '').toLowerCase();
    if (names.some(t => name.includes(t.toLowerCase()))) {
      return typeof n.value === 'number' ? n.value : undefined;
    }
  }
  return undefined;
}

function parsePortionToGrams(portion?: string): number {
  if (!portion) return 100;
  const s = portion.trim().toLowerCase();
  const gMatch = s.match(/(\d+(?:\.\d+)?)\s*(g|gram)/);
  if (gMatch) return parseFloat(gMatch[1]);
  const ozMatch = s.match(/(\d+(?:\.\d+)?)\s*(oz|ounce)/);
  if (ozMatch) return parseFloat(ozMatch[1]) * 28.35;
  const cupMatch = s.match(/(\d+(?:\.\d+)?)\s*cup/);
  if (cupMatch) return parseFloat(cupMatch[1]) * 240;
  const tbspMatch = s.match(/(\d+(?:\.\d+)?)\s*tbsp/);
  if (tbspMatch) return parseFloat(tbspMatch[1]) * 15;
  const tspMatch = s.match(/(\d+(?:\.\d+)?)\s*tsp/);
  if (tspMatch) return parseFloat(tspMatch[1]) * 5;
  return 100;
}

function mapFood(food: USDAFood, portionGrams: number) {
  const kcalPer100 = findNutrient(food, ['Energy']) || 0;
  const proteinPer100 = findNutrient(food, ['Protein']) || 0;
  const carbsPer100 = findNutrient(food, ['Carbohydrate']) || 0;
  const fatPer100 = findNutrient(food, ['Total lipid', 'Fat']) || 0;
  const fiberPer100 = findNutrient(food, ['Fiber']) || 0;
  const sodiumPer100 = findNutrient(food, ['Sodium']) || 0;
  const potassiumPer100 = findNutrient(food, ['Potassium']) || 0;
  const factor = portionGrams / 100;
  return {
    fdcId: String(food.fdcId),
    name: food.description,
    brand: food.brandName,
    dataType: food.dataType,
    portion_g: portionGrams,
    calories: Math.round(kcalPer100 * factor),
    protein_g: Math.round(proteinPer100 * factor * 10) / 10,
    carbs_g: Math.round(carbsPer100 * factor * 10) / 10,
    fat_g: Math.round(fatPer100 * factor * 10) / 10,
    fiber_g: Math.round(fiberPer100 * factor * 10) / 10,
    sodium_mg: Math.round(sodiumPer100 * factor),
    potassium_mg: Math.round(potassiumPer100 * factor),
  };
}

export async function searchUSDA(query: string, portion?: string, pageSize = 5) {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}&pageSize=${pageSize}&dataType=Survey%20(FNDDS),Foundation,SR%20Legacy`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`USDA API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json() as { foods?: USDAFood[] };
  const grams = parsePortionToGrams(portion);
  return (data.foods || []).map(f => mapFood(f, grams));
}

food.get("/search", async (c) => {
  try {
    const q = c.req.query("q");
    const portion = c.req.query("portion") || undefined;
    const pageSize = parseInt(c.req.query("pageSize") || "5");
    if (!q) return c.json({ error: "query required" }, 400);

    const results = await searchUSDA(q, portion, pageSize);
    return c.json({ results });
  } catch (error: any) {
    console.error("Food search error:", error);
    return c.json({ error: error.message || "Search failed" }, 500);
  }
});

export default food;
