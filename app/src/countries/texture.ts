
// import quad from "./quad.wgsl";

// export class Texture{

//     squareVertices = new Uint32Array([0, 0, 0, 1, 1, 0, 1, 1])

//     constructor(canvas: HTMLCanvasElement, device: GPUDevice){
//         const context = canvas.getContext('webgpu') as GPUCanvasContext;

//         const devicePixelRatio = window.devicePixelRatio;
//         canvas.width = canvas.clientWidth * devicePixelRatio;
//         canvas.height = canvas.clientHeight * devicePixelRatio;
//         const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
//         context.configure({
//             device,
//             format: presentationFormat,
//             alphaMode: 'premultiplied',
//         });


//         const computePipeline = device.createComputePipeline({
//             layout: 'auto',
//             compute: {
//                 module: device.createShaderModule({
//                     code: blurWGSL,
//                 }),
//             },
//         });
        
//         const fullscreenQuadPipeline = device.createRenderPipeline({
//             layout: 'auto',
//             vertex: {
//                 module: device.createShaderModule({
//                     code: quad,
//                 }),
//             },
//             fragment: {
//                 module: device.createShaderModule({
//                     code: quad,
//                 }),
//                 targets: [
//                     {
//                         format: presentationFormat,
//                     },
//                 ],
//             },
//             primitive: {
//                 topology: 'triangle-list',
//             },
//         });


//         const sampler = device.createSampler({
//             magFilter: 'linear',
//             minFilter: 'linear',
//         });
//         const computeParamsBuffer = device.createBuffer({
//             size: 8,
//             usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
//         });
//         const computeConstants = device.createBindGroup({
//             layout: computePipeline.getBindGroupLayout(0),
//             entries: [
//                 {
//                     binding: 0,
//                     resource: sampler,
//                 },
//                 {
//                     binding: 1,
//                     resource: {
//                         buffer: computeParamsBuffer,
//                     },
//                 },
//             ],
//         });const commandEncoder = device.createCommandEncoder();

//         const computePass = commandEncoder.beginComputePass();
//         computePass.setPipeline(computePipeline);
//         computePass.setBindGroup(0, computeConstants);
      
//         computePass.setBindGroup(1, computeBindGroup0);
//         computePass.dispatchWorkgroups(
//           Math.ceil(srcWidth / blockDim),
//           Math.ceil(srcHeight / batch[1])
//         );
      
//         computePass.setBindGroup(1, computeBindGroup1);
//         computePass.dispatchWorkgroups(
//           Math.ceil(srcHeight / blockDim),
//           Math.ceil(srcWidth / batch[1])
//         );
      
//         for (let i = 0; i < settings.iterations - 1; ++i) {
//           computePass.setBindGroup(1, computeBindGroup2);
//           computePass.dispatchWorkgroups(
//             Math.ceil(srcWidth / blockDim),
//             Math.ceil(srcHeight / batch[1])
//           );
      
//           computePass.setBindGroup(1, computeBindGroup1);
//           computePass.dispatchWorkgroups(
//             Math.ceil(srcHeight / blockDim),
//             Math.ceil(srcWidth / batch[1])
//           );
//         }
      
//         computePass.end();
      
//         const passEncoder = commandEncoder.beginRenderPass({
//           colorAttachments: [
//             {
//               view: context.getCurrentTexture().createView(),
//               clearValue: [0, 0, 0, 1],
//               loadOp: 'clear',
//               storeOp: 'store',
//             },
//           ],
//         });
      
//         passEncoder.setPipeline(fullscreenQuadPipeline);
//         passEncoder.setBindGroup(0, showResultBindGroup);
//         passEncoder.draw(6);
//         passEncoder.end();
//         device.queue.submit([commandEncoder.finish()]);
          
//     }


// }