let currentDataIndex = 0;
const increment = 50;
let data = [];
let detailsData = [];
let filteredData = [];

document.addEventListener('DOMContentLoaded', function () {
    const loadMoreBtn = document.getElementById('load-more');
    const searchInput = document.getElementById('search-input');
    const dataCountElement = document.getElementById('data-count');

    // Modal elements
    const modal = document.getElementById('detail-modal');
    const modalContent = document.getElementById('modal-body');
    const closeModalBtn = document.getElementsByClassName('close-btn')[0];

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        filteredData = data.filter(opportunity => {
            return opportunity.name.toLowerCase().includes(searchTerm) ||
                opportunity.location.toLowerCase().includes(searchTerm) ||
                opportunity.mitra_name.toLowerCase().includes(searchTerm) ||
                opportunity.mitra_brand_name.toLowerCase().includes(searchTerm);
        });
        currentDataIndex = 0;
        displayData(true);
    });

    closeModalBtn.onclick = function () {
        modal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    function loadData() {
        Promise.all([
            fetch('data/opportunities.json').then(response => response.json()),
            fetch('data/position_details.json').then(response => response.json())
        ])
            .then(([opportunitiesData, positionDetailsData]) => {
                data = opportunitiesData;
                detailsData = positionDetailsData;
                filteredData = data;
                dataCountElement.textContent = data.length;
                displayData(true);
            })
            .catch(error => console.error('Error loading the data:', error));
    }

    function formatTitle(title) {
        const words = title.split(' ');
        if (words.length > 3) {
            return words.slice(0, 3).join(' ') + '<br>' + words.slice(3).join(' ');
        }
        return title;
    }

    function displayData(reset = false) {
        const container = document.getElementById('data-container');
        if (reset) container.innerHTML = '';
        const endIndex = Math.min(currentDataIndex + increment, filteredData.length);
        for (let i = currentDataIndex; i < endIndex; i++) {
            const opportunity = filteredData[i];
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
                </div>
            `;
            container.innerHTML += cardHTML;
        }

        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                const detail = detailsData.find(d => d.id === id);
                if (detail) {
                    showModal(detail, this.querySelector('img').src);
                }
            });
        });

        currentDataIndex += increment;
        if (currentDataIndex >= filteredData.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    function showModal(detail, logoSrc) {
        modalContent.innerHTML = `
            <div class="row">
                <div class="left-column">
                    <img src="${logoSrc}" alt="${detail.mitra_brand_name}">
                    <h2>${detail.name}</h2>
                    <p>${detail.additional_title}</p>
                    <p>${detail.id}</p>
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


    loadMoreBtn.addEventListener('click', () => displayData());

    loadData();
});
