export class MapMesh {

    device: GPUDevice
    buffer!: GPUBuffer
    bufferLayout: GPUVertexBufferLayout
    verticeNo: number = 0;

    maxSize = 50; 
    lastSize = 0; 
    lastSpericalModifier = 0; 

    usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    constructor(device: GPUDevice) {
        this.device = device

        this.createVertices(1, 0)

        let stride = 6*4;
        let cOffset = 3*4;



        //now define the buffer layout
        this.bufferLayout = {
            arrayStride: stride,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x3" as const,
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x3" as const,
                    offset: cOffset
                }
            ]
        }

    }

    createVertices(mod:number = 1, sphereMod: number = 0){
        let size = this.maxSize/mod;
        if (this.lastSize == size && this.lastSpericalModifier == sphereMod){
            return
        }
        this.lastSpericalModifier = sphereMod
        this.lastSize = size
        let halfpi = Math.PI/2;
        let tau = Math.PI*2;
        let listVert: number[] = [];
        // x - front-back
        // y - left-right
        // z - up-down

        let xyz = (r: number, lon: number, lat: number, mod: number = 0): number[] => {
            let x = r*Math.cos(lat)*Math.cos(lon);
            x = 0 + (mod*x);
            let y = r*Math.cos(lat)*Math.sin(lon);
            y = ((1-mod)*lon) + (mod*y);
            let z = r*Math.sin(lat);
            z = ((1-mod)*lat) + (mod*z);
            return [ 
                x,
                y,
                z,
            ]
        };

        let r = 1;
        let stepLat = Math.PI/size;
        let stepLon = stepLat*2;
        for(let i = 0; i < size; i++){
            let lat = (i*stepLat)-halfpi;
            let nextlat = ((i+1)*stepLat)-halfpi;
            for(let j = 0; j < size; j++){
                let lon = (j*stepLon)-Math.PI;
                let nextlon = ((j+1)*stepLon)-Math.PI;
                // x y z r g b
                // top left triangle
                listVert.push(...xyz(r, lon, lat, sphereMod), i%2, 0, 0);
                listVert.push(...xyz(r, nextlon, lat, sphereMod), i%2, 0, 0);
                listVert.push(...xyz(r, lon, nextlat, sphereMod), i%2, 0, 0);

                // bottom right triangle
                listVert.push(...xyz(r, lon, nextlat, sphereMod), i%2, 0, 1);
                listVert.push(...xyz(r, nextlon, lat, sphereMod), i%2, 0, 1);
                listVert.push(...xyz(r, nextlon, nextlat, sphereMod), i%2, 0, 1);


            }
        }
        this.verticeNo = listVert.length/6
        // x - front-back
        // y - left-right
        // z - up-down
            // x y z r g b
        // [
            // 0, -0.5, -0.5, 1.0, 0.0, 0.0,
            // 0, 0.5,  -0.5, 0.0, 1.0, 0.0,
            // 0, -0.5,  0.5, 0.0, 0.0, 0.0,

            // 0, -0.5, 0.5, 1.0, 0.0, 0.0,
            // 0, 0.5, -0.5, 0.0, 1.0, 0.0,
            // 0, 0.5,  0.5, 0.0, 0.0, 1.0,
        // ]
        const vertices: Float32Array = new Float32Array(listVert);

        const descriptor: GPUBufferDescriptor = {
            size: vertices.byteLength,
            usage: this.usage,
            mappedAtCreation: true // similar to HOST_VISIBLE, allows buffer to be written by the CPU
        };
        this.buffer = this.device.createBuffer(descriptor);
        
        //Buffer has been created, now load in the vertices
        new Float32Array(this.buffer.getMappedRange()).set(vertices);
        this.buffer.unmap();

    }
}