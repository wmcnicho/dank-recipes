"""Fetch og:image (and page title) for recipes missing images.

Updates recipes_with_metadata.json (the scrape cache build_data.py merges from),
then re-run build_data.py to fold results into src/recipes.json.
"""
import json
import re
import urllib.request

CACHE = "recipes_with_metadata.json"
RECIPES = "src/recipes.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read(500_000).decode("utf-8", errors="replace")
    def meta(prop):
        m = re.search(
            rf'<meta[^>]+(?:property|name)=["\']{prop}["\'][^>]+content=["\']([^"\']+)', html
        ) or re.search(
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{prop}["\']', html
        )
        return m.group(1) if m else None
    title = meta("og:title")
    if not title:
        m = re.search(r"<title[^>]*>([^<]+)</title>", html)
        title = m.group(1).strip() if m else None
    return title, meta("og:image")


def main():
    cache = json.load(open(CACHE))
    cached_urls = {e["url"] for e in cache if e.get("image")}
    targets = [
        r for r in json.load(open(RECIPES))
        if r["url"] and not r["image"] and r["url"] not in cached_urls
    ]
    print(f"{len(targets)} recipes to fetch")

    ok = failed = 0
    for r in targets:
        try:
            title, image = fetch(r["url"])
            if image:
                cache.append({"url": r["url"], "title": title, "image": image})
                ok += 1
                print(f"  ok   {r['title'][:50]}")
            else:
                failed += 1
                print(f"  noimg {r['title'][:50]}")
        except Exception as e:
            failed += 1
            print(f"  FAIL {r['title'][:50]} ({e})")
        with open(CACHE, "w") as f:
            json.dump(cache, f, indent=2)

    print(f"done: {ok} fetched, {failed} failed")


if __name__ == "__main__":
    main()
