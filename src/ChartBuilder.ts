import { Bar, DataChunk } from "./constants";
import { format, addSeconds } from "date-fns";

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

  constructor(private canvas: HTMLCanvasElement, data: DataChunk[]) {
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
      // const proposedOffsetX = this.offsetX + event.deltaY;

      // // Calculate the right boundary of the chart (assuming all bars should be visible)
      // const maxOffsetX = this.getMaxOffsetX();

      // // Update offsetX if within bounds
      // if (proposedOffsetX >= 0 && proposedOffsetX <= maxOffsetX) {
      //     this.offsetX = proposedOffsetX;
      //     this.draw();
      // }

      // event.preventDefault();




         // Horizontal scrolling with the mouse wheel
         const deltaX = event.deltaY;
         const proposedOffsetX = this.offsetX + deltaX;
 
         const maxOffsetX = this.getMaxOffsetX();
 
         if (proposedOffsetX >= 0 && proposedOffsetX <= maxOffsetX) {
             this.offsetX = proposedOffsetX;
             this.draw();
         }
 
         event.preventDefault();
  }

  private handleMouseDown(event: MouseEvent): void {
      this.isDragging = true;
      this.lastY = event.clientY;  // Capture the vertical position for zooming
      event.preventDefault();
  }

  private handleMouseUp(event: MouseEvent): void {
      this.isDragging = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
        const deltaY = event.clientY - this.lastY;
        const zoomIntensity = 0.005;  // Smaller value for finer control over zoom

        // Update the scale based on the direction of the mouse move
        if (deltaY < 0) {  // Moving mouse upwards
            this.scale *= (1 - zoomIntensity * deltaY);  // Increase scale
        } else if (deltaY > 0) {  // Moving mouse downwards
            this.scale /= (1 + zoomIntensity * deltaY);  // Decrease scale
        }

        this.scale = Math.max(0.1, Math.min(this.scale, 10));  // Ensure the scale stays within reasonable bounds
        this.lastY = event.clientY;  // Update lastY to the new mouse position
        this.draw();  // Redraw the chart with the new scale
        event.preventDefault();
    }
}

  private getMaxOffsetX(): number {
      return Math.max(0, (this.bars.length * (10 * this.scale + 2)) - this.canvas.width);
  }

  private draw(): void {
    console.log('DRAW')
    const canvasWidth = this.canvas.width;
    const barWidth = 10 * this.scale;  // Adjusted bar width based on the scale
    const spacing = 2 * this.scale;  // Adjusted spacing between bars based on the scale
    const totalBarWidth = barWidth + spacing;

    // Calculate the range of visible bars
    const startIndex = Math.max(0, Math.floor(this.offsetX / totalBarWidth));
    const endIndex = Math.min(this.bars.length, Math.ceil((this.offsetX + canvasWidth) / totalBarWidth));

    this.ctx.clearRect(0, 0, canvasWidth, this.canvas.height);
    for (let i = startIndex; i < endIndex; i++) {
        const bar = this.bars[i];
        const x = (i * totalBarWidth) - this.offsetX;  // Calculate the x position based on the offset
        this.drawBar(bar, x, barWidth);
    }
}


  private drawBar(bar: Bar, x: number, width: number): void {
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
}

export default ChartBuilder;
