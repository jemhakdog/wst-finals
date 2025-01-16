// Main JavaScript file for Filipino Food Recipes website

// DOM Elements
const searchInput = document.getElementById('searchRecipes');
const difficultyFilter = document.getElementById('filterDifficulty');
const recipeCards = document.querySelectorAll('.recipe-card');

// Search and Filter Functionality
let searchTimeout;

function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(searchTimeout);
            func(...args);
        };
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(later, wait);
    };
}

function filterRecipes() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDifficulty = difficultyFilter.value.toLowerCase();
    const recipesContainer = document.getElementById('recipesContainer');
    const noResults = document.querySelector('.no-results');
    let visibleCount = 0;
    
    recipeCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.card-text').textContent.toLowerCase();
        const difficulty = card.querySelector('.recipe-meta-item:last-child span').textContent.toLowerCase();
        
        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesDifficulty = !selectedDifficulty || difficulty.includes(selectedDifficulty);
        
        if (matchesSearch && matchesDifficulty) {
            card.classList.remove('hidden');
            card.classList.add('fade-in');
            visibleCount++;
        } else {
            card.classList.add('hidden');
            card.classList.remove('fade-in');
        }
    });
    
    // Show/hide no results message
    if (visibleCount === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
    }
}

const debouncedFilter = debounce(filterRecipes, 300);

// Event Listeners
if (searchInput) {
    searchInput.addEventListener('input', debouncedFilter);
}
if (difficultyFilter) {
    difficultyFilter.addEventListener('change', filterRecipes);
}

// Loading Indicator
function showLoading() {
    Swal.fire({
        title: 'Loading...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Hide loading indicator
function hideLoading() {
    Swal.close();
}

// Show success message
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

// Show error message
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message
    });
}

// Handle recipe rating
function rateRecipe(recipeId, rating) {
    showLoading();
    
    // Simulate API call
    setTimeout(() => {
        hideLoading();
        showSuccess('Thank you for rating this recipe!');
        
        // Update UI
        const ratingElement = document.querySelector(`#recipe-${recipeId} .rating`);
        if (ratingElement) {
            ratingElement.textContent = `Rating: ${rating}/5`;
        }
    }, 1000);
}

// Handle recipe favorite
function toggleFavorite(recipeId) {
    const favoriteBtn = document.querySelector(`#recipe-${recipeId} .favorite-btn`);
    if (!favoriteBtn) return;

    const isFavorite = favoriteBtn.classList.contains('active');
    
    showLoading();
    
    // Simulate API call
    setTimeout(() => {
        hideLoading();
        
        if (isFavorite) {
            favoriteBtn.classList.remove('active');
            showSuccess('Recipe removed from favorites');
        } else {
            favoriteBtn.classList.add('active');
            showSuccess('Recipe added to favorites');
        }
    }, 1000);
}

// Handle recipe sharing
function shareRecipe(recipeId, recipeName) {
    if (navigator.share) {
        navigator.share({
            title: recipeName,
            text: `Check out this delicious ${recipeName} recipe!`,
            url: window.location.href
        })
        .then(() => showSuccess('Recipe shared successfully'))
        .catch((error) => showError('Error sharing recipe'));
    } else {
        // Fallback for browsers that don't support Web Share API
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        showSuccess('Recipe link copied to clipboard!');
    }
}

// Handle print recipe
function printRecipe(recipeId) {
    window.print();
}

// Document ready handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});