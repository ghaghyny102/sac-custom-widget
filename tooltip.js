(function() {
    const rowTemplate = document.createElement('template');
    rowTemplate.innerHTML = `
        <div class="tooltip-row">
            <img class="entry-icon" width="22" height="22">
            <div class="tooltip-row-label">
                <span class="entry-label"></span>
            </div>
        </div>
    `;

    const containerTemplate = document.createElement('template');
    containerTemplate.innerHTML = `
        <style>
            :host { display: block; min-width: 80px; max-width: 250px; min-height: 24px; font-family: "72", Arial, Helvetica, sans-serif; }
            .tooltip-container { padding: 12px; display: flex; flex-flow: column nowrap; background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.2); border-radius: 4px; }
            .tooltip-row { display: flex; min-height: 30px; flex-flow: row nowrap; align-items: center; border-bottom: 1px solid #eee; }
            .tooltip-row:last-child { border-bottom: none; }
            .entry-icon { padding-right: 12px; }
            .entry-label { flex: auto; font-size: 14px; color: #333; }
            .tooltip-row-label { display: flex; flex-flow: column nowrap; flex: auto; }
            progress { height: 6px; width: 100%; border-radius: 0; margin-top: 4px; }
            progress::-webkit-progress-bar { background-color: #eee; }
            progress::-webkit-progress-value { background-color: lightblue; }
        </style>
        <div class="tooltip-container"></div>
    `;

    const tooltipIconMap = {
        'Location': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/Location.png',
        'Product': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/Product.png',
        'Sales Manager': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/SalesManager.png',
        'Date': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/Date.png',
        'Store': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/Store.png',
        'Quantity Sold': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/Quantity.png',
        'Gross Margin': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/GrossMargin.png',
        'Info': 'https://fp68static.cfapps.eu10-004.hana.ondemand.com/sap-icons/Info.png'
    };

    const tooltipEntryToRow = (entry, withPercentageBar = false, max = 100) => {
        const rowElement = rowTemplate.content.cloneNode(true);
        const iconEl = rowElement.querySelector('.entry-icon');
        const labelEl = rowElement.querySelector('.entry-label');
        
        // หาไอคอนจาก Map ถ้าไม่มีให้ใช้ Info
        const iconUrl = tooltipIconMap[entry.name] || tooltipIconMap[entry.value] || tooltipIconMap['Info'];
        iconEl.setAttribute('src', iconUrl);
        
        labelEl.textContent = `${entry.name}: ${entry.value}`; // โชว์ชื่อและค่า

        if (withPercentageBar) {
            // ดึงตัวเลขจากค่า (เช่น "17.12 Million" -> 17.12)
            const numMatch = /[0-9.]+/.exec(entry.value);
            if (numMatch) {
                const percentageBar = document.createElement('progress');
                percentageBar.value = parseFloat(numMatch[0]);
                percentageBar.max = max;
                rowElement.querySelector('.tooltip-row-label').appendChild(percentageBar);
            }
        }
        return rowElement;
    };

    class VizTooltip extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: 'open' });
            this._shadowRoot.appendChild(containerTemplate.content.cloneNode(true));
            this._tooltipContainer = this._shadowRoot.querySelector('.tooltip-container');
            this._props = {};
            this._max = 100;
            this._color = 'lightblue';
        }

        render() {
            this._tooltipContainer.innerHTML = '';
            
            // วาด Header (บรรทัดแรก)
            if (this._props.header) {
                this._tooltipContainer.appendChild(tooltipEntryToRow(this._props.header, true, this._max));
            }
            
            // วาด Details (บรรทัดถัดๆ มา)
            if (this._props.details) {
                this._props.details.forEach(row => {
                    this._tooltipContainer.appendChild(tooltipEntryToRow(row));
                });
            }

            // เปลี่ยนสี Progress Bar ตามค่าที่ตั้งไว้
            if (this._color) {
                const styleSheet = this._shadowRoot.querySelector('style');
                styleSheet.innerHTML += ` progress::-webkit-progress-value { background-color: ${this._color} !important; }`;
            }
        }

        setExtensionData(value) {
            this._props = value;
            this.render();
        }

        set max(value) { this._max = value; this.render(); }
        set color(value) { this._color = value; this.render(); }
    }

    customElements.define('viz-tooltip', VizTooltip);
})();