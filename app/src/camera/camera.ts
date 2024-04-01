import { vec3, mat4 } from "gl-matrix";

export class Camera {
    view:mat4;
    position: vec3
    direction: vec3
    pitch: vec3

    constructor(position: vec3, direction: vec3, pitch: vec3) {
        this.position = position;
        this.direction = direction;
        this.pitch = pitch;
        this.view = mat4.create();
        this.update()
    }

    update() {
        mat4.lookAt(this.view, this.position, this.direction, this.pitch);
    }

    getView(): mat4 {
        return this.view;
    }
}