"""Build src/recipes.json from the root CSV snapshot + previously scraped metadata.

Usage: python3 build_data.py
Reads:  ../Dank Recipes - All Recipes.csv, recipes_with_metadata.json (old scrape cache)
Writes: src/recipes.json
"""
import csv
import json
import re
from urllib.parse import urlparse

CSV_FILE = "../Dank Recipes - All Recipes.csv"
OLD_META = "recipes_with_metadata.json"
OUT = "src/recipes.json"

# Rows in the sheet that are notes-to-self, not recipes
NON_RECIPE_TITLES = re.compile(r"^(prompt:|\d+ servings)", re.I)

PROTEIN_RULES = [
    ("fish", r"salmon|shrimp|tuna|swordfish|anchov|\bfish\b|scampi|prawn"),
    ("chicken", r"chicken|turkey"),
    ("red meat", r"\bbeef\b|\bpork\b|sausage|kebab|steak|lamb|meatball|\bham\b"),
    ("sweets", r"\bcakes?\b|cookies?\b|muffin|brownie|rugelach|\btortes?\b"),
]
# Everything else defaults to veg — accurate for this collection, where the
# base is vegetarian and meat is the exception.
DEFAULT_PROTEIN = "veg"

# Hand overrides where the title/slug misleads the keyword rules,
# keyed by a substring of the title (case-insensitive)
OVERRIDES = {
    "walnut picadillo": "veg",  # vegetarian picadillo
    "not chicken": "veg",  # "I Can't Believe It's Not Chicken" grated tofu
    "weeknight bolognese": "red meat",  # NYT version uses ground beef
}


def slug_title(url):
    """Derive a readable title from a recipe URL slug."""
    path = urlparse(url).path.rstrip("/")
    slug = path.split("/")[-1]
    slug = re.sub(r"^\d+-", "", slug)  # NYT numeric id prefix
    slug = re.sub(r"\.\w+$", "", slug)
    words = slug.replace("-", " ").replace("_", " ").strip()
    return words.title() if words else url


def classify(title, url):
    text = title.lower()
    for key, protein in OVERRIDES.items():
        if key in text:
            return protein
    for protein, pattern in PROTEIN_RULES:
        if re.search(pattern, text):
            return protein
    return DEFAULT_PROTEIN


def main():
    old_meta = {}
    try:
        for entry in json.load(open(OLD_META)):
            if entry.get("image"):
                old_meta[entry["url"]] = entry
    except FileNotFoundError:
        pass

    def scraped_title(url):
        """Cleaned page title from the scrape cache, e.g. 'Porcini Ragù Recipe - NYT Cooking' -> 'Porcini Ragù'."""
        t = old_meta.get(url, {}).get("title")
        if not t or t == "Error loading page":
            return None
        t = re.split(r"\s+[-–|]\s+", t)[0]
        t = re.sub(r"\s+Recipe(\s*[•·].*)?$", "", t, flags=re.I)
        return t.strip() or None

    recipes = []
    seen_urls = {}
    with open(CSV_FILE) as f:
        for row in csv.DictReader(f):
            title = (row["Title"] or "").strip()
            link = (row["Link"] or "").strip()
            if not title and not link:
                continue
            if NON_RECIPE_TITLES.match(title):
                continue
            url = link if link.startswith("http") else None
            if not title:
                title = scraped_title(url) or slug_title(url)

            record = {
                "title": title,
                "url": url,
                "linkText": None if url else (link or None),
                "source": urlparse(url).hostname.replace("www.", "") if url else None,
                "maddyRating": int(row["Maddy Rating"]) if row["Maddy Rating"].strip().isdigit() else None,
                "hunterRating": int(row["Hunter Rating"]) if row["Hunter Rating"].strip().isdigit() else None,
                "dateCooked": row["Date Cooked"].strip() or None,
                "notes": row["Notes"].strip() or None,
                "protein": classify(title, url or ""),
                "image": old_meta.get(url, {}).get("image") if url else None,
            }

            if url and url in seen_urls:
                # Keep the first occurrence; merge any rating/notes the dupe has
                first = seen_urls[url]
                for k in ("maddyRating", "hunterRating", "dateCooked", "notes"):
                    first[k] = first[k] or record[k]
                continue
            if url:
                seen_urls[url] = record
            recipes.append(record)

    for i, r in enumerate(recipes):
        r["id"] = i

    with open(OUT, "w") as f:
        json.dump(recipes, f, indent=2)

    counts = {}
    for r in recipes:
        counts[r["protein"]] = counts.get(r["protein"], 0) + 1
    print(f"{len(recipes)} recipes -> {OUT}")
    print("protein counts:", counts)
    print("missing image:", sum(1 for r in recipes if not r["image"]))
    print("no url:", sum(1 for r in recipes if not r["url"]))


if __name__ == "__main__":
    main()
