import { vec2 } from "gl-matrix"
import { MultiPolygonGeometry, PolygonGeometry } from "../../countries/country_shapes"

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

    // dim = {width: 2048, height: 1024}
    dim = {width: 500, height: 500}

    written = false

    constructor(device: GPUDevice) {
        this.device = device;
    }


    addCountryShapeAsLayer(data: countryData): number {
        if(this.written){
            throw new Error('Can only be modified before being written');
        }

        let coords: vec2[][][]
        if(data.shapes.type == "MultiPolygon"){
            coords = data.shapes.coordinates
        }else if(data.shapes.type == "Polygon"){
            coords = [data.shapes.coordinates]
        }else{
            throw new Error('Unknown shapes type');
        }

        let minLon = -180;
        let maxLon = 180;
        let minLat = -90;
        let maxLat = 90;

        // temp for larger view
        maxLon = Number.MIN_VALUE;
        maxLat = Number.MIN_VALUE;
        minLon = Number.MAX_VALUE;
        minLat = Number.MAX_VALUE;
        

        coords.forEach(shape => {
            shape.forEach(poly => {
                poly.forEach(point => {
                    if(point[0] < minLon!){
                        minLon = point[0]
                    }
                    if(point[0] > maxLon!){
                        maxLon = point[0]
                    }
                    if(point[1] < minLat!){
                        minLat = point[1]
                    }
                    if(point[1] > maxLat!){
                        maxLat = point[1]
                    }
                });
            });
        });
        console.log({minLon, maxLon, minLat, maxLat})
        // end temp for larger view
        

        let layer = new Array(this.dim.width*this.dim.height).fill(0);

        let lonRat = (this.dim.width)/(maxLon!-minLon!)
        let LonOff = -minLon!
        
        let latRat = (this.dim.height)/(maxLat!-minLat!)
        let LatOff = -minLat!

        const drawLine = (p1: vec2, p2: vec2) => {
            let p = p1
            const dx = Math.abs(p2[0] - p1[0]);
            const dy = Math.abs(p2[1] - p1[1]);
            const sx = Math.sign(p2[0] - p1[0]);
            const sy = Math.sign(p2[1] - p1[1]);
            let err = dx - dy;
            
            while (true) {
                layer[p[1]*this.dim.width+p[0]] = 255
            
                if (p[0] === p2[0] && p[1] === p2[1]) break;
            
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; p[0] += sx; }
                if (e2 <  dx) { err += dx; p[1] += sy; }
            }
    }

        coords.forEach(shape => {
            shape.forEach(poly => {
                poly.forEach((point, i) => {
                    let point2: vec2
                    if(i < poly.length-1){
                        point2 = poly[i+1];
                    }else{
                        point2 = poly[0];
                    }
                    let p1: vec2 = [
                        Math.floor(lonRat * (point[0] + LonOff)),
                        this.dim.height - Math.floor(latRat * (point[1] + LatOff))
                    ];
                    let p2: vec2 = [
                        Math.floor(lonRat * (point2[0] + LonOff)),
                        this.dim.height - Math.floor(latRat * (point2[1] + LatOff))
                    ];
                    drawLine(p1, p2)
                });

                // drawing pixels per line wont work, attempting a flood fill might
                // if it will i should either record a position for each polygon at this point, or i should just perform the floodfill here
            });
        });

        for(let line = 0; line < this.dim.height; line++){
            for(let x = 0; x < this.dim.width-1; x++){
                let linePos = line*this.dim.width;
                let aPos = linePos+x;
                let bPos = 0;
                if(layer[aPos] != 0 && layer[aPos+1] == 0){
                    // console.log([line, x, layer[aPos]])
                    let x1 = x;
                    let x2 = -1;
                    x++;
                    for(; x < this.dim.width; x++){
                        bPos = linePos+x;
                        if(layer[bPos] != 0){
                            x2 = x;
                            break;
                        }
                    }
                    if(x2 > -1){
                        for(let i = x1; i <= x2; i++){
                            layer[linePos+i] = 255;
                        }
                    }
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
