

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

    
    getVertices(): number[]{

        let widthOffset = 1/(((this.widthNo-1)*2)+1);
        let lengthOffset = 1/this.lengthNo;
        // vertices for line created on unit square
        let verts: number[] = [];
        for(let i = 0; i < this.lengthNo; i++){
            let x = (i*lengthOffset);
            let xNext = (i+1)*lengthOffset;
            // x -= 0.5;
            // xNext -= 0.5;
            for(let j = 0; j < this.widthNo; j++){
                let y = j*widthOffset;
                let yNext = 1-y;
                // y -= 0.5;
                // yNext -= 0.5;
                
                // flat(2), sperical(3), coloring id(2)
                verts.push(x, y,            0, x, y,           i, j);
                verts.push(xNext, y,        0, xNext, y,       i, j);
                verts.push(x, yNext,        0, x, yNext,       i, j);

                verts.push(x, yNext,        0, x, yNext,       i, j);
                verts.push(xNext, y,        0, xNext, y,       i, j);
                verts.push(xNext, yNext,    0, xNext, yNext,   i, j);
            }
        }


        this.verticeNo = verts.length/7;
        this.vertices = verts;
        return this.vertices;
    }
}