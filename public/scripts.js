// Script to handle suggestions being shown to the user
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const suggestionsList = document.getElementById("suggestions-list");

    // Function to show suggestions
    function showSuggestions() {
        suggestionsList.style.display = 'block';
    }

    // Function to hide suggestions
    function hideSuggestions() {
        suggestionsList.style.display = 'none';
    }

    // Event listener to show suggestions when typing in the search bar
    searchInput.addEventListener("input", function () {
        showSuggestions();
    });

    // Event listener to hide suggestions when clicking outside the search container
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

    const dummyData = [
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
            const filteredData = dummyData.filter(item =>
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

                // Add event listener to log the title when clicked
                listItem.addEventListener('click', function () {
                    console.log(item.title);
                });

                suggestionsList.appendChild(listItem);
            });
        }
    });
});