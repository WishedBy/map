

export class MapMesh {

    vertices!: number[]
    bufferLayout: GPUVertexBufferLayout
    verticeNo: number = 0;

    maxSize = 1500; 
    lastSize = 0; 

    constructor() {

 
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
        }

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

        let uv = (lat: number, lon: number): number[] => {
            let u: number = ((lon+lonHalf)/lonLength)
            let v: number = ((lat+halfpi)/Math.PI)
            
            return [u, v]
        }
        let sphere = (lat: number, lon: number): number[] => {
            return [
                r*Math.cos(lat)*Math.cos(lon),
                r*Math.cos(lat)*Math.sin(lon),
                r*Math.sin(lat),
            ]
        }

        var r = halfpi;
        let stepLat = Math.PI/sizey;
        let stepLon = lonLength/sizex;
        for(let i = 0; i < sizey; i++){
            let lat = (i*stepLat)-halfpi;
            let nextlat = ((i+1)*stepLat)-halfpi;
            for(let j = 0; j < sizex; j++){
                let lon = (j*stepLon)-lonHalf;
                let nextlon = ((j+1)*stepLon)-lonHalf;

                listVert.push(lon, lat, ...sphere(lat, lon), ...uv(lat, lon));
                listVert.push(nextlon, lat, ...sphere(lat, nextlon), ...uv(lat, lon));
                listVert.push(lon, nextlat, ...sphere(nextlat, lon), ...uv(lat, lon));

                // bottom right triangle
                listVert.push(lon, nextlat, ...sphere(nextlat, lon), ...uv(lat, lon));
                listVert.push(nextlon, lat, ...sphere(lat, nextlon), ...uv(lat, lon));
                listVert.push(nextlon, nextlat, ...sphere(nextlat, nextlon), ...uv(lat, lon));


            }
        }
        this.verticeNo = listVert.length/7;
        this.vertices = listVert;

        return this.vertices
    }
}