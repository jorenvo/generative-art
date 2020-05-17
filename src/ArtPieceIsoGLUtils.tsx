export class ArtPieceIsoGLUtils {
  private gl: WebGLRenderingContext;
  program: WebGLProgram | undefined;
  private nameToLocation: Map<string, number>;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.nameToLocation = new Map();
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

  setProgram(vertex_shader_src: string, fragment_shader_src: string) {
    const program = this.gl.createProgram()!;
    const vertex_shader = this.createShader(
      this.gl.VERTEX_SHADER,
      vertex_shader_src
    );
    this.gl.attachShader(program, vertex_shader);

    const fragment_shader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragment_shader_src
    );
    this.gl.attachShader(program, fragment_shader);
    this.gl.linkProgram(program);

    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) {
      this.program = program;
    } else {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(info || "Undefined program creation error.");
    }
  }

  private getAttribLocationAndCheck(name: string): number {
    if (!this.program) {
      throw new Error("Initialize with setProgram() first.");
    }

    const location = this.gl.getAttribLocation(this.program, name);
    if (location === null) {
      throw new Error(`${name} not found.`);
    } else {
      return location;
    }
  }

  private getUniformLocationAndCheck(name: string): number {
    if (!this.program) {
      throw new Error("Initialize with setProgram() first.");
    }

    const location = this.gl.getUniformLocation(this.program, name);
    if (location === null) {
      throw new Error(`${name} not found.`);
    } else {
      return location as number;
    }
  }

  setAttribLocation(name: string) {
    this.nameToLocation.set(name, this.getAttribLocationAndCheck(name));
  }

  setUniformLocation(name: string) {
    this.nameToLocation.set(name, this.getUniformLocationAndCheck(name));
  }

  getLocation(name: string) {
    const location = this.nameToLocation.get(name);
    if (location === undefined) {
      throw new Error(`Location ${name} was not defined.`);
    }
    return location;
  }
}
