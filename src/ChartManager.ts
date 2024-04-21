import { DataChunk } from "./constants";
import Chart from "./Chart";

class ChartManager {

  public createChart(canvas: HTMLCanvasElement, data: DataChunk[]): Chart {
      let newChart = new Chart(canvas, data);
      return newChart;
  }

}

export default ChartManager