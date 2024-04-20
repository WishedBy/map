import { rm } from "fs";
import { mat2, mat3, vec2 } from "gl-matrix";


export class StreamMesh {

    vertices!: number[]
    bufferLayout: GPUVertexBufferLayout

    lengthNo = 100; // segments in length
    widthNo = 5;  // ractangles stacked with small offset on width

    constructor(widthNo: number = 5, lengthNo: number = 20) {
        this.lengthNo = lengthNo;
        this.widthNo = widthNo;
 
        //now define the buffer layout
        this.bufferLayout = {
            arrayStride: 7*4,
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

    
    getVertices(angleRad: number, length: number, width: number): number[]{
        
        
        var r = Math.PI/2;
        let sphere = (lat: number, lon: number): number[] => {
            return [
                r*Math.cos(lat)*Math.cos(lon) + 0.1,
                r*Math.cos(lat)*Math.sin(lon),
                r*Math.sin(lat),
            ]
        }

        let rCos = Math.cos(angleRad);
        let rSin = Math.sin(angleRad);
        let rot = (vec: vec2): vec2 => ([
            (rCos * vec[0]) + (rSin * vec[1]), 
            (rCos * vec[1]) - (rSin * vec[0])
        ]);
        let chunkWidth = width/(((this.widthNo-1)*2)+1);
        let chunkLength = length/this.lengthNo;
        
        let verts: number[] = [];
        for(let i = 0; i < this.lengthNo; i++){
            let x = (i*chunkLength);
            let xNext = x+chunkLength;
            for(let j = 0; j < this.widthNo; j++){
                let y = j*chunkWidth;
                y -= (width/2)
                let yNext = y+chunkWidth;

                let tl = rot([x, y])
                let tr = rot([xNext, y])
                let bl = rot([x, yNext])
                let br = rot([xNext, yNext])

                // flat(2), sperical(3), coloring id(2)
                verts.push(tl[0], tl[1],    ...sphere(x, y),           i, j);
                verts.push(tr[0], tr[1],    ...sphere(xNext, y),       i, j);
                verts.push(bl[0], bl[1],    ...sphere(x, yNext),       i, j);

                verts.push(bl[0], bl[1],    ...sphere(x, yNext),       i, j);
                verts.push(tr[0], tr[1],    ...sphere(xNext, y),       i, j);
                verts.push(br[0], br[1],    ...sphere(xNext, yNext),   i, j);
            }
        }

        this.vertices = verts;
        return this.vertices;
    }
}