

export class MapMesh {

    buffer!: GPUBuffer
    bufferLayout: GPUVertexBufferLayout
    verticeNo: number = 0;

    maxSize = 1000; 
    lastSize = 0; 

    usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    constructor() {

 
        //now define the buffer layout
        this.bufferLayout = {
            arrayStride: 4*4,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x2" as const,
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x2" as const,
                    offset: 2*4
                },
            ]
        }

    }

    getVertices(mod:number = 1, device: GPUDevice): GPUBuffer{
        let size = this.maxSize/mod;
        if (this.lastSize == size){
            return this.buffer
        }
        this.lastSize = size
        let halfpi = Math.PI/2;
        let tau = Math.PI*2;
        let listVert: number[] = [];

        let uv = (lat: number, lon: number): number[] => {
            let u: number = 1-((lon+Math.PI)/tau)
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


                listVert.push(lon, lat, ...uv(lat, lon));
                listVert.push(nextlon, lat, ...uv(lat, lon));
                listVert.push(lon, nextlat, ...uv(lat, lon));

                // bottom right triangle
                listVert.push(lon, nextlat, ...uv(lat, lon));
                listVert.push(nextlon, lat, ...uv(lat, lon));
                listVert.push(nextlon, nextlat, ...uv(lat, lon));


            }
        }
        this.verticeNo = listVert.length/4;
        const vertices: Float32Array = new Float32Array(listVert);

        const descriptor: GPUBufferDescriptor = {
            size: vertices.byteLength,
            usage: this.usage,
            mappedAtCreation: true // similar to HOST_VISIBLE, allows buffer to be written by the CPU
        };
        this.buffer = device.createBuffer(descriptor);
        
        //Buffer has been created, now load in the vertices
        new Float32Array(this.buffer.getMappedRange()).set(vertices);
        this.buffer.unmap();
        return this.buffer
    }
}