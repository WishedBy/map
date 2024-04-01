
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
    mapOpts: mapOpts
    maps: MapModel[];
    observer: Camera;
    triangle_count: number;
    quad_count: number;

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material) {
        this.triangle_count = 0;
        this.quad_count = 0;
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
            data: new Float32Array(), 
            viewTransform: this.observer.getView(),
            groups: [], 
        }
        var i: number = 0;
        var mapGroup: RenderGroup = {
            config: this.mapOpts.mapConfig,
            count: this.maps.length,
        }
        this.maps.forEach((map) => {
            map.update();
            var model = map.model;
            for (var j: number = 0; j < 16; j++) {
                data.data[16 * i + j] = <number>model.at(j);
            }
            data.data[16 * i + j + 1] = map.animationMod;
            
        });

        return data;
    }


}