
import { vec3,mat4 } from "gl-matrix";
import { MapMesh } from "../objects/map/mesh";
import { Camera } from "../camera/camera";
import { MapModel } from "../objects/map/model";
import { RenderData, RenderGroup } from "./renderData";
import { shaderConfig as MapShaderConfig } from "../objects/map/config";
import { scene } from "./scene";
import { Material } from "../objects/material";
import { easeInOutCubicDouble } from "../stepper";

type mapOpts = {
    mapConfig: MapShaderConfig
}

export class MapScene implements scene {
    device: GPUDevice
    mapOpts: mapOpts
    maps: MapModel[];
    observer: Camera;

    t: number = 0.0;

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material, mapMaterialDark: Material) {
        this.device = device
        this.mapOpts = {
            mapConfig: new MapShaderConfig(device, globalBuffer, mapMaterial, mapMaterialDark)
        };


        this.observer = new Camera(
            [-10, 0, 0], [0, 0, 0], [0, 0, -1]
        );
        this.maps = [new MapModel([0,0,0])];
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
            
            map.update(this.t, easeInOutCubicDouble(sphereMod));
        });

        
    }

    getObserver(): Camera {
        return this.observer;
    }

    getRenderData():RenderData{
        var res = { 
            viewTransform: this.observer.getView(),
            groups: [] as RenderGroup[], 
        }
        let mapv = this.mapOpts.mapConfig.mesh.getVertices(1, this.device);
        let data: Float32Array[] = [];
        this.maps.forEach((map) => {
            data.push(map.getRenderModel())

        });
        let mapGroup: RenderGroup = {
            data: data,
            config: this.mapOpts.mapConfig,
            buffer: mapv,
        }
        res.groups.push(mapGroup)
        return res;
    }


}