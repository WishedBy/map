
import { vec3,mat4 } from "gl-matrix";
import { MapMesh } from "../objects/map/mesh";
import { Camera } from "../camera/camera";
import { MapModel } from "../objects/map/model";
import { RenderGroup } from "./rendergroup";


export class MapScene {
    mapMesh: MapMesh
    maps: MapModel[];
    observer: Camera;
    data: {
        data: Float32Array,
        groups: RenderGroup[]
    } = {
        data: new Float32Array(), 
        groups: [], 
    }
    triangle_count: number;
    quad_count: number;

    constructor(mapMesh: MapMesh) {
        this.triangle_count = 0;
        this.quad_count = 0;
        this.mapMesh = mapMesh;


        this.observer = new Camera(
            [-5, 0, 0], [0, 0, 0], [0, 0, 1]
        );
        this.maps = [new MapModel([0, 0, 0])];

    }


    update() {
       this.observer.update();
       
       var i: number = 0;
       this.maps.forEach((map) => {
            map.update();
            var model = map.model;
            for (var j: number = 0; j < 16; j++) {
                this.data.data[16 * i + j] = <number>model.at(j);
            }
            this.data.data[16 * i + j + 1] = map.animationMod;
            i++
        });
    }

    getObserver(): Camera {
        return this.observer;
    }

    getObjects(): RenderGroup[] {
        return {
            view_transform: this.observer.getView(),
            model_transforms: this.data,
            object_counts: {
                [object_types.TRIANGLE]: this.triangle_count,
                [object_types.QUAD]: this.quad_count,
            }
        }
    }


}