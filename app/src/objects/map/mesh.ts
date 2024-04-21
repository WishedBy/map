

export class MapMesh {

    vertices!: number[]
    bufferLayout: GPUVertexBufferLayout
    verticeNo: number = 0;

    maxSize = 200; 
    lastSize = 0; 

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
        }

    }
    getVertexPartCount(): number {
        return 7;
    }

    getVertices(mod:number = 1): number[]{
        let sizex = this.maxSize/mod;
        let sizey = sizex/2;
        let size = sizex/sizey;
        if (this.lastSize == size){
            return this.vertices
        }
        this.lastSize = size
        let halfpi = Math.PI/2;
        let lonLength = Math.PI*2;
        let lonHalf = lonLength/2;
        let listVert: number[] = [];

        var r = halfpi;
        let uv = (lat: number, lon: number): number[] => {
            let u: number = ((lon+lonHalf)/lonLength)
            let v: number = ((lat+halfpi)/Math.PI)
            
            return [u, v]
        }
        let sphere = (y: number, x: number): number[] => {
            return [
                r*Math.cos(y)*Math.cos(x),
                r*Math.cos(y)*Math.sin(x),
                r*Math.sin(y),
            ]
        }

        let stepLat = Math.PI/sizey;
        let stepLon = lonLength/sizex;
        for(let i = 0; i < sizey; i++){
            let lat = (i*stepLat)-halfpi;
            let nextlat = ((i+1)*stepLat)-halfpi;
            for(let j = 0; j < sizex; j++){
                let lon = (j*stepLon)-lonHalf;
                let nextlon = ((j+1)*stepLon)-lonHalf;

                listVert.push(lon, lat, ...sphere(lat, lon), ...uv(lat, lon));
                listVert.push(nextlon, lat, ...sphere(lat, nextlon), ...uv(lat, nextlon));
                listVert.push(lon, nextlat, ...sphere(nextlat, lon), ...uv(nextlat, lon));

                // bottom right triangle
                listVert.push(lon, nextlat, ...sphere(nextlat, lon), ...uv(nextlat, lon));
                listVert.push(nextlon, lat, ...sphere(lat, nextlon), ...uv(lat, nextlon));
                listVert.push(nextlon, nextlat, ...sphere(nextlat, nextlon), ...uv(nextlat, nextlon));


            }
        }
        this.verticeNo = listVert.length/7;
        this.vertices = listVert;

        return this.vertices
    }
}