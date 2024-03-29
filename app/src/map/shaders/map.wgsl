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
    var r = transformer.r;
    var m = transformer.animationMod;
    r = 1.0;
    var lon = vertexPostion[1];
    var lat = vertexPostion[2];
    var x = r*cos(lat)*cos(lon);
    x = 0 + (m*x);
    
    var y = r*cos(lat)*sin(lon);
    y = ((1-m)*lon) + (m*y);
    var z = r*sin(lat);
    z = ((1-m)*lat) + (m*z);
    var pos = vec3<f32>(x, y, z);

    var output : Fragment;
    output.Position = transformer.projection * transformer.view * transformer.model * vec4<f32>(pos, 1.0);
    output.TexCoord = vertexTexCoord;

    return output;
}

@fragment
fn fs_main(@location(0)  TexCoord : vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(myTexture, mySampler, TexCoord);
}