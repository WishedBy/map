import { objectConfig } from "../objectConfig";
import { Material } from "../material";
import { MapMesh } from "./mesh";
import map from "./shaders/map.wgsl";


export class shaderConfig implements objectConfig{
    device: GPUDevice
    quality: number
    mesh: MapMesh = new MapMesh();

    shader = map
    bindGroups = [] as GPUBindGroup[]

   

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material, quality: number = 1){
        this.device = device
        this.quality = quality
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
            ]

        });
    
        this.bindGroups.push(this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: globalBuffer
                    }
                },
                {
                    binding: 1,
                    resource: mapMaterial.view
                },
                {
                    binding: 2,
                    resource: mapMaterial.sampler
                }
            ]
        }));

    } 


    getVerticies(): GPUBuffer{
        return this.mesh.getVertices(this.quality, this.device)
    }
}
