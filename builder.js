(function() {
    const template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host { display: block; padding: 10px; font-family: "72", Arial, Helvetica, sans-serif; }
            fieldset { border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
            legend { padding: 0 5px; font-weight: bold; color: #333; }
            table { width: 100%; }
            td { padding: 5px 0; }
            input { width: 90%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; }
        </style>
        <form id="form">
            <fieldset>
                <legend>Tooltip Settings</legend>
                <table>
                    <tr>
                        <td>Max Value</td>
                        <td><input id="bps_max" type="number" placeholder="100"></td>
                    </tr>
                    <tr>
                        <td>Bar Color</td>
                        <td><input id="bps_color" type="text" placeholder="red or #ff0000"></td>
                    </tr>
                </table>
                <input type="submit" style="display:none;">
            </fieldset>
        </form>
    `;

    class VizTooltipBuilderPanel extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));
            
            // เมื่อมีการพิมพ์ค่า ให้ส่งค่ากลับไปที่ Widget ทันที (ไม่ต้องกด Enter)
            this._shadowRoot.getElementById("bps_max").addEventListener("input", this._submit.bind(this));
            this._shadowRoot.getElementById("bps_color").addEventListener("input", this._submit.bind(this));
        }

        _submit(e) {
            if(e) e.preventDefault();
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                        color: this.color,
                        max: this.max
                    }
                }
            }));
        }

        set color(val) { this._shadowRoot.getElementById("bps_color").value = val; }
        get color() { return this._shadowRoot.getElementById("bps_color").value; }

        set max(val) { this._shadowRoot.getElementById("bps_max").value = val; }
        get max() { return this._shadowRoot.getElementById("bps_max").value; }
    }

    customElements.define("viz-tooltip-build", VizTooltipBuilderPanel);
})();