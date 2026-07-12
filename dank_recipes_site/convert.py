import csv
import json

# Read CSV and convert to JSON
csv_file = "Dank_Recipes_All.csv"
json_file = "recipes.json"

data = []
with open(csv_file, mode="r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        data.append({"url": row["Link"]})  # Replace "URL" with your CSV column header

with open(json_file, mode="w") as file:
    json.dump(data, file, indent=4)
