document.getElementById("name").addEventListener("input", function () {
    let name = this.value;
    const type = document.querySelector("select[name='type']").value; // Get the selected type (movie/video_game)
    if (name.length >= 3) { // Start searching when at least 3 characters are entered
        fetch(`/suggestions?name=${name}&type=${type}`)
            .then(response => response.json())
            .then(data => {
                const suggestionsList = document.getElementById("suggestions");
                suggestionsList.innerHTML = ''; // Clear previous suggestions
                data.forEach(suggestion => {
                    const div = document.createElement("div");
                    div.innerHTML = `
                                <strong>${suggestion.name}</strong> (${suggestion.type === 'movie' ? 'Movie' : 'Video Game'})<br>
                                <span class="suggestion-details">
                                    Company: ${suggestion.company_name} | 
                                    Theme: ${suggestion.theme}
                                </span>
                            `;
                    div.onclick = () => {
                        // Autofill the form with selected suggestion
                        document.getElementById("name").value = suggestion.name;
                        document.querySelector("select[name='type']").value = suggestion.type;
                        document.querySelector("textarea[name='content']").value = suggestion.content;
                        document.querySelector("input[name='rating']").value = suggestion.rating;
                        document.querySelector("input[name='company_name']").value = suggestion.company_name;
                        document.querySelector("input[name='theme']").value = suggestion.theme;

                        // Make the fields readonly except for the content field
                        document.getElementById("name").readOnly = true;

                        type_value = suggestion.type;
                        if (type_value === 'movie') {
                            document.querySelector("select[name='type']").innerHTML = `
                                        <option value="movie">Movie</option>
                                        <option value="video_game" disabled>Video Game</option>
                                    `;
                        } else {
                            document.querySelector("select[name='type']").innerHTML = `
                                        <option value="movie" disabled>Movie</option>
                                        <option value="video_game">Video Game</option>
                                    `;
                        }

                        document.querySelector("input[name='company_name']").readOnly = true;
                        document.querySelector("input[name='theme']").readOnly = true;

                        // Make content field the only editable one
                        document.querySelector("textarea[name='content']").readOnly = false;
                        document.querySelector("input[name='rating']").readOnly = false;

                        // Clear suggestions
                        suggestionsList.innerHTML = '';
                    };
                    suggestionsList.appendChild(div);
                });
            });
    } else {
        document.getElementById("suggestions").innerHTML = ''; // Clear suggestions if input is too short
    }
});
