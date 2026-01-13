class ListComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
                button {
                    cursor: pointer;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    background-color: #dc3545;
                    color: white;
                    font-weight: bold;
                    transition: background-color 0.2s;
                }
                button:hover {
                    background-color: #c82333;
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
        this.tbody = this.shadowRoot.querySelector('tbody');
        this.tfoot = this.shadowRoot.querySelector('tfoot');
    }

    addItem(item) {
        this.items.push(item);
        const energy = item.foodNutrients.find(n => n.nutrientId === 1008)?.value || 0;
        const protein = item.foodNutrients.find(n => n.nutrientId === 1003)?.value || 0;
        const fat = item.foodNutrients.find(n => n.nutrientId === 1004)?.value || 0;
        const carbs = item.foodNutrients.find(n => n.nutrientId === 1005)?.value || 0;

        const row = document.createElement('tr');
        row.dataset.fdcid = item.fdcId;
        row.innerHTML = `
            <td>${item.description}</td>
            <td>${energy}</td>
            <td>${protein}</td>
            <td>${fat}</td>
            <td>${carbs}</td>
            <td><button>Remove</button></td>
        `;

        row.querySelector('button').addEventListener('click', () => {
            this.removeItem(item.fdcId);
        });

        this.tbody.appendChild(row);
        this.updateSummary();
    }

    removeItem(fdcId) {
        this.items = this.items.filter(item => item.fdcId !== fdcId);
        const row = this.tbody.querySelector(`tr[data-fdcid="${fdcId}"]`);
        if (row) {
            this.tbody.removeChild(row);
        }
        this.updateSummary();
    }

    updateSummary() {
        const totalEnergy = this.items.reduce((acc, item) => acc + (item.foodNutrients.find(n => n.nutrientId === 1008)?.value || 0), 0);
        const totalProtein = this.items.reduce((acc, item) => acc + (item.foodNutrients.find(n => n.nutrientId === 1003)?.value || 0), 0);
        const totalFat = this.items.reduce((acc, item) => acc + (item.foodNutrients.find(n => n.nutrientId === 1004)?.value || 0), 0);
        const totalCarbs = this.items.reduce((acc, item) => acc + (item.foodNutrients.find(n => n.nutrientId === 1005)?.value || 0), 0);

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

customElements.define('list-component', ListComponent);
