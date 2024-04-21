import DataFetcher from "./DataFetcher";
import ChartManager from "./ChartManager";
import { firstDataLink, secondDataLink } from "./constants";

document.addEventListener("DOMContentLoaded", async () => {
  const canvas1 = document.getElementById("myChart") as HTMLCanvasElement;
  const canvas2 = document.getElementById("myChart2") as HTMLCanvasElement;
  const manager = new ChartManager();

  // Function to handle fetching and displaying data for a single chart
  async function setupChart(dataLink: string, canvas: HTMLCanvasElement): Promise<void> {
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Display loading message
    ctx.save();  // Save the current canvas state
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px Arial";
    ctx.fillText("Loading...", 10, 50);

    try {
      const fetchData = new DataFetcher(dataLink);
      const dataResult = await fetchData.fetchData();
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the loading message
      manager.createChart(canvas, dataResult);
    } catch (error) {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the loading message
      ctx.fillText("Failed to load data!", 10, 50);
      console.error(`Error fetching data for ${dataLink}:`, error);
    } finally {
      ctx.restore(); // Restore the canvas state
    }
  }

  // Setup charts independently
  setupChart(firstDataLink, canvas1);
  setupChart(secondDataLink, canvas2);
});
