import { ArtCanvas } from "./App";

export abstract class ArtPiece {
  name: string;
  uses_random_pool: boolean;
  uses_parameter_b: boolean;
  protected canvas: ArtCanvas;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    this.name = name;
    this.uses_random_pool = uses_random_pool;
    this.uses_parameter_b = uses_parameter_b;
    this.canvas = canvas;
  }

  cleanUp() {}

  is2d() {
    return true;
  }

  abstract draw(): void;
}
