class PanlasangPinoySearch {
    constructor() {
        this.baseUrl = "https://panlasangpinoy.com";
        this.wsUrl = "wss://c15b-wss.app.slickstream.com/socket";
        this.ws = null;
        this.wsConnected = false;
        this.pendingSearches = new Map();
        this.connectWebSocket();
    }

    connectWebSocket() {
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.wsConnected = true;
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.wsConnected = false;
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.wsConnected = false;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.msgType === 'search4-results') {
                        const searchId = data.payload.searchId;
                        const resolve = this.pendingSearches.get(searchId);
                        if (resolve) {
                            this.pendingSearches.delete(searchId);
                            resolve(this.processSearchResults(data.payload.itemDescriptors));
                        }
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            this.wsConnected = false;
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.connectWebSocket(), 5000);
        }
    }

    generateSearchId() {
        return Math.random().toString(36).substring(2, 15);
    }

    async waitForWebSocket() {
        let attempts = 0;
        while (!this.wsConnected && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        if (!this.wsConnected) {
            throw new Error('WebSocket connection failed');
        }
    }

    processSearchResults(results) {
        if (!results || !Array.isArray(results)) return [];
        
        return results.map(result => ({
            title: result.title || '',
            author: 'Panlasang Pinoy',
            description: result.description || result.snippet || '',
            url: result.url || '',
            image: result.image || result.thumbnail || '',
            cuisine: 'Filipino',
            category: result.category || '',
            rating: result.rating?.value || null,
            ratingCount: result.rating?.count || null,
            // Placeholder values for compatibility
            prepTime: null,
            cookTime: null,
            totalTime: null,
            servings: '',
            ingredients: [],
            instructions: [],
            nutrition: {}
        }));
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

        // Otherwise, use WebSocket search
        try {
            await this.waitForWebSocket();
            
            const searchId = this.generateSearchId();
            const messageId = Math.floor(Math.random() * 1000000);
            
            const searchMessage = {
                at: Date.now(),
                messageId: messageId,
                direction: 'request',
                msgType: 'search4-search',
                payload: {
                    site: 'ZT457GLE',
                    searchId: searchId,
                    searchString: query,
                    speed: 'fast',
                    width: window.innerWidth,
                    height: window.innerHeight,
                    arrangement: 'grid'
                }
            };

            return new Promise((resolve) => {
                this.pendingSearches.set(searchId, resolve);
                this.ws.send(JSON.stringify(searchMessage));

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.pendingSearches.has(searchId)) {
                        this.pendingSearches.delete(searchId);
                        resolve([]);
                    }
                }, 10000);
            });
        } catch (error) {
            console.error('Error searching recipes:', error);
            return [];
        }
    }

    async getRecipeData(url) {
        try {
            console.log('Fetching recipe data for:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
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
                url: url,
                nutrition: recipeData.nutrition || {}
            };
        } catch (error) {
            console.error('Error fetching recipe:', error);
            throw error;
        }
    }
}

// Make the class available globally for browser use
window.PanlasangPinoySearch = PanlasangPinoySearch;
