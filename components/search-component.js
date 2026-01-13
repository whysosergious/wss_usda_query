class SearchComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .dropdown {
                    position: relative;
                    width: 100%;
                }
                input {
                    width: 100%;
                    padding: 0.8rem;
                    font-size: 1rem;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-sizing: border-box;
                }
                .dropdown-content {
                    display: none;
                    position: absolute;
                    background-color: #fff;
                    width: 100%;
                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                    z-index: 1;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 0.5rem;
                }
                .dropdown-content a {
                    color: black;
                    padding: 12px 16px;
                    text-decoration: none;
                    display: block;
                    border-bottom: 1px solid #f1f1f1;
                }
                .dropdown-content a:last-child {
                    border-bottom: none;
                }
                .dropdown-content a:hover {
                    background-color: #f1f1f1;
                }
            </style>
            <div class="dropdown">
                <input type="text" placeholder="Search for a food...">
                <div class="dropdown-content">
                </div>
            </div>
        `;

        this.cache = {};
        this.debounceTimeout = null;
        this.apiKey = '';
    }

    connectedCallback() {
        this.input = this.shadowRoot.querySelector('input');
        this.dropdownContent = this.shadowRoot.querySelector('.dropdown-content');
        this.input.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    disconnectedCallback() {
        this.input.removeEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyUp(e) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.search(e.target.value);
        }, 300);
    }

    async search(query) {
        if (!this.apiKey) {
            console.error('API key is not set.');
            return;
        }

        if (query.length < 3) {
            this.dropdownContent.style.display = 'none';
            return;
        }

        if (this.cache[query]) {
            this.renderResults(this.cache[query]);
            return;
        }

        try {
            const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${this.apiKey}&query=${query}`);
            const data = await response.json();
            this.cache[query] = data.foods;
            this.renderResults(data.foods);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    renderResults(results) {
        this.dropdownContent.innerHTML = '';
        if (results.length) {
            this.dropdownContent.style.display = 'block';
            results.forEach(result => {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = result.description;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.dispatchEvent(new CustomEvent('item-selected', { detail: result }));
                    this.dropdownContent.style.display = 'none';
                    this.input.value = '';
                });
                this.dropdownContent.appendChild(a);
            });
        } else {
            this.dropdownContent.style.display = 'none';
        }
    }
}

customElements.define('search-component', SearchComponent);
