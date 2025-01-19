
import { cconv } from "./color-conv.js"

let rgb     = [0,0,0];

let rgb0 = null;
let hsv1 = null;
let rgb2 = null;
let hsv3 = null;
let hsl4 = null;
let hsv5 = null;
let rgb6 = null;

let rgb0c = null;
let hsv1c = null;
let rgb2c = null;
let hsv3c = null;
let hsl4c = null;
let hsv5c = null;
let rgb6c = null;

let compute = function ()
{
    rgb0.innerHTML = "" + rgb[0]*255 + ", " + rgb[1]*255 + ", " + rgb[2]*255;
    rgb0c.style.backgroundColor = `rgb(${rgb[0]*255} ${rgb[1]*255} ${rgb[2]*255})`;
    
    let hsv1v = cconv.rgb2hsv(rgb);
    hsv1.innerHTML = "" + Math.floor(hsv1v[0]*360) + ", " + Math.floor(hsv1v[1]*100) + ", " + Math.floor(hsv1v[2]*100);
    let hsl1v = cconv.hsv2hsl(hsv1v);
    hsv1c.style.backgroundColor = `hsl(${Math.floor(hsl1v[0]*360)} ${Math.floor(hsl1v[1]*100)}% ${Math.floor(hsl1v[2]*100)}%)`;
    
    let rgb2v = cconv.hsv2rgb(hsv1v);
    rgb2.innerHTML = "" + Math.floor(rgb2v[0]*255) + ", " + Math.floor(rgb2v[1]*255) + ", " + Math.floor(rgb2v[2]*255);
    rgb2c.style.backgroundColor = `rgb(${Math.floor(rgb2v[0]*255)} ${Math.floor(rgb2v[1]*255)} ${Math.floor(rgb2v[2]*255)})`;
    
    let hsv3v = cconv.rgb2hsv(rgb2v);
    hsv3.innerHTML = "" + Math.floor(hsv3v[0]*360) + ", " + Math.floor(hsv3v[1]*100) + ", " + Math.floor(hsv3v[2]*100);
    let hsl3v = cconv.hsv2hsl(hsv3v);
    hsv3c.style.backgroundColor = `hsl(${Math.floor(hsl3v[0]*360)} ${Math.floor(hsl3v[1]*100)}% ${Math.floor(hsl3v[2]*100)}%)`;
    
    let hsl4v = cconv.hsv2hsl(hsv3v);
    hsl4.innerHTML = "" + Math.floor(hsl4v[0]*360) + ", " + Math.floor(hsl4v[1]*100) + ", " + Math.floor(hsl4v[2]*100);
    hsl4c.style.backgroundColor = `hsl(${Math.floor(hsl4v[0]*360)} ${Math.floor(hsl4v[1]*100)}% ${Math.floor(hsl4v[2]*100)}%)`;
    
    let hsv5v = cconv.hsl2hsv(hsl4v);
    hsv5.innerHTML = "" + Math.floor(hsv5v[0]*360) + ", " + Math.floor(hsv5v[1]*100) + ", " + Math.floor(hsv5v[2]*100);
    let hsl5v = cconv.hsv2hsl(hsv5v);
    hsv5c.style.backgroundColor = `hsl(${Math.floor(hsl5v[0]*360)} ${Math.floor(hsl5v[1]*100)}% ${Math.floor(hsl5v[2]*100)}%)`;
    
    let rgb6v = cconv.hsv2rgb(hsv5v);
    rgb6.innerHTML = "" + Math.floor(rgb6v[0]*255) + ", " + Math.floor(rgb6v[1]*255) + ", " + Math.floor(rgb6v[2]*255);
    rgb6c.style.backgroundColor = `rgb(${Math.floor(rgb6v[0]*255)} ${Math.floor(rgb6v[1]*255)} ${Math.floor(rgb6v[2]*255)})`;
};
let set_r = function (rstr)
{
    rgb[0] = parseFloat(rstr) / 255;
    compute();
};
let set_g = function (gstr)
{
    rgb[1] = parseFloat(gstr) / 255;
    compute();
};
let set_b = function (bstr)
{
    rgb[2] = parseFloat(bstr) / 255;
    compute();
};

let init = function ()
{
    document.removeEventListener("DOMContentLoaded", init);
    
    rgb0 = document.getElementById("rgb0");
    hsv1 = document.getElementById("hsv1");
    rgb2 = document.getElementById("rgb2");
    hsv3 = document.getElementById("hsv3");
    hsl4 = document.getElementById("hsl4");
    hsv5 = document.getElementById("hsv5");
    rgb6 = document.getElementById("rgb6");
    
    rgb0c = document.getElementById("rgb0c");
    hsv1c = document.getElementById("hsv1c");
    rgb2c = document.getElementById("rgb2c");
    hsv3c = document.getElementById("hsv3c");
    hsl4c = document.getElementById("hsl4c");
    hsv5c = document.getElementById("hsv5c");
    rgb6c = document.getElementById("rgb6c");
    
    compute();
};

window.set_r = set_r;
window.set_g = set_g;
window.set_b = set_b;

document.addEventListener("DOMContentLoaded", init);
