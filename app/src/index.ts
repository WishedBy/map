import { shaderConfig as MapShaderConfig } from "./objects/map/config";
import { Material } from "./objects/material";
import { Renderer } from "./renderer";
import { MapScene } from "./scene/map";
import { scene } from "./scene/scene";

export async function main(canvas: HTMLCanvasElement ){
  
  var device = <GPUDevice> await (await navigator.gpu?.requestAdapter())?.requestDevice();
  var mapMaterial = await Material.create(device, "assets/img/physical-world-map-mercator.jpg");
  const renderer = new Renderer(canvas, device, (globalBuffer: GPUBuffer): scene => {
    return new MapScene(device, globalBuffer, mapMaterial);
  });
  await renderer.Initialize();
  renderer.render();
}