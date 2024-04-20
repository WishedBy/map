import { mat2, mat4, vec2, vec3 } from "gl-matrix";
import { StreamMesh } from "./mesh";
import { Stepper, StepperCycleType, StepperTimerType, easeNOOP } from "../../stepper";


export class StreamModel {

    mesh: StreamMesh = new StreamMesh();
    position: vec3;
    lastPosition: vec3;
    model: mat4;
    animationMod: number = 0;
    streamPos: number = 0;


    xAngle: number = 0;
    lastXAngle: number = 0;
    yAngle: number = 0;
    lastYAngle: number = 0;
    zAngle: number = 0;
    lastZAngle: number = 0;
    lastRotate: number = 0;

    streamStepper: Stepper = new Stepper(StepperTimerType.Time, 1000, StepperCycleType.Restart, easeNOOP).play();
    vertices: number[];
    // start and end in radians
    constructor(start: vec2, end: vec2){
        this.lastPosition = [0,0,0];
        this.position = [0, 0, 0];
        this.model = mat4.create();
        
        this.vertices = this.mesh.getVertices(start, end, 1/30);
        
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

        this.streamPos = this.streamStepper.step();
        mat4.translate(this.model, this.model, pos);
        mat4.rotate(this.model, this.model, rot*Math.PI*2, [0,0,1]);
        mat4.rotateX(this.model, this.model, xAngle);
        mat4.rotateY(this.model, this.model, yAngle);
        mat4.rotateZ(this.model, this.model, zAngle);
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