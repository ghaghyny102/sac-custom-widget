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
          selectedID: "",
          userColorList: "#83bff6, #188df0, #5ee7df, #b490ca" // ค่า Default
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

      // -----------------------------------------------------------
      // [ใหม่] แปลงข้อความสี (String) ให้เป็น Array
      // -----------------------------------------------------------
      let customColors = [];
      if (this._props.userColorList) {
          // ตัดคำด้วย , และลบช่องว่างทิ้ง
          customColors = this._props.userColorList.split(',').map(c => c.trim());
      }
      
      // ถ้าไม่มีสีเลย ให้ใช้สีกันตาย (Fallback)
      if (customColors.length === 0) {
          customColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666'];
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
         axisData = ["A", "B", "C", "D", "E"];
         seriesData = [50, 80, 45, 90, 60];
      }

      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'category', data: axisData, axisLabel: { color: '#000', interval: 0 } },
        yAxis: { type: 'value', axisLine: { show: false }, splitLine: { show: true, lineStyle: { type: 'solid', color: '#eee' } } },
        series: [
          {
            type: 'bar',
            data: seriesData,
            itemStyle: {
              // --- ใช้สีจาก Array ที่เราแปลงมา ---
              color: function (params) {
                  // วนลูปสีตามลำดับแท่ง
                  var colorHex = customColors[params.dataIndex % customColors.length];
                  
                  // สร้าง Gradient สวยๆ โดยใช้สีที่เลือก ไล่ไปหาสีเดิมแต่โปร่งแสงนิดหน่อย
                  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: colorHex },       // สีบน (เข้มเต็มที่)
                      { offset: 1, color: colorHex }        // สีล่าง (เท่ากัน - แบบ Flat)
                      // *ถ้าอยากได้ไล่เฉด ให้แก้บรรทัด offset 1 เป็น color: 'white' หรือสีอื่น
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

  customElements.define("com-example-gradient-bar", CustomBarChart);
})();
