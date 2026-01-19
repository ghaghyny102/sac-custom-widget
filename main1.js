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
      this._props = { selectedID: "" };
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

    render() {
      if (!window.echarts) return;
      const chartContainer = this.shadowRoot.getElementById("chart-container");
      
      if (!this._myChart) {
        this._myChart = echarts.init(chartContainer);
        window.onresize = () => { if (this._myChart) this._myChart.resize(); };

        this._myChart.on('click', (params) => {
            console.log("Clicked:", params.name);
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: { properties: { selectedID: params.name } }
            }));
            this.dispatchEvent(new Event("onSelect"));
        });
      }

      // ชุดคู่สี Gradient
      const colorPalette = [
          ['#83bff6', '#188df0'], // ฟ้า
          ['#7affa3', '#30cf5f'], // เขียว
          ['#ffe082', '#ffb300'], // เหลือง
          ['#ff8a80', '#d50000'], // แดง
          ['#ea80fc', '#aa00ff'], // ม่วง
          ['#80d8ff', '#0091ea']  // ฟ้าคราม
      ];

      // Prepare Data
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
         axisData = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
         seriesData = [50, 80, 45, 90, 60, 70, 30, 40, 55, 88];
      }

      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { 
            left: '3%', 
            right: '4%', 
            bottom: '15%', // *เผื่อพื้นที่ด้านล่างให้ Slider Bar*
            top: '3%', 
            containLabel: true 
        },
        
        // ---------------------------------------------------------
        // [ส่วนที่เพิ่ม] DataZoom: ให้ซูมและเลื่อนได้
        // ---------------------------------------------------------
        dataZoom: [
            {
                type: 'inside',   // 1. ซูมด้วยการ Scroll Mouse
                xAxisIndex: 0,    // ให้ซูมแค่แกน X (แกน Y ไม่ต้องซูม)
                start: 0,         // เริ่มต้นที่ 0%
                end: 100          // จบที่ 100% (โชว์ทั้งหมดก่อน)
            },
            {
                type: 'slider',   // 2. มีแถบ Slider ให้เลื่อนด้านล่าง
                xAxisIndex: 0,
                bottom: 0,
                height: 20
            }
        ],
        // ---------------------------------------------------------

        xAxis: { type: 'category', data: axisData, axisLabel: { color: '#000', interval: 0 } },
        yAxis: { type: 'value', axisLine: { show: false }, splitLine: { show: true, lineStyle: { type: 'solid', color: '#eee' } } },
        series: [
          {
            type: 'bar',
            data: seriesData,
            itemStyle: {
              color: function (params) {
                  var colorPair = colorPalette[params.dataIndex % colorPalette.length];
                  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: colorPair[0] }, 
                      { offset: 1, color: colorPair[1] } 
                  ]);
              }
            },
            emphasis: { focus: 'series' }
          }
        ]
      };

      this._myChart.setOption(option);
    }
  }

  customElements.define("com-sap-sample-echarts-bar-gradient-binding", CustomBarChart);
})();
