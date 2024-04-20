import { mat2, mat4, vec2, vec3 } from "gl-matrix";
import { StreamMesh } from "./mesh";
import { Stepper, StepperCycleType, StepperTimerType, easeNOOP } from "../../stepper";


export class StreamModel {

    mesh: StreamMesh = new StreamMesh();
    position: vec3;
    model: mat4;
    animationMod: number = 0;
    streamPos: number = 0;
    streamStepper: Stepper = new Stepper(StepperTimerType.Time, 1000, StepperCycleType.Restart, easeNOOP).play();
    vertices: number[];
    // start and end in radians
    constructor(start: vec2, end: vec2){
        this.position = [0, start[0], start[1]];
        this.model = mat4.create();
        
        let l = Math.sqrt((start[0]-end[0])**2+(start[1]-end[1])**2);
        this.vertices = this.mesh.getVertices(-Math.atan2(end[1] - start[1], end[0] - start[0]), l, 1/30);
        
    }

    update(rotate: number, animationMod: number) {
        this.animationMod = animationMod;
        this.model = mat4.create();
        
        this.streamPos = this.streamStepper.step();
        mat4.translate(this.model, this.model, this.position);
        mat4.rotate(this.model, this.model, rotate*Math.PI*2, [0,0,1]);
    }

    getVertices(): number[] {
        return this.vertices
    }

    getVertexPartCount(): number {
        return this.mesh.getVertexPartCount();
    }

    getVertexNo(): number {
        return this.vertices.length/this.getVertexPartCount()
    }

    getRenderModel():Float32Array {
        let data = [];
        for (let i = 0; i < 16; i++) {
            data.push(<number>this.model.at(i));
        }
        // color
        data.push(1.0);
        data.push(0.0);
        data.push(0.0);


        data.push(this.streamPos);
        data.push(this.animationMod);
        data.push(this.mesh.lengthNo);
        data.push(10);

        return new Float32Array(data);
    }
}