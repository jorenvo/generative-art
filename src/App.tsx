import React from "react";
import "./App.css";

enum ArtType {
  Schotter,
  Linien,
  Diamond,
  Moiré1,
  Moiré2,
  Maze,
  Fredkin
}

interface ArtCanvasState {
  type: ArtType;
  parameterA: number;
}

class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  element: React.RefObject<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D | undefined;
  width_to_height_ratio: number;
  draw_width: number;
  width: number;
  draw_height: number;
  height: number;
  margin: number;
  dom_element: HTMLCanvasElement | undefined;
  random_pool: number[];

  constructor(props: any) {
    super(props);
    this.element = React.createRef();
    this.margin = 100;

    this.width_to_height_ratio = 1.25;
    this.draw_width = 400;
    this.width = this.draw_width + this.margin;
    this.draw_height = Math.floor(this.draw_width * this.width_to_height_ratio);
    this.height = this.draw_height + this.margin;

    this.random_pool = [];
    for (let i = 0; i < 100000; i++) {
      this.random_pool.push(Math.random());
    }

    this.state = {
      type: ArtType.Fredkin,
      parameterA: 5
    };
  }

  componentDidMount() {
    this.dom_element = this.element.current!;
    this.dom_element.width = this.width;
    this.dom_element.height = this.height;

    const ctx = this.dom_element.getContext("2d");
    if (!ctx) {
      console.error("Could not get context for canvas.");
    } else {
      this.ctx = ctx;
    }

    this.drawArt();
  }

  componentDidUpdate() {
    this.drawArt();
  }

  drawArt() {
    const ctx = this.ctx!;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // add margin
    ctx.translate(this.margin / 2, this.margin / 2);

    switch (this.state.type) {
      case ArtType.Schotter: {
        this.drawArtSchotter();
        break;
      }
      case ArtType.Linien: {
        this.drawArtLinien();
        break;
      }
      case ArtType.Diamond: {
        this.drawArtDiamond();
        break;
      }
      case ArtType.Moiré1: {
        this.drawArtMoiré1();
        break;
      }
      case ArtType.Moiré2: {
        this.drawArtMoiré2();
        break;
      }
      case ArtType.Maze: {
        this.drawArtMaze();
        break;
      }
      case ArtType.Fredkin: {
        this.drawArtFredkin();
        break;
      }
    }
    ctx.restore();
  }

  drawArtSchotter() {
    const ctx = this.ctx!;
    const rect_per_row = 20;
    const rect_per_col = rect_per_row * (this.height / this.width);

    const rect_width = this.draw_width / rect_per_row;
    const rect_height = this.draw_height / rect_per_col;

    let random_index = 0;

    for (let row = 0; row < rect_per_col; row++) {
      const random_scale = row / (7.5 / this.state.parameterA);

      for (let col = 0; col < rect_per_row; col++) {
        ctx.save();

        const offset_col = col * rect_width;
        const offset_row = row * rect_height;

        // translate to origin
        ctx.translate(
          offset_col + rect_width / 2,
          offset_row + rect_height / 2
        );

        const angle = 0.01 * random_scale;
        if (this.random_pool[random_index++] > 0.5) ctx.rotate(angle);
        else ctx.rotate(-angle);

        // translate back
        ctx.translate(
          -offset_col - rect_width / 2,
          -offset_row - rect_height / 2
        );

        ctx.translate(
          this.random_pool[random_index++] * random_scale,
          this.random_pool[random_index++] * random_scale
        );
        ctx.strokeRect(offset_col, offset_row, rect_width, rect_height);
        ctx.restore();
      }
    }
  }

  drawArtLinien() {
    const ctx = this.ctx!;
    ctx.beginPath();
    ctx.lineWidth = 3;

    const rect_per_row = 20;
    const rect_per_col = Math.floor(rect_per_row * (this.height / this.width));

    const rect_width = this.draw_width / rect_per_row;
    const rect_height = this.draw_height / rect_per_col;

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
        row * rect_height
      ];

      for (let col = 0; col < rect_per_row; col++) {
        const peak = rect_per_row / 2;
        let random_scale_col = col;
        if (col > peak) {
          random_scale_col = rect_per_row - col - 0.5;
        }

        let random_scale =
          (random_scale_row * random_scale_col) / (10 / this.state.parameterA);
        if (row === rect_per_col - 1) {
          random_scale = 1;
        }

        ctx.moveTo(...coordinates[col]);
        ctx.lineTo(...coordinates[col + 1]);

        // vertical to next row, don't draw next line if on last row
        if (row < rect_per_col) {
          const new_row_x =
            col * rect_width +
            (this.random_pool[random_index++] - 0.5) * random_scale;
          const new_row_y =
            row * rect_height +
            rect_height +
            (this.random_pool[random_index++] - 0.5) * random_scale;

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
      rect_height * rect_per_col
    ];
    // draw last horizontal lines
    for (let col = 0; col < rect_per_row; col++) {
      ctx.moveTo(...coordinates[col]);
      ctx.lineTo(...coordinates[col + 1]);
    }

    ctx.stroke();
    ctx.closePath();
  }

  drawArtDiamond() {
    const ctx = this.ctx!;
    const x = 2 * this.state.parameterA + 2;
    const scale = 200;

    ctx.beginPath();
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < x; j++) {
        ctx.save();
        ctx.translate(this.draw_width / 2, this.draw_height / 2);
        ctx.moveTo(Math.sin(i) * scale, 0); // [-1, 1] * scale => [-scale, scale]
        ctx.lineTo(0, Math.sin(j) * scale);
        ctx.restore();
      }
    }
    ctx.stroke();
  }

  drawArtMoiré1() {
    const ctx = this.ctx!;
    const nr_rectangles = 6000;
    let random_index = 0;
    for (let i = 0; i < nr_rectangles; i++) {
      ctx.fillRect(
        this.random_pool[random_index++] * this.draw_width,
        this.random_pool[random_index++] * this.draw_height,
        3,
        3
      );
    }

    ctx.translate(this.draw_width / 2, this.draw_height / 2);
    ctx.rotate(this.state.parameterA * 0.006);
    ctx.translate(-this.draw_width / 2, -this.draw_height / 2);

    random_index = 0;
    for (let i = 0; i < nr_rectangles; i++) {
      ctx.fillRect(
        this.random_pool[random_index++] * this.draw_width,
        this.random_pool[random_index++] * this.draw_height,
        3,
        3
      );
    }
  }

  drawArtMoiré2() {
    const ctx = this.ctx!;
    const nr_rectangles = 6000;
    let random_index = 0;
    for (let i = 0; i < nr_rectangles; i++) {
      ctx.fillRect(
        this.random_pool[random_index++] * this.draw_width,
        this.random_pool[random_index++] * this.draw_height,
        3,
        3
      );
    }

    ctx.translate(this.draw_width / 2, this.draw_height / 2);
    ctx.rotate(0.03);
    ctx.translate(-this.draw_width / 2, -this.draw_height / 2);

    random_index = 0;
    const x_translation = (this.state.parameterA - 5) * 2;
    ctx.translate(x_translation, 0);
    for (let i = 0; i < nr_rectangles; i++) {
      ctx.fillRect(
        this.random_pool[random_index++] * this.draw_width,
        this.random_pool[random_index++] * this.draw_height,
        3,
        3
      );
    }
    ctx.translate(-x_translation, 0);
  }

  drawArtMaze() {
    const ctx = this.ctx!;
    const lines_per_row = 25;
    const lines_per_column = Math.ceil(
      lines_per_row * (this.draw_height / this.draw_width)
    );
    const line_length = this.draw_width / lines_per_row;
    let random_index = 0;

    ctx.beginPath();
    ctx.lineWidth = 3;

    for (let row = 0; row < lines_per_column; row++) {
      for (let col = 0; col < lines_per_row; col++) {
        const random = this.random_pool[random_index++];

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
        if (random < this.state.parameterA / 10) {
          ctx.lineTo(col * line_length + line_length, row * line_length);
        } else {
          ctx.lineTo(col * line_length, row * line_length + line_length);
        }
      }
    }

    ctx.stroke();
  }

  drawArtFredkin() {
    const ctx = this.ctx!;

    // odd rows should be chosen so that cols is also odd for symmetry
    const rows = 107;
    const cols = Math.floor(rows / this.width_to_height_ratio);

    const square_scale = this.draw_width / cols;
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
    const draw_pants = (center_row: number, center_col: number) => {
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
    draw_pants(center_row, center_col);

    draw_pants(1, 1);
    draw_pants(1 + quarter_rows, 1 + quarter_cols);

    draw_pants(1, cols - 2);
    draw_pants(1 + quarter_rows, cols - 2 - quarter_cols);

    draw_pants(rows - 2, 1);
    draw_pants(rows - 2 - quarter_rows, 1 + quarter_cols);

    draw_pants(rows - 2, cols - 2);
    draw_pants(rows - 2 - quarter_rows, cols - 2 - quarter_cols);

    for (let gen = 0; gen < this.state.parameterA * 5; gen++) {
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

  stringToArtType(s: string): ArtType {
    return ArtType[ArtType[Number(s)] as keyof typeof ArtType];
  }

  render(): React.ReactNode {
    return (
      <div>
        <canvas className="ArtCanvas" ref={this.element} />
        <select
          defaultValue={String(this.state.type)}
          onChange={event =>
            this.setState({
              parameterA: 5,
              type: this.stringToArtType(event.target.value)
            })
          }
        >
          <option value={ArtType.Schotter}>Schotter</option>
          <option value={ArtType.Linien}>Linien</option>
          <option value={ArtType.Diamond}>Diamond</option>
          <option value={ArtType.Moiré1}>Moiré 1.</option>
          <option value={ArtType.Moiré2}>Moiré 2.</option>
          <option value={ArtType.Maze}>Doolhof</option>
          <option value={ArtType.Fredkin}>Fredkin</option>
        </select>
        <input
          type="range"
          name="parameter_a"
          min="0"
          max="10"
          step="0.2"
          value={String(this.state.parameterA)}
          onChange={event =>
            this.setState({
              parameterA: Number(event.target.value)
            })
          }
        />
      </div>
    );
  }
}

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Generative Art</h1>
      <div>
        <ArtCanvas />
      </div>
    </div>
  );
};

export default App;
