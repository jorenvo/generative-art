import { ArtPiece } from "./ArtPiece";

export class Schotter extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext2d();
    const rect_per_row = 20;
    const rect_per_col =
      rect_per_row * (this.canvas.height / this.canvas.width);

    const rect_width = this.canvas.draw_width / rect_per_row;
    const rect_height = this.canvas.draw_height / rect_per_col;

    let random_index = 0;

    ctx.lineWidth = 1.3;
    for (let row = 0; row < rect_per_col; row++) {
      const random_scale = row / (7.5 / this.canvas.state.parameter_a);

      for (let col = 0; col < rect_per_row; col++) {
        ctx.save();
        ctx.beginPath();

        const offset_col = col * rect_width;
        const offset_row = row * rect_height;

        // translate to origin
        ctx.translate(
          offset_col + rect_width / 2,
          offset_row + rect_height / 2
        );

        const angle = 0.01 * random_scale;
        if (this.canvas.random_pool.get(random_index++) > 0.5) {
          ctx.rotate(angle);
        } else {
          ctx.rotate(-angle);
        }

        // translate back
        ctx.translate(
          -offset_col - rect_width / 2,
          -offset_row - rect_height / 2
        );

        ctx.translate(
          this.canvas.random_pool.get(random_index++) * random_scale,
          this.canvas.random_pool.get(random_index++) * random_scale
        );
        ctx.rect(offset_col, offset_row, rect_width, rect_height);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
