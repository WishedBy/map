
import { vec3,mat4 } from "gl-matrix";
import { MapMesh } from "../objects/map/mesh";
import { Camera } from "../camera/camera";
import { MapModel } from "../objects/map/model";
import { RenderData, RenderGroup } from "./renderData";
import { shaderConfig as MapShaderConfig } from "../objects/map/config";
import { scene } from "./scene";
import { Material } from "../objects/material";

type mapOpts = {
    mapConfig: MapShaderConfig
}

export class MapScene implements scene {
    device: GPUDevice
    mapOpts: mapOpts
    maps: MapModel[];
    observer: Camera;

    t: number = 0.0;

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material) {
        this.device = device
        this.mapOpts = {
            mapConfig: new MapShaderConfig(device, globalBuffer, mapMaterial)
        };


        this.observer = new Camera(
            [-5, 0, 0], [0, 0, 0], [0, 0, 1]
        );
        this.maps = [new MapModel([0, 0, 0])];
    }

    easeInOutCubic(x: number): number {
        return x < 0.5 ? (4 * x * x * x) : (1 - Math.pow(-2 * x + 2, 3) / 2);
    }
    easeInOutCubicDouble(x: number): number {
        if(x < 0.5){
           return this.easeInOutCubic(x*2)/2 
        }
        return (this.easeInOutCubic((x-0.5)*2)/2)+0.5
    }
    update() {
        this.t += 0.002;
        if (this.t > 1) {
            this.t -= 1;
        }
        let sphereT = this.t*2;
        let dir = sphereT > 1 ? 1 : 0; 
        let sphereMod = (sphereT-dir);
        if(dir == 1){
            sphereMod = 1 - sphereMod;
        }

        this.observer.update();
        this.maps.forEach((map) => {
            
            map.update(this.t, this.easeInOutCubicDouble(sphereMod));
        });

        
    }

    getObserver(): Camera {
        return this.observer;
    }

    getRenderData():RenderData{
        var data = { 
            viewTransform: this.observer.getView(),
            groups: [] as RenderGroup[], 
        }
        var i: number = 0;
        let arr = [] as number[];
        this.maps.forEach((map) => {
            var model = map.model;
            var j: number = 0
            for (; j < 16; j++) {
                arr[16 * i + j] = <number>model.at(j);
            }
            arr[16 * i + j] = map.animationMod;
            i++
        });

        let mapGroup: RenderGroup = {
            data: new Float32Array(arr),
            config: this.mapOpts.mapConfig,
            count: this.maps.length,
            bufferLayout: this.mapOpts.mapConfig.mesh.bufferLayout,
            buffer: this.mapOpts.mapConfig.mesh.getVertices(1, this.device)
        }
        data.groups.push(mapGroup)
        return data;
    }


}