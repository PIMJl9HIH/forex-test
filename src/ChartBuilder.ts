import { Bar, DataChunk } from "./constants";
import { format, addSeconds, addHours, addMilliseconds  } from "date-fns";

class ChartBuilder {
  private ctx: CanvasRenderingContext2D;
  private bars: Bar[];
  private highestPrice: number;
  private lowestPrice: number;
  private offsetX: number = 0;  // Initial horizontal offset
  private scale: number = 1.0;  // Initial zoom level
  private isDragging: boolean = false;
  private lastX: number = 0;  // Last mouse x position for panning
  private lastY: number = 0;  // Last mouse y position for zooming
  private chunkStart: number; 
  private padding: number = 30;

  constructor(private canvas: HTMLCanvasElement, data: DataChunk[]) {
    this.chunkStart = data[0].ChunkStart * 1000; 

      this.bars = data.flatMap(chunk =>
          chunk.Bars.map(bar => ({
              ...bar,
              Time: addSeconds(new Date(chunk.ChunkStart * 1000), bar.TickVolume).getTime(),
          }))
      );

      this.ctx = this.canvas.getContext('2d')!;
      if (!this.ctx) {
          throw new Error("Failed to get canvas context");
      }

      this.highestPrice = Math.max(...this.bars.map(bar => bar.High));
      this.lowestPrice = Math.min(...this.bars.map(bar => bar.Low));
      this.initializeEvents();
      this.draw();
  }

  private initializeEvents(): void {
      this.canvas.addEventListener('wheel', this.handleScroll.bind(this), { passive: false });
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.addEventListener('mouseout', this.handleMouseUp.bind(this));  // Optional, to stop dragging when the mouse leaves the canvas
  }

  private handleScroll(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {  // Check for Ctrl (Cmd on Mac) key
      // Implement zoom scaling
      const zoomIntensity = 0.1;
      const direction = event.deltaY < 0 ? 1 : -1; // Determine zoom direction based on scroll direction
      this.scale *= (1 + direction * zoomIntensity);
      this.scale = Math.max(1, Math.min(this.scale, 10)); // Constrain scale between 1 and 10

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

    event.preventDefault();  // Prevent default to stop the window scrolling
  }
}

private handleMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.lastX = event.clientX;
    event.preventDefault();  // Prevent text selection or other drag interactions
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
            this.lastX = event.clientX;  // Update lastX to the current mouse position
            this.draw();
        }

        event.preventDefault();  // Keep this to prevent any unwanted page behavior while dragging
    }
}

private getMaxOffsetX(): number {
    return Math.max(0, (this.bars.length * (10 * this.scale + 2)) - this.canvas.width);
}


  private draw(): void {
    const canvasHeight = this.canvas.height - this.padding; // Adjust canvas height for drawing bars
        const barWidth = 10 * this.scale;
        const spacing = 2 * this.scale;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);  // Clear entire canvas
        this.ctx.save();  // Save the current state

        // Draw bars within the adjusted canvas area
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.canvas.width, canvasHeight);
        this.ctx.clip();  // Clip to the upper part of the canvas

        for (let i = 0; i < this.bars.length; i++) {
            const bar = this.bars[i];
            const x = (i * (barWidth + spacing)) - this.offsetX;
            this.drawBar(bar, x, barWidth, canvasHeight);
        }

        this.ctx.restore();  // Restore to include the full canvas
        this.drawDateLabels(canvasHeight); 
}


  private drawBar(bar: Bar, x: number, width: number, canvasHeight: number): void {
      const pixelPerPrice = this.canvas.height / (this.highestPrice - this.lowestPrice);
      const yHigh = this.canvas.height - (bar.High - this.lowestPrice) * pixelPerPrice;
      const yLow = this.canvas.height - (bar.Low - this.lowestPrice) * pixelPerPrice;
      const yOpen = this.canvas.height - (bar.Open - this.lowestPrice) * pixelPerPrice;
      const yClose = this.canvas.height - (bar.Close - this.lowestPrice) * pixelPerPrice;

      // Draw high-low line
      this.ctx.beginPath();
      this.ctx.moveTo(x + width / 2, yHigh);
      this.ctx.lineTo(x + width / 2, yLow);
      this.ctx.strokeStyle = '#333';
      this.ctx.stroke();

      // Draw open-close rectangle
      this.ctx.fillStyle = bar.Close > bar.Open ? 'green' : 'red';
      this.ctx.fillRect(x, Math.min(yOpen, yClose), width, Math.abs(yClose - yOpen));
  }

private drawDateLabels(canvasHeight: number): void {
  const barWidth = 10 * this.scale; // Adjust bar width based on scale
  const spacing = 2 * this.scale; // Adjust spacing between bars based on scale
  const labelInterval = 10; // Display a date label every 10 bars

  this.ctx.fillStyle = "#000"; // Set text color
  this.ctx.font = "12px Arial"; // Set font

  for (let i = 0; i < this.bars.length; i += labelInterval) {
      const bar = this.bars[i];
      const x = (i * (barWidth + spacing)) - this.offsetX; // Calculate the x position based on the index and offset

      // Ensure the label is within the visible canvas area
      if (x >= 0 && x <= this.canvas.width) {
          const dateLabel = format(new Date(bar.Time), 'dd MMM HH:mm');
          this.ctx.fillText(dateLabel, x, canvasHeight + 20); // Position labels within the padding area
      }
  }
}

}

export default ChartBuilder;
