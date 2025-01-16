class PanlasangPinoySearch {
    constructor() {
        this.apiBaseUrl = "http://localhost:5000/api";
        this.websocketUrl = "wss://c15b-wss.app.slickstream.com/socket";
        this.siteCode = "ZT457GLE";
        this.epoch = 1723475851945;
        this.readerId = `${Date.now()}.${String(Date.now()).split('.')[1] || '0'}`;
    }

    async getRecipeData(url) {
        try {
            console.log('Fetching recipe data for:', url);
            
            const response = await fetch(`${this.apiBaseUrl}/recipe?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch recipe');
            }
            
            const recipe = await response.json();
            console.log('Recipe data:', recipe);
            
            if (!recipe) {
                throw new Error('Recipe data not found');
            }
            
            return recipe;
        } catch (error) {
            console.error('Error fetching recipe:', error);
            throw error;
        }
    }

    async searchRecipes(query) {
        try {
            console.log('Searching for:', query);
            
            // If query is a URL, fetch recipe directly
            if (query.startsWith('http')) {
                const recipe = await this.getRecipeData(query);
                return recipe ? [recipe] : [];
            }
            
            // Otherwise, search for recipes
            const response = await fetch(`${this.apiBaseUrl}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Search failed');
            }
            
            const recipes = await response.json();
            console.log('Search results:', recipes);
            
            if (!recipes || recipes.length === 0) {
                console.log('No recipes found, trying websocket search...');
                return await this.searchViaWebsocket(query);
            }
            
            return recipes;
        } catch (error) {
            console.error('Error searching recipes:', error);
            console.log('Trying websocket search as fallback...');
            try {
                return await this.searchViaWebsocket(query);
            } catch (wsError) {
                console.error('Websocket search also failed:', wsError);
                throw error; // Throw original error if both methods fail
            }
        }
    }

    async searchViaWebsocket(query) {
        return new Promise((resolve, reject) => {
            const params = new URLSearchParams({ site: this.siteCode });
            const ws = new WebSocket(`${this.websocketUrl}?${params}`, ["SLICK_CLIENT_1"]);
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                
                // Send session start message
                const currentTime = Date.now();
                const sessionMsg = {
                    at: currentTime,
                    messageId: 1,
                    direction: "request",
                    payload: {
                        site: this.siteCode,
                        reader: this.readerId,
                        start: currentTime - 1000,
                        url: "https://panlasangpinoy.com/",
                        canonical: "https://panlasangpinoy.com/",
                        publishedTime: null,
                        updatedTime: "2023-05-01T17:36:50+00:00",
                        referer: "",
                        display: { w: 785, h: 651 },
                        clientVersion: "2.13.103",
                        embedCodeVersion: "2.0.1",
                        userAuthenticated: false,
                        adBlockerDetected: false,
                        error404Detected: false,
                        robotsContent: "index, follow",
                        clientMetrics: {
                            appStart: 3442.5999999940395,
                            bootStart: 3392.7000000178814,
                            embedStart: 1427.0999999940395,
                            origin: 3443,
                            bootDataFetch: 1413.9000000059605,
                            sessionStart: 3732.5999999940395
                        },
                        clientType: "embed",
                        device: "desktop"
                    },
                    msgType: "start-session"
                };
                
                ws.send(JSON.stringify(sessionMsg));
            };
            
            ws.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                console.log('WebSocket message:', data);
                
                if (data.direction === 'error') {
                    ws.close();
                    reject(new Error(data.payload?.description || 'WebSocket error'));
                    return;
                }
                
                if (data.msgType === 'start-session-response') {
                    // Session started, send search request
                    const searchRequest = {
                        at: Date.now(),
                        messageId: 2,
                        direction: "request",
                        payload: {
                            searchString: query,
                            speed: "full",
                            drillContext: "eyJ2IjoiNC4wIiwidGl0bGUiOiJQb3B1bGFyIiwiZ3JvdXBUeXBlIjoicG9wdWxhciIsImFycmFuZ2VtZW50IjoiY29udGV4dC13aXRoLXNlYXJjaCJ9",
                            width: 785,
                            height: 651,
                            arrangement: "context-with-search",
                            action: "start",
                            widgetType: "discovery"
                        },
                        msgType: "search4-search"
                    };
                    
                    ws.send(JSON.stringify(searchRequest));
                } else if (data.msgType === 'search4-search-response') {
                    ws.close();
                    
                    const recipes = [];
                    if (data.payload?.groups) {
                        const itemDescriptors = data.payload.itemDescriptors || {};
                        for (const group of data.payload.groups) {
                            for (const pageId of group.pageIds || []) {
                                if (pageId > 0 && itemDescriptors[pageId]) {
                                    const recipeData = itemDescriptors[pageId];
                                    if (recipeData.url) {
                                        try {
                                            const recipe = await this.getRecipeData(recipeData.url);
                                            if (recipe) {
                                                recipes.push(recipe);
                                            }
                                        } catch (error) {
                                            console.error('Error fetching recipe:', error);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    resolve(recipes);
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                ws.close();
                reject(new Error('WebSocket connection failed'));
            };
            
            ws.onclose = () => {
                console.log('WebSocket closed');
            };
            
            // Set timeout
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                    reject(new Error('WebSocket search timed out'));
                }
            }, 30000);
        });
    }
}

// Make the class available globally for browser use
window.PanlasangPinoySearch = PanlasangPinoySearch;
