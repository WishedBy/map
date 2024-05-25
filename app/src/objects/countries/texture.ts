import { vec2 } from "gl-matrix"

export type MultiPolygonGeometry = {
    type: "MultiPolygon",
    coordinates: vec2[][][],
}

type countryData = {
    shapes: MultiPolygonGeometry,
    fillStart: vec2
    minLon?: number
    maxLon?: number
    minLat?: number
    maxLat?: number
}


export class CountryTexture {
    
    device: GPUDevice
    texture?: GPUTexture
    view?: GPUTextureView
    sampler?: GPUSampler
    buffer: number[][] = []

    dim = {width: 100, height: 100}

    written = false

    constructor(device: GPUDevice) {
        this.device = device;
    }


    addCountryShapeAsLayer(data: countryData): number {
        if(this.written){
            throw new Error('Can only be modified before being written');
        }

        if(
            data.maxLon == undefined || data.maxLon == null || 
            data.minLon == undefined || data.minLon == null || 
            data.maxLat == undefined || data.maxLat == null || 
            data.minLat == undefined || data.minLat == null
        ){
            if(data.maxLon == undefined || data.maxLon == null){
                data.maxLon = Number.MIN_VALUE;
            }
            if(data.maxLat == undefined || data.maxLat == null){
                data.maxLat = Number.MIN_VALUE;
            }
            if(data.minLon == undefined || data.minLon == null){
                data.minLon = Number.MAX_VALUE;
            }
            if(data.minLat == undefined || data.minLat == null){
                data.minLat = Number.MAX_VALUE;
            }
            data.shapes.coordinates.forEach(shape => {
                shape.forEach(poly => {
                    poly.forEach(point => {
                        if(point[0] < data.minLon!){
                            data.minLon = point[0]
                        }
                        if(point[0] > data.maxLon!){
                            data.maxLon = point[0]
                        }
                        if(point[1] < data.minLat!){
                            data.minLat = point[1]
                        }
                        if(point[1] > data.maxLat!){
                            data.maxLat = point[1]
                        }
                    });
                });
            });
            var {minLon, maxLon, minLat, maxLat} = data
            console.log({minLon, maxLon, minLat, maxLat})
        }

        let layer = new Array(this.dim.width*this.dim.height).fill(0);

        let lonRat = (this.dim.width)/(data.maxLon!-data.minLon!)
        let LonOff = -data.minLon!
        
        
        let latRat = (this.dim.height)/(data.maxLat!-data.minLat!)
        // let LatOff = this.dim.height - lonRat * data.maxLat!
        let LatOff = -data.minLat!


        data.shapes.coordinates.forEach(shape => {
            shape.forEach(poly => {
                poly.forEach(point => {
                    let x =  Math.round(lonRat * (point[0] + LonOff))
                    let y = this.dim.height - Math.round(latRat * (point[1] + LatOff))

                    layer[y*this.dim.width+x] = 255
                });
            });
        });
        this.buffer.push(layer);

        return this.buffer.length-1
    }


    write(){
        if(this.written){
           throw new Error('The texture should be written once');
        }
        this.written = true;

        if(this.buffer.length == 0){
            this.dim = {width: 4, height: 4}
            this.buffer = [
                [
                    0, 255, 255, 255,
                    255,   0, 255, 255,
                    255, 255,   0, 255, 
                    255, 255, 255,   0,
                ],[
                    122, 255, 255, 122,
                    255, 122, 122, 255,
                    255, 122, 122, 255, 
                    122, 255, 255, 122,
                ]
            ]
        }
        
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
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 16
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
