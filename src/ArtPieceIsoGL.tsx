import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { Matrix4 } from "./UtilMatrix4";
import { Point3D } from "./ArtPieceIso";

class Color {
  r: number;
  g: number;
  b: number;

  constructor(r = 0, g = 0, b = 0) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  private clamp(min: number, x: number, max: number): number {
    return Math.min(max, Math.max(min, Math.floor(x)));
  }

  randomize() {
    const intensity = 32;
    this.r += Math.random() * intensity - intensity / 2;
    this.g += Math.random() * intensity - intensity / 2;
    this.b += Math.random() * intensity - intensity / 2;

    this.r = this.clamp(0, this.r, 255);
    this.g = this.clamp(0, this.g, 255);
    this.b = this.clamp(0, this.b, 255);
  }
}

export abstract class IsoShapeRotateGL extends ArtPiece {
  private last_render_ms: number | undefined;
  private gl: WebGLRenderingContext;
  protected rotating_shape_radians: number;
  private program: WebGLProgram | undefined;
  private positionLocation: number | undefined;
  private colorLocation: number | undefined;
  private matrixLocation: WebGLUniformLocation | undefined;
  private positionBuffer: WebGLBuffer | null | undefined;
  private colorBuffer: WebGLBuffer | null | undefined;
  private amount_of_vertices: number | undefined;
  private random_pool_i: number;

  constructor(name: string, uses_random_pool: boolean, canvas: ArtCanvas) {
    super(name, uses_random_pool, canvas);
    this.rotating_shape_radians = 0;
    this.gl = this.canvas.getContextGl();
    this.random_pool_i = 0;
  }

  abstract generateShape(): Point3D[][][];
  abstract generateColor(): Color[];

  is_2d() {
    return false;
  }

  private createShader(type: number, source: string) {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (success) {
      return shader;
    } else {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(info || "undefined shader compilation error");
    }
  }

  private createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) {
      return program;
    } else {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(info || "undefined program creation error");
    }
  }

  private setVertices(rows: Point3D[][][]) {
    let vertices: number[] = [];
    rows.forEach(row =>
      row.forEach(f => {
        vertices.push(...f[0].xyz());
        vertices.push(...f[2].xyz());
        vertices.push(...f[1].xyz());

        vertices.push(...f[0].xyz());
        vertices.push(...f[3].xyz());
        vertices.push(...f[2].xyz());
      })
    );

    // currently 0, 0 is top-left
    // console.log("vertices");
    // this.printTriangles(vertices);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      Float32Array.from(vertices),
      this.gl.STATIC_DRAW
    );
  }

  private getCenterY(points: Point3D[]): number {
    return points.reduce((acc, curr) => acc + curr.y, 0) / points.length;
  }

  private setColors(rows: Point3D[][][]) {
    const colors: Color[][] = [];
    const gl_colors: number[] = [];

    let random_i = 0;
    const river_sources: [number, number][] = [];
    rows.forEach((row, i) => {
      let color_row: Color[] = [];
      row.forEach((face, j) => {
        // small values = tall mountains
        const height = this.getCenterY(face);

        let color;
        // todo i think 1 / 4 is the max
        if (height < 0.08) {
          // snow
          color = new Color(255, 255, 255);
          if (this.canvas.state.random_pool[random_i++] > 0.998) {
            river_sources.push([i, j]);
          }
        } else if (height < 0.14) {
          // rock
          color = new Color(170, 164, 157);
          if (this.canvas.state.random_pool[random_i++] > 0.999) {
            river_sources.push([i, j]);
          }
        } else if (height < 0.17) {
          // gras
          color = new Color(96, 128, 56);
        } else if (height < 0.19) {
          // sand
          color = new Color(194, 178, 128);
        } else {
          // water
          color = new Color(0, 0, 230);
        }
        //color.randomize();
        color_row.push(color);
      });
      colors.push(color_row);
    });

    river_sources.forEach(source => {
      let [row, col] = source;
      let path = [];
      while (true) {
        path.push([row, col]);
        let height = this.getCenterY(rows[row][col]);
        let lower_positions: [number, number][] = [];
        // up
        if (row - 1 >= 0) {
          let new_height = this.getCenterY(rows[row - 1][col]);
          if (new_height > height) {
            lower_positions.push([row - 1, col]);
          }
        }

        // down
        if (row + 1 < rows.length) {
          let new_height = this.getCenterY(rows[row + 1][col]);
          if (new_height > height) {
            lower_positions.push([row + 1, col]);
          }
        }

        // left
        if (col - 1 >= 0) {
          let new_height = this.getCenterY(rows[row][col - 1]);
          if (new_height > height) {
            lower_positions.push([row, col - 1]);
          }
        }

        // right
        if (col + 1 < rows[0].length) {
          let new_height = this.getCenterY(rows[row][col + 1]);
          if (new_height > height) {
            lower_positions.push([row, col + 1]);
          }
        }

        // found local minimum
        if (lower_positions.length === 0) {
          break;
        } else {
          let i = Math.floor(this.canvas.state.random_pool[random_i++] * lower_positions.length);
          [row, col] = lower_positions[i];
        }
      }

      const ending_height = this.getCenterY(rows[row][col]);
      if (ending_height >= 0.19) { // only color if it ends in water
        path.forEach(([row, col]) => {
          colors[row][col] = new Color(0, 0, 255);
        });
      }
    });

    const vertices_per_face = 6;
    colors.forEach(row =>
      row.forEach(color => {
        for (let j = 0; j < vertices_per_face; j++) {
          gl_colors.push(color.r);
          gl_colors.push(color.g);
          gl_colors.push(color.b);
        }
      })
    );

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      Uint8Array.from(gl_colors),
      this.gl.STATIC_DRAW
    );
  }

  private getAttribLocationAndCheck(program: WebGLProgram, name: string) {
    const location = this.gl.getAttribLocation(program, name);
    if (location === null) {
      throw new Error(`${name} not found`);
    } else {
      return location;
    }
  }

  private getUniformLocationAndCheck(
    program: WebGLProgram,
    name: string
  ): WebGLUniformLocation {
    const location = this.gl.getUniformLocation(program, name);
    if (location === null) {
      throw new Error(`${name} not found`);
    } else {
      return location;
    }
  }

  public setup() {
    const vertex_shader_src = `
    attribute vec4 a_position;
    attribute vec4 a_color;

    uniform mat4 u_matrix;

    varying vec4 v_color;

    void main() {
      // Multiply the position by the matrix
      gl_Position = u_matrix * a_position;

      // Pass color to the fragment shader
      v_color = a_color;
    }
        `;
    const vertex_shader = this.createShader(
      this.gl.VERTEX_SHADER,
      vertex_shader_src
    );

    const fragment_shader_src = `
    precision mediump float;

    // comes from the vertex shader
    varying vec4 v_color;

    void main() {
       gl_FragColor = v_color;
    }
        `;
    const fragment_shader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragment_shader_src
    );
    this.program = this.createProgram(vertex_shader, fragment_shader);

    this.positionLocation = this.getAttribLocationAndCheck(
      this.program,
      "a_position"
    );
    this.colorLocation = this.getAttribLocationAndCheck(
      this.program,
      "a_color"
    );
    this.matrixLocation = this.getUniformLocationAndCheck(
      this.program,
      "u_matrix"
    );

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer!);
    const rows = this.generateShape();
    this.setVertices(rows);

    this.colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer!);
    this.setColors(rows);

    this.amount_of_vertices = rows.length * rows[0].length * 6;
    this.random_pool_i = 0;
  }

  draw(init = true) {
    if (init) {
      this.setup();
    }
    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Clear the canvas.
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.enable(this.gl.CULL_FACE);

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.useProgram(this.program!);
    this.gl.enableVertexAttribArray(this.positionLocation!);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer!);

    let size = 3; // 3 components per iteration
    let type = this.gl.FLOAT; // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      this.positionLocation!,
      size,
      type,
      normalize,
      stride,
      offset
    );

    this.gl.enableVertexAttribArray(this.colorLocation!);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer!);

    size = 3; // 3 components per iteration
    type = this.gl.UNSIGNED_BYTE; // the data is 8bit unsigned values
    normalize = true; // normalize the data (convert from 0-255 to 0-1)
    stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      this.colorLocation!,
      size,
      type,
      normalize,
      stride,
      offset
    );

    const current_render_ms = performance.now();
    this.rotating_shape_radians +=
      (current_render_ms - (this.last_render_ms || 0)) * 0.0004;
    this.last_render_ms = current_render_ms;
    const translation = [0, 150, 0];
    const rotation = [Math.PI / 5, this.rotating_shape_radians, 0];
    const scale = [this.canvas.width, this.canvas.height, 1];
    const m4 = new Matrix4();
    let matrix = m4.projection(
      (this.gl.canvas as HTMLCanvasElement).clientWidth,
      (this.gl.canvas as HTMLCanvasElement).clientHeight,
      400
    );
    matrix = m4.translate(
      matrix,
      translation[0],
      translation[1],
      translation[2]
    );
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    matrix = m4.translate(matrix, 0.5, 0.5, 0.5);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.translate(matrix, -0.5, -0.5, -0.5);

    // Set the matrix.
    this.gl.uniformMatrix4fv(this.matrixLocation!, false, matrix);

    // Draw the geometry.
    const primitiveType = this.gl.TRIANGLES;
    offset = 0;
    this.gl.drawArrays(primitiveType, offset, this.amount_of_vertices!);

    this.canvas.animation_id = requestAnimationFrame(() => this.draw(false));
  }
}

// http://www.huttar.net/lars-kathy/graphics/perlin-noise/perlin-noise.html
class PerlinData {
  private readonly gridcells: number;
  private readonly gridsize: number;
  private gradients: Point3D[][];
  private samples: number[][];
  private samples_per_row: number;
  private canvas: ArtCanvas;

  constructor(canvas: ArtCanvas, samples_per_row: number) {
    this.gridcells = 5; // gridcells * gridsize should be 1
    this.gridsize = 0.2;
    this.gradients = [];
    this.samples = [];
    this.samples_per_row = samples_per_row;
    this.canvas = canvas;
    this.init();
  }

  public init() {
    this.gradients = this.initGradients();
    this.samples = this.initSamples();
  }

  private initGradients() {
    const gradients: Point3D[][] = [];
    for (let i = 0; i <= this.gridcells; i++) {
      gradients.push([]);
      for (let j = 0; j <= this.gridcells; j++) {
        let angle_unit_circle =
          this.canvas.state.random_pool[i * this.gridcells + j] * Math.PI * 2;
        gradients[i].push(
          new Point3D(Math.cos(angle_unit_circle), Math.sin(angle_unit_circle))
        );
      }
    }
    return gradients;
  }

  private initSamples() {
    const samples: number[][] = [];
    const half_range = Math.sqrt(2) / 2;
    for (let row = 0; row < this.samples_per_row; ++row) {
      samples.push([]);
      for (let col = 0; col < this.samples_per_row; ++col) {
        let sample = this.perlin(
          row / this.samples_per_row,
          col / this.samples_per_row
        );
        sample += half_range;
        sample /= 2 * half_range;
        samples[row].push(sample);
      }
    }
    return samples;
  }

  private fade(x: number): number {
    return 3 * x * x - 2 * x * x * x;
  }

  private linearlyInterpolate(x1: number, x2: number, weight: number): number {
    return (1 - weight) * x1 + weight * x2;
  }

  private dotProduct(distance: Point3D, gradient: Point3D): number {
    return distance.x * gradient.x + distance.y * gradient.y;
  }

  private perlin(x: number, y: number): number {
    x /= this.gridsize;
    y /= this.gridsize;

    // grid cell coordinates
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const weight_x = this.fade(x - x0);
    const weight_y = this.fade(y - y0);

    let dp1 = this.dotProduct(
      new Point3D(x - x0, y - y0),
      this.gradients[y0][x0]
    );
    let dp2 = this.dotProduct(
      new Point3D(x - x1, y - y0),
      this.gradients[y0][x1]
    );
    let interpolated1 = this.linearlyInterpolate(dp1, dp2, weight_x);

    dp1 = this.dotProduct(new Point3D(x - x0, y - y1), this.gradients[y1][x0]);
    dp2 = this.dotProduct(new Point3D(x - x1, y - y1), this.gradients[y1][x1]);
    let interpolated2 = this.linearlyInterpolate(dp1, dp2, weight_x);

    return this.linearlyInterpolate(interpolated1, interpolated2, weight_y);
  }

  getSamples(): number[][] {
    return this.samples;
  }
}

export class Perlin extends IsoShapeRotateGL {
  private samples_per_row: number;
  private terrain: PerlinData;
  private color: PerlinData;

  constructor(name: string, uses_random_pool: boolean, canvas: ArtCanvas) {
    super(name, uses_random_pool, canvas);
    this.samples_per_row = 210;
    this.terrain = new PerlinData(canvas, this.samples_per_row);
    this.color = new PerlinData(canvas, this.samples_per_row);
  }

  setup() {
    this.terrain.init();
    this.color.init();
    super.setup();
  }

  generateShape(): Point3D[][][] {
    const samples = this.terrain.getSamples();
    const face_vertices: Point3D[][][] = [];

    for (let row = 1; row < this.samples_per_row; ++row) {
      const current_row: Point3D[][] = [];
      for (let col = 1; col < this.samples_per_row; ++col) {
        let row_coord = row;
        let col_coord = col;
        let face: Point3D[] = [];

        face.push(new Point3D(col_coord, samples[row][col], row_coord));
        face.push(new Point3D(col_coord, samples[row - 1][col], row_coord - 1));
        face.push(
          new Point3D(col_coord - 1, samples[row - 1][col - 1], row_coord - 1)
        );
        face.push(new Point3D(col_coord - 1, samples[row][col - 1], row_coord));

        face.forEach(vertex => {
          vertex.divide(
            new Point3D(this.samples_per_row, 3, this.samples_per_row)
          );
          vertex.y = Math.min(vertex.y, 0.19);
        });

        current_row.push(face);
      }
      face_vertices.push(current_row);
    }

    return face_vertices;
  }

  generateColor(): Color[] {
    const samples = this.color.getSamples();
    const flattened = [];

    let random_i = 0;
    const greens = [
      new Color(108, 135, 0),
      new Color(92, 158, 0),
      new Color(23, 199, 0),
    ];
    const browns = [
      new Color(210, 105, 30),
      new Color(135, 104, 0),
      new Color(179, 121, 0),
    ];
    for (let row of samples) {
      for (let sample of row) {
        let color_i = Math.floor(this.canvas.state.random_pool[random_i++] * 3);
        if (sample > 0.4) {
          flattened.push(greens[color_i]);
        } else {
          flattened.push(browns[color_i]);
        }

        // sample *= Math.pow(256, 3) - 1;

        // let r = sample % 256;
        // sample = Math.floor(sample / 256);
        // let g = sample % 256;
        // sample = Math.floor(sample / 256);
        // let b = sample % 256;
        // flattened.push(new Color(r, g, b));
      }
    }

    return flattened;
  }
}
