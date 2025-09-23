let allShows = []; // Cache for all shows when needed
let currentSection = 'search';
const RESULTS_LIMIT = 10; // Maximum results to show

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-container').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.remove('hidden');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    currentSection = sectionName;
    
    // Clear previous results
    clearResults();
}

// Utility functions
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    hideError();
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').classList.remove('hidden');
    hideLoading();
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function clearResults() {
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('resultsTitle').classList.add('hidden');
}

function showResults() {
    document.getElementById('resultsTitle').classList.remove('hidden');
}

// Validation functions
function validateRuntimeInputs(min, max) {
    if (min && max && parseInt(min) > parseInt(max)) {
        return 'Minimum runtime cannot be greater than maximum runtime';
    }
    if (min && (parseInt(min) < 0 || parseInt(min) > 500)) {
        return 'Minimum runtime must be between 0 and 500 minutes';
    }
    if (max && (parseInt(max) < 0 || parseInt(max) > 500)) {
        return 'Maximum runtime must be between 0 and 500 minutes';
    }
    return null;
}

function validateRatingInputs(min, max) {
    if (min && max && parseFloat(min) > parseFloat(max)) {
        return 'Minimum rating cannot be greater than maximum rating';
    }
    if (min && (parseFloat(min) < 0 || parseFloat(min) > 10)) {
        return 'Minimum rating must be between 0 and 10';
    }
    if (max && (parseFloat(max) < 0 || parseFloat(max) > 10)) {
        return 'Maximum rating must be between 0 and 10';
    }
    return null;
}

function validateYearInputs(min, max) {
    const currentYear = new Date().getFullYear();
    if (min && max && parseInt(min) > parseInt(max)) {
        return 'From year cannot be greater than to year';
    }
    if (min && (parseInt(min) < 1900 || parseInt(min) > currentYear + 10)) {
        return `From year must be between 1900 and ${currentYear + 10}`;
    }
    if (max && (parseInt(max) < 1900 || parseInt(max) > currentYear + 10)) {
        return `To year must be between 1900 and ${currentYear + 10}`;
    }
    return null;
}

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

// Random selection function
function getRandomSelection(array, limit) {
    if (array.length <= limit) {
        return array;
    }
    
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
}

// Card creation function
function makeShowCard(shows, isDirectShow = false) {
    const container = document.getElementById('resultsContainer');
    
    if (!shows || shows.length === 0) {
        container.innerHTML = '<p>No shows found matching your criteria.</p>';
        showResults();
        return;
    }

    // Randomly select shows if there are more than the limit
    const selectedShows = getRandomSelection(shows, RESULTS_LIMIT);

    for (let result of selectedShows) {
        const show = isDirectShow ? result : (result.show || result);
        
        if (!show || !show.name) continue;

        const imgSrc = show.image && show.image.medium ? show.image.medium : 'https://placehold.co/210x295';
        
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <img src="${imgSrc}" alt="${show.name}" onerror="this.src='https://placehold.co/210x295'">
            <h3>${show.name}</h3>
        `;
        
        container.appendChild(card);
    }
    
    // Show message if results were limited
    if (shows.length > RESULTS_LIMIT) {
        const infoMessage = document.createElement('p');
        infoMessage.style.fontStyle = 'italic';
        infoMessage.style.textAlign = 'center';
        infoMessage.style.marginTop = '20px';
        infoMessage.textContent = `Showing ${selectedShows.length} random shows out of ${shows.length} total results.`;
        container.appendChild(infoMessage);
    }
    
    showResults();
}

// Enhanced error handling
function handleApiError(error, context) {
    console.error(`${context} error:`, error);
    
    if (error.response) {
        // Server responded with error status
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
            default:
                showError(`Error ${status}: Unable to fetch data. Please try again.`);
        }
    } else if (error.request) {
        // Network error
        showError(`Network error: Please check your internet connection and try again.`);
    } else {
        // Other error
        showError(`Something went wrong. Please try again.`);
    }
}

// Section 1: Search Show
document.getElementById('searchForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearResults();
    
    const query = document.getElementById('searchInput').value.trim();
    
    // Validation
    const validationError = validateSearchInput(query);
    if (validationError) {
        showError(validationError);
        return;
    }

    showLoading();

    try {
        const response = await axios.get('https://api.tvmaze.com/search/shows', {
            params: { q: query },
            timeout: 10000 // 10 second timeout
        });
        
        hideLoading();
        
        if (!response.data || response.data.length === 0) {
            showError(`No shows found for "${query}". Try different keywords or check spelling.`);
            return;
        }
        
        makeShowCard(response.data);
        document.getElementById('searchInput').value = '';
    } catch (error) {
        handleApiError(error, 'Search');
    }
});

// Section 2: Surprise Me
document.getElementById('surpriseButton').addEventListener('click', async function() {
    clearResults();
    showLoading();

    try {
        // Get a random page of shows (TVMaze has shows paginated by 250 per page)
        const randomPage = Math.floor(Math.random() * 50); // Limit to first 50 pages for better show variety
        const response = await axios.get('https://api.tvmaze.com/shows', {
            params: { page: randomPage },
            timeout: 10000
        });

        if (response.data && response.data.length > 0) {
            // Pick a random show from the page
            const randomShow = response.data[Math.floor(Math.random() * response.data.length)];
            hideLoading();
            makeShowCard([randomShow], true);
        } else {
            throw new Error('No shows found on this page');
        }
    } catch (error) {
        // Fallback: try to get shows from page 0
        try {
            const response = await axios.get('https://api.tvmaze.com/shows', {
                params: { page: 0 },
                timeout: 10000
            });
            if (response.data && response.data.length > 0) {
                const randomShow = response.data[Math.floor(Math.random() * response.data.length)];
                hideLoading();
                makeShowCard([randomShow], true);
            } else {
                throw new Error('No shows available');
            }
        } catch (fallbackError) {
            handleApiError(fallbackError, 'Random show');
        }
    }
});

// Section 3: Show Finder
document.getElementById('finderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearResults();

    // Get form values
    const runtimeMin = document.getElementById('runtimeMin').value;
    const runtimeMax = document.getElementById('runtimeMax').value;
    const ratingMin = document.getElementById('ratingMin').value;
    const ratingMax = document.getElementById('ratingMax').value;
    const yearMin = document.getElementById('yearMin').value;
    const yearMax = document.getElementById('yearMax').value;

    // Validate inputs
    let validationError = validateRuntimeInputs(runtimeMin, runtimeMax);
    if (validationError) {
        showError(validationError);
        return;
    }

    validationError = validateRatingInputs(ratingMin, ratingMax);
    if (validationError) {
        showError(validationError);
        return;
    }

    validationError = validateYearInputs(yearMin, yearMax);
    if (validationError) {
        showError(validationError);
        return;
    }

    showLoading();

    try {
        // Get shows data (load more pages for better filtering results)
        if (allShows.length === 0) {
            const maxPages = 100; // Increased for better variety while keeping reasonable load time
            const promises = [];
            
            for (let page = 0; page < maxPages; page++) {
                promises.push(
                    axios.get('https://api.tvmaze.com/shows', { 
                        params: { page },
                        timeout: 15000 // Increased timeout for multiple requests
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
        }

        // Apply filters
        let filteredShows = [...allShows];

        // Genre filter
        const genre = document.getElementById('genreFilter').value;
        if (genre) {
            filteredShows = filteredShows.filter(show => 
                show.genres && show.genres.includes(genre)
            );
        }

        // Language filter
        const language = document.getElementById('languageFilter').value;
        if (language) {
            filteredShows = filteredShows.filter(show => 
                show.language === language
            );
        }

        // Status filter
        const status = document.getElementById('statusFilter').value;
        if (status) {
            filteredShows = filteredShows.filter(show => 
                show.status === status
            );
        }

        // Type filter
        const type = document.getElementById('typeFilter').value;
        if (type) {
            filteredShows = filteredShows.filter(show => 
                show.type === type
            );
        }

        // Runtime filters
        if (runtimeMin) {
            filteredShows = filteredShows.filter(show => 
                show.runtime && show.runtime >= parseInt(runtimeMin)
            );
        }
        if (runtimeMax) {
            filteredShows = filteredShows.filter(show => 
                show.runtime && show.runtime <= parseInt(runtimeMax)
            );
        }

        // Rating filters
        if (ratingMin) {
            filteredShows = filteredShows.filter(show => 
                show.rating && show.rating.average && show.rating.average >= parseFloat(ratingMin)
            );
        }
        if (ratingMax) {
            filteredShows = filteredShows.filter(show => 
                show.rating && show.rating.average && show.rating.average <= parseFloat(ratingMax)
            );
        }

        // Year filters
        if (yearMin) {
            filteredShows = filteredShows.filter(show => {
                if (!show.premiered) return false;
                const year = new Date(show.premiered).getFullYear();
                return year >= parseInt(yearMin);
            });
        }
        if (yearMax) {
            filteredShows = filteredShows.filter(show => {
                if (!show.premiered) return false;
                const year = new Date(show.premiered).getFullYear();
                return year <= parseInt(yearMax);
            });
        }

        hideLoading();

        if (filteredShows.length === 0) {
            showError('No shows match your criteria. Try adjusting your filters.');
            return;
        }

        makeShowCard(filteredShows, true);

    } catch (error) {
        handleApiError(error, 'Show finder');
    }
});

// Clear filters function
function clearFilters() {
    document.getElementById('finderForm').reset();
    clearResults();
}

// Initialize - show search section by default
window.addEventListener('load', function() {
    // Hide all sections first
    document.querySelectorAll('.section-container').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show search section and make its button active
    document.getElementById('search').classList.remove('hidden');
    document.querySelector('button[onclick="showSection(\'search\')"]').classList.add('active');
    
    currentSection = 'search';
});