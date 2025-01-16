// Favorites management
class RecipeFavorites {
    constructor() {
        this.storageKey = 'favoriteRecipes';
    }

    // Get all favorite recipes
    getFavorites() {
        const favorites = localStorage.getItem(this.storageKey);
        return favorites ? JSON.parse(favorites) : [];
    }

    // Add a recipe to favorites
    addFavorite(recipe) {
        const favorites = this.getFavorites();
        // Check if recipe already exists
        if (!favorites.some(fav => fav.url === recipe.url)) {
            favorites.push(recipe);
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
            return true;
        }
        return false;
    }

    // Remove a recipe from favorites
    removeFavorite(recipeUrl) {
        const favorites = this.getFavorites();
        const updatedFavorites = favorites.filter(recipe => recipe.url !== recipeUrl);
        localStorage.setItem(this.storageKey, JSON.stringify(updatedFavorites));
    }

    // Check if a recipe is in favorites
    isFavorite(recipeUrl) {
        const favorites = this.getFavorites();
        return favorites.some(recipe => recipe.url === recipeUrl);
    }

    // Toggle favorite status
    toggleFavorite(recipe) {
        if (this.isFavorite(recipe.url)) {
            this.removeFavorite(recipe.url);
            return false;
        } else {
            this.addFavorite(recipe);
            return true;
        }
    }
}

// Create global instance
const recipeFavorites = new RecipeFavorites();

// Helper function to create favorite button
function createFavoriteButton(recipe, buttonClass = '') {
    const button = document.createElement('button');
    const isFavorite = recipeFavorites.isFavorite(recipe.url);
    
    button.className = `btn ${buttonClass} ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}`;
    button.innerHTML = `
        <i class="bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
        ${isFavorite ? 'Saved' : 'Save Recipe'}
    `;
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const isNowFavorite = recipeFavorites.toggleFavorite(recipe);
        
        button.className = `btn ${buttonClass} ${isNowFavorite ? 'btn-danger' : 'btn-outline-danger'}`;
        button.innerHTML = `
            <i class="bi ${isNowFavorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
            ${isNowFavorite ? 'Saved' : 'Save Recipe'}
        `;

        // Show notification
        Swal.fire({
            icon: 'success',
            title: isNowFavorite ? 'Recipe Saved!' : 'Recipe Removed',
            text: isNowFavorite ? 'You can find it in your favorites.' : 'Recipe removed from favorites.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

        // Dispatch event for recipe view page
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    });
    
    return button;
}