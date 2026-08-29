// Flavor pairing data for common CSA produce — in the spirit of the Flavor
// Bible: for each ingredient, companions that classically work with it.
// Curated from general culinary knowledge; extend freely as boxes arrive.
//
// Keys are canonical ingredient names (lowercase). ALIASES maps the messy
// names CSA emails use onto those keys.

export const PAIRINGS = {
  arugula: ["lemon", "parmesan", "olive oil", "prosciutto", "tomatoes", "goat cheese", "pine nuts", "balsamic", "peaches", "pasta"],
  basil: ["tomatoes", "mozzarella", "garlic", "olive oil", "pine nuts", "peaches", "corn", "zucchini", "lemon", "strawberries"],
  beets: ["goat cheese", "walnuts", "orange", "dill", "arugula", "yogurt", "horseradish", "lentils", "feta", "balsamic"],
  "bok choy": ["ginger", "garlic", "soy sauce", "sesame", "scallions", "mushrooms", "chili crisp", "tofu", "rice vinegar", "miso"],
  broccoli: ["garlic", "lemon", "parmesan", "chili flakes", "anchovies", "sesame", "cheddar", "almonds", "pasta", "soy sauce"],
  "brussels sprouts": ["bacon", "balsamic", "maple", "mustard", "apples", "parmesan", "hazelnuts", "miso", "honey", "lemon"],
  cabbage: ["caraway", "apples", "bacon", "mustard", "ginger", "sesame", "lime", "fish sauce", "butter", "dill"],
  carrots: ["cumin", "ginger", "honey", "dill", "orange", "yogurt", "harissa", "tahini", "maple", "parsley"],
  cauliflower: ["curry", "tahini", "capers", "raisins", "brown butter", "turmeric", "parmesan", "lemon", "almonds", "harissa"],
  celery: ["blue cheese", "peanut butter", "apples", "walnuts", "lemon", "anchovies", "white beans", "tuna", "olives", "parsley"],
  chard: ["garlic", "lemon", "pine nuts", "raisins", "white beans", "eggs", "parmesan", "olive oil", "chickpeas", "feta"],
  cilantro: ["lime", "chili", "avocado", "corn", "coconut", "ginger", "cumin", "fish sauce", "peanuts", "scallions"],
  corn: ["butter", "basil", "lime", "cotija", "chili", "tomatoes", "miso", "bacon", "scallions", "cilantro"],
  cucumber: ["dill", "yogurt", "mint", "feta", "rice vinegar", "sesame", "chili crisp", "tomatoes", "red onion", "lemon"],
  delicata: ["sage", "brown butter", "maple", "chili flakes", "goat cheese", "pecans", "apples", "rosemary", "honey", "yogurt"],
  dill: ["yogurt", "cucumber", "salmon", "potatoes", "beets", "lemon", "feta", "eggs", "white beans", "carrots"],
  eggplant: ["miso", "garlic", "tomatoes", "tahini", "yogurt", "basil", "soy sauce", "chili", "honey", "za'atar"],
  fennel: ["orange", "olives", "parmesan", "lemon", "sausage", "white fish", "tomatoes", "cream", "pernod", "arugula"],
  garlic: ["olive oil", "lemon", "chili flakes", "butter", "anchovies", "ginger", "herbs", "white beans", "pasta", "greens"],
  "garlic scapes": ["eggs", "pesto", "butter", "potatoes", "white beans", "lemon", "parmesan", "olive oil", "pasta", "grilling"],
  ginger: ["garlic", "scallions", "soy sauce", "sesame", "lime", "coconut", "carrots", "honey", "chili", "turmeric"],
  "green beans": ["almonds", "garlic", "sesame", "tomatoes", "dill", "mustard", "potatoes", "olives", "lemon", "fish sauce"],
  kale: ["garlic", "lemon", "parmesan", "white beans", "chili flakes", "tahini", "sausage", "sweet potatoes", "avocado", "cranberries"],
  kohlrabi: ["apples", "lime", "sesame", "yogurt", "mint", "chili", "cabbage", "carrots", "peanuts", "mustard"],
  leeks: ["butter", "cream", "potatoes", "thyme", "white wine", "gruyere", "eggs", "mustard", "lemon", "white beans"],
  lettuce: ["buttermilk", "dill", "radish", "scallions", "lemon", "parmesan", "anchovies", "avocado", "peas", "mustard"],
  melon: ["prosciutto", "mint", "feta", "lime", "chili", "cucumber", "basil", "yogurt", "honey", "ginger"],
  mint: ["peas", "yogurt", "cucumber", "feta", "lamb", "lime", "watermelon", "chili", "bulgur", "strawberries"],
  mushrooms: ["butter", "thyme", "garlic", "cream", "soy sauce", "miso", "eggs", "parmesan", "wild rice", "sherry"],
  onions: ["butter", "thyme", "balsamic", "cheese", "eggs", "beef", "cream", "white wine", "sage", "lentils"],
  parsley: ["lemon", "garlic", "bulgur", "capers", "anchovies", "white beans", "potatoes", "walnuts", "olive oil", "eggs"],
  parsnips: ["maple", "brown butter", "thyme", "apples", "cream", "curry", "honey", "hazelnuts", "potatoes", "nutmeg"],
  peas: ["mint", "butter", "lemon", "ricotta", "prosciutto", "pasta", "scallions", "cream", "parmesan", "eggs"],
  peppers: ["onions", "garlic", "eggs", "feta", "tomatoes", "smoked paprika", "corn", "sausage", "capers", "sherry vinegar"],
  potatoes: ["butter", "rosemary", "garlic", "sour cream", "dill", "cheese", "eggs", "mustard", "leeks", "smoked paprika"],
  radishes: ["butter", "salt", "lime", "sesame", "yogurt", "dill", "vinegar", "avocado", "scallions", "brown butter"],
  scallions: ["ginger", "sesame", "soy sauce", "eggs", "chili", "lime", "miso", "pancakes", "butter", "charring"],
  spinach: ["garlic", "lemon", "cream", "feta", "eggs", "nutmeg", "yogurt", "chickpeas", "paneer", "sesame"],
  "summer squash": ["basil", "parmesan", "lemon", "garlic", "corn", "mint", "feta", "brown butter", "pine nuts", "tomatoes"],
  "sweet potatoes": ["black beans", "chili", "lime", "coconut", "maple", "pecans", "yogurt", "tahini", "kale", "peanut butter"],
  tomatoes: ["basil", "mozzarella", "olive oil", "garlic", "balsamic", "bread", "feta", "capers", "anchovies", "peaches"],
  turnips: ["butter", "miso", "honey", "bacon", "apples", "thyme", "mustard", "cream", "scallions", "brown butter"],
  "winter squash": ["sage", "brown butter", "maple", "chili", "coconut", "ginger", "pecans", "parmesan", "apples", "miso"],
  zucchini: ["basil", "parmesan", "lemon", "garlic", "mint", "feta", "corn", "olive oil", "pine nuts", "chili flakes"],
};

// CSA-email spellings -> canonical PAIRINGS keys.
export const ALIASES = {
  "baby kale": "kale",
  "lacinato kale": "kale",
  "dinosaur kale": "kale",
  "curly kale": "kale",
  "red kale": "kale",
  "swiss chard": "chard",
  "rainbow chard": "chard",
  "red chard": "chard",
  "collards": "kale",
  "collard greens": "kale",
  "salad mix": "lettuce",
  "mesclun": "lettuce",
  "salad greens": "lettuce",
  "head lettuce": "lettuce",
  "romaine": "lettuce",
  "spring mix": "lettuce",
  "pac choi": "bok choy",
  "pak choi": "bok choy",
  "baby bok choy": "bok choy",
  "green onions": "scallions",
  "spring onions": "scallions",
  "red onion": "onions",
  "red onions": "onions",
  "yellow onion": "onions",
  "yellow onions": "onions",
  "sweet onions": "onions",
  "cippolini": "onions",
  "shallots": "onions",
  "new potatoes": "potatoes",
  "fingerling potatoes": "potatoes",
  "red potatoes": "potatoes",
  "yukon gold": "potatoes",
  "sweet potato": "sweet potatoes",
  "green pepper": "peppers",
  "bell pepper": "peppers",
  "bell peppers": "peppers",
  "sweet peppers": "peppers",
  "hot peppers": "peppers",
  "jalapeno": "peppers",
  "jalapenos": "peppers",
  "poblano": "peppers",
  "cherry tomatoes": "tomatoes",
  "grape tomatoes": "tomatoes",
  "heirloom tomatoes": "tomatoes",
  "slicing tomatoes": "tomatoes",
  "roma tomatoes": "tomatoes",
  "summer squash": "summer squash",
  "yellow squash": "summer squash",
  "patty pan": "summer squash",
  "pattypan": "summer squash",
  "butternut squash": "winter squash",
  "butternut": "winter squash",
  "acorn squash": "winter squash",
  "kabocha": "winter squash",
  "spaghetti squash": "winter squash",
  "pumpkin": "winter squash",
  "delicata squash": "delicata",
  "string beans": "green beans",
  "wax beans": "green beans",
  "haricots verts": "green beans",
  "snap peas": "peas",
  "sugar snap peas": "peas",
  "snow peas": "peas",
  "shell peas": "peas",
  "english peas": "peas",
  "salad turnips": "turnips",
  "hakurei turnips": "turnips",
  "baby turnips": "turnips",
  "daikon": "radishes",
  "radish": "radishes",
  "watermelon radish": "radishes",
  "easter egg radishes": "radishes",
  "beet": "beets",
  "golden beets": "beets",
  "chioggia beets": "beets",
  "carrot": "carrots",
  "rainbow carrots": "carrots",
  "baby carrots": "carrots",
  "cuke": "cucumber",
  "cukes": "cucumber",
  "cucumbers": "cucumber",
  "pickling cucumbers": "cucumber",
  "slicing cucumbers": "cucumber",
  "eggplants": "eggplant",
  "italian eggplant": "eggplant",
  "japanese eggplant": "eggplant",
  "leek": "leeks",
  "garlic scape": "garlic scapes",
  "scapes": "garlic scapes",
  "green garlic": "garlic",
  "cantaloupe": "melon",
  "muskmelon": "melon",
  "watermelon": "melon",
  "honeydew": "melon",
  "sweet corn": "corn",
  "corn on the cob": "corn",
  "brussels": "brussels sprouts",
  "brussel sprouts": "brussels sprouts",
  "broccolini": "broccoli",
  "broccoli raab": "broccoli",
  "rapini": "broccoli",
  "romanesco": "cauliflower",
  "celeriac": "celery",
  "celery root": "celery",
  "parsnip": "parsnips",
  "shiitake": "mushrooms",
  "shiitakes": "mushrooms",
  "oyster mushrooms": "mushrooms",
  "cremini": "mushrooms",
  "fresh basil": "basil",
  "thai basil": "basil",
  "fresh dill": "dill",
  "fresh mint": "mint",
  "fresh parsley": "parsley",
  "flat-leaf parsley": "parsley",
  "fresh cilantro": "cilantro",
  "baby spinach": "spinach",
};

const CANON = new Set(Object.keys(PAIRINGS));

// Longest-match lookup: "1 bunch lacinato kale" -> "kale". Returns the
// canonical name, or null if nothing in the line looks like a known
// ingredient.
export function matchIngredient(line) {
  const text = line
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  const candidates = [];
  for (const alias of Object.keys(ALIASES)) {
    if (text.includes(alias)) candidates.push([alias, ALIASES[alias]]);
  }
  for (const name of CANON) {
    if (text.includes(name)) candidates.push([name, name]);
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b[0].length - a[0].length);
  return candidates[0][1];
}

// Words that mean a line is probably email noise, not a box item.
const NOISE = /unsubscribe|farm|pickup|pick-up|newsletter|http|www\.|@|dear |hello|hi |thanks|thank you|see you|recipe of|this week's|forecast|weather|volunteer|market/i;

// Quantity/container words — a line made only of these isn't an ingredient
// ("4 ears", "1 bunch", "2 lbs").
const UNIT_WORDS = new Set([
  "bunch", "bunches", "head", "heads", "ear", "ears", "lb", "lbs", "pound",
  "pounds", "oz", "pint", "pints", "quart", "quarts", "bag", "bags", "each",
  "dozen", "half", "large", "small", "medium", "of", "a", "the",
]);

// Parse a pasted CSA email into { matched: [canonical...], unmatched: [line...] }
export function parseBox(text) {
  const matched = [];
  const unmatched = [];
  const seen = new Set();
  for (const rawLine of text.split(/\n+/)) {
    // Emails often pack items into one line: "kale, carrots, and beets"
    for (const part of rawLine.split(/,|;|·|•|\band\b/)) {
      const line = part.trim();
      if (!line || line.length > 60 || NOISE.test(line)) continue;
      const hit = matchIngredient(line);
      if (hit) {
        if (!seen.has(hit)) {
          seen.add(hit);
          matched.push(hit);
        }
      } else if (/^[\d\s]*[a-z][a-z\s-]{2,30}$/i.test(line) && line.split(" ").length <= 4) {
        // short food-looking line we don't know — keep it, user can decide
        const words = line
          .toLowerCase()
          .replace(/[^a-z\s-]/g, " ")
          .split(/\s+/)
          .filter((w) => w && !UNIT_WORDS.has(w));
        const cleaned = words.join(" ");
        if (cleaned && !seen.has(cleaned)) {
          seen.add(cleaned);
          unmatched.push(cleaned);
        }
      }
    }
  }
  return { matched, unmatched };
}

export const pairingsFor = (name) => PAIRINGS[name] ?? null;
