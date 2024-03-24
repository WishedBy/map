@vertex
fn vert(
    @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4f {
    var pos = array<vec2f, 3>(
        vec2(0.0, 0.5),
        vec2(-0.5, -0.5),
        vec2(0.5, -0.5)
    );

    return vec4f(pos[VertexIndex], 0.0, 1.0);
}

@fragment
fn frag() -> @location(0) vec4f {
    return vec4(1.0, 0.0, 0.0, 1.0);
}