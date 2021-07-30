import { ArtPiece } from "./ArtPiece";

export class Waves extends ArtPiece {
  private animation_id: number | undefined;

  private renderFrame(timeMs: number) {
    const ctx = this.canvas.getContext2d();
    const nr_circles = 12;
    const width_per_circle = this.canvas.draw_width / nr_circles;
    const circle_radius = 5;
    const degree = timeMs / 100 / (2 * Math.PI);

    ctx.save();
    this.canvas.center();
    this.canvas.clear();

    let circle_x = width_per_circle / 2 + circle_radius + 1;
    for (let i = 0; i < nr_circles; i++) {
      const degree_offset = (i * Math.PI) / 5;
      const x = Math.cos(degree + degree_offset) * (width_per_circle / 2);
      const y = Math.sin(degree + degree_offset) * (width_per_circle / 2);

      // Circular waves
      ctx.fillStyle = "rgb(94, 215, 235)";
      ctx.beginPath();
      ctx.arc(
        circle_x + x,
        this.canvas.draw_height * (1 / 4) + y,
        circle_radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();

      // Transverse waves
      ctx.fillStyle = "rgb(180, 165, 217)";
      ctx.beginPath();
      ctx.arc(
        circle_x,
        this.canvas.draw_height * (2 / 4) + y,
        circle_radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();

      // Longitudinal waves
      ctx.fillStyle = "rgb(181, 210, 75)";
      ctx.beginPath();
      ctx.arc(
        circle_x + x,
        this.canvas.draw_height * (3 / 4),
        circle_radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();

      circle_x += width_per_circle;
    }

    ctx.restore();
    this.animation_id = requestAnimationFrame(this.renderFrame.bind(this));
  }

  cleanUp() {
    super.cleanUp();
    this.canvas.setHoverText("");
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }
  }

  draw() {
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
    }

    this.canvas.setHoverText(
      'Inspired by the "Waves In Motion" machine at Fleet Science Center in San Diego. If you\'re ever in the area I highly recommend visiting!'
    );
    this.animation_id = requestAnimationFrame(this.renderFrame.bind(this));
  }
}
