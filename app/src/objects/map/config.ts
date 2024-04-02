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

    pipeline: GPURenderPipeline

    bindGroupLayout: GPUBindGroupLayout

    globalBuffer: GPUBuffer
    mapMaterial: Material

    depthStencilState!: GPUDepthStencilState;
    depthStencilBuffer!: GPUTexture;
    depthStencilView!: GPUTextureView;
    depthStencilAttachment!: GPURenderPassDepthStencilAttachment;
   

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material, quality: number = 1){
        this.device = device
        this.quality = quality
        this.globalBuffer = globalBuffer
        this.mapMaterial = mapMaterial
    
        this.bindGroupLayout = this.device.createBindGroupLayout({
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
                {
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage" as GPUBufferBindingType
                    }
                },
            ]

        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });
    
        this.pipeline = this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : map
                }),
                entryPoint : "vs_main",
                buffers: [this.mesh.bufferLayout,]
            },
    
            fragment : {
                module : this.device.createShaderModule({
                    code : map
                }),
                entryPoint : "fs_main",
                targets : [{
                    format : "bgra8unorm" as GPUTextureFormat
                }]
            },
    
            primitive : {
                topology : "triangle-list"
            },
    
            layout: pipelineLayout,
            depthStencil: this.depthStencilState,
        });

    }


    getBindGroup(subModelBuffer: GPUBuffer): GPUBindGroup{

        
        return this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.globalBuffer
                    }
                },
                {
                    binding: 1,
                    resource: this.mapMaterial.view
                },
                {
                    binding: 2,
                    resource: this.mapMaterial.sampler
                },
                {
                    binding: 3,
                    resource: {
                        buffer: subModelBuffer
                    }
                }
            ]
        });
    }

    getVerticies(): GPUBuffer{
        return this.mesh.getVertices(this.quality, this.device)
    }

    getVerticeNo(): number{
        return this.mesh.verticeNo
    }
}
