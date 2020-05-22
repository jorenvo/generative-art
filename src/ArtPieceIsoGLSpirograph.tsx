import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { ArtPieceIsoGLUtils } from "./ArtPieceIsoGLUtils";
import { Color } from "./UtilColor";
import { Matrix4 } from "./UtilMatrix4";
import { Point } from "./UtilPoint";

export class ArtPieceIsoGLSpirograph extends ArtPiece {
  private gl: WebGLRenderingContext;
  private gl_utils: ArtPieceIsoGLUtils;
  private random_i: number;
  private is_setup: boolean;
  private amount_of_vertices: number;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_a: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    super(name, uses_random_pool, uses_parameter_a, uses_parameter_b, canvas);
    this.gl = this.canvas.getContextGl();
    this.gl_utils = this.createUtils();
    this.random_i = 0;
    this.is_setup = false;
    this.amount_of_vertices = 0;
  }

  is2d() {
    return false;
  }

  private createUtils() {
    const vertex_shader = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    varying vec4 v_color;

    uniform mat4 u_matrix;

    void main() {
      v_color = a_color;
      gl_Position = u_matrix * a_position;
    }
    `;
    const fragment_shader = `
    precision mediump float;

    // comes from the vertex shader
    varying vec4 v_color;

    void main() {
       gl_FragColor = v_color;
    }
    `;

    const utils = new ArtPieceIsoGLUtils(
      this.gl,
      vertex_shader,
      fragment_shader
    );
    return utils;
  }

  private setProjection() {
    const translation = [0, 0, 0];
    // const scale = [1, 1, 1];
    const m4 = new Matrix4();
    const rotate = [
      // TODO before using this properly center the canvas
      0, // ((this.canvas.state.parameter_a / 10) * Math.PI) / 2,
      -((this.canvas.state.parameter_a / 10) * Math.PI) / 2,
      0, // ((this.canvas.state.parameter_a / 10) * Math.PI) / 2,
    ];
    let matrix = m4.projection(
      (this.gl.canvas as HTMLCanvasElement).clientWidth,
      (this.gl.canvas as HTMLCanvasElement).clientHeight,
      9_999
    );
    // this happens last
    matrix = m4.translate(
      matrix,
      translation[0],
      translation[1],
      translation[2]
    );

    matrix = m4.translate(matrix, 300, 0, 0);

    matrix = m4.zRotate(matrix, rotate[2]);
    matrix = m4.yRotate(matrix, rotate[1]);
    matrix = m4.xRotate(matrix, rotate[0]);

    // this happens first
    matrix = m4.translate(matrix, -300, 0, 0);

    // Set the matrix.
    this.gl.uniformMatrix4fv(
      this.gl_utils.getLocation("u_matrix"),
      false,
      matrix
    );
  }

  private getVertices() {
    const nr_rotations = 8;
    const triangle = [
      new Point(0, 0, 0),
      new Point(1, nr_rotations - 1, 0),
      new Point(nr_rotations - 1, 0, 0),
    ];
    const flipped_triangle = [
      new Point(1, nr_rotations - 1, 0),
      new Point(nr_rotations - 1, 0, 0),
      new Point(nr_rotations, nr_rotations - 1, 0),
    ];
    const rhombus = triangle.concat(flipped_triangle);
    rhombus.forEach((v) => v.for_each_dimension((a) => a * 5));

    const angle = (2 * Math.PI) / (nr_rotations - 1);
    const res: Point[] = [];
    let prev = new Point(200, 200, 0);

    for (let i = 0; i < nr_rotations * 60; ++i) {
      const pattern_copy = rhombus.map((v) => v.copy());
      const pattern_angle = i * angle;
      pattern_copy.forEach((v) => {
        v.rotate_yz(pattern_angle);
        v.add(prev);
        res.push(v);
      });

      prev = res[res.length - 3];
    }

    // const mark_center = [
    //   new Point(center.x, center.y, 0),
    //   new Point(center.x + 10, center.y + 10, 0),
    //   new Point(center.x, center.y + 10, 0),
    // ];
    // console.log(rhombus);
    // console.log(center.xyz());
    // mark_center.forEach((v) => (v.z = -100));
    // res.push(...mark_center);
    // res.push(...rhombus);

    return res;
  }

  private getColors(amount: number) {
    const color = new Color(0, 0, 200);
    const colors: Color[] = [];

    if (amount % 3 !== 0) {
      throw new Error("Vertices not a multiple of 3");
    }

    for (let i = 0; i < amount; i += 3) {
      const random_color = color.copy();
      random_color.randomize(this.canvas.random_pool.get(this.random_i++) * 2);
      colors.push(random_color);
      colors.push(random_color);
      colors.push(random_color);
    }

    return colors.map((c) => c.multiplied_by(1 / 255));
  }

  private clear() {
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
  }

  private setup() {
    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(
      0,
      0,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight
    );

    // this.gl.enable(this.gl.CULL_FACE);
    // this.gl.enable(this.gl.BLEND);
    // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.useProgram(this.gl_utils.program);

    const position_buffer = this.gl.createBuffer();
    if (!position_buffer) {
      throw new Error("Couldn't create positon_buffer.");
    }
    this.gl.enableVertexAttribArray(this.gl_utils.getLocation("a_position"));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position_buffer);

    const vertices = this.getVertices();
    this.amount_of_vertices = vertices.length;
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices.flatMap((v) => v.xyz())),
      this.gl.STATIC_DRAW
    );

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const size = 3; // 3 components per iteration
    const type = this.gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      this.gl_utils.getLocation("a_position"),
      size,
      type,
      normalize,
      stride,
      offset
    );

    const color_buffer = this.gl.createBuffer();
    if (!color_buffer) {
      throw new Error("Couldn't create color_buffer.");
    }
    this.gl.enableVertexAttribArray(this.gl_utils.getLocation("a_color"));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_buffer);

    const colors = this.getColors(vertices.length);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(colors.flatMap((c) => c.rgb())),
      this.gl.STATIC_DRAW
    );

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    this.gl.vertexAttribPointer(
      this.gl_utils.getLocation("a_color"),
      size,
      type,
      normalize,
      stride,
      offset
    );
  }

  draw() {
    if (!this.is_setup) {
      this.setup();
      this.is_setup = true;
    }

    this.setProjection();
    this.clear();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.amount_of_vertices);
  }
}
