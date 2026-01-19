var getScriptPromisify = (src) => {
  return new Promise((resolve) => {
    $.getScript(src, resolve);
  });
};

(function () {
  const template = document.createElement("template");
  template.innerHTML = `
        <style>
            #chart-container { width: 100%; height: 100%; }
        </style>
        <div id="chart-container"></div>
    `;

  class CustomBarChart extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this._firstConnection = 0;
      this._myChart = null;
      this._props = {
          startColor: "#83bff6",
          endColor: "#188df0",
          selectedID: "" // เก็บค่าที่คลิก
      };
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      if (this._firstConnection === 0) {
        this._firstConnection = 1;
        getScriptPromisify("https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js").then(() => {
          this.render();
        });
      } else {
        this.render();
      }
    }

    setColors(newStartColor, newEndColor) {
        this._props.startColor = newStartColor;
        this._props.endColor = newEndColor;
        this.render();
    }

    render() {
      if (!window.echarts) return;
      const chartContainer = this.shadowRoot.getElementById("chart-container");
      
      if (!this._myChart) {
        this._myChart = echarts.init(chartContainer);
        window.onresize = () => { if (this._myChart) this._myChart.resize(); };

        // ----------------------------------------------------
        // [เพิ่มใหม่] ดักจับการคลิก (Click Event)
        // ----------------------------------------------------
        this._myChart.on('click', (params) => {
            // params.name คือชื่อแท่งกราฟที่คลิก (เช่น "Janet Bury")
            console.log("Clicked:", params.name);

            // 1. อัปเดตค่า selectedID กลับไปที่ SAC
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                        selectedID: params.name
                    }
                }
            }));

            // 2. ส่งสัญญาณ Event "onSelect" ให้ SAC รู้ตัว
            this.dispatchEvent(new Event("onSelect"));
        });
      }

      // --- Data Binding Logic ---
      let axisData = [];
      let seriesData = [];
      if (this._props.myData && this._props.myData.state === "success") {
        const data = this._props.myData.data;
        data.forEach(row => {
            let label = row["dimensions_0"] ? row["dimensions_0"].label : "";
            let value = row["measures_0"] ? row["measures_0"].raw : 0;
            axisData.push(label);
            seriesData.push(value);
        });
      } else {
         // Dummy Data
         axisData = ["A", "B", "C"];
         seriesData = [10, 20, 15];
      }

      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'category', data: axisData, axisLabel: { color: '#000' } },
        yAxis: { type: 'value', axisLine: { show: false }, splitLine: { show: true, lineStyle: { type: 'solid', color: '#eee' } } },
        series: [
          {
            type: 'bar',
            data: seriesData,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: this._props.startColor }, 
                { offset: 0.5, color: this._props.endColor },
                { offset: 1, color: this._props.endColor }
              ])
            }
          }
        ]
      };

      this._myChart.setOption(option);
    }
  }

  customElements.define("com-example-gradient-bar", CustomBarChart);
})();
