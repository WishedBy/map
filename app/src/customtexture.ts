

export class CustomTexture {
    
    device: GPUDevice
    texture: GPUTexture
    view: GPUTextureView
    sampler: GPUSampler

    constructor(device: GPUDevice) {
        
        
        const textureDescriptor: GPUTextureDescriptor = {
            size: {
                width: 4,
                height: 4
            },
            format: "r8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };
        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "r8unorm",
            dimension: "2d",
            aspect: "all",
            baseMipLevel: 0,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: 1
        };
        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 16
        };
        
        
        this.device = device
        this.texture = device.createTexture(textureDescriptor);
        this.view = this.texture.createView(viewDescriptor);
        this.sampler = device.createSampler(samplerDescriptor);
        
        let b: number[] = [
            122, 255, 255, 122,
            255, 122, 122, 255,
            255, 122, 122, 255, 
            122, 255, 255, 122,
        ];
        this.device.queue.writeTexture({texture: this.texture}, <ArrayBuffer> new Uint8Array(b), {
            bytesPerRow: 4, 
        }, textureDescriptor.size)

    }


}
