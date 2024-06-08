import { vec2 } from "gl-matrix"
import { MultiPolygonGeometry, PolygonGeometry } from "../../countries/country_shapes"
import { Geometry, Position } from "../../countries/geojson"

type countryData = {
    shapes: MultiPolygonGeometry|PolygonGeometry,
    fillStart: vec2
}

export class CountryTexture {
    
    device: GPUDevice
    texture?: GPUTexture
    view?: GPUTextureView
    sampler?: GPUSampler
    buffer: number[][] = []

    dim = {width: 2048, height: 1024}
    // dim = {width: 500, height: 500}

    written = false

    constructor(device: GPUDevice) {
        this.device = device;
    }


    addCountryShapeAsLayer(data: Geometry): number {
        if(this.written){
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

        let minLon = -180;
        let maxLon = 180;
        let minLat = -90;
        let maxLat = 90;


        let layer = new Array(this.dim.width*this.dim.height).fill(0);

        let lonRat = (this.dim.width)/(maxLon!-minLon!)
        let LonOff = -minLon!
        
        let latRat = (this.dim.height)/(maxLat!-minLat!)
        let LatOff = -minLat!


        for(let y = 0; y < this.dim.height; y++){
            let xpos: number[] = []
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
                    layer[linePos+x] = 255;
                }

            }
        }


        this.buffer.push(layer);

        return this.buffer.length-1
    }


    write(){
        if(this.written){
           throw new Error('The texture should be written once');
        }
        this.written = true;

        
        const textureDescriptor: GPUTextureDescriptor = {
            size: {
                width: this.dim.width,
                height: this.dim.height,
                depthOrArrayLayers: this.buffer.length
            },
            format: "r8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };
        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "r8unorm",
            dimension: "2d-array",
            aspect: "all",
            baseMipLevel: 0,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: this.buffer.length
        };
        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "nearest",
            minFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 1
        };
        
        
        this.texture = this.device.createTexture(textureDescriptor);
        this.view = this.texture.createView(viewDescriptor);
        this.sampler = this.device.createSampler(samplerDescriptor);
        
        this.device.queue.writeTexture({texture: this.texture}, <ArrayBuffer> new Uint8Array(([] as number[]).concat(...this.buffer)), {
            bytesPerRow: this.dim.width, 
            rowsPerImage: this.dim.height,
        }, textureDescriptor.size)

        this.buffer = []; // clear buffer once written
    }

    getView(): GPUTextureView{
        if(!this.written){
            this.write()
        }
        return this.view as GPUTextureView
    }
    getSampler(): GPUSampler{
        if(!this.written){
            this.write()
        }
        return this.sampler as GPUSampler
    }

}
