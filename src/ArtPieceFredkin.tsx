import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";

class FredkinUtils {
  drawArtFredkin(
    canvas: ArtCanvas,
    seeder: (
      squares: number[][],
      center_row: number,
      center_col: number
    ) => void
  ) {
    const ctx = canvas.getContext();

    // odd rows should be chosen so that cols is also odd for symmetry
    const rows = 107;
    const cols = Math.floor(rows / canvas.width_to_height_ratio);

    const square_scale = canvas.draw_width / cols;
    const square_size = 5;
    let squares: number[][] = [];
    const get_neumann_neighbors = (row: number, col: number) => {
      let neighbors = 0;

      // top
      if (row - 1 >= 0 && squares[row - 1][col] & 1) {
        neighbors += 1;
      }

      // bottom
      if (row + 1 < rows && squares[row + 1][col] & 1) {
        neighbors += 1;
      }

      // right
      if (col + 1 < cols && squares[row][col + 1] & 1) {
        neighbors += 1;
      }

      // left
      if (col - 1 >= 0 && squares[row][col - 1] & 1) {
        neighbors += 1;
      }

      return neighbors;
    };

    for (let row = 0; row < rows; row++) {
      squares.push([]);
      for (let col = 0; col < cols; col++) {
        squares[row].push(0);
      }
    }

    const quarter_rows = Math.floor(rows / 4);
    const quarter_cols = Math.floor(cols / 4);
    const center_row = Math.floor(rows / 2);
    const center_col = Math.floor(cols / 2);
    seeder(squares, center_row, center_col);

    seeder(squares, 1, 1);
    seeder(squares, 1 + quarter_rows, 1 + quarter_cols);

    seeder(squares, 1, cols - 2);
    seeder(squares, 1 + quarter_rows, cols - 2 - quarter_cols);

    seeder(squares, rows - 2, 1);
    seeder(squares, rows - 2 - quarter_rows, 1 + quarter_cols);

    seeder(squares, rows - 2, cols - 2);
    seeder(squares, rows - 2 - quarter_rows, cols - 2 - quarter_cols);

    for (let gen = 0; gen < canvas.state.parameterA * 5 + 5; gen++) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const neighbors = get_neumann_neighbors(row, col);

          if (neighbors & 1) {
            squares[row][col] |= 0b10;
          }
        }
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          squares[row][col] >>= 1;
        }
      }
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (squares[row][col]) {
          ctx.fillRect(
            col * square_scale + 0.5,
            row * square_scale + 0.5,
            square_size,
            square_size
          );
        }
      }
    }
  }
}

export class Fredkin1 extends ArtPiece {
  draw() {
    const draw_pants = (
      squares: number[][],
      center_row: number,
      center_col: number
    ) => {
      // XXX
      // XOX
      // X X
      //
      // O is center
      squares[center_row - 1][center_col] = 1;

      squares[center_row - 1][center_col - 1] = 1;
      squares[center_row][center_col - 1] = 1;
      squares[center_row + 1][center_col - 1] = 1;

      squares[center_row - 1][center_col + 1] = 1;
      squares[center_row][center_col + 1] = 1;
      squares[center_row + 1][center_col + 1] = 1;
    };

    new FredkinUtils().drawArtFredkin(this.canvas, draw_pants);
  }
}

export class Fredkin2 extends ArtPiece {
  draw() {
    const draw_pentomino = (
      squares: number[][],
      center_row: number,
      center_col: number
    ) => {
      //  X
      //  O
      // XXX
      //
      // O is center
      squares[center_row - 1][center_col] = 1;

      squares[center_row + 1][center_col - 1] = 1;
      squares[center_row + 1][center_col] = 1;
      squares[center_row + 1][center_col + 1] = 1;
    };

    new FredkinUtils().drawArtFredkin(this.canvas, draw_pentomino);
  }
}
