import { mat4, vec3 } from "gl-matrix";


export class MapModel {

    position: vec3;
    lastPosition: vec3;
    model: mat4;
    normalMatrix: mat4;
    animationMod: number = 0;
    xAngle: number = 0;
    lastXAngle: number = 0;
    yAngle: number = 0;
    lastYAngle: number = 0;
    zAngle: number = 0;
    lastZAngle: number = 0;
    lastRotate: number = 0;

    constructor(position: vec3){
        this.lastPosition = [0,0,0];
        this.position = position;
        this.model = mat4.create();
        this.normalMatrix = mat4.create();
    }

    setRotation(xAngle: number, yAngle: number, zAngle: number){
        this.xAngle = xAngle;
        this.yAngle = yAngle;
        this.zAngle = zAngle;
    }

    update(rotate: number, animationMod: number) {
        let rot = rotate - this.lastRotate;
        this.lastRotate = rotate;

        let xAngle = (this.lastXAngle - this.xAngle) % (Math.PI*2);
        let yAngle = Math.min(Math.max((this.lastYAngle - this.yAngle), -Math.PI/2), Math.PI/2);
        let zAngle = (this.lastXAngle - this.zAngle) % (Math.PI*2);
        this.lastXAngle = this.xAngle;
        this.lastYAngle = this.yAngle;
        this.lastZAngle = this.zAngle;

        this.animationMod = animationMod;
        let pos: vec3 = [
            this.position[0] - this.lastPosition[0],
            this.position[1] - this.lastPosition[1],
            this.position[2] - this.lastPosition[2],
        ]
        this.lastPosition = this.position;
        
        mat4.translate(this.model, this.model, pos);
        mat4.rotate(this.model, this.model, rot*Math.PI*2, [0,0,1]);
        mat4.rotateX(this.model, this.model, xAngle);
        mat4.rotateY(this.model, this.model, yAngle);
        mat4.rotateZ(this.model, this.model, zAngle);

        mat4.rotate(this.normalMatrix, this.normalMatrix, rot*Math.PI*2, [0,0,1]);
        mat4.rotateX(this.normalMatrix, this.normalMatrix, xAngle);
        mat4.rotateY(this.normalMatrix, this.normalMatrix, yAngle);
        mat4.rotateZ(this.normalMatrix, this.normalMatrix, zAngle);
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