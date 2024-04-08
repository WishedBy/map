
import { vec3,mat4 } from "gl-matrix";
import { MapMesh } from "../objects/map/mesh";
import { Camera } from "../camera/camera";
import { MapModel } from "../objects/map/model";
import { RenderData, RenderGroup } from "./renderData";
import { shaderConfig as MapShaderConfig } from "../objects/map/config";
import { light, scene } from "./scene";
import { Material } from "../objects/material";
import { Stepper, StepperTimerCycleType, StepperTimerType, easeInOutCubicDouble } from "../stepper";

type mapOpts = {
    mapConfig: MapShaderConfig
}

export class MapScene implements scene {
    device: GPUDevice
    mapOpts: mapOpts
    maps: MapModel[];
    observer: Camera;
    light: light = new light([-10,-10,0], 1, 0);

    rotationStepper: Stepper = new Stepper(StepperTimerType.Time, 5000, StepperTimerCycleType.Restart);
    mapStepper: Stepper = new Stepper(StepperTimerType.Time, 7000, StepperTimerCycleType.Reverse, easeInOutCubicDouble);

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

        this.observer.update();
        this.maps.forEach((map) => {
            map.update(this.rotationStepper.step(), this.mapStepper.step());
        });

        
    }

    getLight(): light {
        return this.light;
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