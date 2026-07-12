from playwright.sync_api import sync_playwright
import json

# Define the metadata file
metadata_file = "recipes_with_metadata.json"

# Load existing metadata
with open(metadata_file, "r") as file:
    metadata = json.load(file)

# Filter out failed entries
failed_entries = [entry for entry in metadata if entry["title"] == "Error loading page"]

print(f"Found {len(failed_entries)} failed entries to retry.")

success_count = 0
failure_count = 0

def fetch_metadata(url):
    global success_count, failure_count  # Track counts globally
    print(f"Retrying URL: {url}")  # Print the URL being retried
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            try:
                page.goto(url, timeout=15000)  # Set a timeout for loading the page
                title = page.title()  # Fetch page title
                image = page.locator('meta[property="og:image"]').get_attribute("content")  # Fetch og:image

                # Update the metadata entry
                for entry in metadata:
                    if entry["url"] == url:
                        entry["title"] = title
                        entry["image"] = image
                        success_count += 1
                        break
            except Exception as e:
                print(f"Error fetching metadata for URL: {url}. Error: {e}")
                failure_count += 1
            finally:
                browser.close()
    except Exception as e:
        print(f"Error initializing Playwright for URL: {url}. Error: {e}")
        failure_count += 1

    # Save the updated metadata to the file after each retry
    with open(metadata_file, "w") as file:
        json.dump(metadata, file, indent=4)

    print(f"Updated metadata saved for URL: {url}")

# Retry scraping for failed entries
for entry in failed_entries:
    fetch_metadata(entry["url"])

# Final count of successes and failures
print(f"Retry complete. Successes: {success_count}, Failures: {failure_count}.")
print(f"Updated metadata saved to {metadata_file}.")
