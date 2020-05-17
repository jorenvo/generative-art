import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { ArtPieceIsoGLUtils } from "./ArtPieceIsoGLUtils";

export class ArtPieceIsoGLSpirograph extends ArtPiece {
  private gl: WebGLRenderingContext;
  private gl_utils: ArtPieceIsoGLUtils;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_a: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    super(name, uses_random_pool, uses_parameter_a, uses_parameter_b, canvas);
    this.gl = this.canvas.getContextGl();
    this.gl_utils = new ArtPieceIsoGLUtils(this.gl);
    this.setupWhenLoading();
  }

  is2d() {
    return false;
  }

  private setupWhenLoading() {
    const vertex_shader = `
    attribute vec4 a_position;

    void main() {
      gl_Position = a_position;
    }
    `;

    const fragment_shader = `
    // comes from the vertex shader
    varying vec4 v_color;

    void main() {
       gl_FragColor = v_color;
    }
    `;

    // this.gl_utils.setProgram(vertex_shader, fragment_shader);

    // this.program = this.gl_utils.createProgram(vertex_shader, fragment_shader);
    // this.positionLocation = this.gl_utils.getAttribLocationAndCheck(
    //   this.program,
    //   "a_position"
    // );
  }

  draw() {}
}
