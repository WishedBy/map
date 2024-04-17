import { mat2, vec2 } from "gl-matrix";


export class StreamMesh {

    vertices!: number[]
    bufferLayout: GPUVertexBufferLayout
    verticeNo: number = 0;

    lengthNo = 100; // segments in length
    widthNo = 5;  // ractangles stacked with small offset on width

    constructor(widthNo: number = 5, lengthNo: number = 100) {
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

    
    getVertices(angle: number, offset2d: vec2, length: number): number[]{
        let width = (1/50);
        var r = Math.PI/2;
        let sphere = (lat: number, lon: number): number[] => {
            return [
                r*Math.cos(lat)*Math.cos(lon) + 0.1,
                r*Math.cos(lat)*Math.sin(lon),
                r*Math.sin(lat),
            ]
        }
        let widthOffset = width/(((this.widthNo-1)*2)+1);
        let lengthOffset = length/this.lengthNo;
        // vertices for line created on unit square
        
        let rCos = Math.cos(-angle);
        let rSin = Math.sin(-angle);
        let verts: number[] = [];
        for(let i = 0; i < this.lengthNo; i++){
            let _x = (i*lengthOffset);
            let _xNext = _x+lengthOffset;
            for(let j = 0; j < this.widthNo; j++){
                let _y = j*widthOffset;
                let _yNext = width-_y;
                let x = (rCos * _x) + (rSin * _y)
                let y = (rCos * _y) - (rSin * _x)
                let xNext = (rCos * _xNext) + (rSin * _yNext)
                let yNext = (rCos * _yNext) - (rSin * _xNext)

                
                


                // flat(2), sperical(3), coloring id(2)
                verts.push(x, y,            ...sphere(x, y),           i, j);
                verts.push(xNext, y,        ...sphere(xNext, y),       i, j);
                verts.push(x, yNext,        ...sphere(x, yNext),       i, j);

                verts.push(x, yNext,        ...sphere(x, yNext),       i, j);
                verts.push(xNext, y,        ...sphere(xNext, y),       i, j);
                verts.push(xNext, yNext,    ...sphere(xNext, yNext),   i, j);
            }
        }


        this.verticeNo = verts.length/7;
        this.vertices = verts;
        return this.vertices;
    }
}