import { Point3D } from "./ArtPieceIso";
import { IsoShapeRotateGLDataToWorker, IsoShapeRotateGLDataToMain } from "./ArtPieceIsoGL";

const ctx: Worker = self as any;

// Received message from parent thread
ctx.addEventListener("message", e => {
  console.time("worker");
  console.log(`worker started and received data, starting perlin`);
  const data = e.data as IsoShapeRotateGLDataToWorker;
  const perlin = new Perlin(data.random_pool, data.parameter_a);
  const faces = perlin.generateShape();
  let flattened_faces = faces.flat();
  flattened_faces.sort((a, b) => b.height - a.height); // painter's algorithm

  const vertices = perlin.calcVertices(flattened_faces);
  const colors = perlin.calcColors(flattened_faces);
  const [vertex_range_min, vertex_range_max] = perlin.calcVertexRange(flattened_faces);

  const postData: IsoShapeRotateGLDataToMain = {
    vertices: vertices,
    amount_of_vertices: vertices.length / 3,
    colors: colors,
    vertex_range_min: vertex_range_min,
    vertex_range_max: vertex_range_max,
  };

  console.timeEnd("worker");
  ctx.postMessage(postData);
});

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

// http://www.huttar.net/lars-kathy/graphics/perlin-noise/perlin-noise.html
class PerlinData {
  private readonly gridcells: number;
  private readonly gridsize: number;
  private gradients: Point3D[][];
  private samples: number[][];
  private samples_per_row: number;
  private seed: number;
  private random_pool: number[];

  constructor(samples_per_row: number, seed: number, random_pool: number[]) {
    this.gridcells = 5; // gridcells * gridsize should be 1
    this.gridsize = 0.2;
    this.gradients = [];
    this.samples = [];
    this.samples_per_row = samples_per_row;
    this.seed = Math.floor(seed * 9_999);
    this.random_pool = random_pool;
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
          this.random_pool[i * this.gridcells + j + this.seed] * Math.PI * 2;
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

class Perlin {
  private samples_per_row: number;
  private terrain: PerlinData;
  private clouds: PerlinData;
  private random_pool: number[];
  private parameter_a: number;

  constructor(random_pool: number[], parameter_a: number) {
    this.samples_per_row = 91;
    this.random_pool = random_pool;
    this.parameter_a = parameter_a;
    this.terrain = new PerlinData(
      this.samples_per_row + 1, // + 1 because of fenceposting
      random_pool[0],
      random_pool
    );
    this.clouds = new PerlinData(
      this.samples_per_row + 1,
      1 - random_pool[0],
      random_pool
    );

    this.terrain.init();
    this.clouds.init();
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
    const random = this.random_pool[row * col];
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
          1.3 + (10 - this.parameter_a) / 4,
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

  calcVertexRange(faces: Face[]): [Point3D, Point3D] {
    const vertex_range_min = new Point3D(Infinity, Infinity, Infinity);
    const vertex_range_max = new Point3D(-Infinity, -Infinity, -Infinity);

    faces.forEach(f => {
      vertex_range_min.x = Math.min(
        vertex_range_min.x,
        ...f.vertices.map(v => v.x)
      );
      vertex_range_min.y = Math.min(
        vertex_range_min.y,
        ...f.vertices.map(v => v.y)
      );
      vertex_range_min.z = Math.min(
        vertex_range_min.z,
        ...f.vertices.map(v => v.z)
      );

      vertex_range_max.x = Math.max(
        vertex_range_max.x,
        ...f.vertices.map(v => v.x)
      );
      vertex_range_max.y = Math.max(
        vertex_range_max.y,
        ...f.vertices.map(v => v.y)
      );
      vertex_range_max.z = Math.max(
        vertex_range_max.z,
        ...f.vertices.map(v => v.z)
      );
    });

    console.log(
      `x range: [${vertex_range_min.x}, ${vertex_range_max.x}]`
    );
    console.log(
      `y range: [${vertex_range_min.y}, ${vertex_range_max.y}]`
    );
    console.log(
      `z range: [${vertex_range_min.z}, ${vertex_range_max.z}]`
    );

    return [vertex_range_min, vertex_range_max];
  }

  calcVertices(faces: Face[]) {
    let vertices: number[] = [];
    faces.forEach(f => {
      const v = f.vertices;
      vertices.push(...v[0].xyz());
      vertices.push(...v[2].xyz());
      vertices.push(...v[1].xyz());

      vertices.push(...v[0].xyz());
      vertices.push(...v[3].xyz());
      vertices.push(...v[2].xyz());
    });

    // currently 0, 0 is top-left
    // console.log("vertices");
    // this.printTriangles(vertices);

    return vertices;
  }

  calcColors(faces: Face[]) {
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

    return gl_colors;
  }
}
