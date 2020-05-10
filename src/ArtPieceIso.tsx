import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { Point } from "./UtilPoint";

interface Face {
  face: Point[];
  center: Point;
}

class IsoUtils {
  private canvas: ArtCanvas;

  constructor(canvas: ArtCanvas) {
    this.canvas = canvas;
  }

  private convertToIso(c: Point) {
    const sqrt2 = Math.sqrt(2);
    const sqrt3 = Math.sqrt(3);
    const temp_x = sqrt3 * c.x + 0 * c.y + -sqrt3 * c.z;
    const temp_y = 1 * c.x + 2 * c.y + 1 * c.z;
    const temp_z = sqrt2 * c.x + -sqrt2 * c.y + sqrt2 * c.z;
    c.x = temp_x;
    c.y = temp_y;
    c.z = temp_z;
  }

  transformShape(
    faces: Point[][],
    bottom_left_front: Point,
    randomize: boolean,
    rotate_radians?: number
  ) {
    bottom_left_front.y *= -1;

    let random_index = Math.floor(Math.random() * 99999);
    const scale = 20;
    const parameter = this.canvas.state.parameter_a - 5;
    faces.forEach((face) => {
      face.forEach((p) => {
        if (rotate_radians) {
          p.rotate_xz(rotate_radians);
        }

        p.add(bottom_left_front);

        if (randomize) {
          const random = new Point(
            (this.canvas.random_pool.get(random_index++) * parameter) / scale,
            (this.canvas.random_pool.get(random_index++) * parameter) / scale,
            0
          );

          if (this.canvas.random_pool.get(random_index++) > 0.5) {
            p.add(random);
          } else {
            p.subtract(random);
          }
        }
      });
    });
  }

  generateCarousel(
    bottom_left_front: Point,
    randomize: boolean,
    rotate_radians?: number
  ): Point[][] {
    const sides = Math.ceil(this.canvas.state.parameter_a) + 2;
    const degrees_per_side = (2 * Math.PI) / sides;
    const carousel = [];
    const horizontal_side_length = 2 / sides;
    const vertical_side_length = 0.25;
    const side = [
      new Point(0, 0, 0),
      new Point(horizontal_side_length, 0, 0),
      new Point(horizontal_side_length, vertical_side_length, 0),
      new Point(0, vertical_side_length, 0),
      new Point(0, 0, 0),
    ];
    const min_of_shape = new Point();
    const max_of_shape = new Point();

    for (let i = 0; i < sides; i++) {
      let last_face_bottom_right = new Point(0, 0, 0);
      if (carousel.length) {
        last_face_bottom_right = carousel[carousel.length - 1][1];
      }

      const new_side = side.map(
        (vertex) => new Point(vertex.x, vertex.y, vertex.z)
      );
      new_side.forEach((vertex) => {
        vertex.rotate_xz(degrees_per_side * i);
        vertex.add(last_face_bottom_right);
        min_of_shape.min(vertex);
        max_of_shape.max(vertex);
      });
      carousel.push(new_side);
    }

    const size = max_of_shape.copy();
    size.subtract(min_of_shape);
    size.divide(new Point(2, 2, 2));

    carousel.forEach((face) =>
      face.forEach((vertex) => {
        vertex.subtract(min_of_shape);
        vertex.subtract(size);
      })
    );

    this.transformShape(carousel, bottom_left_front, randomize, rotate_radians);
    return carousel;
  }

  generateCube(
    bottom_left_front: Point,
    randomize: boolean,
    rotate_radians?: number
  ): Point[][] {
    let cube: Point[][] = [
      [
        // top face (ends up bottom in isometric projection)
        new Point(0, 1, 0), // top left front
        new Point(1, 1, 0), // top right front
        new Point(1, 1, 1), // top right back
        new Point(0, 1, 1), // top left back
        new Point(0, 1, 0), // top left front
      ],
      [
        // front face (ends up back right in isometric projection)
        new Point(0, 0, 0), // bottom left front
        new Point(1, 0, 0), // bottom right front
        new Point(1, 1, 0), // top right front
        new Point(0, 1, 0), // top left front
        new Point(0, 0, 0), // bottom left front
      ],
      [
        // left face (ends up back left in isometric projection)
        new Point(0, 0, 0), // bottom left front
        new Point(0, 0, 1), // bottom left back
        new Point(0, 1, 1), // top left back
        new Point(0, 1, 0), // top left front
        new Point(0, 0, 0), // bottom left front
      ],
      [
        // back face (ends up front left in isometric projection)
        new Point(0, 0, 1), // bottom left back
        new Point(1, 0, 1), // bottom right back
        new Point(1, 1, 1), // top right back
        new Point(0, 1, 1), // top left back
        new Point(0, 0, 1), // bottom left back
      ],
      [
        // right face (ends up front right in isometric projection)
        new Point(1, 0, 0), // bottom right front
        new Point(1, 0, 1), // bottom right back
        new Point(1, 1, 1), // top right back
        new Point(1, 1, 0), // top right front
        new Point(1, 0, 0), // bottom right front
      ],
      [
        // bottom face (ends up top in isometric projection)
        new Point(0, 0, 0), // bottom left front
        new Point(1, 0, 0), // bottom right front
        new Point(1, 0, 1), // bottom right back
        new Point(0, 0, 1), // bottom left back
        new Point(0, 0, 0), // bottom left front
      ],
    ];
    cube.forEach((face) =>
      face.forEach((vertex) => vertex.subtract(new Point(0.5, 0.5, 0.5)))
    );
    this.transformShape(cube, bottom_left_front, randomize, rotate_radians);
    return cube;
  }

  drawArtIso(color: boolean) {
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
        if (
          this.canvas.random_pool.get(random_index++) <
          col / horizontal_cubes
        ) {
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

    let cubes: Point[][] = [];
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
              ...this.generateCube(new Point(i, height, depth), !color)
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
    p: Point
  ) {
    const sqrt3 = Math.sqrt(3);
    p.for_each_dimension((a) => (a + sqrt3 * cube_depth) * scale);
  }

  private renderIsoPath(face: Face, fill_color: string) {
    const ctx = this.canvas.getContext2d();
    const debug_stroke_color = ["red", "green", "blue", "black"];
    const debug = false;

    ctx.fillStyle = fill_color;
    ctx.beginPath();
    ctx.moveTo(face.face[0].x, face.face[0].y);
    for (let i = 1; i < face.face.length; i++) {
      ctx.lineTo(face.face[i].x, face.face[i].y);
    }
    ctx.closePath();
    ctx.fill();

    if (!debug) {
      ctx.stroke();
    } else {
      for (let i = 1; i < face.face.length; i++) {
        ctx.beginPath();
        ctx.moveTo(face.face[i - 1].x, face.face[i - 1].y);
        ctx.lineTo(face.face[i].x, face.face[i].y);
        ctx.setLineDash([2, 10 + Math.floor(Math.random() * 20)]);
        ctx.strokeStyle = debug_stroke_color[(i - 1) % 4];
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  paintIsoArt(
    horizontal_cubes: number,
    cube_depth: number,
    face_vertices: Point[][],
    color: boolean
  ) {
    const ctx = this.canvas.getContext2d();
    // console.log("rendering", cubes.length / (5 * 6), "cubes");

    // range is:
    // [-sqrt3 * cube_depth, ..., horizontal_cubes * sqrt3]
    // add cube_depth * sqrt3 (done in convertToScreenCoordinates)
    //   [0, ..., horizontal_cubes * sqrt3 + cube_depth * sqrt3]
    // = [0, ..., (horizontal_cubes + cube_depth) * sqrt3]
    // divide by (horizontal_cubes + cube_depth) * sqrt3
    // [0, ..., 1]
    // multiply by draw_width
    // [0, ..., draw_width]
    const scale =
      this.canvas.draw_width / ((horizontal_cubes + cube_depth) * Math.sqrt(3));

    const faces: Face[] = [];
    face_vertices.forEach((face) => {
      const face_sum: Point = new Point();

      face.forEach((vertex) => {
        this.convertToIso(vertex);
        face_sum.add(vertex);
        this.convertToScreenCoordinates(cube_depth, scale, vertex);
      });

      faces.push({
        face: face,
        center: new Point(
          face_sum.x / (face.length - 1),
          face_sum.y / (face.length - 1),
          face_sum.z / (face.length - 1)
        ),
      });
    });

    faces.sort((a, b) => a.center.z - b.center.z);

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
        ["#3e9e55", "#3f5cad", "#bd3f9f", "#c6a445"],
      ];
      palette =
        palettes[
          Math.floor((this.canvas.state.parameter_a / 11) * palettes.length)
        ];
    }

    let palette_index = 0;
    faces.forEach((f) => {
      this.renderIsoPath(f, palette[palette_index]);
      palette_index = (palette_index + 1) % palette.length;
    });
  }
}

export class IsoCube extends ArtPiece {
  draw() {
    const utils = new IsoUtils(this.canvas);
    utils.drawArtIso(!"no color");
  }
}

export class IsoCubeColor extends ArtPiece {
  draw() {
    const utils = new IsoUtils(this.canvas);
    utils.drawArtIso(!!"color");
  }
}

abstract class IsoShapeRotate extends ArtPiece {
  private last_render_ms: number | undefined;
  private animation_id: number | undefined;
  protected rotating_shape_radians: number;
  protected iso_utils: IsoUtils;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    super(name, uses_random_pool, uses_parameter_b, canvas);
    this.iso_utils = new IsoUtils(this.canvas);
    this.rotating_shape_radians = 0;
  }

  cleanUp() {
    super.cleanUp();
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }
  }

  private renderAnimationFrame(render_fn: () => void) {
    const ctx = this.canvas.getContext2d();

    this.canvas.clear();
    ctx.save();
    this.canvas.center();
    render_fn();
    ctx.restore();
  }

  private drawArtRotatingShapeFrame() {
    const current_render_ms = performance.now();
    const elapsed_ms = current_render_ms - (this.last_render_ms || 0);

    const shape_coords = this.generateShape(
      new Point(0, 0, 0),
      false,
      elapsed_ms
    );
    this.renderAnimationFrame(() =>
      this.iso_utils.paintIsoArt(1, 1, shape_coords, false)
    );

    this.last_render_ms = current_render_ms;
    this.animation_id = requestAnimationFrame(
      this.drawArtRotatingShapeFrame.bind(this)
    );
  }

  private drawArtRotatingShape() {
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
    }

    this.animation_id = requestAnimationFrame(
      this.drawArtRotatingShapeFrame.bind(this)
    );
  }

  draw() {
    this.drawArtRotatingShape();
  }

  abstract generateShape(
    bottom_left_front: Point,
    randomize: boolean,
    elapsed_ms: number
  ): Point[][];
}

export class IsoCubeRotate extends IsoShapeRotate {
  generateShape(
    bottom_left_front: Point,
    randomize: boolean,
    elapsed_ms: number
  ): Point[][] {
    const rotation_per_ms = 0.0005 * (this.canvas.state.parameter_a - 4);
    this.rotating_shape_radians += elapsed_ms * rotation_per_ms;

    return this.iso_utils.generateCube(
      bottom_left_front,
      randomize,
      this.rotating_shape_radians
    );
  }
}

export class IsoCarouselRotate extends IsoShapeRotate {
  generateShape(
    bottom_left_front: Point,
    randomize: boolean,
    elapsed_ms: number
  ): Point[][] {
    this.rotating_shape_radians += elapsed_ms * 0.0005;
    return this.iso_utils.generateCarousel(
      bottom_left_front,
      randomize,
      this.rotating_shape_radians
    );
  }
}

// export class IsoMoonRotate extends IsoShapeRotate {
//   generateMoon(bottom_left_front: Point, radians: number): Point[][] {

//   }

//   generateShape(
//     bottom_left_front: Point,
//     randomize: boolean,
//     elapsed_ms: number
//   ): Point[][] {
//     this.rotating_shape_radians += elapsed_ms * 0.0005;
//     return this.generateMoon(
//       bottom_left_front,
//       this.rotating_shape_radians
//     );
//   }
// }
