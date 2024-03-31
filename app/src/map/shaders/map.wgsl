struct TransformData {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    animationMod: f32,
    r: f32,
};
@binding(0) @group(0) var<uniform> transformer: TransformData;
@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>,
};

@vertex
fn vs_main(@location(0) vertexPostion: vec3<f32>, @location(1) vertexTexCoord: vec2<f32>) -> Fragment {
    var m = transformer.animationMod;
    var r = transformer.r;
    // r += rmod;
    
    var lon = vertexPostion[1];
    var lat = vertexPostion[2];
    // z = up down
    var x = r*cos(lat)*cos(lon);
    var y = r*cos(lat)*sin(lon);
    var z = r*sin(lat);

    // test cylinder
    z = lat;
    x = r*cos(lon);
    y = r*sin(lon);
    // so when splitting the animation in half, first do the cilinder, then keeping that value, and addition for y*sin(lon) and z*sin(lat)? i think?
    
    x = m*x;
    y = ((1-m)*lon) + (m*y);
    z = ((1-m)*lat) + (m*z);


    var pos = transformer.model * vec4<f32>(x, y, z, 1.0); // after rotation

    var output : Fragment;
    output.Position = transformer.projection * transformer.view * pos;
    output.TexCoord = vertexTexCoord;

    return output;
}

@fragment
fn fs_main(@location(0)  TexCoord : vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(myTexture, mySampler, TexCoord);
}