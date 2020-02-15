import { ArtCanvas } from "./App";

export abstract class ArtPiece {
    name: string;
    protected canvas: ArtCanvas;

    constructor(name: string, canvas: ArtCanvas) {
        this.name = name;
        this.canvas = canvas;
    }

    abstract draw(): void;
}