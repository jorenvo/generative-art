import { ArtPiece } from "./ArtPiece";

export class Linien extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext2d();
    ctx.beginPath();
    ctx.lineWidth = 3;

    const rect_per_row = 20;
    const rect_per_col = Math.floor(
      rect_per_row * (this.canvas.height / this.canvas.width)
    );

    const rect_width = this.canvas.draw_width / rect_per_row;
    const rect_height = this.canvas.draw_height / rect_per_col;

    let random_index = 0;

    const coordinates: [number, number][] = [];
    for (let col = 0; col < rect_per_row + 1; col++) {
      const straight_next_x = col * rect_width;
      coordinates.push([straight_next_x, 0]);
    }

    for (let row = 0; row < rect_per_col; row++) {
      const peak = rect_per_col / 2;
      let random_scale_row = row;
      if (row > peak) {
        random_scale_row = rect_per_col - row - 2;
      }

      coordinates[rect_per_row] = [
        rect_width * rect_per_row,
        row * rect_height,
      ];

      for (let col = 0; col < rect_per_row; col++) {
        const peak = rect_per_row / 2;
        let random_scale_col = col;
        if (col > peak) {
          random_scale_col = rect_per_row - col - 0.5;
        }

        let random_scale =
          (random_scale_row * random_scale_col) /
          (10 / this.canvas.state.parameterA);
        if (row === rect_per_col - 1) {
          random_scale = 1;
        }

        ctx.moveTo(...coordinates[col]);
        ctx.lineTo(...coordinates[col + 1]);

        // vertical to next row, don't draw next line if on last row
        if (row < rect_per_col) {
          const new_row_x =
            col * rect_width +
            (this.canvas.random_pool.get(random_index++) - 0.5) *
              random_scale;
          const new_row_y =
            row * rect_height +
            rect_height +
            (this.canvas.random_pool.get(random_index++) - 0.5) *
              random_scale;

          ctx.moveTo(...coordinates[col]);
          ctx.lineTo(new_row_x, new_row_y);

          coordinates[col] = [new_row_x, new_row_y];
        }
      }

      // draw last vertical lines
      if (row < rect_per_col) {
        ctx.moveTo(rect_per_row * rect_width, row * rect_height);
        ctx.lineTo(rect_per_row * rect_width, row * rect_height + rect_height);
      }
    }

    coordinates[rect_per_row] = [
      rect_width * rect_per_row,
      rect_height * rect_per_col,
    ];
    // draw last horizontal lines
    for (let col = 0; col < rect_per_row; col++) {
      ctx.moveTo(...coordinates[col]);
      ctx.lineTo(...coordinates[col + 1]);
    }

    ctx.stroke();
    ctx.closePath();
  }
}
