import { Bar, DataChunk } from "./constants";
import { format, addSeconds, addHours, addMilliseconds } from "date-fns";

class ChartBuilder {
  private ctx: CanvasRenderingContext2D;
  private bars: Bar[];
  private highestPrice: number;
  private lowestPrice: number;
  private offsetX: number = 0; // Initial horizontal offset
  private scale: number = 1.0; // Initial zoom level
  private isDragging: boolean = false;
  private lastX: number = 0; // Last mouse x position for panning
  private chunkStarts: number[];
  private chunkIndices: number[];
  private padding: number = 30;
  private rightPadding: number = 50; // Right padding width in pixels
  private spacePadding: number = 15;

  // ---------------------------
  constructor(private canvas: HTMLCanvasElement, data: DataChunk[]) {
    this.chunkStarts = data.map((chunk) => chunk.ChunkStart * 1000);
    let currentIndex = 0;
    this.chunkIndices = [];

    this.bars = data.flatMap((chunk) => {
      this.chunkIndices.push(currentIndex); // Store start index of the current chunk
      currentIndex += chunk.Bars.length; // Update index count

      return chunk.Bars.map((bar) => ({
        ...bar,
        Time: addSeconds(
          new Date(chunk.ChunkStart * 1000),
          bar.TickVolume
        ).getTime(),
      }));
    });

    this.ctx = this.canvas.getContext("2d")!;
    if (!this.ctx) {
      throw new Error("Failed to get canvas context");
    }

    this.highestPrice = Math.max(...this.bars.map((bar) => bar.High));
    this.lowestPrice = Math.min(...this.bars.map((bar) => bar.Low));
    this.initializeEvents();
    this.draw();
  }

  private initializeEvents(): void {
    this.canvas.addEventListener("wheel", this.handleScroll.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseout", this.handleMouseUp.bind(this)); // Optional, to stop dragging when the mouse leaves the canvas
  }

  private handleScroll(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      // Check for Ctrl (Cmd on Mac) key
      // Implement zoom scaling
      const zoomIntensity = 0.1;
      const direction = event.deltaY < 0 ? 1 : -1; // Determine zoom direction based on scroll direction
      this.scale *= 1 + direction * zoomIntensity;
      this.scale = Math.max(0.5, Math.min(this.scale, 5)); // Constrain scale between 1 and 10

      this.draw();
      event.preventDefault(); // Prevent the default scroll behavior to stop page zoom
    } else {
      const deltaX = -event.deltaY; // Assuming vertical scroll translates to horizontal panning
      const proposedOffsetX = this.offsetX + deltaX;

      const maxOffsetX = this.getMaxOffsetX();

      if (proposedOffsetX >= 0 && proposedOffsetX <= maxOffsetX) {
        this.offsetX = proposedOffsetX;
        this.draw();
      }

      event.preventDefault(); // Prevent default to stop the window scrolling
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.lastX = event.clientX;
    event.preventDefault(); // Prevent text selection or other drag interactions
  }

  private handleMouseUp(event: MouseEvent): void {
    this.isDragging = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const deltaX = event.clientX - this.lastX;
      const proposedOffsetX = this.offsetX + deltaX;

      const maxOffsetX = this.getMaxOffsetX();

      if (proposedOffsetX >= 0 && proposedOffsetX <= maxOffsetX) {
        this.offsetX = proposedOffsetX;
        this.lastX = event.clientX; // Update lastX to the current mouse position
        this.draw();
      }

      event.preventDefault(); // Keep this to prevent any unwanted page behavior while dragging
    }
  }

  private getMaxOffsetX(): number {
    return Math.max(
      0,
      this.bars.length * (10 * this.scale + 2) - this.canvas.width
    );
  }

  private draw(): void {
    const canvasHeight = this.canvas.height - this.padding;
    const canvasWidth = this.canvas.width - this.rightPadding;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid(canvasWidth, canvasHeight);

    for (let i = 0; i < this.chunkIndices.length; i++) {
      const startIdx = this.chunkIndices[i];
      const startX = startIdx * (10 * this.scale + 2) - this.offsetX;

      // Draw vertical line at the start of each chunk
      if (startX >= 0 && startX <= canvasWidth) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, 0);
        this.ctx.lineTo(startX, canvasHeight);
        this.ctx.strokeStyle = "red"; // Distinct color for visibility
        this.ctx.stroke();
      }

      // Draw bars for each chunk
      for (
        let j = startIdx;
        j <
        (i + 1 < this.chunkIndices.length
          ? this.chunkIndices[i + 1]
          : this.bars.length);
        j++
      ) {
        const bar = this.bars[j];
        const x = j * (10 * this.scale + 2) - this.offsetX;
        if (x <= canvasWidth) {
          this.drawBar(bar, x, 10 * this.scale, canvasHeight);
        }
      }
    }
    this.drawScaleCount(); // Draw the current scale count
    this.drawDateLabels(canvasHeight);
    this.drawPriceScale(canvasWidth, canvasHeight);
  }

  private drawBar(
    bar: Bar,
    x: number,
    width: number,
    canvasHeight: number
  ): void {
    // Calculate height based on scaled price differences
    const pixelPerPrice =
      (canvasHeight / (this.highestPrice - this.lowestPrice)) * this.scale;
    const yHigh = canvasHeight - (bar.High - this.lowestPrice) * pixelPerPrice;
    const yLow = canvasHeight - (bar.Low - this.lowestPrice) * pixelPerPrice;
    const yOpen = canvasHeight - (bar.Open - this.lowestPrice) * pixelPerPrice;
    const yClose =
      canvasHeight - (bar.Close - this.lowestPrice) * pixelPerPrice;

    // Draw high-low line
    this.ctx.beginPath();
    this.ctx.moveTo(x + width / 2, yHigh);
    this.ctx.lineTo(x + width / 2, yLow);
    this.ctx.strokeStyle = "#333";
    this.ctx.stroke();

    // Draw open-close rectangle
    this.ctx.fillStyle = bar.Close > bar.Open ? "green" : "red";
    this.ctx.fillRect(
      x,
      Math.min(yOpen, yClose),
      width,
      Math.abs(yClose - yOpen)
    );
  }

  private drawDateLabels(canvasHeight: number): void {
    const maxLabelWidth = 100; // Assume each date label could take up to 100px width
    const visibleBars = Math.ceil(this.canvas.width / (10 * this.scale + 2)); // Number of bars that can fit in the visible canvas at the current scale
    let labelInterval = Math.ceil(maxLabelWidth / (10 * this.scale + 2)); // Minimum interval to avoid overlap based on max label width

    this.ctx.fillStyle = "#000"; // Set text color
    this.ctx.font = "12px Arial"; // Set font

    for (let i = 0; i < this.bars.length; i += labelInterval) {
      const bar = this.bars[i];
      const x = i * (10 * this.scale + 2) - this.offsetX; // Calculate the x position based on the index and offset

      // Ensure the label is within the visible canvas area and prevent drawing overlapping labels
      if (x >= 0 && x <= this.canvas.width - maxLabelWidth) {
        // Check if within canvas and has space for the label
        const dateLabel = format(new Date(bar.Time), "dd MMM HH:mm");
        this.ctx.fillText(dateLabel, x, canvasHeight + 20); // Draw label above the padding area
      }
    }
  }

  private drawPriceScale(canvasWidth: number, canvasHeight: number): void {
    // Define the maximum and minimum number of price levels based on the current scale
    const maxPriceLabels = 10; // maximum number of price labels at the smallest scale
    const minPriceLabels = 3; // minimum number of price labels at the largest scale

    // Dynamically adjust the number of price labels based on the scale
    const scaledPriceLevels = Math.max(
      minPriceLabels,
      Math.min(maxPriceLabels, Math.floor(10 / this.scale))
    );

    const priceRange = this.highestPrice - this.lowestPrice;
    const priceStep = priceRange / scaledPriceLevels;

    for (let i = 0; i <= scaledPriceLevels; i++) {
      const price = this.lowestPrice + priceStep * i;
      const y =
        canvasHeight - ((price - this.lowestPrice) / priceRange) * canvasHeight;

      // Ensure the label is within the visible area and not too close to the edge
      if (y >= this.spacePadding && y <= canvasHeight - this.spacePadding) {
        this.ctx.fillText(`${price.toFixed(5)}`, canvasWidth + 5, y);
      }
    }
  }

  private drawGrid(canvasWidth: number, canvasHeight: number): void {
    const numVerticalLines = 10;
    const numHorizontalLines = 10;
    const verticalSpacing = (canvasWidth / numVerticalLines) * this.scale; // Scale the vertical spacing
    const horizontalSpacing = (canvasHeight / numHorizontalLines) * this.scale; // Scale the horizontal spacing as well

    this.ctx.fillStyle = "#fcfcfc"; // Light gray background
    this.ctx.fillRect(
      0,
      0,
      canvasWidth + this.rightPadding,
      canvasHeight + this.padding
    );

    this.ctx.beginPath();
    this.ctx.setLineDash([5, 5]);

    // Draw vertical grid lines that adjust with horizontal scaling
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = i * verticalSpacing; // Adjust line position based on scaled spacing
      this.ctx.moveTo(x - (this.offsetX % verticalSpacing), 0);
      this.ctx.lineTo(x - (this.offsetX % verticalSpacing), canvasHeight);
    }

    // Draw horizontal grid lines that adjust with vertical scaling
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = i * horizontalSpacing;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvasWidth, y);
    }

    this.ctx.strokeStyle = "#ddd";
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset to solid lines for other drawings
  }

  // Method to draw the current scale count
  private drawScaleCount(): void {
    this.ctx.fillStyle = "black"; // Color for the scale text
    this.ctx.font = "16px Arial"; // Font for the scale text
    this.ctx.fillText(`Scale: ${this.scale.toFixed(2)}`, 10, 20); // Position the text at the top left
  }
}

export default ChartBuilder;
