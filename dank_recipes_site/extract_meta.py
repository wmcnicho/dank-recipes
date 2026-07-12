from playwright.sync_api import sync_playwright
import json

# Load URLs from JSON
with open("recipes.json", "r") as file:
    urls = json.load(file)

metadata = []

# Define the output file
output_file = "recipes_with_metadata.json"

def fetch_metadata(url):
    print(f"Scraping URL: {url}")  # Print the URL being scraped
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            try:
                page.goto(url, timeout=5000)  # Set a timeout for loading the page
                title = page.title()  # Fetch page title
                image = page.locator('meta[property="og:image"]').get_attribute("content")  # Fetch og:image
                metadata.append({"url": url, "title": title, "image": image})
            except Exception as e:
                print(f"Error fetching metadata for URL: {url}. Error: {e}")
                metadata.append({"url": url, "title": "Error loading page", "image": None})
            finally:
                browser.close()
    except Exception as e:
        print(f"Error initializing Playwright for URL: {url}. Error: {e}")
        metadata.append({"url": url, "title": "Error initializing scraper", "image": None})

    # Save the updated metadata to the file after each URL is processed
    with open(output_file, "w") as file:
        json.dump(metadata, file, indent=4)

    print(f"Saved metadata for URL: {url}")

# Loop through URLs and fetch metadata
for recipe in urls:
    fetch_metadata(recipe["url"])

print(f"Scraping complete. All metadata saved to {output_file}.")
