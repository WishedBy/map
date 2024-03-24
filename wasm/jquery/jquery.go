//go:build js && wasm

package jquery

import "syscall/js"

func GetElements(selector string) js.Value {
	return js.Global().Call("jQuery", selector)
}

func GetFirstElement(selector string) js.Value {
	return js.Global().Call("jQuery", selector).Index(0)
}

func AppendElement(intoSelector string, newElements ...string) js.Value {
	elements := make([]any, len(newElements))
	for i, v := range newElements {
		elements[i] = v
	}
	return js.Global().Call("jQuery", intoSelector).Call("append", elements...)
}
