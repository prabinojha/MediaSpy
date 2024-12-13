// Script to handle suggestions being shown to the user
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const suggestionsList = document.getElementById("suggestions-list");

    function showSuggestions() {
        suggestionsList.style.display = 'block';
    }

    function hideSuggestions() {
        suggestionsList.style.display = 'none';
    }

    searchInput.addEventListener("input", function () {
        showSuggestions();
    });

    document.addEventListener("click", function (event) {
        if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
            hideSuggestions();
        }
    });

    // Prevent click events within the search container from hiding the suggestions
    searchInput.addEventListener("click", function (event) {
        event.stopPropagation();
        showSuggestions();
    });

    suggestionsList.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    const data = [
        {
            image: 'https://via.placeholder.com/50',
            title: 'Inception',
            genre: 'Sci-Fi',
            rating: '8.8',
            age: '13+'
        },
        {
            image: 'https://via.placeholder.com/50',
            title: 'The Witcher 3: Wild Hunt',
            genre: 'RPG',
            rating: '9.5',
            age: '18+'
        },
        {
            image: 'https://via.placeholder.com/50',
            title: 'Toy Story',
            genre: 'Animation',
            rating: '8.3',
            age: 'G'
        },
    ];

    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        suggestionsList.innerHTML = '';

        if (query) {
            const filteredData = data.filter(item =>
                item.title.toLowerCase().includes(query)
            );

            filteredData.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <img src="${item.image}" alt="${item.title}">
                    <div class="suggestion-details">
                        <div class="title">${item.title}</div>
                        <div class="info">Genre: ${item.genre} | Rating: ${item.rating} | Age: ${item.age}</div>
                    </div>
                `;

                listItem.addEventListener('click', function () {
                    // Redirect to that review --> /view-content/id
                    console.log(item.title);
                });

                suggestionsList.appendChild(listItem);
            });
        }
    });
});