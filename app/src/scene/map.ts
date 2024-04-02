
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


    update() {
       this.observer.update();
       this.maps.forEach((map) => {
            map.update();
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
            map.update();
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