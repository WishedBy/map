import { mat4, vec3 } from "gl-matrix";


export class MapModel {

    position: vec3;
    model: mat4;
    rot: mat4;
    animationMod: number = 0;

    constructor(position: vec3){
        this.position = position;
        this.model = mat4.create();
        this.rot = mat4.create();
    }

    update(rotate: number, animationMod: number) {
        this.animationMod = animationMod;
        this.model = mat4.create();
        this.rot = mat4.create();
        mat4.rotate(this.rot, this.rot, rotate*Math.PI*2, [0,0,1]);
        mat4.translate(this.model, this.model, this.position);
    }
}