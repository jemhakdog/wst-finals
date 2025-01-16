document.addEventListener('DOMContentLoaded', async function() {
    // Get recipe URL from query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const recipeUrl = urlParams.get('url');

    if (!recipeUrl) {
        showError('No recipe URL provided');
        return;
    }

    try {
        console.log('Loading recipe from:', recipeUrl);
        // Initialize PanlasangPinoy search client
        const searchClient = new PanlasangPinoySearch();
        
        // Show loading state
        document.getElementById('loadingState').classList.remove('d-none');
        document.getElementById('recipeContent').classList.add('d-none');
        document.getElementById('errorState').classList.add('d-none');

        // Get recipe data
        const recipe = await searchClient.getRecipeData(recipeUrl);
        console.log('Recipe data:', recipe);

        if (!recipe) {
            showError('Recipe not found. Please try searching again.');
            return;
        }

        // Update page title
        document.title = `${recipe.title} - Filipino Food Recipes`;
        
        // Update recipe content
        document.getElementById('recipeTitle').textContent = recipe.title;
        if (recipe.image) {
            document.getElementById('recipeImage').src = recipe.image;
            document.getElementById('recipeImage').alt = recipe.title;
        }
        
        // Update meta information
        const metaHtml = [];
        if (recipe.prepTime) metaHtml.push(`<span><i class="bi bi-clock"></i> Prep: ${recipe.prepTime}m</span>`);
        if (recipe.cookTime) metaHtml.push(`<span><i class="bi bi-fire"></i> Cook: ${recipe.cookTime}m</span>`);
        if (recipe.rating) {
            metaHtml.push(`
                <span>
                    <i class="bi bi-star-fill text-warning"></i> 
                    ${recipe.rating} (${recipe.ratingCount || 0} reviews)
                </span>
            `);
        }
        document.getElementById('recipeMeta').innerHTML = metaHtml.join('');
        
        // Update description
        document.getElementById('recipeDescription').innerHTML = `
            <div class="mb-4">
                ${recipe.description || ''}
            </div>
            <div class="mb-4">
                ${recipe.author ? `<p><strong>Author:</strong> ${recipe.author}</p>` : ''}
                ${recipe.servings ? `<p><strong>Servings:</strong> ${recipe.servings}</p>` : ''}
                ${recipe.cuisine ? `<p><strong>Cuisine:</strong> ${recipe.cuisine}</p>` : ''}
                ${recipe.category ? `<p><strong>Category:</strong> ${recipe.category}</p>` : ''}
            </div>
        `;
        
        // Update ingredients section
        document.getElementById('ingredientsList').innerHTML = recipe.ingredients?.length ? `
            <ul class="list-unstyled">
                ${recipe.ingredients.map(ingredient => `
                    <li class="d-flex align-items-center mb-2">
                        <input type="checkbox" class="form-check-input me-2">
                        <span>${ingredient}</span>
                    </li>
                `).join('')}
            </ul>
        ` : `
            <div class="alert alert-info mb-0">
                <i class="bi bi-info-circle me-2"></i>
                No ingredients listed
            </div>
        `;

        // Update instructions section
        document.getElementById('instructionsList').innerHTML = recipe.instructions?.length ? `
            <ol class="instruction-list">
                ${recipe.instructions.map(instruction => `
                    <li class="mb-4">
                        <p>${instruction}</p>
                    </li>
                `).join('')}
            </ol>
        ` : `
            <div class="alert alert-info mb-0">
                <i class="bi bi-info-circle me-2"></i>
                No instructions listed
            </div>
        `;

        // Initialize save recipe functionality
        const saveBtn = document.getElementById('saveRecipeBtn');
        const recipeData = {
            url: window.location.pathname + window.location.search,
            title: recipe.title,
            image: recipe.image,
            description: recipe.description
        };

        // Update button state based on favorite status
        function updateSaveButton() {
            const isFavorite = recipeFavorites.isFavorite(recipeData.url);
            saveBtn.innerHTML = `
                <i class="bi bi-heart${isFavorite ? '-fill' : ''}"></i>
                ${isFavorite ? 'Saved' : 'Save Recipe'}
            `;
            saveBtn.className = `btn btn-${isFavorite ? '' : 'outline-'}danger`;
        }

        // Toggle favorite status
        saveBtn.addEventListener('click', () => {
            recipeFavorites.toggleFavorite(recipeData);
            updateSaveButton();
            // Dispatch event for recipes page
            window.dispatchEvent(new CustomEvent('favoritesUpdated'));
        });

        // Initialize share buttons
        document.querySelectorAll('.dropdown-item').forEach(shareBtn => {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = e.currentTarget.textContent.trim().toLowerCase();
                const shareUrl = encodeURIComponent(window.location.href);
                const shareTitle = encodeURIComponent(recipe.title);
                let shareLink = '';

                switch (platform) {
                    case 'facebook':
                        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
                        break;
                    case 'twitter':
                        shareLink = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
                        break;
                    case 'pinterest':
                        shareLink = `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareTitle}`;
                        break;
                    case 'email':
                        shareLink = `mailto:?subject=${shareTitle}&body=Check out this recipe: ${decodeURIComponent(shareUrl)}`;
                        break;
                }

                if (shareLink) {
                    if (platform === 'email') {
                        window.location.href = shareLink;
                    } else {
                        window.open(shareLink, '_blank', 'width=600,height=400');
                    }
                }
            });
        });

        // Initial save button state
        updateSaveButton();

        // Show recipe content
        document.getElementById('loadingState').classList.add('d-none');
        document.getElementById('recipeContent').classList.remove('d-none');
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        showError('Failed to load recipe. Please try again later.');
    }
});

function showError(message) {
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('recipeContent').classList.add('d-none');
    document.getElementById('errorState').classList.remove('d-none');
    document.getElementById('errorMessage').innerHTML = `
        <p>${message}</p>
        <p>You can try:</p>
        <ul>
            <li>Going back to <a href="recipe-search.html">recipe search</a></li>
            <li>Checking if the URL is correct</li>
            <li>Refreshing the page</li>
        </ul>
    `;
}
