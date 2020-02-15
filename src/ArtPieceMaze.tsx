import { ArtPiece } from "./ArtPiece";

export class Maze extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext();
    const lines_per_row = 25;
    const lines_per_column = Math.ceil(
      lines_per_row * (this.canvas.draw_height / this.canvas.draw_width)
    );
    const line_length = this.canvas.draw_width / lines_per_row;
    let random_index = 0;

    ctx.beginPath();
    ctx.lineWidth = 3;

    for (let row = 0; row < lines_per_column; row++) {
      for (let col = 0; col < lines_per_row; col++) {
        const random = this.canvas.state.random_pool[random_index++];

        if (row === 0) {
          ctx.moveTo(col * line_length, row * line_length);
          ctx.lineTo(col * line_length + line_length, row * line_length);
        } else if (row === lines_per_column - 1) {
          ctx.moveTo(col * line_length, (row + 1) * line_length);
          ctx.lineTo(col * line_length + line_length, (row + 1) * line_length);
        }

        if (col === 0) {
          ctx.moveTo(col * line_length, row * line_length);
          ctx.lineTo(col * line_length, row * line_length + line_length);
        } else if (col === lines_per_row - 1) {
          ctx.moveTo((col + 1) * line_length, row * line_length);
          ctx.lineTo((col + 1) * line_length, row * line_length + line_length);
        }

        ctx.moveTo(col * line_length, row * line_length);
        if (random < this.canvas.state.parameterA / 10) {
          ctx.lineTo(col * line_length + line_length, row * line_length);
        } else {
          ctx.lineTo(col * line_length, row * line_length + line_length);
        }
      }
    }

    ctx.stroke();
  }
}