import { Material } from "../material";
import { MapMesh } from "./mesh";
import map from "./shaders/map.wgsl";


export class shaderConfig{
    device: GPUDevice
    quality: number
    mesh: MapMesh = new MapMesh();

    shader = map
    bindGroups = [] as GPUBindGroup[]

    pipelineLayout: GPUPipelineLayout

    bindGroupLayout: GPUBindGroupLayout

    globalBuffer: GPUBuffer
    mapMaterial: Material
    mapMaterialDark: Material

    depthStencilBuffer!: GPUTexture;
    depthStencilView!: GPUTextureView;
    depthStencilAttachment!: GPURenderPassDepthStencilAttachment;
   

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material, mapMaterialDark: Material, quality: number = 1){
        this.device = device
        this.quality = quality
        this.globalBuffer = globalBuffer
        this.mapMaterial = mapMaterial
        this.mapMaterialDark = mapMaterialDark
    
        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
            ]

        });

        this.pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });
    

    }

    getPipeline(dss: GPUDepthStencilState, sampleCount: number): GPURenderPipeline {
        return this.device.createRenderPipeline({
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
                    format : "bgra8unorm" as GPUTextureFormat,
                    blend: {
                        color:{
                            operation: "add" as GPUBlendOperation,
                            srcFactor: "src-alpha" as GPUBlendFactor,
                            dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
                        },
                        alpha:{
                            operation: "add" as GPUBlendOperation,
                            srcFactor: "src-alpha" as GPUBlendFactor,
                            dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
                        },
                    },
                }]
            },
    
            multisample: {
                count: sampleCount,
            },
            primitive : {
                topology : "triangle-list",
                cullMode: 'none',
            },
    
            layout: this.pipelineLayout,
            depthStencil: dss,
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
                },
                {
                    binding: 4,
                    resource: this.mapMaterialDark.view
                },
                {
                    binding: 5,
                    resource: this.mapMaterialDark.sampler
                },
            ]
        });
    }


    getVerticeNo(): number{
        return this.mesh.verticeNo
    }
}
