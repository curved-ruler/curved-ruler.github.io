
import { cconv } from "./color-conv.js"

let canvas  = null;
let context = null;
let VN      = 100;
let voronoi = [];

let colsdiv = null;
let cols    = [];
let colshsv = [];
let activecol = 0;

let wheel = null;
let wheelsize = 0;
let wheelclick = function (e)
{
    //console.log("E", e);
    let x = e.layerX - wheelsize/2;
    let y = wheelsize - e.layerY - wheelsize/2;
    let angle = Math.atan2(x,y) *180/Math.PI;
    angle = 360 - Math.floor(angle);
    //console.log("WA", angle);
    
    colshsv[activecol*3] = angle;
    let s = colshsv[activecol*3 + 1];
    let v = colshsv[activecol*3 + 2];
    
    let hsl = cconv.hsv2hsl([angle,s,v]);
    cols[activecol].style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
    
    draw();
};

let sets = function (sstr)
{
    let s = parseFloat(sstr)/100;
    let h = colshsv[activecol*3];
    colshsv[activecol*3 + 1] = s;
    let v = colshsv[activecol*3 + 2];
    
    let hsl = cconv.hsv2hsl([h,s,v]);
    //console.log("hsv", [h,s,v], "hsl", hsl);
    cols[activecol].style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
    
    draw();
};
let setv = function (vstr)
{
    let v = parseFloat(vstr)/100;
    let h = colshsv[activecol*3];
    let s = colshsv[activecol*3 + 1];
    colshsv[activecol*3 + 2] = v;
    
    let hsl = cconv.hsv2hsl([h,s,v]);
    //console.log("hsv", [h,s,v], "hsl", hsl);
    cols[activecol].style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
    
    draw();
};

let addcolor = function ()
{
    if (cols.length >= 50) return;
    
    const div   = document.createElement("div");
    div.id = "c" + cols.length + "div";
    
    const sphue =  document.createElement("span");
    sphue.id = "h" + cols.length;
    sphue.className = "col";
    sphue.onclick = (e) => { activecol = parseInt(e.target.id.substr(1)); };
    div.appendChild(sphue);
    
    const ins =  document.createElement("input");
    ins.id   = "s" + cols.length; 
    ins.type = "range";
    ins.min  = 0;
    ins.max  = 100;
    ins.value = 90;
    ins.onclick = (e) => { activecol = parseInt(e.target.id.substr(1)); sets(e.target.value); }
    div.appendChild(ins);
    
    const inv =  document.createElement("input");
    inv.id   = "v" + cols.length; 
    inv.type = "range";
    inv.min  = 0;
    inv.max  = 100;
    inv.value = 90;
    inv.onclick = (e) => { activecol = parseInt(e.target.id.substr(1)); setv(e.target.value); }
    div.appendChild(inv);
    
    colsdiv.appendChild(div);
    
    cols.push(div);
    colshsv.push(0, 0.9, 0.9);
    activecol = cols.length-1;
    
    setv("90");
};

let resize = function ()
{
    if (!canvas) return;
    
    canvas.width = Math.floor( window.innerWidth / 2 );
    canvas.height = window.innerHeight;
    
    init_voronoi();
};

let init_voronoi = function ()
{
    for (let i=0 ; i<VN ; ++i)
    {
        voronoi.push(Math.random() * (canvas.width  - 20) + 10,
                     Math.random() * (canvas.height - 20) + 10);
    }
};

let draw = function ()
{
    let pix = 2;
    
    for (let y = 0 ; y < canvas.height ; y += pix)
    for (let x = 0 ; x < canvas.width  ; x += pix)
    {
        let d  = 10000;
        let vi = 0;
        for (let i=0 ; i<VN ; ++i)
        {
            let di = Math.sqrt((x-voronoi[i*2])*(x-voronoi[i*2]) + (y-voronoi[i*2+1])*(y-voronoi[i*2+1]));
            if (di < d)
            {
                d = di;
                vi = i;
            }
        }
        let ci = vi % cols.length;
        let c = [ colshsv[ci*3], colshsv[ci*3+1], colshsv[ci*3+2] ];
        let hsl = cconv.hsv2hsl(c);
        context.fillStyle = `hsl(${hsl[0]}, ${hsl[1]*100}%, ${hsl[2]*100}%)`;
        context.fillRect( x, y, pix, pix );
    }
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    
    wheel = document.getElementById("wheel");
    wheelsize = wheel.offsetWidth;
    wheel.addEventListener("click", wheelclick);
    
    colsdiv = document.getElementById("colsdiv");
    //cols.push( document.getElementById("c0") );
    
    addcolor();
    
    resize();
    draw();
};

window.addcolor = addcolor;

window.addEventListener("resize", function() { resize(); draw(); });

document.addEventListener("DOMContentLoaded", init);
