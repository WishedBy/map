struct light{
    lightPosition: vec3<f32>,
    diffuseStrength: f32,
    ambientIntensity: f32,
}
struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    light: light
};

struct model {
    model: mat4x4<f32>,
};


@binding(0) @group(0) var<uniform> transformer: TransformData;


@binding(1) @group(0) var<storage, read> object: model;

@binding(2) @group(0) var testTexture: texture_2d_array<f32>;
@binding(3) @group(0) var testSampler: sampler;



struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec3<f32>,
    @location(1) pos: vec2<f32>,

};



@vertex
fn vs_main( @location(0) vertexPostion: vec2<f32>) -> Fragment {

    var vpos = vertexPostion;


    var view = transformer.view;
    var projection = transformer.projection;
    var model = object.model;

    var pos = vec4<f32>(0, vpos, 1.0);

    var output = Fragment();
    output.pos = vpos;
    pos = model * pos;
    pos = projection * view * pos;
    output.Position = pos;

    
    output.Color = vec3<f32>(0,1,0);

    return output;
}

struct Output{
	@location(0) color: vec4<f32>,
}

@fragment
fn fs_main(frag: Fragment) ->  Output{
    var output : Output;
    let a = textureSample(testTexture, testSampler, frag.pos, 0);
    output.color = vec4<f32>(frag.Color, a[0]);

    
    return output;
}