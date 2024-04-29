export class ImageTexture {
    
    texture: GPUTexture
    view: GPUTextureView
    sampler: GPUSampler

    constructor(device: GPUDevice, textureDescriptor: GPUTextureDescriptor, viewDescriptor: GPUTextureViewDescriptor, samplerDescriptor: GPUSamplerDescriptor, imageData: ImageBitmap) {
        this.texture = device.createTexture(textureDescriptor);
        this.view = this.texture.createView(viewDescriptor);
        this.sampler = device.createSampler(samplerDescriptor);
        device.queue.copyExternalImageToTexture(
            {source: imageData},
            {texture: this.texture},
            textureDescriptor.size
        );
    }


    static async create(device: GPUDevice, url: string): Promise<ImageTexture> {
        const response: Response = await fetch(url);
        const blob: Blob = await response.blob();
        const imageData: ImageBitmap = await createImageBitmap(blob);
 
        const textureDescriptor: GPUTextureDescriptor = {
            size: {
                width: imageData.width,
                height: imageData.height
            },
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };
        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "rgba8unorm",
            dimension: "2d",
            aspect: "all",
            baseMipLevel: 0,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: 1
        };
        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "mirror-repeat",
            addressModeV: "mirror-repeat",
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 16
        };

        return new ImageTexture(device, textureDescriptor, viewDescriptor, samplerDescriptor, imageData)
        
    }

}