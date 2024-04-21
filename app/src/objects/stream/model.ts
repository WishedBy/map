import { mat2, mat4, vec2, vec3 } from "gl-matrix";
import { StreamMesh } from "./mesh";
import { Stepper, StepperCycleType, StepperTimerType, easeNOOP } from "../../stepper";


export class StreamModel {

    mesh: StreamMesh = new StreamMesh();
    position: vec3;
    model: mat4;
    animationMod: number = 0;
    streamPos: number = 0;


    xAngle: number = 0;
    yAngle: number = 0;
    zAngle: number = 0;

    streamStepper: Stepper = new Stepper(StepperTimerType.Time, 1000, StepperCycleType.Restart, easeNOOP).play();
    vertices: number[];
    // start and end in radians
    constructor(start: vec2, end: vec2){
        this.position = [0, 0, 0];
        this.model = mat4.create();
        
        this.vertices = this.mesh.getVertices(start, end, 1/30);
        
    }
    forgetRotation(){
        this.xAngle = 0;
        this.yAngle = 0;
        this.zAngle = 0;
    }
    setRotation(xAngle: number, yAngle: number, zAngle: number){
        this.xAngle = Math.min(Math.max(xAngle, -Math.PI/2), Math.PI/2);
        this.yAngle = Math.min(Math.max(yAngle, -Math.PI/2), Math.PI/2);
        this.zAngle = (zAngle) % (Math.PI*2);
    }

    update(rotate: number, animationMod: number) {
        this.model = mat4.create();

        this.animationMod = animationMod;
        let zRotate = (rotate*Math.PI*2 + this.zAngle) % (Math.PI*2);

        this.streamPos = this.streamStepper.step();
        
        mat4.translate(this.model, this.model, this.position);
        mat4.rotate(this.model, this.model, this.xAngle,    [1,0,0]);
        mat4.rotate(this.model, this.model, this.yAngle,    [0,1,0]);
        mat4.rotate(this.model, this.model, zRotate,        [0,0,1]);
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