import { ArtPiece } from "./ArtPiece";

export class Sun extends ArtPiece {
  private radianToXY(r: number): [number, number] {
    const SCALE = 128;
    return [
      Math.cos(r) * SCALE + this.canvas.draw_width / 2,
      Math.sin(r) * SCALE + this.canvas.draw_height / 2,
    ];
  }

  draw() {
    const ctx = this.canvas.getContext2d();
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";

    const EDGES = 256;
    for (let line = 0; line < EDGES; line++) {
      const start = this.canvas.random_pool.get(line * 2) * 2 * Math.PI;
      const end =
        start + (this.canvas.random_pool.get(line * 2 + 1) * Math.PI) / 3;

      const [startX, startY] = this.radianToXY(start);
      const [endX, endY] = this.radianToXY(end);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    const offset = Math.floor(this.canvas.state.parameter_a * 1024);
    const LINES = 4_096;
    for (let line = offset; line < offset + LINES; line++) {
      const start = this.canvas.random_pool.get(line * 2) * 2 * Math.PI;
      const end = this.canvas.random_pool.get(line * 2 + 1) * 2 * Math.PI;

      const [startX, startY] = this.radianToXY(start);
      const [endX, endY] = this.radianToXY(end);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }
}
