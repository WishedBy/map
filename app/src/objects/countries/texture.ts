import { vec2 } from "gl-matrix"
import { MultiPolygonGeometry, PolygonGeometry } from "../../countries/country_shapes"
import { Geometry, Position } from "../../countries/geojson"



export class CountryTexture {
    
    device: GPUDevice
    texture?: GPUTexture
    view?: GPUTextureView
    sampler?: GPUSampler

    dim = {width: 2048, height: 1024}

    // account for 0 = unset, 255 items per layer
    buffer: Uint32Array
    gpuBuffer: GPUBuffer|null = null
    count = 0


    constructor(device: GPUDevice) {
        this.buffer = new Uint32Array(this.dim.width*this.dim.height).fill(0)
        this.device = device;
    }


    addCountryShapeAsLayer(id:number, data: Geometry) {
        if(this.gpuBuffer != null){
            throw new Error('Can only be modified before being written');
        }

        let coords: Position[][][]
        if(data.type == "MultiPolygon"){
            coords = data.coordinates
        }else if(data.type == "Polygon"){
            coords = [data.coordinates]
        }else{
            throw new Error('Unknown shapes type');
        }

        const minLon = -180;
        const maxLon = 180;
        const minLat = -90;
        const maxLat = 90;

        this.count++;
        

        const lonRat = (this.dim.width)/(maxLon!-minLon!)
        const LonOff = -minLon!
        
        const latRat = (this.dim.height)/(maxLat!-minLat!)
        const LatOff = -minLat!


        for(let y = 0; y < this.dim.height; y++){
            const xpos: number[] = []
            coords.forEach(shape => {
                shape.forEach(poly => {
                    poly.forEach((point, i) => {
                        let point2: Position
                        if(i < poly.length-1){
                            point2 = poly[i+1];
                        }else{
                            point2 = poly[0];
                        }
                        let p1: Position = [
                            (lonRat * (point[0] + LonOff)),
                            this.dim.height - (latRat * (point[1] + LatOff))
                        ];
                        let p2: Position = [
                            (lonRat * (point2[0] + LonOff)),
                            this.dim.height - (latRat * (point2[1] + LatOff))
                        ];
                        if(p1[0] > this.dim.width-1){
                            p1[0] = this.dim.width-1
                        }
                        if(p2[0] > this.dim.width-1){
                            p2[0] = this.dim.width-1
                        }
                        if(p1[1] > this.dim.height-1){
                            p1[1] = this.dim.height-1
                        }
                        if(p2[1] > this.dim.height-1){
                            p2[1] = this.dim.height-1
                        }
                        if (p1[1] < y && p2[1] >= y || p2[1] < y && p1[1] >= y) {
                            xpos.push(Math.round(p1[0]+(y-p1[1])/(p2[1]-p1[1]) *(p2[0]-p1[0])))
                        }
                        
                    });

                });
            });  
            xpos.sort(function(a, b) {
                return a - b;
            })
            let linePos = y*this.dim.width;
            for(let i = 0; i < xpos.length-1; i+=2){
                for (let x=xpos[i]; x<xpos[i+1]; x++) {
                    if(x >= this.dim.width){
                        x = this.dim.width-1
                    }
                    this.buffer.set([id], linePos+x)
                }

            }
        }

    }



    getAsBuffer(): GPUBuffer{
        if(this.gpuBuffer != null){
            return this.gpuBuffer
        }
        let b = this.device.createBuffer({
            size: this.buffer.byteLength+8,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        let dim = new Uint32Array(2)
        dim.set([this.dim.width, this.dim.height], 0)
        this.device.queue.writeBuffer(b, 0, <ArrayBuffer>dim);
        this.device.queue.writeBuffer(b, 8, <ArrayBuffer>this.buffer);
        b.unmap();
        this.buffer = new Uint32Array(); 
        this.gpuBuffer = b;

        return b
    }

}
