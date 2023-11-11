import QuickChart from "quickchart-js";
import { SunlightRecord } from "./crawler";

export class Chart {
  static async generateChart(data: SunlightRecord[]): Promise<string> {
    const labels = data.map((item) => item.date);
    const sunlightDurationData = data.map((item) => item.sunlight_duration);
    const sunlightAmountData = data.map((item) => item.sunlight_amount);
    const sunlightDurationNormalData = data.map(
      (item) => item.sunlight_duration_normal
    );
    const sunlightAmountNormalData = data.map(
      (item) => item.sunlight_amount_normal
    );

    const myChart = new QuickChart();
    myChart
      .setConfig({
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Radiation",
              data: sunlightAmountData,
              borderColor: "rgba(235, 162, 54, 1)",
              borderWidth: 8,
              fill: false,
              yAxisID: "y1",
            },
            {
              label: "Duration",
              data: sunlightDurationData,
              borderColor: "rgba(255, 206, 86, 1)",
              borderWidth: 4,
              fill: false,
              yAxisID: "y2",
            },
            {
              label: "Normal Radiation",
              data: sunlightAmountNormalData,
              borderColor: "rgba(235, 162, 54, 0.4)", // Semi-transparent version of the sunlight amount color
              borderWidth: 20,
              yAxisID: "y1",
              fill: false,
              pointRadius: 0,
              //borderDash: [5, 5], // Optional: if you want dashed lines
            },
            {
              label: "Normal Duration",
              data: sunlightDurationNormalData,
              borderColor: "rgba(255, 206, 86, 0.4)", // Semi-transparent version of the sunlight duration color
              borderWidth: 20,
              yAxisID: "y2",
              fill: false,
              pointRadius: 0,
              //borderDash: [5, 5], // Optional: if you want dashed lines
            },
          ],
        },
        options: {
          scales: {
            yAxes: [
              {
                id: "y1",
                display: true,
                position: "left",
                gridLines: {
                  drawOnChartArea: false,
                },
                labelString: "MJ/m^2",
                ticks: {
                  min: 0,
                  max:
                    Math.ceil(
                      Math.max(
                        19,
                        ...sunlightAmountData,
                        ...sunlightAmountNormalData
                      )
                    ) + 1,
                  fontSize: 20,
                  fontStyle: "bold",
                },
              },
              {
                id: "y2",
                display: true,
                position: "right",
                labelString: "Hours",
                ticks: {
                  min: 0,
                  max:
                    Math.ceil(
                      Math.max(
                        11,
                        ...sunlightDurationData,
                        ...sunlightDurationNormalData
                      )
                    ) + 1,
                  fontSize: 20,
                  fontStyle: "bold",
                },
              },
            ],
          },
        },
      })
      .setHeight(600)
      .setWidth(1000);
    return await myChart.getShortUrl();
  }
}
