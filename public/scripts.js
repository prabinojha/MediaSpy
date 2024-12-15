// Client-side javascript which will execute while client is running the website

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
                        let additionalRating;
                        // Check if averageRating exists and set the class accordingly
                        if (item.averageRating !== undefined) {
                            if (item.averageRating > 4) {
                                additionalRating = 'high-rating';
                            } else if (item.averageRating >= 3) {
                                additionalRating = 'medium-rating';
                            } else {
                                additionalRating = 'low-rating';
                            }
                        } else {
                            additionalRating = 'no-rating'; // Fallback for undefined averageRating
                        }

                        const listItem = document.createElement('li');
                        listItem.innerHTML = `
                            <img src="${item.image_path || 'https://via.placeholder.com/50'}" alt="${item.name}">
                            <div class="suggestion-details">
                                <div> 
                                    <div class="titleType"> 
                                        <div class="title">${item.name}</div>
                                        <div class="suggestion-type">${item.type}</div>
                                    </div>
                                    <div class="info">
                                        <div><strong>Theme:</strong> ${item.theme}</div>
                                        <div><strong>Company:</strong> ${item.company_name}</div>
                                    </div>
                                </div>
                                <div> 
                                    <p class="suggestionRating ${additionalRating}">
                                        <strong>${item.averageRating || 'N/A'}/5</strong>
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


const nameInput = document.getElementById('nameAdd');
const suggestionBox = document.createElement('div');
suggestionBox.id = 'suggestion-box';
document.body.appendChild(suggestionBox);

nameInput.addEventListener('input', async (e) => {
    const query = e.target.value;
    suggestionBox.innerHTML = '';
    if (query.length < 1) return;

    try {
        const response = await fetch(`/reviews/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');

        const suggestions = await response.json();
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.style.display = 'flex';
            suggestionItem.style.alignItems = 'center';
            suggestionItem.style.borderBottom = '1px solid #ccc';
            suggestionItem.style.padding = '8px';

            const img = document.createElement('img');
            img.src = suggestion.image_path; 
            img.alt = suggestion.name;
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.objectFit = 'cover';
            img.style.marginRight = '10px';

            const details = document.createElement('div');

            const name = document.createElement('strong');
            name.textContent = suggestion.name;
            name.style.display = 'block';

            const additionalDetails = document.createElement('span');
            additionalDetails.textContent = `${suggestion.company_name} | ${suggestion.theme}`;
            additionalDetails.style.fontSize = '12px';
            additionalDetails.style.color = '#555';

            details.appendChild(name);
            details.appendChild(additionalDetails);

            suggestionItem.appendChild(img);
            suggestionItem.appendChild(details);

            suggestionItem.addEventListener('click', () => {
                nameInput.value = suggestion.name;
                document.querySelector('select[name="type"]').value = suggestion.type;
                document.querySelector('select[name="age"]').value = suggestion.age;
                //document.querySelector('textarea[name="content"]').value = suggestion.content;
                document.querySelector('input[name="company_name"]').value = suggestion.company_name;
                document.querySelector('input[name="theme"]').value = suggestion.theme;

                nameInput.readOnly = true;
                document.querySelector('textarea[name="content"]').readOnly = true;
                document.querySelector('input[name="company_name"]').readOnly = true;
                document.querySelector('input[name="theme"]').readOnly = true;
                document.querySelector('input[name="image"]').disabled = true;

                const fileUploadSection = document.querySelector('input[name="image"]');
                fileUploadSection.style.display = 'none';

                const ratingField = document.querySelector('select[name="rating"]');
                ratingField.disabled = false;
                ratingField.style.backgroundColor = '#f4eaff';

                const reviewField = document.querySelector('textarea[name="content"]');
                reviewField.readOnly = false;
                reviewField.style.backgroundColor = '#f4eaff';

                suggestionBox.innerHTML = '';
            });

            suggestionBox.appendChild(suggestionItem);
        });

        const rect = nameInput.getBoundingClientRect();
        suggestionBox.style.position = 'absolute';
        suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        suggestionBox.style.width = `${rect.width}px`;
        suggestionBox.style.border = '1px solid #ccc';
        suggestionBox.style.backgroundColor = 'white';
        suggestionBox.style.zIndex = '1000';
        suggestionBox.style.maxHeight = '200px';
        suggestionBox.style.overflowY = 'auto';
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
});

document.addEventListener('click', (e) => {
    if (!nameInput.contains(e.target) && !suggestionBox.contains(e.target)) {
        suggestionBox.innerHTML = '';
    }
});
