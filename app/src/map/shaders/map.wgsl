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
    var m1 = 0.0;
    var m2 = 0.0;
    var phase = 0.0;
    if(m <= 0.5){
        m1 = (m*2);
    }else{
        m1 = 1;
        m2 = (m*2)-1;
    }
    
    var lon = vertexPostion[1];
    var lat = vertexPostion[2];

    // test cylinder
    var x = r*cos(lon)*m1*(1-m2) + r*cos(lat)*cos(lon)*m2;
    var y = r*sin(lon)*m1*(1-m2) + r*cos(lat)*sin(lon)*m2;
    var z = (1-m2)*lat + r*sin(lat)*m2;
    
    
    x *= m;
    y = ((1-m2)*lon) + (m2*y);
    // z = ((1-m)*lat) + (m*z);


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