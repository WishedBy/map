import { Renderer } from "./renderer";

export async function main(canvas: HTMLCanvasElement ){
  
  const renderer = new Renderer(canvas);
  await renderer.Initialize();
  renderer.render();
}