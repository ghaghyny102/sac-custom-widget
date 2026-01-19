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
      // _props ไม่จำเป็นต้องเก็บสี start/end แล้ว เพราะจะใช้จาก Palette แทน
      this._props = {
          selectedID: ""
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

    // ฟังก์ชัน setColors เดิมอาจจะไม่ได้ใช้แล้ว แต่เก็บไว้ไม่เสียหาย
    setColors(newStartColor, newEndColor) {
        // this._props.startColor = newStartColor;
        // this._props.endColor = newEndColor;
        // this.render();
        console.warn("setColors is disabled in multi-color mode");
    }

    render() {
      if (!window.echarts) return;
      const chartContainer = this.shadowRoot.getElementById("chart-container");
      
      if (!this._myChart) {
        this._myChart = echarts.init(chartContainer);
        window.onresize = () => { if (this._myChart) this._myChart.resize(); };

        // Click Event
        this._myChart.on('click', (params) => {
            console.log("Clicked:", params.name);
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: { properties: { selectedID: params.name } }
            }));
            this.dispatchEvent(new Event("onSelect"));
        });
      }

      // --- 1. เตรียมชุดสี (Gradient Palette) ---
      // เก็บเป็นคู่ [สีอ่อน(บน), สีเข้ม(ล่าง)]
      const colorPalette = [
          ['#83bff6', '#188df0'], // ฟ้า (เดิม)
          ['#5ee7df', '#b490ca'], // เขียวอมฟ้า-ม่วง
          ['#f6d365', '#fda085'], // เหลือง-ส้ม
          ['#f093fb', '#f5576c'], // ชมพู-แดง
          ['#a1c4fd', '#c2e9fb'], // ฟ้าอ่อน
          ['#d4fc79', '#96e6a1']  // เขียวมะนาว
      ];

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
         axisData = ["User A", "User B", "User C", "User D", "User E", "User F"];
         seriesData = [150, 230, 224, 118, 190, 260];
      }

      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'category', data: axisData, axisLabel: { color: '#000', interval:0 } },
        yAxis: { type: 'value', axisLine: { show: false }, splitLine: { show: true, lineStyle: { type: 'solid', color: '#eee' } } },
        series: [
          {
            type: 'bar',
            data: seriesData,
            itemStyle: {
              // --- 2. แก้ไขส่วนนี้: ใช้ฟังก์ชันเลือกสีจาก Palette ---
              color: function (params) {
                  // params.dataIndex คือลำดับของแท่งกราฟ (0, 1, 2...)
                  // ใช้ % เพื่อวนลูปสี ถ้าข้อมูลเยอะกว่าจำนวนสีที่มี
                  var colorPair = colorPalette[params.dataIndex % colorPalette.length];
                  
                  // สร้าง Gradient จากคู่สีที่เลือกได้
                  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: colorPair[0] }, 
                      { offset: 1, color: colorPair[1] }
                  ]);
              }
            },
            // ลบ emphasis แบบกำหนดเองออก ปล่อยให้ ECharts จัดการ highlight อัตโนมัติ
            emphasis: {
                focus: 'series'
            }
          }
        ]
      };

      this._myChart.setOption(option);
    }
  }

  customElements.define("com-example-gradient-bar", CustomBarChart);
})();
