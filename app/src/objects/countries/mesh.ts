import { rm } from "fs";
import { mat2, mat3, vec2, vec3 } from "gl-matrix";


export class TestMesh {

    vertices!: number[]
    bufferLayout: GPUVertexBufferLayout


    constructor() {
 
        //now define the buffer layout
        this.bufferLayout = {
            arrayStride: this.getVertexPartCount()*4,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x2" as const,
                    offset: 0
                },
            ]
        };

    }
    getVertexPartCount(): number {
        return 2;
    }

    
    getVertices(width: number, height:number): number[]{
        if(this.vertices && this.vertices.length > 0){
            return  this.vertices
        }
        
        let verts: number[] = [];
        let lt: vec2 = [
            -(width/2),
            -(height/2),
        ];
        let rt: vec2 = [
            (width/2),
            -(height/2),
        ];
        let lb: vec2 = [
            -(width/2),
            (height/2),
        ];
        let rb: vec2 = [
            (width/2),
            (height/2),
        ];
        verts.push(lt[0], lt[1]);
        verts.push(rt[0], rt[1]);
        verts.push(lb[0], lb[1]);

        verts.push(lb[0], lb[1]);
        verts.push(rt[0], rt[1]);
        verts.push(rb[0], rb[1]);
        this.vertices = verts;
        return this.vertices;
    }
}