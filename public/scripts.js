document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const suggestionsList = document.getElementById("suggestions-list");

    function showSuggestions() {
        suggestionsList.style.display = 'block';
    }

    function hideSuggestions() {
        suggestionsList.style.display = 'none';
    }

    // Handle search input and request filtered data from the backend
    searchInput.addEventListener('input', function () {
        const query = this.value.trim();
        suggestionsList.innerHTML = ''; // Clear previous suggestions

        if (query) {
            // Fetch search results from the backend
            fetch(`/search?query=${query}`)
                .then(response => response.json())
                .then(data => {
                    const { movieResults, videoGameResults } = data;

                    // Combine the results into one list
                    const allResults = [...movieResults, ...videoGameResults];

                    allResults.forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `
                            <img src="${item.image_path || 'https://via.placeholder.com/50'}" alt="${item.name}">
                            <div class="suggestion-details">
                                <div class="title">${item.name}</div>
                                <div class="info">Genre: ${item.type === 'movie' ? item.genre : item.theme} | Rating: ${item.rating} | Age: ${item.age || 'N/A'}</div>
                            </div>
                        `;
                        listItem.addEventListener('click', function () {
                            console.log(item.name);
                            // You can add redirection here if needed
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

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (event) {
        if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
            hideSuggestions();
        }
    });
});
