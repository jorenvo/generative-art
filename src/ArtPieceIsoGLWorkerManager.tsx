import {
  IsoShapeRotateGLDataToWorker,
  IsoShapeRotateGLDataToWorkerManager,
} from "./ArtPieceIsoGL";
import GLWorker from "worker-loader!./ArtPieceIsoGLWorker";

const ctx: Worker = self as any;
let random_pool: number[] = [];
let gl_worker: GLWorker | undefined = undefined;

ctx.addEventListener("message", e => {
  const data = e.data as IsoShapeRotateGLDataToWorkerManager;

  if (data.random_pool) {
    random_pool = data.random_pool;
  }

  const workerData: IsoShapeRotateGLDataToWorker = {
    random_pool: random_pool,
    parameter_a: data.parameter_a,
  };

  if (gl_worker) {
    gl_worker.terminate();
  }
  gl_worker = new GLWorker();
  gl_worker.postMessage(workerData);

  gl_worker.onmessage = e => {
    console.log("relaying message to main");
    ctx.postMessage(e.data);
  };
});
