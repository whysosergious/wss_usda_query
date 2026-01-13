import './components/search-component.js';
import './components/list-component.js';

const searchComponent = document.querySelector('search-component');
const listComponent = document.querySelector('list-component');

// IMPORTANT: Replace with your actual USDA API key.
// You can get a key from https://fdc.nal.usda.gov/api-key-signup.html
searchComponent.apiKey = 'YOUR_API_KEY';

if (searchComponent.apiKey === 'YOUR_API_KEY') {
    alert('Please replace "YOUR_API_KEY" with your actual USDA API key in main.js');
}

searchComponent.addEventListener('item-selected', (e) => {
    listComponent.addItem(e.detail);
});
