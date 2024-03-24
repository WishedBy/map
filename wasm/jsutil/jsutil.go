//go:build js && wasm

package jsutil

import (
	"fmt"
	"syscall/js"
)

func Await(awaitable js.Value) ([]js.Value, error) {
	then := make(chan []js.Value)
	defer close(then)
	thenFunc := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		then <- args
		return nil
	})
	defer thenFunc.Release()

	catch := make(chan []js.Value)
	defer close(catch)
	catchFunc := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		catch <- args
		return nil
	})
	defer catchFunc.Release()

	awaitable.Call("then", thenFunc).Call("catch", catchFunc)

	select {
	case result := <-then:
		return result, nil
	case err := <-catch:

		return nil, ErrsJSToError(err...)
	}
}

func ErrsJSToError(errs ...js.Value) error {
	if len(errs) == 0 {
		return nil
	}
	return fmt.Errorf("%s", errs)
}

func ConsoleErr(err error) {
	if err == nil {
		return
	}
	js.Global().Get("console").Call("error", fmt.Sprintf("%+v", err))
}

func ConsoleLog(in ...any) {
	js.Global().Get("console").Call("log", in...)
}
