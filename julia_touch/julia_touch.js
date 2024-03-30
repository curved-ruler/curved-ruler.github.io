
let get_context = function (canvas_id)
{
    let canvas = document.getElementById(canvas_id);
    let glc;
    if (!canvas)
    {
        console.error('No <canvas> with id: ' + canvas_id);
        return null;
    }
    try
    {
        glc = canvas.getContext('webgl');
    }
    catch (e)
    {
        console.error('Error creating WebGL Context!: ' + e.toString());
    }
    if (!glc)
    {
        console.error('NO GL');
    }
    
    return glc;
};

let get_context_2 = function (canvas_id)
{
    let canvas = document.getElementById(canvas_id);
    let glc2;
    if (!canvas)
    {
        console.error('No <canvas> with id: ' + canvas_id);
        return null;
    }
    try
    {
        glc2 = canvas.getContext('webgl2');
    }
    catch (e)
    {
        console.error('Error creating WebGL 2.0 Context!: ' + e.toString());
    }
    if (!glc2)
    {
        console.error('NO GL');
    }
    
    return glc2;
};

let compile_shader = function (gl, str, type)
{ 
    let shader = gl.createShader(type);
    
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        console.error('Error while compiling shader: ' + gl.getShaderInfoLog(shader));
        window.alert('Error while compiling shader:\n' + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
};

let create_vf_program = function (gl, vs_str, fs_str)
{
    let vfp = { glprog : gl.createProgram() };
    
    vfp.vs = compile_shader(gl, vs_str, gl.VERTEX_SHADER);
    gl.attachShader(vfp.glprog, vfp.vs);
            
    vfp.fs = compile_shader(gl, fs_str, gl.FRAGMENT_SHADER);
    gl.attachShader(vfp.glprog, vfp.fs);
    
    gl.linkProgram(vfp.glprog);
    
    if (!gl.getProgramParameter(vfp.glprog, gl.LINK_STATUS))
    {
        console.error('Error while linking program: ' + getProgramInfoLog());
        window.alert('Error while linking program:\n' + getProgramInfoLog());
    }
    
    return vfp;
};

let glprog = {
    get_context       : get_context,
    get_context_2     : get_context_2,
    create_vf_program : create_vf_program
};

let vs = `\
#version 300 es

layout(location = 0) in vec2  pos;

void main ()
{
    gl_Position = vec4(pos, 0.0, 1.0);
}
`;

let fs = `\
#version 300 es
precision highp float;

uniform vec4 tr;
uniform vec2 mouse;
out vec4 color;

// HSV to RGB by Inigo Quilez https://www.shadertoy.com/view/lsS3Wc
vec3 hsv2rgb (in vec3 c)
{
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}
// Mandelbrot
float mand(in float x, in float y)
{
    vec2 z = vec2(0.0);
    int i = 0;
    int n = 100;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + x, 2.0*z.x*z.y + y);
        if (length(z) > 2.0) break;
    }
    return (float(i)/float(n));
}
// Julia
vec3 col(in float x, in float y)
{
    vec2 z = vec2(x,y);
    vec2 c = vec2(mouse.x, mouse.y);
    int i = 0;
    int n = 500;
    for (i=0 ; i<n ; ++i)
    {
        z = vec2(z.x*z.x - z.y*z.y + c.x, 2.0*z.x*z.y + c.y);
        if (length(z) > 2.0) break;
    }
    float t = fract(float(i) / float(n) * 2.0);
    return hsv2rgb(vec3(0.1, 0.9, t)) + vec3(0.1*mand(x,y));
}

void main()
{
    float x = tr.x * gl_FragCoord.x + tr.y;
    float y = tr.z * gl_FragCoord.y + tr.w;
    color = vec4(col(x, y), 1.0);
}
`;


//***************************************************
//***************************************************
//***************************************************

let gl     = null;
let shader = null;
let canvas = null;
let params = null;
let cwidth, cheight;

let pan0      = { x:0.0,  y:0.0,  zoom:1.0 };
let pos       = { x:0.0,  y:0.0 };
let mouse_pos = { x:0.0,  y:0.0 };
let mouse_dom = { x:null, y:null };
let tr = [1,0,1,0];
let scale = 2.5;
let grabbed = 0;
let mouse_param = true;
let screen_quad_buffer = null;
let start_func = "";
let menu_hidden = false;



let make_quad = function ()
{
    let screen_quad = [
        -1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0,
        
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
    ];
    
    screen_quad_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screen_quad_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screen_quad), gl.STATIC_DRAW);
};

let draw = function ()
{
    if (!gl) return;
    if (!shader) return;
    gl.useProgram(shader.glprog);
    
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    tr = [scale/cheight, -(cwidth*scale)/(cheight*2.0)-pos.x, scale/cheight, -scale/2.0+pos.y];
    //console.log("TR", tr);
    gl.uniform4fv(shader.tr, tr);
    gl.uniform2f(shader.mouse, mouse_pos.x, mouse_pos.y);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, screen_quad_buffer);
    gl.vertexAttribPointer(shader.pos, 2, gl.FLOAT, false, 0*4, 0*4);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};




//let zoomin  = function () { scale *= 0.8; };
//let zoomout = function () { scale *= 1.25;  };
let start_zoom = function (z) { pan0.zoom = z; }
let zoom = function (z) { scale /= z/pan0.zoom; pan0.zoom = z; };
let start_pan = function (x, y)
{
    pan0.x = x;
    pan0.y = y;
};
let pan = function (x, y)
{
    let a = ( scale/cheight ) / window.devicePixelRatio;
    pos.x += (x-pan0.x) * a;
    pos.y += (y-pan0.y) * a;
    pan0.x = x;
    pan0.y = y;
    draw();
};

let setparam = function (x, y)
{
    mouse_pos.x = tr[0] * x + tr[1];
    mouse_pos.y = tr[2] * (cheight-y) + tr[3];
    params.textContent = "(" + mouse_pos.x + ", " + mouse_pos.y + ")";
    draw();
};

let touchstart = function (event)
{
    event.preventDefault();
    if (event.touches.length === 1)
    {
        if (mouse_param)
        {
            setparam(event.touches[0].pageX, event.touches[0].pageY);
            draw();
        }
        else
        {
            start_pan(event.touches[0].pageX, event.touches[0].pageY);
        }
    }
    else if (event.touches.length === 2)
    {
        if (!mouse_param)
        {
            start_zoom(Math.sqrt((event.touches[0].pageX-event.touches[1].pageX) *
                                 (event.touches[0].pageX-event.touches[1].pageX) +
                                 (event.touches[0].pageY-event.touches[1].pageY) *
                                 (event.touches[0].pageY-event.touches[1].pageY)));
        }
    }
};
let touchend = function (event)
{
    event.preventDefault();
};
let touchcancel = function (event)
{
    event.preventDefault();
};
let touchmove = function (event)
{
    event.preventDefault();
    if (!mouse_param)
    {
    
    if (event.touches.length === 1)
    {
        pan(event.touches[0].pageX, event.touches[0].pageY);
        draw();
    }
    else if (event.touches.length === 2)
    {
        zoom(Math.sqrt((event.touches[0].pageX-event.touches[1].pageX) *
                       (event.touches[0].pageX-event.touches[1].pageX) +
                       (event.touches[0].pageY-event.touches[1].pageY) *
                       (event.touches[0].pageY-event.touches[1].pageY)));
        draw();
    }
    
    }
};

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let create_shader = function ()
{
    shader = glprog.create_vf_program(gl, vs, fs);
        
    shader.pos = gl.getAttribLocation(shader.glprog, "pos");
    gl.enableVertexAttribArray(shader.pos);
    
    shader.tr    = gl.getUniformLocation(shader.glprog, "tr");
    shader.mouse = gl.getUniformLocation(shader.glprog, "mouse");
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    params = document.getElementById('params');
    canvas = document.getElementById('canvas');
    gl     = glprog.get_context_2('canvas');
    canvas.addEventListener("touchstart",  touchstart);
    canvas.addEventListener("touchend",    touchend);
    canvas.addEventListener("touchcancel", touchcancel);
    canvas.addEventListener("touchmove",   touchmove);
    
    resize();
    make_quad();
    create_shader();
    draw();
};



let freeze = function ()
{
    if (mouse_param)
    {
        mouse_param = false;
        document.getElementById("freeze").style.backgroundColor = '#55c';
    }
    else
    {
        mouse_param = true;
        document.getElementById("freeze").style.backgroundColor = '#aaa';
    }
};
window.freeze = freeze;

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", function() { resize(); draw(); });

