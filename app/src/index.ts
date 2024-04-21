import { shaderConfig as MapShaderConfig } from "./objects/map/config";
import { Material } from "./objects/material";
import { Renderer } from "./renderer";
import { MapScene, State } from "./scene/map";
import { scene } from "./scene/scene";

export async function main(canvas: HTMLCanvasElement ){
  
    var device = <GPUDevice> await (await navigator.gpu?.requestAdapter())?.requestDevice();
    var mapMaterial = await Material.create(device, "assets/img/map.png");
    var mapMaterialDark = await Material.create(device, "assets/img/map-dark.png");

    var scene: scene;
    var mapState = new State();
    const renderer = new Renderer(canvas, device, (globalBuffer: GPUBuffer): scene => {
        scene = new MapScene(device, globalBuffer, mapMaterial, mapMaterialDark, mapState);
        return scene;
    });

    $(document).on("mousedown", (e: JQuery.MouseDownEvent) => {
        if(e.which == 1){
            mapState.leftMousePressed = true;
            mapState.mousePosStart = mapState.mousePosCurrent;
        }
    })
    $(document).on("mouseup", (e: JQuery.MouseUpEvent) => {
        if(e.which == 1){
            mapState.leftMousePressed = false;
        }
    })
    $(document).on("mousemove", (e: JQuery.MouseMoveEvent) => {
        mapState.mousePosCurrent = [e.pageX, e.pageY]
    })

    await renderer.Initialize();
    renderer.run();
}