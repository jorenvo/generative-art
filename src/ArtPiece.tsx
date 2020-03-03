import { ArtCanvas } from "./App";

export abstract class ArtPiece {
  name: string;
  uses_random_pool: boolean;
  protected canvas: ArtCanvas;

  constructor(name: string, uses_random_pool: boolean, canvas: ArtCanvas) {
    this.name = name;
    this.uses_random_pool = uses_random_pool;
    this.canvas = canvas;
  }

  is_2d() {
    return true;
  }

  abstract draw(): void;
}
