import { mat2, mat4, vec2, vec3 } from "gl-matrix";
import { StreamMesh } from "./mesh";


export class StreamModel {

    mesh: StreamMesh = new StreamMesh();
    position: vec3;
    model2d: mat2;
    offset2d: vec2;
    model: mat4;
    animationMod: number = 0;
    // start and end in radians
    constructor(position: vec3, start: vec2, end: vec2){
        this.position = position;
        this.model = mat4.create();
        this.model2d = mat2.create();
        this.offset2d = start;
        
        let l = Math.sqrt((start[0]-end[0])**2+(start[1]-end[1])**2);
        mat2.rotate(this.model2d, this.model2d, Math.atan2(end[1] - start[1], end[0] - start[0]))
        mat2.scale(this.model2d, this.model2d, [l, 1/50]);
        
    }

    update(rotate: number, animationMod: number) {
        this.animationMod = animationMod;
        this.model = mat4.create();
        
        mat4.translate(this.model, this.model, this.position);
        mat4.rotate(this.model, this.model, rotate*Math.PI*2, [0,0,1]);
    }


    getRenderModel():Float32Array {
        let data = [];
        var c: number = 0
        for (let i = 0; i < 16; i++,c++) {
            data[c] = <number>this.model.at(i);
        }
        for (let i = 0; i < 4; i++,c++) {
            data[c] = <number>this.model2d.at(i);
        }
        for (let i = 0; i < 2; i++,c++) {
            data[c] = <number>this.offset2d.at(i);
        }
        data[c] = this.animationMod;
        data[c+1] = this.mesh.lengthNo;
        data[c+2] = this.mesh.widthNo;

        return new Float32Array(data);
    }
}