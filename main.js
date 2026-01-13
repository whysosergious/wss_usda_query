// Contents of components/search-component.js
class SearchComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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
                    max-height: 200px; /* Added for scrollability */
                    overflow-y: auto; /* Added for scrollability */
                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                    z-index: 1;
                    border-radius: 4px;
                    /* overflow: hidden; */ /* This was the conflicting property */
                    margin-top: 0.5rem;
                }
                .dropdown-content a {
                    color: black;
                    padding: 12px 16px;
                    text-decoration: none;
                    display: block;
                    border-bottom: 1px solid #f1f1f1;
                    line-height: 1.4; /* Added for better spacing with details */
                }
                .dropdown-content a .details { /* New style for additional details */
                    font-size: 0.8em;
                    color: #888;
                    display: block;
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
    this.apiKey = "";
    this.selectedIndex = -1; // Initialize selected index for keyboard navigation
  }

  connectedCallback() {
    this.input = this.shadowRoot.querySelector("input");
    this.dropdownContent = this.shadowRoot.querySelector(".dropdown-content");
    this.input.addEventListener("keyup", this.onKeyUp.bind(this));
    this.input.addEventListener("keydown", this.onKeyDown.bind(this)); // Add keydown listener
    this.input.addEventListener("focus", this.onFocus.bind(this));
    this.input.addEventListener("blur", this.onBlur.bind(this));
    window.addEventListener("resize", this._calculateDropdownHeight.bind(this));
    this._calculateDropdownHeight(); // Initial calculation
  }

  disconnectedCallback() {
    this.input.removeEventListener("keyup", this.onKeyUp.bind(this));
    this.input.removeEventListener("keydown", this.onKeyDown.bind(this)); // Remove keydown listener
    this.input.removeEventListener("focus", this.onFocus.bind(this));
    this.input.removeEventListener("blur", this.onBlur.bind(this));
    window.removeEventListener("resize", this._calculateDropdownHeight.bind(this));
  }

  onKeyDown(e) {
    console.log("Keydown event:", e.key, "selectedIndex:", this.selectedIndex);
    const items = Array.from(this.dropdownContent.children);
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      this._highlightSelectedItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      this._highlightSelectedItem(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (this.selectedIndex !== -1) {
        items[this.selectedIndex].click();
      }
    } else if (e.key === "Escape") {
      this.dropdownContent.style.display = "none";
      this.selectedIndex = -1;
    }
  }

  _highlightSelectedItem(items) {
    console.log("Highlighting item:", this.selectedIndex);
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.style.backgroundColor = "#e9ecef"; // Highlight color
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.style.backgroundColor = "";
      }
    });
  }

  onFocus() {
    if (this.dropdownContent.children.length > 0) {
      this.dropdownContent.style.display = "block";
      this._calculateDropdownHeight(); // Recalculate on focus/open
    }
  }

  onBlur() {
    // Delay hiding to allow click events on dropdown items to register
    setTimeout(() => {
      this.dropdownContent.style.display = "none";
    }, 100);
  }

  _calculateDropdownHeight() {
    // Calculate available space from the bottom of the input to the bottom of the viewport
    const inputRect = this.input.getBoundingClientRect();
    const availableHeight = window.innerHeight - inputRect.bottom - 20; // 20px margin from bottom

    this.dropdownContent.style.maxHeight = `${availableHeight}px`;
  }

  onKeyUp(e) {
    this.selectedIndex = -1; // Reset selected index on new input
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.search(this.input.value);
    }, 300);
  }

  async search(query) {
    if (!this.apiKey) {
      console.error("API key is not set.");
      return;
    }

    if (query.length < 3) {
      this.dropdownContent.style.display = "none";
      return;
    }

    if (this.cache[query]) {
      this.renderResults(this.cache[query]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${this.apiKey}&query=${query}`,
      );
      const data = await response.json();
      const foods = data.foods || [];
      this.cache[query] = foods;
      this.renderResults(foods);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  renderResults(results) {
    this.dropdownContent.innerHTML = "";
    this.selectedIndex = -1; // Reset selected index on new results

    if (results && results.length) {
      this.dropdownContent.style.display = "block";
      console.log("Dropdown displayed with", results.length, "items.");
      this._calculateDropdownHeight(); // Recalculate height when content changes
      results.forEach((result) => {
        const a = document.createElement("a");
        a.href = "#";
        a.innerHTML = `
          ${result.description}
          <span class="details">
            ${result.brandOwner ? `Brand: ${result.brandOwner}` : ""}
            ${result.foodCategory ? `Category: ${result.foodCategory}` : ""}
          </span>
        `;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          console.log("Dispatching item-selected event for:", result.description);
          this.dispatchEvent(
            new CustomEvent("item-selected", { detail: result }),
          );
          this.dropdownContent.style.display = "none";
          this.input.value = "";
        });
        this.dropdownContent.appendChild(a);
      });
    } else {
      this.dropdownContent.style.display = "none";
      this.selectedIndex = -1; // Reset if no results or hidden
    }
  }
}

// Contents of components/list-component.js
class ListComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                th, td {
                    border-bottom: 1px solid #ddd;
                    padding: 12px 15px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                tbody tr:hover {
                    background-color: #f1f1f1;
                }
                tfoot {
                    font-weight: bold;
                }
                tfoot td {
                    border-top: 2px solid #333;
                }
                button.remove-btn {
                    background-color: #dc3545;
                }
                button.remove-btn:hover {
                    background-color: #c82333;
                }
                button.view-btn {
                    background-color: #007bff;
                    margin-right: 5px;
                }
                button.view-btn:hover {
                    background-color: #0056b3;
                }
            </style>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Kcal</th>
                        <th>Protein</th>
                        <th>Fat</th>
                        <th>Carbs</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                    <tr>
                        <td>Total</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        `;

    this.items = [];
    this.tbody = this.shadowRoot.querySelector("tbody");
    this.tfoot = this.shadowRoot.querySelector("tfoot");
  }

  addItem(item) {
    console.log("Adding item to list:", item.description);
    this.items.push(item);
    const energy =
      item.foodNutrients.find((n) => n.nutrientId === 1008)?.value || 0;
    const protein =
      item.foodNutrients.find((n) => n.nutrientId === 1003)?.value || 0;
    const fat =
      item.foodNutrients.find((n) => n.nutrientId === 1004)?.value || 0;
    const carbs =
      item.foodNutrients.find((n) => n.nutrientId === 1005)?.value || 0;

    const row = document.createElement("tr");
    row.dataset.fdcid = item.fdcId;
    row.innerHTML = `
            <td>${item.description}</td>
            <td>${energy}</td>
            <td>${protein}</td>
            <td>${fat}</td>
            <td>${carbs}</td>
            <td>
                <button class="view-btn">View</button>
                <button class="remove-btn">Remove</button>
            </td>
        `;

    row.querySelector(".view-btn").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent('view-item-details', { detail: item, bubbles: true, composed: true }));
    });

    row.querySelector(".remove-btn").addEventListener("click", () => {
      this.removeItem(item.fdcId);
    });

    this.tbody.appendChild(row);
    this.updateSummary();
  }

  removeItem(fdcId) {
    this.items = this.items.filter((item) => item.fdcId !== fdcId);
    const row = this.tbody.querySelector(`tr[data-fdcid="${fdcId}"]`);
    if (row) {
      this.tbody.removeChild(row);
    }
    this.updateSummary();
  }

  updateSummary() {
    const totalEnergy = this.items.reduce(
      (acc, item) =>
        acc +
        (item.foodNutrients.find((n) => n.nutrientId === 1008)?.value || 0),
      0,
    );
    const totalProtein = this.items.reduce(
      (acc, item) =>
        acc +
        (item.foodNutrients.find((n) => n.nutrientId === 1003)?.value || 0),
      0,
    );
    const totalFat = this.items.reduce(
      (acc, item) =>
        acc +
        (item.foodNutrients.find((n) => n.nutrientId === 1004)?.value || 0),
      0,
    );
    const totalCarbs = this.items.reduce(
      (acc, item) =>
        acc +
        (item.foodNutrients.find((n) => n.nutrientId === 1005)?.value || 0),
      0,
    );

    this.tfoot.innerHTML = `
            <tr>
                <td>Total</td>
                <td>${totalEnergy.toFixed(2)}</td>
                <td>${totalProtein.toFixed(2)}</td>
                <td>${totalFat.toFixed(2)}</td>
                <td>${totalCarbs.toFixed(2)}</td>
                <td></td>
            </tr>
        `;
  }
}

class ItemModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background-color: #fff;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    position: relative;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    color: #333;
                }
                .modal-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 1.5rem;
                    cursor: pointer;
                    background: none;
                    border: none;
                    padding: 5px;
                    line-height: 1;
                }
                .modal-close:hover {
                    color: #dc3545;
                }
                pre {
                    background-color: #f8f8f8;
                    border: 1px solid #ddd;
                    padding: 10px;
                    border-radius: 4px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-size: 0.9em;
                }
                h3 {
                    margin-top: 0;
                    color: #007bff;
                }
            </style>
            <div class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close">&times;</button>
                    <h3>Item Details</h3>
                    <pre id="item-data"></pre>
                </div>
            </div>
        `;
        this._item = null;
    }

    connectedCallback() {
        this.shadowRoot.querySelector('.modal-close').addEventListener('click', this._closeModal.bind(this));
        this.shadowRoot.querySelector('.modal-overlay').addEventListener('click', this._handleOverlayClick.bind(this));
        this.shadowRoot.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation()); // Prevent content clicks from closing modal
    }

    disconnectedCallback() {
        this.shadowRoot.querySelector('.modal-close').removeEventListener('click', this._closeModal.bind(this));
        this.shadowRoot.querySelector('.modal-overlay').removeEventListener('click', this._handleOverlayClick.bind(this));
        this.shadowRoot.querySelector('.modal-content').removeEventListener('click', (e) => e.stopPropagation());
    }

    set item(data) {
        this._item = data;
        if (this._item) {
            this.shadowRoot.getElementById('item-data').textContent = JSON.stringify(this._item, null, 2);
            this.shadowRoot.querySelector('h3').textContent = `Details for ${this._item.description || 'Item'}`;
        }
    }

    _closeModal() {
        this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
    }

    _handleOverlayClick() {
        this._closeModal();
    }
}

// Define custom elements
customElements.define("search-component", SearchComponent);
customElements.define("list-component", ListComponent);
customElements.define("item-modal", ItemModal); // Define the new modal component

// Main script logic
const searchComponent = document.querySelector("search-component");
const listComponent = document.querySelector("list-component");

const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key');
const apiKeyStatus = document.querySelector('.api-key-status');

const LOCAL_STORAGE_API_KEY = 'usda_api_key';

// Load API key from local storage on startup
let storedApiKey = localStorage.getItem(LOCAL_STORAGE_API_KEY);
if (storedApiKey) {
    searchComponent.apiKey = storedApiKey;
    apiKeyInput.value = storedApiKey;
    apiKeyStatus.textContent = 'API Key loaded from local storage.';
    apiKeyStatus.style.color = '#28a745'; // Green for success
} else {
    apiKeyStatus.textContent = 'No API Key found. Please enter and save your key.';
    apiKeyStatus.style.color = '#dc3545'; // Red for warning
}

// Save API key to local storage when button is clicked
saveApiKeyButton.addEventListener('click', () => {
    const newKey = apiKeyInput.value.trim();
    if (newKey) {
        localStorage.setItem(LOCAL_STORAGE_API_KEY, newKey);
        searchComponent.apiKey = newKey;
        apiKeyStatus.textContent = 'API Key saved successfully!';
        apiKeyStatus.style.color = '#28a745'; // Green
    } else {
        apiKeyStatus.textContent = 'API Key cannot be empty.';
        apiKeyStatus.style.color = '#dc3545'; // Red
    }
});


searchComponent.addEventListener("item-selected", (e) => {
  console.log("item-selected event received in main.js for:", e.detail.description);
  listComponent.addItem(e.detail);
});

listComponent.addEventListener("view-item-details", (e) => {
    const modal = document.createElement('item-modal');
    modal.item = e.detail;
    document.body.appendChild(modal);

    modal.addEventListener('close-modal', () => {
        document.body.removeChild(modal);
    });
});
