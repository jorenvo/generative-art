import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { Matrix4 } from "./UtilMatrix4";
import { Point } from "./UtilPoint";
import { Color } from "./UtilColor";

// https://webpack.js.org/loaders/worker-loader/#integrating-with-typescript
// eslint-disable-next-line import/no-webpack-loader-syntax
import GLWorker from "worker-loader!./ArtPieceIsoGLWorker";

export interface IsoShapeRotateGLDataToWorker {
  seed: string;
  parameter_a: number;
}

export interface IsoShapeRotateGLDataToMain {
  vertices: number[];
  colors: number[];
  amount_of_vertices: number;
  vertex_range_min: Point;
  vertex_range_max: Point;
}

export class IsoShapeRotateGL extends ArtPiece {
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
  private amount_of_vertices: number;
  private vertex_range_min: Point;
  private vertex_range_max: Point;
  private animation_id: number | undefined;
  private animation_loop_started: boolean;
  private worker_promise: Promise<unknown>;
  private calc_id: number;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_a: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    super(name, uses_random_pool, uses_parameter_a, uses_parameter_b, canvas);
    this.rotating_shape_radians = 0;
    this.gl = this.canvas.getContextGl();
    this.amount_of_vertices = 0;
    this.vertex_range_min = new Point();
    this.vertex_range_max = new Point();
    this.animation_loop_started = false;
    this.worker_promise = Promise.resolve();
    this.calc_id = 0;

    this.setupWhenLoading();
  }

  cleanUp() {
    super.cleanUp();
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
      this.animation_loop_started = false;
    }
  }

  is2d() {
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

  public setupWhenLoading() {
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
  }

  public setup() {
    // this.amount_of_vertices = 0; // prevent rendering
    const calc_id = ++this.calc_id;
    this.worker_promise = this.worker_promise.then(() => {
      if (calc_id !== this.calc_id) {
        console.log("later calls available, skipping this one");
        return;
      }

      console.time("create GLWorker");
      const gl_worker = new GLWorker();
      console.timeEnd("create GLWorker");
      const data: IsoShapeRotateGLDataToWorker = {
        seed: this.canvas.state.seed,
        parameter_a: this.canvas.state.parameter_a,
      };

      return new Promise((resolve) => {
        gl_worker.onmessage = (e) => {
          console.log(`Got data from worker.`);
          const data = e.data as IsoShapeRotateGLDataToMain;

          this.positionBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer!);
          this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            Float32Array.from(data.vertices),
            this.gl.STATIC_DRAW
          );

          this.colorBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer!);
          this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            Uint8Array.from(data.colors),
            this.gl.STATIC_DRAW
          );

          this.amount_of_vertices = data.amount_of_vertices;
          this.vertex_range_min = data.vertex_range_min;
          this.vertex_range_max = data.vertex_range_max;
          resolve(undefined);
        };

        console.time("postMessage");
        gl_worker.postMessage(data);
        console.timeEnd("postMessage");
      });
    });
  }

  private animationLoop() {
    if (this.amount_of_vertices === 0) {
      console.log("data not ready, waiting on worker?");
      this.animation_id = requestAnimationFrame(() => this.animationLoop()); // todo dedup
      return;
    }

    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(
      0,
      0,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight
    );

    // Clear the canvas.
    let background_color = new Color(0.9, 0.9, 0.9, 1.0);
    if (this.canvas.dark_mode) {
      background_color = new Color(35 / 255, 37 / 255, 38 / 255);
    }
    this.gl.clearColor(
      background_color.r,
      background_color.g,
      background_color.b,
      background_color.a
    );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.useProgram(this.program!);
    this.gl.enableVertexAttribArray(this.positionLocation!);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer!);

    let size = 3; // 3 components per iteration
    let type: number = this.gl.FLOAT; // the data is 32bit floats
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
    this.gl.drawArrays(primitiveType, offset, this.amount_of_vertices);

    this.animation_id = requestAnimationFrame(() => {
      this.animationLoop();
    });
    // console.timeEnd("main_draw");
  }

  draw() {
    console.time("setup");
    this.setup();
    console.timeEnd("setup");

    if (!this.animation_loop_started) {
      this.animation_loop_started = true;
      this.animationLoop();
    }
  }
}
