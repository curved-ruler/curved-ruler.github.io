
import { gl_init }    from "./gl_init.js";
import { shaders }    from "./shaders.js";
import { m4, v3, tr } from "./matvec.js";

let gl      = null;
let glprog  = null;
let canvas  = null;
let cwidth, cheight;

let planet = {
    N:     128,
    ready:   0,
    cx:      3,
    cy:      3,
    cells: [...Array(3*3)].map( (i)=>(
        {
            tris:[],   lines:[],  points:[],
            tbuf:null, lbuf:null, pbuf:null
        }) )
};

let funk = false;


let bcol  = [0.2, 0.2, 0.2];
let tcol  = [1.0, 1.0, 1.0];
let alpha = 1.0;
let alpha_dom = null;

let menu_hidden = false;

let obj  = 2;
let proj = 1;
let projmat, modlmat, viewmat;
let scale    = 1;
let grabbed  = 0;


let camh = 1;
let camera = {
    pos   : [0, 0, camh],
    look  : [0.5, 0.5, 0],
    up    : [0, 0, 1],
    near  : 0.1,
    median: 30,
    far   : 1000,
    fovy  : Math.PI / 3,
    aspect: 1,
    
    move_k : 0.1,
    rot_k  : 0.1,
    
    move_ws : 0,
    move_ad : 0,
    
    move_touch : [0, 0],
    look_touch : [0, 0]
};
let cam_constrain = function ()
{
    camera.look = v3.normalize(camera.look);
    
    let up2 = v3.cross(camera.look, camera.up);
    
    camera.up = v3.cross(up2, camera.look);
    camera.up = v3.normalize(camera.up);
};
let cam_move = function ()
{
    if (camera.move_ws)
    {
        camera.pos[0] += camera.look[0] * camera.move_k*camera.move_ws;
        camera.pos[1] += camera.look[1] * camera.move_k*camera.move_ws;
    }
    
    if (camera.move_ad)
    {
        let d = v3.cross(camera.up, camera.look);
        d[2] = 0;
        d = v3.normalize(d);
        camera.pos = v3.add(camera.pos, v3.cmul(d, camera.move_k*camera.move_ad));
    }
    
    let a = camera.move_touch[0]-camera.move_touch[1];
    if (a > 0.01 || a < -0.01)
    {
        camera.pos[0] += camera.look[0] * 0.0005*a;
        camera.pos[1] += camera.look[1] * 0.0005*a;
    }
    
    let b = camera.look_touch[0]-camera.look_touch[1];
    if (b > 0.01 || b < -0.01)
    {
        let zi   = [0, 0, 1];
        let qx = tr.rot(zi, 0.0005*b);
        camera.up   = v3.mmul(qx, camera.up);
        camera.look = v3.mmul(qx, camera.look);
    }
    
    cam_constrain();
};


let compute_matrices = function ()
{
    modlmat = m4.init();
    
    viewmat = tr.view(camera);
    projmat = m4.init();
    if (proj === 0)
    {
        projmat = tr.axon(camera);
    }
    else if (proj === 1)
    {
        projmat = tr.persp(camera);
    }
};

let clamp = function (x, a, b)
{
    if (x < a) return a;
    if (x > b) return b;
    return x;
};

let getheight = function (pos)
{
    let i = clamp(Math.floor(pos[0] / planet.N), 0, planet.cx-1);
    let j = clamp(Math.floor(pos[1] / planet.N), 0, planet.cy-1);
    
    if (planet.cells[j*3+i].tris.length < 1) return 0+camh;
    
    let x = pos[0] - Math.floor(pos[0]/planet.N)*planet.N;
    let y = pos[1] - Math.floor(pos[1]/planet.N)*planet.N;
    
    let k = 2 * ( Math.floor(y) * planet.N + Math.floor(x) );
    let xx = x - Math.floor(x);
    let yy = y - Math.floor(y);
    
    return planet.cells[j*3+i].tris[k*6*3 +    2]    * (1-xx) *   (yy) +
           planet.cells[j*3+i].tris[k*6*3 +  6+2]    * (1-xx) * (1-yy) +
           planet.cells[j*3+i].tris[k*6*3 + 12+2]    *   (xx) * (1-yy) +
           planet.cells[j*3+i].tris[(k+1)*6*3 + 6+2] *   (xx) *   (yy);
};
let cam_pos_h = function ()
{
    let h = getheight(camera.pos);
    camera.pos[2] = h+camh;
};


let fetch_terr = function (name, x, y, pnx)
{
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === 4 && xhr.status === 200)
        {
            let arrayBuffer = xhr.response;
            const view = new DataView(arrayBuffer);
            
            let Nx = view.getUint32(0, true);
            let Ny = view.getUint32(4, true);
            if (Nx != planet.N || Ny != planet.N)
            {
                window.alert("N mismatch: PN-Nx-Ny: " + planet.N + " - " + Nx + " - " + Ny);
                return;
            }
            
            let xoff = x*planet.N;
            let yoff = y*planet.N;
            
            let H  = [...Array((Nx+1)*(Ny+1))];
            let C  = [...Array((Nx+1)*(Ny+1))];
            
            for (let j=0 ; j<=Ny ; ++j)
            for (let i=0 ; i<=Nx ; ++i)
            {
                H[j*(Nx+1)+i] = view.getFloat32(8+(j*(Nx+1)+i)*4, true);
            }
            for (let j=0 ; j<=Ny ; ++j)
            for (let i=0 ; i<=Nx ; ++i)
            { 
                C[j*(Nx+1)+i] = view.getUint32(8+(Nx+1)*(Ny+1)*4+(j*(Nx+1)+i)*4, true);
            }
            for (let j=0 ; j<Ny ; ++j)
            for (let i=0 ; i<Nx ; ++i)
            {
                let col = C[j*(Nx+1)+i];
                let a = col % 256;
                col = Math.floor((col-a)/256);
                let b = col % 256;
                col = Math.floor((col-b)/256);
                let g = col % 256;
                col = Math.floor((col-g)/256);
                let r = col % 256;
                
                planet.cells[y*pnx+x].tris.push(xoff+i,   yoff+j+1, H[(j+1)*(Nx+1)+i],   r/255, g/255, b/255);
                planet.cells[y*pnx+x].tris.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255);
                planet.cells[y*pnx+x].tris.push(xoff+i+1, yoff+j,   H[(j  )*(Nx+1)+i+1], r/255, g/255, b/255);
             
                planet.cells[y*pnx+x].tris.push(xoff+i+1, yoff+j,   H[(j  )*(Nx+1)+i+1], r/255, g/255, b/255);
                planet.cells[y*pnx+x].tris.push(xoff+i+1, yoff+j+1, H[(j+1)*(Nx+1)+i+1], r/255, g/255, b/255);
                planet.cells[y*pnx+x].tris.push(xoff+i,   yoff+j+1, H[(j+1)*(Nx+1)+i],   r/255, g/255, b/255);
                
                planet.cells[y*pnx+x].lines.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255);
                planet.cells[y*pnx+x].lines.push(xoff+i+1, yoff+j,   H[(j  )*(Nx+1)+i+1], r/255, g/255, b/255);
                
                planet.cells[y*pnx+x].lines.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255);
                planet.cells[y*pnx+x].lines.push(xoff+i,   yoff+j+1, H[(j+1)*(Nx+1)+i],   r/255, g/255, b/255);
                
                //planet.cells[y*pnx+x].points.push(xoff+i,   yoff+j,   H[(j  )*(Nx+1)+i],   r/255, g/255, b/255);
            }
            
            //console.log("H", H);
            
            planet.cells[y*pnx+x].tbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[y*pnx+x].tbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planet.cells[y*pnx+x].tris),  gl.STATIC_DRAW);
            
            planet.cells[y*pnx+x].lbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[y*pnx+x].lbuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planet.cells[y*pnx+x].lines), gl.STATIC_DRAW);
            
            //planet.cells[y*pnx+x].pbuf = gl.createBuffer();
            //gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[y*pnx+x].pbuf);
            //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planet.cells[y*pnx+x].points), gl.STATIC_DRAW);
            
            ++planet.ready;
        }
    }
    xhr.open('GET', name, true);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
};

let make_planet = function ()
{
    planet.ready = 0;
    for (let i=0 ; i<planet.cx*planet.cy ; ++i)
    {
        planet.cells[i].tris   = [];
        planet.cells[i].lines  = [];
        //planet.cells[i].points = [];
        if (planet.cells[i].tbuf)
        {
            gl.deleteBuffer(planet.cells[i].tbuf);
            gl.deleteBuffer(planet.cells[i].lbuf);
            //gl.deleteBuffer(planet.cells[i].pbuf);
            planet.cells[i].tbuf = null;
            planet.cells[i].lbuf = null;
            //planet.cells[i].pbuf = null;
        }
    }
    
    let pldir = funk ? 'plfunk' : 'pl';
    fetch_terr(pldir + '/terr_ds_0_0.terr', 0, 0, planet.cx);
    fetch_terr(pldir + '/terr_ds_0_1.terr', 1, 0, planet.cx);
    fetch_terr(pldir + '/terr_ds_0_2.terr', 2, 0, planet.cx);
    fetch_terr(pldir + '/terr_ds_1_0.terr', 0, 1, planet.cx);
    fetch_terr(pldir + '/terr_ds_1_1.terr', 1, 1, planet.cx);
    fetch_terr(pldir + '/terr_ds_1_2.terr', 2, 1, planet.cx);
    fetch_terr(pldir + '/terr_ds_2_0.terr', 0, 2, planet.cx);
    fetch_terr(pldir + '/terr_ds_2_1.terr', 1, 2, planet.cx);
    fetch_terr(pldir + '/terr_ds_2_2.terr', 2, 2, planet.cx);
}


let draw = function ()
{
    if (!gl || !glprog.bin) return;
    
    gl.useProgram(glprog.bin);
    
    if (alpha < 0.98)
    {
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    else
    {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    }
    
    gl.clearColor(bcol[0], bcol[1], bcol[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    compute_matrices();
    
    gl.uniformMatrix4fv(glprog.p,  true, projmat);
    gl.uniformMatrix4fv(glprog.vm, true, m4.mul(viewmat, modlmat));
    gl.uniform1i(glprog.proj, proj);
    gl.uniform1f(glprog.aspect, camera.aspect);
    gl.uniform1f(glprog.alpha, alpha);
    
    for (let i=0 ; i<9 ; ++i)
    {
        if (planet.cells[i].lbuf !== null)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[i].lbuf);
            gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 6*4, 0*4);
            gl.vertexAttribPointer(glprog.col, 3, gl.FLOAT, false, 6*4, 3*4);
            gl.uniform1i(glprog.sahded, 0);
            gl.drawArrays(gl.LINES, 0, planet.cells[i].lines.length / 6);
        }
        
        if (obj === 2 && planet.cells[i].tbuf !== null)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, planet.cells[i].tbuf);
            gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 6*4, 0*4);
            gl.vertexAttribPointer(glprog.col, 3, gl.FLOAT, false, 6*4, 3*4);
            gl.uniform1i(glprog.sahded, 1);
            
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(1, 1);
            //gl.drawElements(gl.TRIANGLES, model.tris.length, gl.UNSIGNED_INT, 0);
            gl.drawArrays(gl.TRIANGLES, 0, planet.cells[i].tris.length / 6);
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
    }
};


let handle_mouse_down = function (event)
{
    grabbed = 1;
};
let handle_mouse_up = function (event)
{
    grabbed = 0;
};

let handle_mouse_move = function (event)
{
    if (grabbed === 1)
    {
        let zi   = [0, 0, 1];
        let left = v3.cross(camera.up, camera.look);
        let qx = tr.rot(zi,   -camera.rot_k*event.movementX);
        let qy = tr.rot(left,  camera.rot_k*event.movementY);
        
        let nu = v3.mmul(qy, camera.up);
        let nl = v3.mmul(qy, camera.look);
        
        if (nu[2] > 0.001)
        {
            camera.up   = nu;
            camera.look = nl;
        }
        
        camera.up   = v3.mmul(qx, camera.up);
        camera.look = v3.mmul(qx, camera.look);
        
        cam_constrain();
    }
};
let handle_key_up = function (event)
{
    if (event.key === "w" || event.key === "W")
    {
        camera.move_ws = 0;
    }
    else if (event.key === "s" || event.key === "S")
    {
        camera.move_ws = 0;
    }
    else if (event.key === "a" || event.key === "A")
    {
        camera.move_ad = 0;
    }
    else if (event.key === "d" || event.key === "D")
    {
        camera.move_ad = 0;
    }
};
let handle_key_down = function (event)
{
    if (event.key === "m" || event.key === "M")
    {
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
    }
    else if (event.key === "i" || event.key === "I")
    {
        ++proj;
        if (proj > 2) { proj = 0; }
    }
    else if (event.key === "o" || event.key === "O")
    {
        ++obj;
        if (obj > 2) { obj = 1; }
    }
    else if (event.key === "F8")
    {
        let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href=image;
    }
    
    else if (event.key === "f" || event.key === "F")
    {
        funk = !funk;
        make_planet();
    }
    
    
    else if (event.key === "w" || event.key === "W")
    {
        camera.move_ws = 1;
    }
    else if (event.key === "s" || event.key === "S")
    {
        camera.move_ws = -1;
    }
    else if (event.key === "a" || event.key === "A")
    {
        camera.move_ad = 1;
    }
    else if (event.key === "d" || event.key === "D")
    {
        camera.move_ad = -1;
    }
};

let touchstart = function (event)
{
    if (event.touches.length === 1)
    {
        camera.look_touch = [event.touches[0].pageX, event.touches[0].pageX];
        camera.move_touch = [event.touches[0].pageY, event.touches[0].pageY];
    }
};
let touchend = function (event)
{
    camera.look_touch = [0, 0];
    camera.move_touch = [0, 0];
};
let touchcancel = function (event)
{
    camera.look_touch = [0, 0];
    camera.move_touch = [0, 0];
};
let touchmove = function (event)
{
    if (event.touches.length === 1)
    {
        camera.look_touch[1] = event.touches[0].pageX;
        camera.move_touch[1] = event.touches[0].pageY;
    }
};

let set_alpha = function (strval)
{
    alpha = parseFloat(strval);
    alpha_dom.blur();
};

let tick = function (timestamp)
{
    cam_move();
    cam_pos_h();
    draw();
    
    window.requestAnimationFrame(tick);
};

let resize = function ()
{
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cwidth  = canvas.width;
    cheight = canvas.height;
    camera.aspect = cwidth / cheight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};

let gpu_init = function (canvas_id)
{
    gl = gl_init.get_webgl2_context(canvas_id);
    
    glprog = gl_init.create_glprog(gl, shaders.version + shaders.vs, shaders.version + shaders.precision + shaders.fs);
    
    glprog.pos = gl.getAttribLocation(glprog.bin, "pos");
    gl.enableVertexAttribArray(glprog.pos);
    glprog.col = gl.getAttribLocation(glprog.bin, "col");
    gl.enableVertexAttribArray(glprog.col);
    
    glprog.p       = gl.getUniformLocation(glprog.bin, "p");
    glprog.vm      = gl.getUniformLocation(glprog.bin, "vm");
    glprog.proj    = gl.getUniformLocation(glprog.bin, "proj");
    glprog.aspect  = gl.getUniformLocation(glprog.bin, "aspect");
    glprog.alpha   = gl.getUniformLocation(glprog.bin, "alpha");
    glprog.shaded  = gl.getUniformLocation(glprog.bin, "shaded");
}

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    gpu_init('canvas');
    
    canvas.addEventListener("mousedown", handle_mouse_down);
    canvas.addEventListener("mouseup",   handle_mouse_up);
    canvas.addEventListener("mousemove", handle_mouse_move);
    
    canvas.addEventListener("touchstart",  touchstart);
    canvas.addEventListener("touchend",    touchend);
    canvas.addEventListener("touchcancel", touchcancel);
    canvas.addEventListener("touchmove",   touchmove);
    
    alpha_dom = document.getElementById('alpha');
    let opts = alpha_dom.options;
    for (let i=0 ; i<opts.length ; ++i)
    {
        if (opts[i].value == alpha) { opts.selectedIndex = i; }
    }
    
    resize();
    
    make_planet();
};


window.set_alpha = set_alpha;
window.proj_toggle = function () { ++proj; if (proj > 2) { proj = 1; } };
window.obj_toggle  = function () { ++obj; if (obj > 2) { obj = 1; } };
window.funk_toggle = function () { funk = !funk; make_planet(); };

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", handle_key_down);
document.addEventListener("keyup",   handle_key_up);
window.addEventListener("resize", function() { resize(); draw(); });

window.requestAnimationFrame(tick);
