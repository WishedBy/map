import { mat2, mat4, vec2, vec3 } from "gl-matrix";
import { TestMesh } from "./mesh";
import { Stepper, StepperCycleType, StepperTimerType, easeNOOP } from "../../stepper";


export class TestModel {

    mesh: TestMesh = new TestMesh();
    position: vec3;
    model: mat4;



    vertices: number[];


    // start and end in radians
    constructor(width: number, height: number, position: vec3){
        this.position = position;
        this.model = mat4.create();
        
        this.vertices = this.mesh.getVertices(width, height);

        this.update();
    }

    update() {
        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);
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



        return new Float32Array(data);
    }
}