import { vec3, mat4 } from "gl-matrix";

export class Camera {
    view:mat4;
    position: vec3
    direction: vec3
    up: vec3

    constructor(position: vec3, direction: vec3, up: vec3) {
        this.position = position;
        this.direction = direction;
        this.up = up;
        this.view = mat4.create();
        this.update()
    }

    update() {
        mat4.lookAt(this.view, this.position, this.direction, this.up);
    }

    getView(): mat4 {
        return this.view;
    }
}