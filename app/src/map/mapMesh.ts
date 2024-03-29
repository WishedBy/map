import { Material } from "../material";

export class MapMesh {

    device: GPUDevice
    buffer!: GPUBuffer
    bufferLayout: GPUVertexBufferLayout
    verticeNo: number = 0;

    maxSize = 500; 
    lastSize = 0; 

    usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    constructor(device: GPUDevice) {
        this.device = device

        this.createVertices(1)

        let stride = 5*4;
        let tOffset = 3*4;


 
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
                    format: "float32x2" as const,
                    offset: tOffset
                },
            ]
        }

    }

    createVertices(mod:number = 1){
        let size = this.maxSize/mod;
        if (this.lastSize == size){
            return
        }
        this.lastSize = size
        let halfpi = Math.PI/2;
        let tau = Math.PI*2;
        let listVert: number[] = [];
        // x - front-back
        // y - left-right
        // z - up-down

        let uv = (lat: number, lon: number): number[] => {
            let u: number = (lon+Math.PI)/tau
            let v: number = (lat+halfpi)/Math.PI
            
            return [u, v]
        }

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
                // // top left triangle
                // listVert.push(...xyz(r, lon, lat, sphereMod), ...uv(lat, lon));
                // listVert.push(...xyz(r, nextlon, lat, sphereMod), ...uv(lat, lon));
                // listVert.push(...xyz(r, lon, nextlat, sphereMod), ...uv(lat, lon));

                // // bottom right triangle
                // listVert.push(...xyz(r, lon, nextlat, sphereMod), ...uv(lat, lon));
                // listVert.push(...xyz(r, nextlon, lat, sphereMod), ...uv(lat, lon));
                // listVert.push(...xyz(r, nextlon, nextlat, sphereMod), ...uv(lat, lon));


                listVert.push(0, lon, lat, ...uv(lat, lon));
                listVert.push(0, nextlon, lat, ...uv(lat, lon));
                listVert.push(0, lon, nextlat, ...uv(lat, lon));

                // bottom right triangle
                listVert.push(0, lon, nextlat, ...uv(lat, lon));
                listVert.push(0, nextlon, lat, ...uv(lat, lon));
                listVert.push(0, nextlon, nextlat, ...uv(lat, lon));


            }
        }
        this.verticeNo = listVert.length/5
        // x - front-back
        // y - left-right
        // z - up-down
        // x y z u v r g b
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