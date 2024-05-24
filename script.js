document.addEventListener('DOMContentLoaded', function () {
    const loadMoreBtn = document.getElementById('load-more');
    const searchInput = document.getElementById('search-input');
    const dataCountElement = document.getElementById('data-count');
    const modal = document.getElementById('detail-modal');
    const modalContent = document.getElementById('modal-body');
    const closeModalBtn = document.getElementsByClassName('close-btn')[0];
    const allTab = document.getElementById('all-tab');
    const favoritesTab = document.getElementById('favorites-tab');
    const dataContainer = document.getElementById('data-container');
    const favoritesContainer = document.getElementById('favorites-container');

    let currentDataIndex = 0;
    const increment = 50;
    let data = [];
    let detailsData = [];
    let filteredData = [];

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        filteredData = data.filter(opportunity => {
            const details = detailsData.find(detail => detail.id === opportunity.id) || {};
            return isMatch(opportunity, searchTerm) || isMatch(details, searchTerm);
        });
        currentDataIndex = 0;
        displayData(true);
    });

    closeModalBtn.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    allTab.onclick = function () {
        toggleView('all');
    };

    favoritesTab.onclick = function () {
        toggleView('favorites');
    };

    function isMatch(item, searchTerm) {
        for (let key in item) {
            if (typeof item[key] === 'string' && item[key].toLowerCase().includes(searchTerm)) {
                return true;
            } else if (typeof item[key] === 'object') {
                if (isMatch(item[key], searchTerm)) {
                    return true;
                }
            }
        }
        return false;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function loadData() {
        document.getElementById('loading-spinner').style.display = 'flex'; // Show spinner

        Promise.all([
            fetch('data/opportunities.json').then(response => response.json()),
            fetch('data/position_details.json').then(response => response.json())
        ])
            .then(([opportunitiesData, positionDetailsData]) => {
                data = opportunitiesData;
                shuffleArray(data);
                detailsData = positionDetailsData.map(detail => {
                    const opportunity = data.find(op => op.id === detail.id);
                    return { ...detail, mitra_id: opportunity ? opportunity.mitra_id : null };
                });
                filteredData = data;
                updateDataCount(data.length);
                displayData(true);
            })
            .catch(error => {
                console.error('Error loading the data:', error);
            })
            .finally(() => {
                document.getElementById('loading-spinner').style.display = 'none'; // Hide spinner
            });
    }

    function updateDataCount(count) {
        const dataCountElement = document.getElementById('data-count');
        dataCountElement.textContent = count;
    }

    function displayData(reset = false) {
        const container = document.getElementById('data-container');
        if (reset) container.innerHTML = '';
        const endIndex = Math.min(currentDataIndex + increment, filteredData.length);
        const favorites = loadFavorites();
        filteredData.slice(currentDataIndex, endIndex).forEach(opportunity => {
            const formattedTitle = formatTitle(opportunity.name);
            const isFavorite = favorites.includes(opportunity.id);
            const cardHTML = `
                <div class="card" data-id="${opportunity.id}">
                    <img src="${opportunity.logo}" alt="${opportunity.mitra_brand_name}">
                    <div class="card-content">
                        <div class="card-title">${formattedTitle}</div>
                        <div class="card-text"><strong>Partner:</strong> ${opportunity.mitra_brand_name}</div>
                        <div class="card-text"><strong>Location:</strong> ${opportunity.location}</div>
                        <div class="card-text"><strong>Duration:</strong> ${opportunity.months_duration} Month • MSIB</div>
                    </div>
                    <div class="badges">${opportunity.activity_type}</div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}"><i class="fas fa-heart"></i></button>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        addCardEventListeners();
        currentDataIndex += increment;
        loadMoreBtn.style.display = currentDataIndex >= filteredData.length ? 'none' : 'block';
    }

    function displayFavorites() {
        const container = document.getElementById('favorites-container');
        container.innerHTML = '';
        const favorites = loadFavorites();
        const favoriteData = data.filter(opportunity => favorites.includes(opportunity.id));
        favoriteData.forEach(opportunity => {
            const formattedTitle = formatTitle(opportunity.name);
            const cardHTML = `
                <div class="card" data-id="${opportunity.id}">
                    <img src="${opportunity.logo}" alt="${opportunity.mitra_brand_name}">
                    <div class="card-content">
                        <div class="card-title">${formattedTitle}</div>
                        <div class="card-text"><strong>Partner:</strong> ${opportunity.mitra_brand_name}</div>
                        <div class="card-text"><strong>Location:</strong> ${opportunity.location}</div>
                        <div class="card-text"><strong>Duration:</strong> ${opportunity.months_duration} Month • MSIB</div>
                    </div>
                    <div class="badges">${opportunity.activity_type}</div>
                    <button class="favorite-btn active"><i class="fas fa-heart"></i></button>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        addCardEventListeners();
    }

    function toggleView(view) {
        if (view === 'favorites') {
            displayFavorites();
            favoritesContainer.style.display = 'grid';
            dataContainer.style.display = 'none';
            allTab.classList.remove('active');
            favoritesTab.classList.add('active');
        } else {
            displayData(true);
            favoritesContainer.style.display = 'none';
            dataContainer.style.display = 'grid';
            allTab.classList.add('active');
            favoritesTab.classList.remove('active');
        }
    }

    function addCardEventListeners() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', function (event) {
                if (event.target.closest('.favorite-btn')) {
                    toggleFavorite(event.target.closest('.favorite-btn'), this.getAttribute('data-id'));
                    return;
                }

                const id = this.getAttribute('data-id');
                const detail = detailsData.find(d => d.id === id);
                if (detail) {
                    showModal(detail, this.querySelector('img').src);
                }
            });
        });
    }

    function toggleFavorite(button, id) {
        const favorites = loadFavorites();
        const index = favorites.indexOf(id);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(id);
        }
        saveFavorites(favorites);
        button.classList.toggle('active');

        if (favoritesContainer.style.display === 'grid') {
            displayFavorites();
        }
    }

    function formatTitle(title) {
        const words = title.split(' ');
        return words.length > 3 ? words.slice(0, 3).join(' ') + '<br>' + words.slice(3).join(' ') : title;
    }

    function showModal(detail, logoSrc) {
        modalContent.innerHTML = `
            <div class="row">
                <div class="left-column">
                    <img src="${logoSrc}" alt="${detail.mitra_brand_name}">
                    <h2>${detail.name}</h2>
                    <p>${detail.additional_title}</p>
                    <!-- Link with mitra_id and id -->
                    <p><a href="https://kampusmerdeka.kemdikbud.go.id/program/magang/browse/${detail.mitra_id}/${detail.id}" target="_blank">Go to MSIB page</a></p>
                    <p><strong>Start Duration:</strong> ${new Date(detail.activity_details.start_duration).toLocaleDateString()}</p>
                    <p><strong>End Duration:</strong> ${new Date(detail.activity_details.end_duration).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> ${detail.activity_details.location}</p>
                </div>
                <div class="right-column">
                    <p><strong>Requirement:</strong> ${detail.requirement}</p>
                    <h3>Activity Details</h3>
                    <p><strong>Name:</strong> ${detail.activity_details.name}</p>
                    <p><strong>Description:</strong> ${detail.activity_details.description}</p>
                    <p><strong>Additional Information:</strong> ${detail.activity_details.additional_information}</p>
                    <h3>Skills</h3>
                    <ul>
                        ${detail.skills.map(skill => `<li><strong>${skill.name}:</strong> ${skill.detail}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        modal.style.display = "block";
    }

    function loadFavorites() {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    }

    function saveFavorites(favorites) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    loadMoreBtn.addEventListener('click', () => displayData());
    loadData();
});
