import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { Matrix4 } from "./UtilMatrix4";
import { Point3D } from "./ArtPieceIso";

class Face {
  vertices: [Point3D, Point3D, Point3D, Point3D];
  height: number;
  color: Color;

  constructor(vertices: [Point3D, Point3D, Point3D, Point3D], color?: Color) {
    this.vertices = vertices;
    this.height = 0;
    this.color = color || new Color();

    this.setHeight();
  }

  private setHeight() {
    this.height =
      this.vertices.reduce((acc, curr) => acc + curr.y, 0) /
      this.vertices.length;
  }
}

class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r = 0, g = 0, b = 0, a = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  private clamp(min: number, x: number, max: number): number {
    return Math.min(max, Math.max(min, Math.floor(x)));
  }

  randomize(random: number) {
    const intensity = 32;
    this.r += random * intensity - intensity / 2;
    this.g += random * intensity - intensity / 2;
    this.b += random * intensity - intensity / 2;

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
  private cloudTranslation: WebGLUniformLocation | undefined;
  private positionBuffer: WebGLBuffer | null | undefined;
  private colorBuffer: WebGLBuffer | null | undefined;
  private amount_of_vertices: number | undefined;
  private vertex_range_min: Point3D;
  private vertex_range_max: Point3D;

  constructor(name: string, uses_random_pool: boolean, canvas: ArtCanvas) {
    super(name, uses_random_pool, canvas);
    this.rotating_shape_radians = 0;
    this.gl = this.canvas.getContextGl();
    this.vertex_range_min = new Point3D();
    this.vertex_range_max = new Point3D();
  }

  abstract generateShape(): Face[][];

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

  private setVertexRange(faces: Face[]) {
    this.vertex_range_min = new Point3D(Infinity, Infinity, Infinity);
    this.vertex_range_max = new Point3D(-Infinity, -Infinity, -Infinity);

    faces.forEach(f => {
      this.vertex_range_min.x = Math.min(
        this.vertex_range_min.x,
        ...f.vertices.map(v => v.x)
      );
      this.vertex_range_min.y = Math.min(
        this.vertex_range_min.y,
        ...f.vertices.map(v => v.y)
      );
      this.vertex_range_min.z = Math.min(
        this.vertex_range_min.z,
        ...f.vertices.map(v => v.z)
      );

      this.vertex_range_max.x = Math.max(
        this.vertex_range_max.x,
        ...f.vertices.map(v => v.x)
      );
      this.vertex_range_max.y = Math.max(
        this.vertex_range_max.y,
        ...f.vertices.map(v => v.y)
      );
      this.vertex_range_max.z = Math.max(
        this.vertex_range_max.z,
        ...f.vertices.map(v => v.z)
      );
    });

    console.log(
      `x range: [${this.vertex_range_min.x}, ${this.vertex_range_max.x}]`
    );
    console.log(
      `y range: [${this.vertex_range_min.y}, ${this.vertex_range_max.y}]`
    );
    console.log(
      `z range: [${this.vertex_range_min.z}, ${this.vertex_range_max.z}]`
    );
  }

  private setVertices(faces: Face[]) {
    let amount_of_vertices = 0;
    let vertices: number[] = [];

    this.setVertexRange(faces);

    faces.forEach(f => {
      const v = f.vertices;
      vertices.push(...v[0].xyz());
      vertices.push(...v[2].xyz());
      vertices.push(...v[1].xyz());

      vertices.push(...v[0].xyz());
      vertices.push(...v[3].xyz());
      vertices.push(...v[2].xyz());

      amount_of_vertices += 6;
    });

    // currently 0, 0 is top-left
    // console.log("vertices");
    // this.printTriangles(vertices);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      Float32Array.from(vertices),
      this.gl.STATIC_DRAW
    );

    return amount_of_vertices;
  }

  private setColors(faces: Face[]) {
    const gl_colors: number[] = [];

    // river_sources.forEach(source => {
    //   let [row, col] = source;
    //   let path = [];
    //   while (true) {
    //     path.push([row, col]);
    //     let height = faces[row][col].height;
    //     let lower_positions: [number, number][] = [];
    //     // up
    //     if (row - 1 >= 0) {
    //       let new_height = faces[row - 1][col].height;
    //       if (new_height > height) {
    //         lower_positions.push([row - 1, col]);
    //       }
    //     }

    //     // down
    //     if (row + 1 < faces.length) {
    //       let new_height = faces[row + 1][col].height;
    //       if (new_height > height) {
    //         lower_positions.push([row + 1, col]);
    //       }
    //     }

    //     // left
    //     if (col - 1 >= 0) {
    //       let new_height = faces[row][col - 1].height;
    //       if (new_height > height) {
    //         lower_positions.push([row, col - 1]);
    //       }
    //     }

    //     // right
    //     if (col + 1 < faces[0].length) {
    //       let new_height = faces[row][col + 1].height;
    //       if (new_height > height) {
    //         lower_positions.push([row, col + 1]);
    //       }
    //     }

    //     // found local minimum
    //     if (lower_positions.length === 0) {
    //       break;
    //     } else {
    //       let i = Math.floor(
    //         this.canvas.state.random_pool[random_i++] * lower_positions.length
    //       );
    //       [row, col] = lower_positions[i];
    //     }
    //   }

    //   const ending_height = faces[row][col].height;
    //   if (ending_height >= 0.19) {
    //     // only color if it ends in water
    //     path.forEach(([row, col]) => {
    //       colors[row][col] = new Color(0, 0, 255);
    //     });
    //   }
    // });

    const vertices_per_face = 6;
    faces.forEach(face => {
      for (let j = 0; j < vertices_per_face; j++) {
        gl_colors.push(face.color.r);
        gl_colors.push(face.color.g);
        gl_colors.push(face.color.b);
        gl_colors.push(face.color.a);
      }
    });

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
    uniform float cloud_translation;

    varying vec4 v_color;

    void main() {
      vec4 final_pos = a_position;
      vec4 final_color = a_color;

      // clouds
      if (a_color.a < 1.0) {
        final_pos.x += cloud_translation;

        if (final_pos.x > 1.0) {
          final_pos.x -= 1.0;
        }

        float edge = 0.3;
        vec4 transparent = vec4(1, 1, 1, 0);
        if (final_pos.x < edge) {
          final_color = mix(transparent, final_color, final_pos.x / edge);
        } else if (final_pos.x > 1.0 - edge) {
          final_color = mix(transparent, final_color, 1.0 - (final_pos.x - (1.0 - edge)) / edge);
        }
      }

      // Multiply the position by the matrix
      gl_Position = u_matrix * final_pos;

      // Pass color to the fragment shader
      v_color = final_color;
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
    this.cloudTranslation = this.getUniformLocationAndCheck(
      this.program,
      "cloud_translation"
    );

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer!);
    const faces = this.generateShape();
    let flattened_faces = faces.flat();
    flattened_faces.sort((a, b) => b.height - a.height); // painter's algorithm
    this.amount_of_vertices = this.setVertices(flattened_faces);

    this.colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer!);
    this.setColors(flattened_faces);
  }

  draw(init = true) {
    // console.time("iso_setup");
    if (init) {
      this.setup();
    }

    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(
      0,
      0,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight
    );

    // Clear the canvas.
    this.gl.clearColor(0.8, 0.8, 0.8, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
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

    size = 4; // 4 components per iteration
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
      (current_render_ms - (this.last_render_ms || 0)) * 0.0002;
    this.last_render_ms = current_render_ms;

    const map_size = this.canvas.html_element.clientHeight * 0.9;
    const scale_factor = map_size;
    const x_offset = (this.canvas.html_element.clientWidth - map_size) / 2;
    const y_offset =
      (map_size * (1 - this.vertex_range_max.y - this.vertex_range_min.y)) / 2;

    const translation = [x_offset, y_offset, 0];
    const rotation = [Math.PI / 4, this.rotating_shape_radians, 0];
    const scale = [scale_factor, scale_factor, 0.1];
    const m4 = new Matrix4();
    let matrix = m4.projection(
      (this.gl.canvas as HTMLCanvasElement).clientWidth,
      (this.gl.canvas as HTMLCanvasElement).clientHeight,
      400
    );
    // this happens last
    matrix = m4.translate(
      matrix,
      translation[0],
      translation[1],
      translation[2]
    );
    const y_center =
      -this.vertex_range_min.y -
      (this.vertex_range_max.y - this.vertex_range_min.y) / 2;
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    matrix = m4.translate(matrix, 0.5, -y_center, 0.5);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    // this happens first
    matrix = m4.translate(matrix, -0.5, y_center, -0.5);

    // Set the matrix.
    this.gl.uniformMatrix4fv(this.matrixLocation!, false, matrix);

    // Set the current time
    const seconds_cloud_cycle = 15;
    this.gl.uniform1f(
      this.cloudTranslation!,
      ((current_render_ms / 1000) % seconds_cloud_cycle) / seconds_cloud_cycle
    );

    // Draw the geometry.
    const primitiveType = this.gl.TRIANGLES;
    offset = 0;
    // console.timeEnd("iso_setup");
    // console.time("iso_render");
    this.gl.drawArrays(primitiveType, offset, this.amount_of_vertices!);
    // console.timeEnd("iso_render");

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
  private seed: number;
  private canvas: ArtCanvas;

  constructor(canvas: ArtCanvas, samples_per_row: number, seed: number) {
    this.gridcells = 5; // gridcells * gridsize should be 1
    this.gridsize = 0.2;
    this.gradients = [];
    this.samples = [];
    this.samples_per_row = samples_per_row;
    this.seed = Math.floor(seed * 9_999);
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
          this.canvas.state.random_pool[i * this.gridcells + j + this.seed] *
          Math.PI *
          2;
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
  private clouds: PerlinData;

  constructor(name: string, uses_random_pool: boolean, canvas: ArtCanvas) {
    super(name, uses_random_pool, canvas);
    this.samples_per_row = 91;
    this.terrain = new PerlinData(
      canvas,
      this.samples_per_row + 1, // + 1 because of fenceposting
      this.canvas.state.random_pool[0]
    );
    this.clouds = new PerlinData(
      canvas,
      this.samples_per_row + 1,
      1 - this.canvas.state.random_pool[0]
    );
  }

  setup() {
    this.terrain.init();
    this.clouds.init();
    super.setup();
  }

  private generateTerrainFace(row: number, col: number): Face {
    const samples = this.terrain.getSamples();
    let face = new Face([
      new Point3D(col + 1, samples[row + 1][col + 1], row + 1),
      new Point3D(col + 1, samples[row][col + 1], row),
      new Point3D(col, samples[row][col], row),
      new Point3D(col, samples[row + 1][col], row + 1),
    ]);

    // small values = tall mountains
    let color;
    const water_level = 0.68;
    const random = this.canvas.state.random_pool[row * col];
    if (face.height < 0.24 && random < 0.96) {
      // snow
      color = new Color(255, 255, 255);
    } else if (face.height < 0.5) {
      // rock
      color = new Color(170, 164, 157);
    } else if (face.height < 0.6) {
      // gras
      color = new Color(96, 128, 56);
    } else if (face.height < water_level) {
      // sand
      color = new Color(194, 178, 128);
    } else {
      // water
      color = new Color(0, 0, 230);
    }
    color.randomize(random);
    face.color = color;

    face.vertices.forEach(vertex => {
      vertex.y = Math.min(vertex.y, water_level - 0.04);
      vertex.divide(
        new Point3D(
          this.samples_per_row,
          1.3 + (10 - this.canvas.state.parameterA) / 4,
          this.samples_per_row
        )
      );
    });

    return face;
  }

  private generateCloudFaces(row: number, col: number): Face[] {
    const samples = this.clouds.getSamples();
    const cloud_intensity = 120;
    const cloud_alpha = 100;
    const center = this.samples_per_row / 2;
    let cloud_height = 0.07;
    let faces = [];
    let sample = samples[row][col];

    const distance_to_center = Math.sqrt(
      Math.pow(row - center, 2) + Math.pow(col - center, 2)
    );

    if (distance_to_center > center / 1.2) {
      // fade
      const offset = (distance_to_center / center) * 0.3;
      // if (Math.random() > 0.9)
      //   console.log(
      //     "Fade. Distance to center",
      //     distance_to_center,
      //     "Row, Col",
      //     row,
      //     col,
      //     "Sample",
      //     sample,
      //     "Offset",
      //     offset
      //   );
      sample += offset;
    }
    for (; sample < 0.5; sample += 0.05) {
      const face = new Face([
        new Point3D(col + 1, cloud_height, row + 1),
        new Point3D(col + 1, cloud_height, row),
        new Point3D(col, cloud_height, row),
        new Point3D(col, cloud_height, row + 1),
      ]);
      face.color = new Color(
        cloud_intensity,
        cloud_intensity,
        cloud_intensity,
        cloud_alpha
      );

      // todo generalize
      face.vertices.forEach(vertex => {
        vertex.divide(
          new Point3D(this.samples_per_row, 1, this.samples_per_row)
        );
      });

      faces.push(face);
      cloud_height -= 0.005;
    }

    return faces;
  }

  generateShape(): Face[][] {
    const faces: Face[][] = [];

    for (let row = 0; row < this.samples_per_row; ++row) {
      let current_row: Face[] = [];
      for (let col = 0; col < this.samples_per_row; ++col) {
        current_row.push(this.generateTerrainFace(row, col));
        current_row = current_row.concat(this.generateCloudFaces(row, col));
      }
      faces.push(current_row);
    }

    return faces;
  }
}
