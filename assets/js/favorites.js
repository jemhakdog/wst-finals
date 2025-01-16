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
    console.log('Creating favorite button for recipe:', recipe);
    
    const button = document.createElement('button');
    const isFavorite = recipeFavorites.isFavorite(recipe.url);
    console.log('Is recipe favorite?', isFavorite);
    
    button.className = `btn ${buttonClass} ${isFavorite ? 'btn-danger disabled' : 'btn-outline-danger'}`;
    if (isFavorite) {
        button.disabled = true;
        button.setAttribute('title', 'Recipe already saved');
    }
    button.innerHTML = `
        <i class="bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
        ${isFavorite ? 'Already Saved' : 'Save Recipe'}
    `;
    
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Save button clicked for recipe:', recipe.title);
        
        if (typeof Swal === 'undefined') {
            console.error('SweetAlert2 is not loaded!');
            alert('Error: SweetAlert2 is not loaded. Please refresh the page.');
            return;
        }
        
        try {
            console.log('Showing Swal confirmation dialog...');
            const result = await Swal.fire({
            title: recipeFavorites.isFavorite(recipe.url) ? 'Remove from Favorites?' : 'Save Recipe?',
            text: recipeFavorites.isFavorite(recipe.url) ? 
                  'Are you sure you want to remove this recipe from your favorites?' : 
                  'Would you like to save this recipe to your favorites?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: recipeFavorites.isFavorite(recipe.url) ? 'Yes, remove it' : 'Yes, save it',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const isNowFavorite = recipeFavorites.toggleFavorite(recipe);
            
            button.className = `btn ${buttonClass} ${isNowFavorite ? 'btn-danger disabled' : 'btn-outline-danger'}`;
            if (isNowFavorite) {
                button.disabled = true;
                button.setAttribute('title', 'Recipe already saved');
            } else {
                button.disabled = false;
                button.removeAttribute('title');
            }
            button.innerHTML = `
                <i class="bi ${isNowFavorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
                ${isNowFavorite ? 'Already Saved' : 'Save Recipe'}
            `;

            // Show success notification
            console.log('Showing success notification...');
            await Swal.fire({
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
        }
    } catch (error) {
        console.error('Error in save button click handler:', error);
        // Fallback notification if Swal fails
        alert(recipeFavorites.isFavorite(recipe.url) ? 
              'Are you sure you want to remove this recipe from your favorites?' : 
              'Would you like to save this recipe to your favorites?');
    }
    });
    
    return button;
}
