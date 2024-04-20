import { rm } from "fs";
import { mat2, mat3, vec2 } from "gl-matrix";


export class StreamMesh {

    vertices!: number[]
    bufferLayout: GPUVertexBufferLayout

    lengthNo = 100; // segments in length

    constructor(lengthNo: number = 51) {
        this.lengthNo = lengthNo;
 
        //now define the buffer layout
        this.bufferLayout = {
            arrayStride: this.getVertexPartCount()*4,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x2" as const,
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x3" as const,
                    offset: 2*4
                },
                {
                    shaderLocation: 2,
                    format: "float32x2" as const,
                    offset: 5*4
                },
            ]
        };

    }
    getVertexPartCount(): number {
        return 7;
    }

    
    getVertices(angleRad: number, length: number, width: number): number[]{
        
        
        var r = Math.PI/2;
        let sphere = (x: number, y: number): number[] => {
            return [
                r*Math.cos(y)*Math.cos(x),
                r*Math.cos(y)*Math.sin(x),
                r*Math.sin(y),
            ]
        }

        let rCos = Math.cos(angleRad);
        let rSin = Math.sin(angleRad);
        let rot = (vec: vec2): vec2 => ([
            (rCos * vec[0]) + (rSin * vec[1]), 
            (rCos * vec[1]) - (rSin * vec[0])
        ]);
        let chunkLength = length/this.lengthNo;
        
        let verts: number[] = [];
        for(let i = 0; i < this.lengthNo; i++){
            let x = (i*chunkLength);
            let xNext = x+chunkLength;
            let y = 0;
            let y2 = width/2;
            let y3 = width;
            y -= (width/2)
            y2 -= (width/2)
            y3 -= (width/2)

            let tl = rot([x, y]) // 1
            let tr = rot([xNext, y]) // 2
            let mr = rot([xNext, y2]) // 3
            let br = rot([xNext, y3]) // 4
            let bl = rot([x, y3]) // 5
            let ml = rot([x, y2]) // 6

            // flat(2), sperical(3), coloring id(2)
            verts.push(tl[0], tl[1],    ...sphere(tl[0], tl[1]),   i, 1);
            verts.push(tr[0], tr[1],    ...sphere(tr[0], tr[1]),   i, 2);
            verts.push(ml[0], ml[1],    ...sphere(ml[0], ml[1]),   i, 6);

            verts.push(ml[0], ml[1],    ...sphere(ml[0], ml[1]),   i, 6);
            verts.push(tr[0], tr[1],    ...sphere(tr[0], tr[1]),   i, 2);
            verts.push(mr[0], mr[1],    ...sphere(mr[0], mr[1]),   i, 3);


            verts.push(ml[0], ml[1],    ...sphere(ml[0], ml[1]),   i, 6);
            verts.push(mr[0], mr[1],    ...sphere(mr[0], mr[1]),   i, 3);
            verts.push(bl[0], bl[1],    ...sphere(bl[0], bl[1]),   i, 5);

            verts.push(bl[0], bl[1],    ...sphere(bl[0], bl[1]),   i, 5);
            verts.push(mr[0], mr[1],    ...sphere(mr[0], mr[1]),   i, 3);
            verts.push(br[0], br[1],    ...sphere(br[0], br[1]),   i, 4);
            
        }

        this.vertices = verts;
        return this.vertices;
    }
}