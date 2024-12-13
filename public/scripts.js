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
