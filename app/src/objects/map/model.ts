import { mat4, vec3 } from "gl-matrix";


export class MapModel {

    position: vec3;
    model: mat4;
    normalMatrix: mat4;
    animationMod: number = 0;

    constructor(position: vec3){
        this.position = position;
        this.model = mat4.create();
        this.normalMatrix = mat4.create();
    }

    update(rotate: number, animationMod: number) {
        this.animationMod = animationMod;
        this.model = mat4.create();
        this.normalMatrix = mat4.create();
        
        mat4.translate(this.model, this.model, this.position);
        mat4.rotate(this.model, this.model, rotate*Math.PI*2, [0,0,1]);

        mat4.rotate(this.normalMatrix, this.normalMatrix, rotate*Math.PI*2, [0,0,1]);
    }

    getRenderModel():Float32Array {
        let data = [];
        var c: number = 0
        for (let i = 0; i < 16; i++,c++) {
            data[c] = <number>this.model.at(i);
        }
        for (let i = 0; i < 16; i++,c++) {
            data[c] = <number>this.normalMatrix.at(i);
        }
        data[c] = this.position[0];
        data[c+1] = this.position[1];
        data[c+2] = this.position[2];
        data[c+3] = this.animationMod;

        return new Float32Array(data);
    }
}