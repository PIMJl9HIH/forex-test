import DataFetcher from "./DataFetcher";
import ChartBuilder from "./ChartBuilder";

import { firstDataLink, Bar } from "./constants";

document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("myChart") as HTMLCanvasElement;
  const firstData = new DataFetcher(firstDataLink);

  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  try {
    const firstDataResult = await firstData.fetchData();
    console.log("data", firstDataResult);
    // @ts-ignore
    const test = firstDataResult.map((item) => {
      return {
        ...item,
        Bars: item.Bars.slice(0, 1),
      };
    });

    console.log(2222, test);
  //   const allBars = test.flatMap((chunk) => chunk.Bars);

  //   const bars: Bar[] = [
  //     { Time: 1, Open: 100, High: 105, Low: 95, Close: 103, TickVolume: 1000 },
  //     { Time: 2, Open: 103, High: 108, Low: 102, Close: 104, TickVolume: 1500 },
  //     // Add more bars as needed
  // ];

  
  //   new ChartBuilder(canvas, bars);
    new ChartBuilder(canvas, firstDataResult);
  } catch (error) {
    console.error("Error in data fetching or chart building", error);
  }
});
