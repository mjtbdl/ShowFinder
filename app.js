// Application State
let allShows = [];
let userPreferences = {};
let currentQuestionIndex = 0;
const RESULTS_LIMIT = 10;

const questions = ['language', 'genre', 'type', 'rating', 'status'];

// DOM Elements
let welcomeState, cardDeckState, searchState, resultsState, resultsPanel, showFinderPanel;

// Initialize Application
window.addEventListener('load', function() {
    initializeDOMElements();
    initializeApp();
});

function initializeDOMElements() {
    welcomeState = document.getElementById('welcomeState');
    cardDeckState = document.getElementById('cardDeckState');
    searchState = document.getElementById('searchState');
    resultsState = document.getElementById('resultsState');
    resultsPanel = document.getElementById('resultsPanel');
    showFinderPanel = document.getElementById('showFinderPanel');
}

function initializeApp() {
    resetAppState();
    showWelcomeState();
    bindEventListeners();
}

function resetAppState() {
    userPreferences = {};
    currentQuestionIndex = 0;
    hideAllStates();
    hideResultsPanel();
    clearResults();
    hideError();
    hideLoading();
}

// Event Listeners
function bindEventListeners() {
    // Start finder button
    const startFinderBtn = document.getElementById('startFinderBtn');
    if (startFinderBtn) {
        startFinderBtn.addEventListener('click', startCardDeck);
    }
    
    // Search toggle button
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    if (searchToggleBtn) {
        searchToggleBtn.addEventListener('click', showSearchState);
    }
    
    // Back to finder button
    const backToFinderBtn = document.getElementById('backToFinderBtn');
    if (backToFinderBtn) {
        backToFinderBtn.addEventListener('click', showWelcomeState);
    }
    
    // Start again button
    const startAgainBtn = document.getElementById('startAgainBtn');
    if (startAgainBtn) {
        startAgainBtn.addEventListener('click', startAgain);
    }
    
    // Close results button
    const closeResultsBtn = document.getElementById('closeResultsBtn');
    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', hideResultsPanel);
    }
    
    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Question card options
    bindCardOptions();
    
    // Error retry
    const errorRetryBtn = document.getElementById('errorRetryBtn');
    if (errorRetryBtn) {
        errorRetryBtn.addEventListener('click', hideError);
    }
}

function bindCardOptions() {
    document.querySelectorAll('.question-card').forEach(card => {
        const buttons = card.querySelectorAll('.option-btn, .skip-btn');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const question = card.dataset.question;
                const value = this.dataset.value;
                answerQuestion(question, value);
            });
        });
    });
}

// State Management
function hideAllStates() {
    if (welcomeState) welcomeState.classList.add('hidden');
    if (cardDeckState) cardDeckState.classList.add('hidden');
    if (searchState) searchState.classList.add('hidden');
    if (resultsState) resultsState.classList.add('hidden');
}

function showWelcomeState() {
    hideAllStates();
    if (welcomeState) welcomeState.classList.remove('hidden');
    if (showFinderPanel) {
        showFinderPanel.classList.remove('flipped');
        showFinderPanel.classList.remove('slide-left');
    }
}

function showSearchState() {
    hideAllStates();
    if (searchState) searchState.classList.remove('hidden');
    if (showFinderPanel) {
        showFinderPanel.classList.add('flipped');
        showFinderPanel.classList.remove('slide-left');
    }
}

function showResultsState() {
    hideAllStates();
    if (resultsState) resultsState.classList.remove('hidden');
    if (showFinderPanel) showFinderPanel.classList.remove('flipped');
}

function showCardDeck() {
    hideAllStates();
    if (cardDeckState) cardDeckState.classList.remove('hidden');
    if (showFinderPanel) {
        showFinderPanel.classList.remove('flipped');
        showFinderPanel.classList.remove('slide-left');
    }
    resetCardDeck();
}

function hideResultsPanel() {
    if (resultsPanel) resultsPanel.classList.remove('visible');
    if (showFinderPanel) showFinderPanel.classList.remove('slide-left');
}

function showResultsPanel() {
    if (resultsPanel) resultsPanel.classList.add('visible');
    if (showFinderPanel) showFinderPanel.classList.add('slide-left');
}

// Card Deck Functions
function startCardDeck() {
    userPreferences = {}; // Reset preferences
    showCardDeck();
    updateProgress();
}

function resetCardDeck() {
    currentQuestionIndex = 0;
    document.querySelectorAll('.question-card').forEach((card, index) => {
        card.classList.remove('active', 'answered', 'slide-down', 'slide-up');
        if (index === 0) {
            card.classList.add('active');
        }
    });
    updateProgress();
}

function answerQuestion(questionType, value) {
    userPreferences[questionType] = value;
    
    const currentCard = document.querySelector('.question-card.active');
    if (currentCard) {
        currentCard.classList.add('answered');
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        setTimeout(() => {
            moveToNextCard();
        }, 300);
    } else {
        setTimeout(() => {
            finishQuestionnaire();
        }, 500);
    }
    
    updateProgress();
}

function moveToNextCard() {
    const currentCard = document.querySelector('.question-card.active');
    const nextCard = document.querySelector(`[data-question="${questions[currentQuestionIndex]}"]`);
    
    if (currentCard) {
        currentCard.classList.remove('active');
        currentCard.classList.add('slide-down');
        
        // Clean up after animation
        setTimeout(() => {
            currentCard.classList.remove('slide-down');
        }, 500);
    }
    
    if (nextCard) {
        nextCard.classList.add('active', 'slide-up');
        
        setTimeout(() => {
            nextCard.classList.remove('slide-up');
        }, 300);
    }
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const progress = (currentQuestionIndex / questions.length) * 100;
        progressFill.style.width = progress + '%';
    }
}

function finishQuestionnaire() {
    findShowsWithPreferences();
}

function startAgain() {
    resetAppState();
    showWelcomeState();
}

// Show Finding Logic
async function findShowsWithPreferences() {
    showLoading();
    
    try {
        // Get shows data if not cached
        if (allShows.length === 0) {
            await loadShowsData();
        }
        
        // Filter shows based on preferences
        let filteredShows = filterShowsByPreferences(allShows, userPreferences);
        
        hideLoading();
        
        if (filteredShows.length === 0) {
            showError('No shows match your preferences. Try different options or use "No preference" for more results.');
            return;
        }
        
        displayResults(filteredShows, 'finder');
        
    } catch (error) {
        handleApiError(error, 'Show finder');
    }
}

async function loadShowsData() {
    const maxPages = 10; // Increased for better variety
    const promises = [];
    
    for (let page = 0; page < maxPages; page++) {
        promises.push(
            axios.get('https://api.tvmaze.com/shows', { 
                params: { page },
                timeout: 15000
            })
            .catch(err => {
                console.warn(`Failed to load page ${page}:`, err);
                return { data: [] };
            })
        );
    }
    
    const responses = await Promise.all(promises);
    allShows = responses.flatMap(response => response.data);
    
    if (allShows.length === 0) {
        throw new Error('Unable to load show database');
    }
    
    console.log(`Loaded ${allShows.length} shows for filtering`);
}

function filterShowsByPreferences(shows, preferences) {
    let filtered = [...shows];
    
    console.log('Starting with', filtered.length, 'shows');
    console.log('User preferences:', preferences);
    
    // Language filter
    if (preferences.language) {
        filtered = filtered.filter(show => show.language === preferences.language);
        console.log(`After language filter (${preferences.language}):`, filtered.length, 'shows');
    }
    
    // Genre filter
    if (preferences.genre) {
        filtered = filtered.filter(show => 
            show.genres && show.genres.includes(preferences.genre)
        );
        console.log(`After genre filter (${preferences.genre}):`, filtered.length, 'shows');
    }
    
    // Type filter
    if (preferences.type) {
        filtered = filtered.filter(show => show.type === preferences.type);
        console.log(`After type filter (${preferences.type}):`, filtered.length, 'shows');
    }
    
    // Rating filter
    if (preferences.rating) {
        const minRating = parseFloat(preferences.rating);
        filtered = filtered.filter(show => 
            show.rating && show.rating.average && show.rating.average >= minRating
        );
        console.log(`After rating filter (${minRating}+):`, filtered.length, 'shows');
    }
    
    // Status filter
    if (preferences.status) {
        filtered = filtered.filter(show => show.status === preferences.status);
        console.log(`After status filter (${preferences.status}):`, filtered.length, 'shows');
    }
    
    return filtered;
}

// Search Functionality
async function handleSearch(e) {
    e.preventDefault();
    
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        showError('Please enter a show name');
        return;
    }
    
    if (query.length < 2) {
        showError('Search query must be at least 2 characters long');
        return;
    }

    showLoading();

    try {
        const response = await axios.get('https://api.tvmaze.com/search/shows', {
            params: { q: query },
            timeout: 10000
        });
        
        hideLoading();
        
        if (!response.data || response.data.length === 0) {
            showError(`No shows found for "${query}". Try different keywords or check spelling.`);
            return;
        }
        
        displayResults(response.data, 'search');
        document.getElementById('searchInput').value = '';
        
    } catch (error) {
        handleApiError(error, 'Search');
    }
}

// Results Display
function displayResults(shows, source) {
    const container = document.getElementById('resultsContainer');
    const title = document.getElementById('resultsTitle');
    
    if (!container || !title) return;
    
    // Update title based on source
    title.textContent = source === 'search' ? 'Search Results' : 'Recommended Shows';
    
    // Clear previous results
    container.innerHTML = '';
    
    if (!shows || shows.length === 0) {
        container.innerHTML = '<p class="no-results">No shows found matching your criteria.</p>';
        showResultsState();
        showResultsPanel();
        return;
    }

    // Get random selection if too many results
    const selectedShows = getRandomSelection(shows, RESULTS_LIMIT);

    selectedShows.forEach(result => {
        const show = source === 'search' ? (result.show || result) : result;
        
        if (!show || !show.name) return;

        const imgSrc = show.image && show.image.medium ? show.image.medium : 'https://placehold.co/210x295';
        
        const card = document.createElement('div');
        card.classList.add('show-card');
        card.innerHTML = `
            <img src="${imgSrc}" alt="${show.name}" onerror="this.src='https://placehold.co/210x295'">
            <h3>${show.name}</h3>
        `;
        
        container.appendChild(card);
    });
    
    // Show info message if results were limited
    if (shows.length > RESULTS_LIMIT) {
        const infoMessage = document.createElement('p');
        infoMessage.className = 'results-info';
        infoMessage.textContent = `Showing ${selectedShows.length} random shows out of ${shows.length} total results.`;
        container.appendChild(infoMessage);
    }
    
    // Show results state and panel
    showResultsState();
    showResultsPanel();
}

// Utility Functions
function getRandomSelection(array, limit) {
    if (array.length <= limit) {
        return array;
    }
    
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
}

function clearResults() {
    const container = document.getElementById('resultsContainer');
    if (container) {
        container.innerHTML = '';
    }
}

// Loading and Error States
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
    hideError();
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showError(message) {
    const errorContainer = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorContainer) {
        errorContainer.classList.remove('hidden');
    }
    hideLoading();
}

function hideError() {
    const errorContainer = document.getElementById('error');
    if (errorContainer) {
        errorContainer.classList.add('hidden');
    }
}

function handleApiError(error, context) {
    console.error(`${context} error:`, error);
    
    if (error.response) {
        const status = error.response.status;
        switch (status) {
            case 404:
                showError(`No results found. Please try a different search term.`);
                break;
            case 429:
                showError(`Too many requests. Please wait a moment and try again.`);
                break;
            case 500:
                showError(`Server error. The TV database is temporarily unavailable.`);
                break;
            case 503:
                showError(`Service temporarily unavailable. Please try again later.`);
                break;
            default:
                showError(`Error ${status}: Unable to fetch data. Please try again.`);
        }
    } else if (error.request) {
        showError(`Network error: Please check your internet connection and try again.`);
    } else if (error.code === 'ECONNABORTED') {
        showError(`Request timeout: The server is taking too long to respond. Please try again.`);
    } else {
        showError(`Something went wrong: ${error.message}. Please try again.`);
    }
}

// Validation functions (for future use)
function validateSearchInput(query) {
    if (!query || query.trim().length === 0) {
        return 'Please enter a show name';
    }
    if (query.trim().length < 2) {
        return 'Search query must be at least 2 characters long';
    }
    if (query.trim().length > 100) {
        return 'Search query cannot exceed 100 characters';
    }
    return null;
}

// Debug helpers
function logAppState() {
    console.log('Current app state:', {
        currentQuestionIndex,
        userPreferences,
        totalShows: allShows.length,
        welcomeVisible: !welcomeState?.classList.contains('hidden'),
        cardDeckVisible: !cardDeckState?.classList.contains('hidden'),
        searchVisible: !searchState?.classList.contains('hidden'),
        resultsVisible: !resultsState?.classList.contains('hidden'),
        resultsPanel: resultsPanel?.classList.contains('visible')
    });
}

// Expose debug function globally
window.logAppState = logAppState;