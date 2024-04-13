import { mat4, vec2, vec3 } from "gl-matrix";


export class StreamModel {

    position: vec3;
    model: mat4;
    animationMod: number = 0;
    // start and end in radians
    constructor(position: vec3, start: vec2, end: vec2){
        this.position = position;
        this.model = mat4.create();
    }

    update(rotate: number, animationMod: number) {
        this.animationMod = animationMod;
        this.model = mat4.create();
        
        mat4.translate(this.model, this.model, this.position);
        mat4.rotate(this.model, this.model, rotate*Math.PI*2, [0,0,1]);

    }

    getVertices(): number[]{
        return [
            -1,-1, 1,-1, -1,1,   -1,-1, 1,-1, -1,1,
            -1,1, 1,1, 1,-1,    -1,1, 1,1, 1,-1,
        ];
    }

    getRenderModel():Float32Array {
        let data = [];
        var c: number = 0
        for (let i = 0; i < 16; i++,c++) {
            data[c] = <number>this.model.at(i);
        }
        data[c] = this.animationMod;

        return new Float32Array(data);
    }
}