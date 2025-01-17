
import subprocess
import sys

def setup_packages():
    """
    Install required packages from requirements.txt if they're not already installed.
    Returns True if all packages are installed successfully, False otherwise.
    """
    try:
        print("Checking and installing required packages...")
        # Use pip to install requirements
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("All required packages installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing packages: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error during package installation: {e}")
        return False

# Ensure packages are installed before starting the app
if not setup_packages():
    print("Failed to install required packages. Please install them manually.")
    sys.exit(1)


from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_caching import Cache
import asyncio
import websockets
import json
import time
from urllib.parse import urlencode
import aiohttp
from bs4 import BeautifulSoup
import re
from datetime import datetime


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Flask-Caching
cache = Cache(app, config={
    'CACHE_TYPE': 'simple',  # Use simple in-memory cache
    'CACHE_DEFAULT_TIMEOUT': 3600  # Cache timeout in seconds (1 hour)
})

class PanlasangPinoySearch:
    def __init__(self):
        self.base_url = "wss://c15b-wss.app.slickstream.com/socket"
        self.site_code = "ZT457GLE"
        self.epoch = 1723475851945
        self.reader_id = f"{int(time.time() * 1000)}.{str(time.time()).split('.')[-1]}"
        
    async def get_recipe_urls(self, query):
        params = {'site': self.site_code}
        ws_url = f"{self.base_url}?{urlencode(params)}"
        
        async with websockets.connect(
            ws_url,
            subprotocols=["SLICK_CLIENT_1"]
        ) as websocket:
            # First send session start message
            current_time = int(time.time() * 1000)
            session_msg = {
                "at": current_time,
                "messageId": 1,
                "direction": "request",
                "payload": {
                    "site": self.site_code,
                    "reader": self.reader_id,
                    "start": current_time - 1000,
                    "url": "https://panlasangpinoy.com/",
                    "canonical": "https://panlasangpinoy.com/",
                    "publishedTime": None,
                    "updatedTime": "2023-05-01T17:36:50+00:00",
                    "referer": "",
                    "display": {"w": 785, "h": 651},
                    "clientVersion": "2.13.103",
                    "embedCodeVersion": "2.0.1",
                    "userAuthenticated": False,
                    "adBlockerDetected": False,
                    "error404Detected": False,
                    "robotsContent": "index, follow",
                    "clientMetrics": {
                        "appStart": 3442.5999999940395,
                        "bootStart": 3392.7000000178814,
                        "embedStart": 1427.0999999940395,
                        "origin": 3443,
                        "bootDataFetch": 1413.9000000059605,
                        "sessionStart": 3732.5999999940395
                    },
                    "clientType": "embed",
                    "device": "desktop"
                },
                "msgType": "start-session"
            }
            
            await websocket.send(json.dumps(session_msg))
            session_response = await websocket.recv()
            session_data = json.loads(session_response)
            
            if 'direction' in session_data and session_data['direction'] == 'error':
                raise Exception(f"Session error: {session_data['payload'].get('description', 'Unknown error')}")
            
            # Now send search request
            search_request = {
                "at": int(time.time() * 1000),
                "messageId": 2,
                "direction": "request",
                "payload": {
                    "searchString": query,
                    "speed": "full",
                    "drillContext": "eyJ2IjoiNC4wIiwidGl0bGUiOiJQb3B1bGFyIiwiZ3JvdXBUeXBlIjoicG9wdWxhciIsImFycmFuZ2VtZW50IjoiY29udGV4dC13aXRoLXNlYXJjaCJ9",
                    "width": 785,
                    "height": 651,
                    "arrangement": "context-with-search",
                    "action": "start",
                    "widgetType": "discovery"
                },
                "msgType": "search4-search"
            }

            await websocket.send(json.dumps(search_request))
            response = await websocket.recv()
            results = json.loads(response)
            
            if 'direction' in results and results['direction'] == 'error':
                raise Exception(f"Search error: {results['payload'].get('description', 'Unknown error')}")
            
            urls = []
            if 'payload' in results:
                for group in results['payload'].get('groups', []):
                    item_descriptors = results['payload'].get('itemDescriptors', {})
                    for page_id in group.get('pageIds', []):
                        if page_id > 0 and str(page_id) in item_descriptors:
                            recipe_data = item_descriptors[str(page_id)]
                            if 'url' in recipe_data:
                                urls.append(recipe_data['url'])
            
            return urls

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
                'prepTime': self._parse_duration(recipe_data.get('prepTime', '')),
                'cookTime': self._parse_duration(recipe_data.get('cookTime', '')),
                'totalTime': self._parse_duration(recipe_data.get('totalTime', '')),
                'servings': recipe_data.get('recipeYield', [''])[0],
                'ingredients': recipe_data.get('recipeIngredient', []),
                'instructions': [step['text'] for step in recipe_data.get('recipeInstructions', [])],
                'rating': recipe_data.get('aggregateRating', {}).get('ratingValue'),
                'ratingCount': recipe_data.get('aggregateRating', {}).get('ratingCount'),
                'cuisine': recipe_data.get('recipeCuisine', [''])[0],
                'category': recipe_data.get('recipeCategory', [''])[0],
                'image': recipe_data.get('image', [''])[0],
                'description': recipe_data.get('description', ''),
                'url': url
            }
        except (json.JSONDecodeError, KeyError) as e:
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

    async def search_recipes(self, query):
        try:
            urls = await self.get_recipe_urls(query)
            recipes = []
            
            for url in urls[:5]:  # Limit to first 5 recipes
                try:
                    recipe = await self.get_recipe_data(url)
                    if recipe:
                        recipes.append(recipe)
                except Exception as e:
                    print(f"Error fetching recipe from {url}: {e}")
                    
            return recipes
        except Exception as e:
            print(f"Error searching recipes: {e}")
            return []

# Create global searcher instance
searcher = PanlasangPinoySearch()

@app.route('/')
def home():
    return 'Recipe Search API is running!'

@app.route('/api/search', methods=['GET'])
async def search():
    query = request.args.get('q', '')
    print(f"\n[API] Received search request for query: {query}")
    
    if not query:
        print("[API] Error: No query parameter provided")
        return jsonify({'error': 'Query parameter "q" is required'}), 400
    
    # Try to get cached results
    cache_key = f'search_{query}'
    cached_result = cache.get(cache_key)
    if cached_result:
        print(f"[API] Returning cached results for query: {query}")
        return jsonify(cached_result)
        
    try:
        print(f"[API] Starting recipe search for: {query}")
        recipes = await searcher.search_recipes(query)
        print(f"[API] Found {len(recipes)} recipes")
        
        # Cache the results
        cache.set(cache_key, recipes)
        return jsonify(recipes)
    except Exception as e:
        print(f"[API] Error in search: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipe', methods=['GET'])
async def get_recipe():
    url = request.args.get('url', '')
    print(f"\n[API] Received recipe request for URL: {url}")
    
    if not url:
        print("[API] Error: No URL parameter provided")
        return jsonify({'error': 'URL parameter is required'}), 400
    
    # Try to get cached recipe
    cache_key = f'recipe_{url}'
    cached_recipe = cache.get(cache_key)
    if cached_recipe:
        print(f"[API] Returning cached recipe for URL: {url}")
        return jsonify(cached_recipe)
        
    try:
        print(f"[API] Fetching recipe data from: {url}")
        recipe = await searcher.get_recipe_data(url)
        if recipe:
            print(f"[API] Successfully retrieved recipe: {recipe.get('title', 'Unknown')}")
            # Cache the recipe
            cache.set(cache_key, recipe)
            return jsonify(recipe)
        print("[API] Recipe not found")
        return jsonify({'error': 'Recipe not found'}), 404
    except Exception as e:
        print(f"[API] Error fetching recipe: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    try:
        cache.clear()
        print("[API] Cache cleared successfully")
        return jsonify({'message': 'Cache cleared successfully'})
    except Exception as e:
        print(f"[API] Error clearing cache: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.after_request
def after_request(response):
    print(f"\n[API] Response status: {response.status}")
    print(f"[API] Response headers: {dict(response.headers)}")
    
    # Log cache statistics if available
    if hasattr(cache, 'get_stats'):
        stats = cache.get_stats()
        print(f"[API] Cache stats: {stats}")
    
    return response

if __name__ == '__main__':
    print("[API] Starting Flask server with caching enabled")
    print(f"[API] Cache type: {cache.config['CACHE_TYPE']}")
    print(f"[API] Cache timeout: {cache.config['CACHE_DEFAULT_TIMEOUT']} seconds")
    app.run(debug=True, host="0.0.0.0", port=5000)
