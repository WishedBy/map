//go:build js && wasm

package webgpu

import (
	"map/jsutil"
	"syscall/js"

	"github.com/pkg/errors"
)

type GPU struct {
	js.Value
}

type Device struct {
	js.Value
}

var UnexpectedLengthErr = "Unexpected length"

func NewUnexpectedLengthErr() error {
	return errors.New(UnexpectedLengthErr)
}

func GetGPU() GPU {
	return GPU{js.Global().Get("navigator").Get("gpu")}
}

func (g GPU) GetDevice() (*Device, error) {
	adapter, err := jsutil.Await(g.Call("requestAdapter"))
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if len(adapter) != 1 {
		return nil, NewUnexpectedLengthErr()
	}

	device, err := jsutil.Await(adapter[0].Call("requestDevice"))
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if len(device) != 1 {
		return nil, NewUnexpectedLengthErr()
	}
	return &Device{device[0]}, nil
}
