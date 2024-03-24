//go:build js && wasm

package main

import (
	"map/jquery"
	"map/jsutil"
	"map/webgpu"
	"syscall/js"

	"embed"
)

//go:embed webgpu/assets/wgsl
var wgslF embed.FS

func frame(device webgpu.Device, context js.Value, pipeline js.Value) {
	commandEncoder := device.Call("createCommandEncoder")
	textureView := context.Call("getCurrentTexture").Call("createView")
	renderPassDescriptor := map[string]any{
		"colorAttachments": []any{
			map[string]any{
				"view":       textureView,
				"clearValue": map[string]any{"r": 0.0, "g": 0.0, "b": 0.0, "a": 1.0},
				"loadOp":     "clear",
				"storeOp":    "store",
			},
		},
	}
	passEncoder := commandEncoder.Call("beginRenderPass", renderPassDescriptor)
	passEncoder.Call("setPipeline", pipeline)
	passEncoder.Call("draw", 3)
	passEncoder.Call("end")
	device.Get("queue").Call("submit", []any{commandEncoder.Call("finish")})
	js.Global().Call("requestAnimationFrame", js.FuncOf(func(this js.Value, args []js.Value) any { frame(device, context, pipeline); return nil }))

}
func main() {

	jquery.AppendElement("body", `<canvas id="mainCanvas" />`)
	canvas := jquery.GetFirstElement("#mainCanvas")
	dpr := js.Global().Get("window").Get("devicePixelRatio").Int()
	ch := js.Global().Get("window").Get("innerHeight").Int()
	cw := js.Global().Get("window").Get("innerWidth").Int()
	canvas.Set("width", cw*dpr)
	canvas.Set("height", ch*dpr)
	context := canvas.Call("getContext", "webgpu")
	gpu := webgpu.GetGPU()
	device, err := gpu.GetDevice()
	if err != nil {
		panic(err)
	}
	presentationFormat := gpu.Call("getPreferredCanvasFormat")
	context.Call("configure", map[string]any{
		"device":    device.Value,
		"format":    presentationFormat,
		"alphaMode": "premultiplied",
	})

	testShaderB, err := wgslF.ReadFile("webgpu/assets/wgsl/test.wgsl")
	if err != nil {
		panic(err)
	}
	testShader := device.Call("createShaderModule", map[string]any{
		"code": string(testShaderB),
	})

	pipeline := device.Call("createRenderPipeline", map[string]any{
		"layout": "auto",
		"vertex": map[string]any{
			"module": testShader,
		},
		"fragment": map[string]any{
			"module": testShader,
			"targets": []any{
				map[string]any{"format": presentationFormat},
			},
		},
		"primitive": map[string]any{"topology": "triangle-list"},
	})
	js.Global().Call("requestAnimationFrame", js.FuncOf(func(this js.Value, args []js.Value) any { frame(*device, context, pipeline); return nil }))

	jsutil.ConsoleLog(context)
	jsutil.ConsoleLog(cw, ch)

	cc := make(chan struct{})
	<-cc
}
