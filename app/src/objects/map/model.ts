import { mat4, vec3 } from "gl-matrix";


export class MapModel {

    position: vec3;
    model: mat4 = mat4.create();
    animationMod: number = 0;
    radius: number = 1;

    constructor(position: vec3){
        this.position = position;
    }

    update(animationMod: number = 0) {
        this.animationMod = animationMod;
        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);
    }
}