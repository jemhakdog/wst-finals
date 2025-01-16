class PanlasangPinoySearch {
    constructor() {
        this.baseUrl = "https://panlasangpinoy.com";
        this.proxyServices = [
            {
                name: 'allorigins',
                url: 'https://api.allorigins.win/get?url=',
                processResponse: async (response) => {
                    const data = await response.json();
                    return data.contents;
                }
            },
            {
                name: 'corsanywhere',
                url: 'https://cors-anywhere.herokuapp.com/',
                processResponse: async (response) => {
                    return await response.text();
                }
            },
            {
                name: 'scraperapi',
                url: 'https://api.scraperapi.com/scrape?url=',
                processResponse: async (response) => {
                    const text = await response.text();
                    try {
                        // ScraperAPI sometimes returns JSON
                        const json = JSON.parse(text);
                        return json.content || json.html || text;
                    } catch {
                        // If not JSON, return the raw text
                        return text;
                    }
                }
            }
        ];
        this.currentProxyIndex = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // Start with 1 second delay
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchWithRetry(url, attempt = 1) {
        try {
            const proxy = this.proxyServices[this.currentProxyIndex];
            const proxyUrl = proxy.name === 'corsanywhere' 
                ? `${proxy.url}${url}`
                : `${proxy.url}${encodeURIComponent(url)}`;
            
            console.log(`Attempt ${attempt} using ${proxy.name}`);
            
            try {
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await proxy.processResponse(response);
                if (!result) {
                    throw new Error('Empty response from proxy');
                }
                
                return result;
            } catch (error) {
                console.error(`Proxy ${proxy.name} failed:`, error);
                throw new Error(`Proxy ${proxy.name} failed: ${error.message}`);
            }
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            
            // If we haven't reached max retries, try again
            if (attempt < this.maxRetries) {
                // Switch to next proxy service
                this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyServices.length;
                const nextProxy = this.proxyServices[this.currentProxyIndex];
                console.log(`Switching to proxy: ${nextProxy.name}`);
                
                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                console.log(`Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
                
                return this.fetchWithRetry(url, attempt + 1);
            }
            
            // If all retries failed, throw a more descriptive error
            throw new Error(`All proxy attempts failed after ${this.maxRetries} retries. Last error: ${error.message}`);
        }
    }

    async getRecipeData(url) {
        try {
            console.log('Fetching recipe data for:', url);
            
            console.log('Fetching recipe page...');
            const html = await this.fetchWithRetry(url);
            console.log('Parsing recipe HTML...');
            
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Find recipe schema data
            console.log('Looking for recipe schema...');
            const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
            if (!schemaScripts.length) {
                console.error('No schema scripts found in the page');
                throw new Error('Recipe data not found');
            }
            
            let recipeData = null;
            
            // Try parsing each JSON-LD block to find recipe data
            for (const script of schemaScripts) {
                try {
                    const jsonLd = JSON.parse(script.textContent);
                    console.log('Parsing JSON-LD block:', jsonLd);
                    
                    // Handle different schema structures
                    if (jsonLd['@graph']) {
                        // Yoast SEO style
                        recipeData = jsonLd['@graph'].find(item => item['@type'] === 'Recipe');
                    } else if (Array.isArray(jsonLd)) {
                        // Array of schema objects
                        recipeData = jsonLd.find(item => item['@type'] === 'Recipe');
                    } else if (jsonLd['@type'] === 'Recipe') {
                        // Direct recipe object
                        recipeData = jsonLd;
                    }
                    
                    if (recipeData) break;
                } catch (e) {
                    console.warn('Error parsing JSON-LD block:', e);
                    continue;
                }
            }
            console.log('Extracted recipe data:', recipeData);
            
            if (!recipeData) {
                throw new Error('Recipe data not found');
            }
            
            // Parse durations
            const parseDuration = (duration) => {
                if (!duration) return null;
                const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
                if (match) {
                    const [_, hours, minutes] = match;
                    return (parseInt(hours || 0) * 60) + parseInt(minutes || 0);
                }
                return null;
            };
            
            // Format recipe data
            return {
                title: recipeData.name || '',
                author: recipeData.author?.name || '',
                prepTime: parseDuration(recipeData.prepTime),
                cookTime: parseDuration(recipeData.cookTime),
                totalTime: parseDuration(recipeData.totalTime),
                servings: recipeData.recipeYield?.[0] || '',
                ingredients: recipeData.recipeIngredient || [],
                instructions: recipeData.recipeInstructions?.map(step => step.text) || [],
                rating: recipeData.aggregateRating?.ratingValue,
                ratingCount: recipeData.aggregateRating?.ratingCount,
                cuisine: recipeData.recipeCuisine?.[0] || 'Filipino',
                category: recipeData.recipeCategory?.[0] || '',
                image: recipeData.image?.[0] || '',
                description: recipeData.description || '',
                url: url
            };
        } catch (error) {
            console.error('Error fetching recipe:', error);
            throw error;
        }
    }

    async searchRecipes(query) {
        // If query is a URL, fetch recipe directly
        if (query.startsWith('http')) {
            try {
                const recipe = await this.getRecipeData(query);
                return [recipe];
            } catch (error) {
                console.error('Error fetching recipe:', error);
                return [];
            }
        }

        // Otherwise, search for recipes
        try {
            console.log('Searching for:', query);
            const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
            console.log('Search URL:', searchUrl);
            
            console.log('Fetching search results...');
            const html = await this.fetchWithRetry(searchUrl);
            console.log('Search response received');
            console.log('Parsing HTML content...');
            
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Find recipe links
            console.log('Looking for recipe links...');
            const mainContent = doc.querySelector('main') || doc.querySelector('#content') || doc.querySelector('.content') || doc.body;
            const allLinks = Array.from(mainContent.querySelectorAll('a[href*="panlasangpinoy.com"]'));
            console.log('Found total links:', allLinks.length);
            
            const recipeLinks = allLinks
                .map(a => a.href)
                .filter(href => {
                    // Exclude category and tag pages
                    if (href.includes('/categories/') || href.includes('/recipes/') || href.includes('/tag/')) {
                        return false;
                    }
                    // Include only links that look like recipe posts
                    // Recipe URLs typically end with a slug and don't have additional path segments
                    const urlParts = href.split('/').filter(Boolean);
                    const lastPart = urlParts[urlParts.length - 1];
                    return lastPart && lastPart.includes('-') && !lastPart.includes('page');
                })
                .slice(0, 5); // Limit to first 5 recipes
            
            console.log('Filtered recipe links:', recipeLinks);
            
            // Fetch each recipe with delay between requests
            const recipes = [];
            for (const url of recipeLinks) {
                try {
                    console.log(`Attempting to fetch recipe from: ${url}`);
                    const recipe = await this.getRecipeData(url);
                    if (recipe) {
                        console.log(`Successfully fetched recipe: ${recipe.title}`);
                        recipes.push(recipe);
                    }
                    // Add delay between recipe fetches to avoid rate limiting
                    if (recipeLinks.indexOf(url) < recipeLinks.length - 1) {
                        console.log('Waiting before next recipe fetch...');
                        await this.sleep(500);
                    }
                } catch (error) {
                    console.error(`Error fetching recipe from ${url}:`, error);
                }
            }
            
            return recipes;
        } catch (error) {
            console.error('Error searching recipes:', error);
            return [];
        }
    }
}

// Make the class available globally for browser use
window.PanlasangPinoySearch = PanlasangPinoySearch;
