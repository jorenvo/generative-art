import React from "react";
import "./App.css";

enum ArtType {
  Schotter,
  Linien,
  Diamond,
  Moiré1,
  Moiré2,
  Maze,
  Fredkin1,
  Fredkin2,
  Iso,
  IsoColor
}

interface ArtCanvasState {
  type: ArtType;
  parameterA: number;
}

class Point3D {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(other: Point3D) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
  }

  remove(other: Point3D) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
  }
}

class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  private element: React.RefObject<HTMLCanvasElement>;
  private width_to_height_ratio: number;
  private draw_width: number;
  private width: number;
  private draw_height: number;
  private height: number;
  private margin: number;
  private dom_element: HTMLCanvasElement | undefined;
  private random_pool: number[];

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
      type: ArtType.Schotter,
      parameterA: 5
    };
  }

  componentDidMount() {
    this.dom_element = this.element.current!;
    this.dom_element.width = this.width;
    this.dom_element.height = this.height;
    this.drawArt();
  }

  componentDidUpdate() {
    this.drawArt();
  }

  private getContext() {
    const element = this.dom_element;
    if (!element) {
      throw new Error("Could not get canvas DOM element.");
    } else {
      const ctx = element.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get context for canvas.");
      } else {
        return ctx;
      }
    }
  }

  private drawArt() {
    const ctx = this.getContext();
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
      case ArtType.Fredkin1: {
        this.drawArtFredkin1();
        break;
      }
      case ArtType.Fredkin2: {
        this.drawArtFredkin2();
        break;
      }
      case ArtType.Iso: {
        this.drawArtIso(!"no color");
        break;
      }
      case ArtType.IsoColor: {
        this.drawArtIso(!!"color");
        break;
      }
    }
    ctx.restore();
  }

  private drawArtSchotter() {
    const ctx = this.getContext();
    const rect_per_row = 20;
    const rect_per_col = rect_per_row * (this.height / this.width);

    const rect_width = this.draw_width / rect_per_row;
    const rect_height = this.draw_height / rect_per_col;

    let random_index = 0;

    ctx.beginPath();
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
        ctx.rect(offset_col, offset_row, rect_width, rect_height);
        ctx.restore();
      }
    }
    ctx.stroke();
  }

  private drawArtLinien() {
    const ctx = this.getContext();
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

  private drawArtDiamond() {
    const ctx = this.getContext();
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

  private drawArtMoiré1() {
    const ctx = this.getContext();
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

  private drawArtMoiré2() {
    const ctx = this.getContext();
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

  private drawArtMaze() {
    const ctx = this.getContext();
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

  private drawArtFredkin(
    seeder: (
      squares: number[][],
      center_row: number,
      center_col: number
    ) => void
  ) {
    const ctx = this.getContext();

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

    for (let gen = 0; gen < this.state.parameterA * 5 + 5; gen++) {
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

  private drawArtFredkin1() {
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

    this.drawArtFredkin(draw_pants);
  }

  private drawArtFredkin2() {
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

    this.drawArtFredkin(draw_pentomino);
  }

  private convertToIso(c: Point3D) {
    const sqrt3 = Math.sqrt(3);
    const temp_x = sqrt3 * c.x + 0 * c.y + -sqrt3 * c.z;
    const temp_y = 1 * c.x + 2 * c.y + 1 * c.z;
    c.x = temp_x;
    c.y = temp_y;

    // z is unused
    // iso_c.z = sqrt2 * c.x + -sqrt2 * c.y + sqrt2 * c.z;
  }

  private generateCube(
    bottom_left_front: Point3D,
    randomize: boolean
  ): Point3D[] {
    let cube: Point3D[] = [
      // top face (ends up bottom in isometric projection)
      new Point3D(0, 1, 0), // top left front
      new Point3D(1, 1, 0), // top right front
      new Point3D(1, 1, 1), // top right back
      new Point3D(0, 1, 1), // top left back
      new Point3D(0, 1, 0), // top left front

      // front face (ends up right back in isometric projection)
      new Point3D(0, 0, 0), // bottom left front
      new Point3D(1, 0, 0), // bottom right front
      new Point3D(1, 1, 0), // top right front
      new Point3D(0, 1, 0), // top left front
      new Point3D(0, 0, 0), // bottom left front

      // left face (ends up back left in isometric projection)
      new Point3D(0, 0, 0), // bottom left front
      new Point3D(0, 0, 1), // bottom left back
      new Point3D(0, 1, 1), // top left back
      new Point3D(0, 1, 0), // top left front
      new Point3D(0, 0, 0), // bottom left front

      // back face (ends up front left in isometric projection)
      new Point3D(0, 0, 1), // bottom left back
      new Point3D(1, 0, 1), // bottom right back
      new Point3D(1, 1, 1), // top right back
      new Point3D(0, 1, 1), // top left back
      new Point3D(0, 0, 1), // bottom left back

      // right face (ends up back right in isometric projection)
      new Point3D(1, 0, 0), // bottom right front
      new Point3D(1, 0, 1), // bottom right back
      new Point3D(1, 1, 1), // top right back
      new Point3D(1, 1, 0), // top right front
      new Point3D(1, 0, 0), // bottom right front

      // bottom face (ends up top in isometric projection)
      new Point3D(0, 0, 0), // bottom left front
      new Point3D(1, 0, 0), // bottom right front
      new Point3D(1, 0, 1), // bottom right back
      new Point3D(0, 0, 1), // bottom left back
      new Point3D(0, 0, 0) // bottom left front
    ];
    bottom_left_front.y *= -1;

    let random_index = 0;
    const scale = 20;
    const parameter = this.state.parameterA - 5;
    cube.forEach(p => {
      p.add(bottom_left_front);

      if (randomize) {
        const random = new Point3D(
          (this.random_pool[random_index++] * parameter) / scale,
          (this.random_pool[random_index++] * parameter) / scale,
          0
        );

        if (this.random_pool[random_index++] > 0.5) {
          p.add(random);
        } else {
          p.remove(random);
        }
      }
    });

    return cube;
  }

  private drawArtIso(color: boolean) {
    let random_index = 0;
    const cube_size = 10;
    const horizontal_cubes = cube_size;
    const cube_depth = cube_size;
    const cube_height = cube_size;

    const starting_height = cube_height;
    let column_height: number[][] = [];
    for (let row = 0; row < cube_depth; row++) {
      column_height[row] = [];
      for (let col = 0; col < horizontal_cubes; col++) {
        let prev_height = starting_height;
        if (row - 1 >= 0) {
          prev_height = column_height[row - 1][col];
        }

        column_height[row][col] = prev_height;
        if (this.random_pool[random_index++] < col / horizontal_cubes) {
          column_height[row][col]--;
        }

        if (col - 1 >= 0) {
          column_height[row][col] = Math.min(
            column_height[row][col],
            column_height[row][col - 1]
          );
        }
      }
    }

    // 0 depth is at the back
    // 0 i is to the right

    let cubes: Point3D[] = [];
    for (let height = 0; height < cube_height; height++) {
      for (let depth = 0; depth < cube_depth; depth++) {
        for (let i = 0; i < horizontal_cubes; i++) {
          // skip if there is something
          // - in front of it and,
          // - to the right of it and,
          // - on top of it
          const in_front =
            depth + 1 < column_height.length &&
            column_height[depth + 1][i] > height + 1;
          const to_the_right =
            i + 1 < column_height[depth].length &&
            column_height[depth][i + 1] > height + 1;
          const occluded = in_front && to_the_right;
          if (!occluded && height <= column_height[depth][i]) {
            cubes.push(
              ...this.generateCube(new Point3D(i, height, depth), !color)
            );
          }
        }
      }
    }

    this.paintIsoArt(horizontal_cubes, cube_depth, cubes, color);
  }

  private convertToScreenCoordinates(
    cube_depth: number,
    scale: number,
    x: number
  ): number {
    const sqrt3 = Math.sqrt(3);
    return (x + sqrt3 * cube_depth) * scale;
  }

  private paintIsoArt(
    horizontal_cubes: number,
    cube_depth: number,
    cubes: Point3D[],
    color: boolean
  ) {
    const ctx = this.getContext();
    // console.log("rendering", cubes.length / (5 * 6), "cubes");

    // range is:
    // [-sqrt3 * cube_depth, ..., horizontal_cubes * sqrt3]
    // add cube_depth * sqrt3
    //   [0, ..., horizontal_cubes * sqrt3 + cube_depth * sqrt3]
    // = [0, ..., (horizontal_cubes + cube_depth) * sqrt3]
    // divide by (horizontal_cubes + cube_depth) * sqrt3
    // [0, ..., 1]
    // multiply by draw_width
    // [0, ..., draw_width]
    const scale =
      this.draw_width / ((horizontal_cubes + cube_depth) * Math.sqrt(3));
    for (let index = 0; index < cubes.length; index++) {
      this.convertToIso(cubes[index]);
      cubes[index].x = this.convertToScreenCoordinates(
        cube_depth,
        scale,
        cubes[index].x
      );
      cubes[index].y = this.convertToScreenCoordinates(
        cube_depth,
        scale,
        cubes[index].y
      );
      cubes[index].z = this.convertToScreenCoordinates(
        cube_depth,
        scale,
        cubes[index].z
      );
    }

    ctx.beginPath();

    let palette = ["white"];
    if (color) {
      // generated with https://colourco.de/
      const palettes = [
        ["#619b3d", "#3e9eaa", "#8a3eba", "#c55243"],
        ["#c6a36c", "#75cd7f", "#7e9fd4", "#da88d1"],
        ["#42b87a", "#42bda1", "#44b7c0", "#4794c2", "#4972c5"],
        ["#35885c", "#373997", "#a63772", "#b6b238"],
        ["#cd7376", "#d08e76", "#d2ab79", "#d4c87c", "#c8d67f"],
        ["#3e9e55", "#3f5cad", "#bd3f9f", "#c6a445"]
      ];
      palette =
        palettes[Math.floor((this.state.parameterA / 11) * palettes.length)];
    }

    let palette_index = 0;
    let new_face = true;
    for (let i = 0; i < cubes.length; i++) {
      if (i % 5 === 0) {
        new_face = true;
        ctx.fillStyle = palette[palette_index];
        palette_index = (palette_index + 1) % palette.length;
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
      }

      if (new_face) {
        ctx.moveTo(cubes[i].x, cubes[i].y);
        new_face = false;
      } else {
        ctx.lineTo(cubes[i].x, cubes[i].y);
      }
    }

    // draw last face
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private stringToArtType(s: string): ArtType {
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
          <option value={ArtType.Fredkin1}>Fredkin 1.</option>
          <option value={ArtType.Fredkin2}>Fredkin 2.</option>
          <option value={ArtType.Iso}>Iso</option>
          <option value={ArtType.IsoColor}>Isocolor</option>
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
