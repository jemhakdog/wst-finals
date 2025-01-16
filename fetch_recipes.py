import requests
from bs4 import BeautifulSoup
import json
import os
import re

class RecipeFetcher:
    def __init__(self):
        self.base_url = "https://panlasangpinoy.com"
        
    def get_recipe_data(self, url):
        print(f"Fetching recipe from: {url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"Error fetching {url}: {response.status_code}")
            return None
            
        soup = BeautifulSoup(response.text, 'html.parser')
        json_ld_script = soup.find('script', {'type': 'application/ld+json', 'class': 'yoast-schema-graph'})
        
        if not json_ld_script:
            print("No recipe data found")
            return None
            
        try:
            json_ld = json.loads(json_ld_script.string)
            recipe_data = next((item for item in json_ld.get('@graph', []) if item.get('@type') == 'Recipe'), None)
            if not recipe_data:
                print("No recipe found in JSON-LD data")
                return None

            print(f"Found recipe: {recipe_data.get('name')}")
            return {
                'title': recipe_data.get('name', ''),
                'author': recipe_data.get('author', {}).get('name', ''),
                'prep_time': self._parse_duration(recipe_data.get('prepTime', '')),
                'cook_time': self._parse_duration(recipe_data.get('cookTime', '')),
                'total_time': self._parse_duration(recipe_data.get('totalTime', '')),
                'servings': recipe_data.get('recipeYield', [''])[0],
                'ingredients': recipe_data.get('recipeIngredient', []),
                'instructions': [step['text'] for step in recipe_data.get('recipeInstructions', [])],
                'rating': recipe_data.get('aggregateRating', {}).get('ratingValue'),
                'rating_count': recipe_data.get('aggregateRating', {}).get('ratingCount'),
                'cuisine': recipe_data.get('recipeCuisine', [''])[0],
                'category': recipe_data.get('recipeCategory', [''])[0],
                'description': recipe_data.get('description', ''),
                'image': recipe_data.get('image', [])[0] if recipe_data.get('image') else None,
                'nutrition': recipe_data.get('nutrition', {})
            }
        except Exception as e:
            print(f"Error parsing recipe data: {e}")
            return None
            
    def _parse_duration(self, duration):
        if not duration:
            return None
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', duration)
        if match:
            hours, minutes = match.groups()
            total_minutes = (int(hours or 0) * 60) + int(minutes or 0)
            return total_minutes
        return None

def create_php_recipe(recipe_data):
    """Convert recipe data to PHP format"""
    title = recipe_data['title']
    filename = title.lower().replace(' ', '-').replace('/', '-')
    
    def format_time(minutes):
        if not minutes:
            return "N/A"
        hours = minutes // 60
        mins = minutes % 60
        if hours > 0:
            return f"{hours}h {mins}m" if mins > 0 else f"{hours}h"
        return f"{mins}m"
    
    php_content = "<?php\n"
    php_content += "$recipe = [\n"
    php_content += f"    'id' => '{filename}',\n"
    php_content += f"    'title' => '{title}',\n"
    php_content += f"    'author' => '{recipe_data['author']}',\n"
    php_content += f"    'description' => '{recipe_data['description'].replace(chr(39), chr(92) + chr(39))}',\n"
    php_content += f"    'prep_time' => '{format_time(recipe_data['prep_time'])}',\n"
    php_content += f"    'cook_time' => '{format_time(recipe_data['cook_time'])}',\n"
    php_content += f"    'total_time' => '{format_time(recipe_data['total_time'])}',\n"
    php_content += f"    'servings' => '{recipe_data['servings']}',\n"
    php_content += "    'difficulty' => 'Medium',\n"
    php_content += f"    'cuisine' => '{recipe_data['cuisine']}',\n"
    php_content += f"    'category' => '{recipe_data['category']}',\n"
    php_content += f"    'rating' => {recipe_data['rating'] if recipe_data['rating'] else 'null'},\n"
    php_content += f"    'rating_count' => {recipe_data['rating_count'] if recipe_data['rating_count'] else 0},\n"
    php_content += f"    'image_url' => '{recipe_data['image']}',\n"
    php_content += "    'ingredients' => [\n"
    
    for ingredient in recipe_data['ingredients']:
        escaped_ingredient = ingredient.replace("'", "\\'")
        php_content += f"        '{escaped_ingredient}',\n"
    
    php_content += "    ],\n"
    php_content += "    'instructions' => [\n"
    
    for instruction in recipe_data['instructions']:
        escaped_instruction = instruction.replace(chr(39), chr(92) + chr(39))
        php_content += f"        '{escaped_instruction}',\n"
    
    php_content += "    ],\n"
    php_content += "    'nutrition' => [\n"
    
    nutrition = recipe_data.get('nutrition', {})
    for key, value in nutrition.items():
        if key != '@type':
            escaped_value = str(value).replace(chr(39), chr(92) + chr(39))
            php_content += f"        '{key}' => '{escaped_value}',\n"
    
    php_content += "    ]\n"
    php_content += "];\n\n"
    php_content += "include dirname(__FILE__) . '/../recipe-template.php';\n"
    php_content += "?>"
    
    return filename, php_content

def main():
    recipes_dir = "recipes"
    if not os.path.exists(recipes_dir):
        os.makedirs(recipes_dir)
    
    # Direct URLs to popular Filipino recipes
    recipe_urls = [
        "https://panlasangpinoy.com/filipino-chicken-adobo-recipe/",
        "https://panlasangpinoy.com/pork-sinigang-na-baboy-recipe/",
        "https://panlasangpinoy.com/pancit-bihon-noodles/",
        "https://panlasangpinoy.com/filipino-chicken-tinola-recipe/",
        "https://panlasangpinoy.com/beef-kaldereta/"
    ]
    
    fetcher = RecipeFetcher()
    
    for url in recipe_urls:
        try:
            print(f"\nProcessing recipe from {url}")
            recipe_data = fetcher.get_recipe_data(url)
            
            if recipe_data:
                filename, php_content = create_php_recipe(recipe_data)
                recipe_path = os.path.join(recipes_dir, f"{filename}.php")
                
                with open(recipe_path, 'w', encoding='utf-8') as f:
                    f.write(php_content)
                print(f"Saved recipe: {filename}.php")
            else:
                print(f"Failed to get recipe data from {url}")
                
        except Exception as e:
            print(f"Error processing {url}: {e}")

if __name__ == "__main__":
    main()