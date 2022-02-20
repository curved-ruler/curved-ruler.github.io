
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
//import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cw, ch;

let path     = [];
let pathv    = [];
let pathbuf  = null;
let pathlen  = 10;
let board    = [];
let boardbuf = null;

let bcol      = [0, 0, 0];
let pathcol   = [0.0, 1.0, 1.0];
let boardcol  = [1.0, 1.0, 1.0];

let menu_hidden = false;

let G         = 0.8;
let grava     = Math.PI / 2;
let gravadiff = 50 / (5*50*Math.PI);
let gravs     = 0.1;
let aspect    = 1;
let pix       = 1;
let viewm     = [];
let simulation    = true;
let simulation_id = null;
//let eps = 0.00001;

let make_board = function ()
{
    board.push(-1 + gravs*(Math.cos(grava) + 1), 1 - gravs*(Math.sin(grava)+1)*aspect, 1);
    board.push(-1 + gravs,                       1 - (gravs*aspect), 1);
    
    board.push(-1, -1, 1);
    board.push( 1, -1, 1);
    
    board.push(1, -1, 1);
    board.push(1,  1, 1);
    
    board.push( 1, 1, 1);
    board.push(-1, 1, 1);
    
    board.push(-1,  1, 1);
    board.push(-1, -1, 1);
    
    boardbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boardbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(board), gl.DYNAMIC_DRAW);
};
let update_board = function ()
{
    board[0] = -1 + gravs*(Math.cos(grava)+1);
    board[1] =  1 - gravs*(Math.sin(grava)+1)*aspect;
    gl.bindBuffer(gl.ARRAY_BUFFER, boardbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(board), 0, 2);
};
let make_path = function ()
{
    for (let i=0 ; i<pathlen ; ++i)
    {
        path.push( 0, 0, (pathlen-i)/pathlen);
        pathv.push(0, 0);
    }
    
    pathbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pathbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(path), gl.DYNAMIC_DRAW);
};
let update_path = function ()
{
    for (let i=1 ; i<pathlen ; ++i)
    {
        path[i*3]     = path[(i-1)*3];
        path[i*3 + 1] = path[(i-1)*3 + 1];
        
        pathv[i*2]     = pathv[(i-1)*2];
        pathv[i*2 + 1] = pathv[(i-1)*2 + 1];
    }
    
    
    
    let h = 0.1;
    
    pathv[0] = pathv[2] + h*G*Math.cos(grava);
    pathv[1] = pathv[3] - h*G*Math.sin(grava)*aspect;
    
    path[0] = path[3] + h*pathv[0];
    path[1] = path[4] + h*pathv[1];
    
    
    
    let energy = -0.95;
    
    // x bounce
    if (path[0] >  1) { path[0] =  1; pathv[0] = energy * pathv[0]; }
    else
    if (path[0] < -1) { path[0] = -1; pathv[0] = energy * pathv[0]; }
    // y bounce
    if (path[1] >  1) { path[1] =  1; pathv[1] = energy * pathv[1]; }
    else
    if (path[1] < -1) { path[1] = -1; pathv[1] = energy * pathv[1]; }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pathbuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(path), 0, path.length);
}

let simulate = function ()
{
    grava += gravadiff;
    update_board();
    update_path();
    draw();
};
let toggle_sim = function ()
{
    if (simulation)
    {
        simulation = false;
        window.clearInterval(simulation_id);
    }
    else
    {
        simulation = true;
        simulation_id = window.setInterval(simulate, 45);
    }
};

let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    //compute_matrices();
    gl.uniformMatrix4fv(glprog.vm, true, viewm);
    
    // board
    gl.bindBuffer(gl.ARRAY_BUFFER, boardbuf);
    gl.vertexAttribPointer(glprog.posa, 3, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(glprog.col, boardcol);
    gl.drawArrays(gl.LINES, 0, board.length / 3);
    
    // path
    gl.bindBuffer(gl.ARRAY_BUFFER, pathbuf);
    gl.vertexAttribPointer(glprog.posa, 3, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(glprog.col, pathcol);
    gl.drawArrays(gl.LINE_STRIP, 0, path.length / 3);
};

let handle_key_down = function (event)
{
    if (event.key === "m" || event.key === "M")
    {
        /*
        if (menu_hidden)
        {
            menu_hidden = false;
            document.getElementById("menu").className = "";
        }
        else
        {
            menu_hidden = true;
            document.getElementById("menu").className = "hidden";
        }
        */
    }
    else if (event.key === " ")
    {
        toggle_sim();
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
};

let set_g = function (sval)
{
    //console.log('G', val);
    let val = parseInt(sval);
    G = val / 100;
};
let set_dg = function (sval)
{
    //console.log('DG', val);
    let val = parseInt(sval);
    gravadiff = val / (5*50*Math.PI);
};

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth - 200;
    canvas.height = window.innerHeight;
    cw = canvas.width;
    ch = canvas.height;
    aspect = cw / ch;
    pix = 2 / cw;
    viewm = [
        (cw-40)/cw,    0,       0, 0,
           0,       (ch-40)/ch, 0, 0,
           0,          0,       1, 0,
           0,          0,       0, 1
    ];
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.posa = gl.getAttribLocation(glprog.bin, "posa");
    gl.enableVertexAttribArray(glprog.posa);
    
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    //glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.col     = gl.getUniformLocation(glprog.bin, "col");
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    
    resize();
    make_board();
    make_path();
    draw();
    toggle_sim();
};

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
window.addEventListener("resize", function() { resize(); draw(); });
window.set_g  = set_g;
window.set_dg = set_dg;
