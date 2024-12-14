document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const suggestionsList = document.getElementById("suggestions-list");

    function showSuggestions() {
        suggestionsList.style.display = 'block';
    }

    function hideSuggestions() {
        suggestionsList.style.display = 'none';
    }

    searchInput.addEventListener('input', function () {
        const query = this.value.trim();
        suggestionsList.innerHTML = '';

        if (query) {
            fetch(`/search-suggestions?query=${query}`)
                .then(response => response.json())
                .then(data => {
                    const { movieResults, videoGameResults } = data;

                    const allResults = [...movieResults, ...videoGameResults];

                    allResults.forEach(item => {
                        const listItem = document.createElement('li');

                        if (item.rating > 4) {
                            additionalRating = 'high-rating';
                        } else if (item.rating >= 3) {
                            additionalRating = 'medium-rating';
                        } else {
                            additionalRating = 'low-rating';
                        }

                        listItem.innerHTML = `
                            <img src="${item.image_path || 'https://via.placeholder.com/50'}" alt="${item.name}">
                            <div class="suggestion-details">
                                <div> 
                                    <div class="titleType"> 
                                        <div class="title">${item.name}</div>
                                        <div class="suggestion-type"> ${item.type}</div>
                                    </div>
                                    <div class="info">
                                        <div> <strong> Theme: </strong> ${item.theme} </div>
                                        <div> <strong> Company: </strong> ${item.company_name} </div>
                                    </div>
                                </div>
                                <div> 
                                    <p class="suggestionRating ${additionalRating}">
                                        <strong>
                                            ${item.rating}/5
                                        </strong>
                                    </p>
                                </div>
                            </div>
                        `;
                        listItem.addEventListener('click', function () {
                            window.location.href = `/view-content/${item.id}`;
                        });

                        suggestionsList.appendChild(listItem);
                    });

                    showSuggestions();
                })
                .catch(err => console.error('Error fetching search results:', err));
        } else {
            hideSuggestions();
        }
    });

    document.addEventListener('click', function (event) {
        if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
            hideSuggestions();
        }
    });
});


const nameInput = document.getElementById('name');
const suggestionBox = document.createElement('div');
suggestionBox.id = 'suggestion-box';
document.body.appendChild(suggestionBox);

nameInput.addEventListener('input', async (e) => {
    const query = e.target.value;
    suggestionBox.innerHTML = ''; // Clear previous suggestions
    if (query.length < 2) return; // Wait until at least 2 characters are typed

    try {
        const response = await fetch(`/api/reviews/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');

        const suggestions = await response.json();
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.textContent = suggestion.name;
            suggestionItem.className = 'suggestion-item';

            // On click, populate the form with the selected review's data
            suggestionItem.addEventListener('click', () => {
                nameInput.value = suggestion.name;
                document.querySelector('select[name="type"]').value = suggestion.type;
                document.querySelector('select[name="age"]').value = suggestion.age;
                document.querySelector('select[name="rating"]').value = suggestion.rating;
                document.querySelector('textarea[name="content"]').value = suggestion.content;
                document.querySelector('input[name="company_name"]').value = suggestion.company_name;
                document.querySelector('input[name="theme"]').value = suggestion.theme;
                suggestionBox.innerHTML = ''; // Clear suggestions after selection
            });

            suggestionBox.appendChild(suggestionItem);
        });

        // Position the suggestion box near the input
        const rect = nameInput.getBoundingClientRect();
        suggestionBox.style.position = 'absolute';
        suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        suggestionBox.style.width = `${rect.width}px`;
        suggestionBox.style.border = '1px solid #ccc';
        suggestionBox.style.backgroundColor = 'white';
        suggestionBox.style.zIndex = '1000';
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
});

// Hide the suggestion box if clicked outside
document.addEventListener('click', (e) => {
    if (!nameInput.contains(e.target) && !suggestionBox.contains(e.target)) {
        suggestionBox.innerHTML = '';
    }
});