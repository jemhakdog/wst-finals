import asyncio
import aiohttp
from bs4 import BeautifulSoup
import json
import re

class PanlasangPinoySearch:
    def __init__(self):
        self.base_url = "https://panlasangpinoy.com"
        self.recipe_urls = [
            "https://panlasangpinoy.com/filipino-chicken-adobo-recipe/",
            "https://panlasangpinoy.com/pork-sinigang-na-baboy-recipe/",
            "https://panlasangpinoy.com/pancit-bihon-noodles/",
            "https://panlasangpinoy.com/filipino-chicken-tinola-recipe/",
            "https://panlasangpinoy.com/beef-kaldereta/"
        ]

    async def get_recipe_data(self, url):
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                html_content = await response.text()
                
        soup = BeautifulSoup(html_content, 'html.parser')
        json_ld_script = soup.find('script', {'type': 'application/ld+json', 'class': 'yoast-schema-graph'})
        
        if not json_ld_script:
            return None
            
        try:
            json_ld = json.loads(json_ld_script.string)
            recipe_data = next((item for item in json_ld.get('@graph', []) if item.get('@type') == 'Recipe'), None)
            if not recipe_data:
                return None
                
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
                'category': recipe_data.get('recipeCategory', [''])[0]
            }
        except (json.JSONDecodeError, KeyError):
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

    def display_recipe(self, recipe):
        print(f"\n{recipe['title']}")
        if recipe['author']:
            print(f"Author: {recipe['author']}")
            
        if recipe['prep_time']:
            print(f"Prep Time\n{recipe['prep_time']} minutes mins")
        if recipe['cook_time']:
            print(f"Cook Time\n{recipe['cook_time']} minutes mins")
        if recipe['total_time']:
            print(f"Total Time\n{recipe['total_time']} minutes mins")
            
        if recipe['servings']:
            print(f"Servings: {recipe['servings']}")
            
        if recipe['rating']:
            print(f"Rating: {recipe['rating']}/5 ({recipe['rating_count']} ratings)")
            
        print("\nIngredients")
        for ingredient in recipe['ingredients']:
            print(f"- {ingredient}")
            
        print("\nInstructions")
        for i, step in enumerate(recipe['instructions'], 1):
            print(f"{i}. {step}")
            
        if recipe['cuisine']:
            print(f"\nCuisine: {recipe['cuisine']}")
        if recipe['category']:
            print(f"Category: {recipe['category']}")
            
        print("-" * 50)

    async def search_recipes(self):
        recipes = []
        for url in self.recipe_urls:
            try:
                recipe = await self.get_recipe_data(url)
                if recipe:
                    recipes.append(recipe)
            except Exception as e:
                print(f"Error fetching recipe from {url}: {e}")
        return recipes

    def display_results(self, recipes):
        if not recipes:
            print("\nNo recipes found.")
            return

        print(f"\nFound {len(recipes)} recipe(s):")
        for recipe in recipes:
            self.display_recipe(recipe)

async def main():
    searcher = PanlasangPinoySearch()
    try:
        data = await searcher.get_recipe_data("https://panlasangpinoy.com/fish-lumpia-recipe/")
        if data:
            searcher.display_recipe(data)
        else:
            print("No recipe data found")
    except Exception as e:
        print(f"Error fetching recipe: {e}")

if __name__ == "__main__":
    try:
        asyncio.get_event_loop().run_until_complete(main())
    except KeyboardInterrupt:
        print("\nSearch cancelled by user")
    except Exception as e:
        print(f"\nAn error occurred: {e}")
