
import os

folders = [
    ["objector", "3d objects and perspectives",
           "Ways of displaying 3D objects in 2D. Axonometry, Perspective, 6 point perspective (or 360° fisheye): (x,y,z)=>(x2,y2) \
            And there is cyclography, too. Try: <a href='../webgl-sketches/objector/objector.html'>Objector</a>"],
    ["eq", "Equation plotter",
           "Started as an equation plotter, now is a 2d playground. Try: <a href='../webgl-sketches/eq/eq.html'>Eq plotter</a>"],
    ["eq_frac", "Fractals",
           "Fractals created with the above playground. For easier Julia program try: <a href='../julia/julia2.html'>Juila</a>"],
    ["marching", "Marching Cubes",
           "F(x, y, z) = S, Triangulization with marching cubes. Try: \
            <a href='../webgl-sketches/marching/mc.html'>Marching Cubes</a>"],
    ["midpoints", "Midpoints",
           "Takes a curve a plane, creates unordered pairs of all points in the curve, and new point location is the midpoint, \
            elevation is the distance. <a href='../webgl-sketches/midpoints/gorbincs-felho.html'>Midpoints</a>"],
    ["spiro3", "3d spirograph",
           "Sphere rolls on sphere <a href='../webgl-sketches/spiro3/spiro3.html'>Spiro3</a>"],
    ["sphere4d", "4d rotating sphere",
           "This <a href='https://mathcatalog.tumblr.com/post/89572389754/xysciences-projection-of-a-double-spiral-on-a'>gif</a> \
            is around for a while: stereographic projection of a spiral on a sphere. I had an idea to step up a dimension, \
            4d hypersphere projected onto 3d space. Obviously I don't see in 4d, and could made mistakes, \
            but this program is the result. Try: <a href='../webgl-sketches/sphere4d/sphere4d.html'>Sphere in 4D</a>"],
    ["parametric", "Parametric surfaces",
           "(u,v)=>(x,y,z) Try: <a href='../webgl-sketches/parametric/parametric.html'>Parametric surfaces</a>"],
    ["times", "Times",
           "Times diagram described in a Mathologer video <a href='https://www.youtube.com/watch?v=qhbuKbxJsk8'>here</a> \
            Try: <a href='../webgl-sketches/times/times.html'>Times</a>"],
    ["voronoi", "Voronoi",
           "Voronoi diagram with interactive distance function. Try: <a href='../webgl-sketches/voronoi2/voronoi2.html'>Voronoi</a>"],
    ["bugs", "Bugs",
           "Bugs following each other. 1st -> 2nd, 2nd -> 3rd ... Nth -> 1st \
            Try: <a href='../webgl-sketches/bugs/bugs.html'>Bugs</a>"],
    ["pascal", "Pascal / 1d cellular automata", "Try: <a href='../webgl-sketches/pascal/pascal.html'>Pascal</a>"],
    
    ["chaosg", "Modified chaos game", ""],
    ["cycloid", "Cycloid drawing machine", "Based on the cycloid drawing machine by Joe Freedman"],
    ["plane_tr", "Planar transformations", ""],
    ["dandelion", "Dandelion", "Images recreated from a basic program in a 1984 Hungarian book 'Etűdök ​személyi számítógépekre'"],
    ["spiral", "Turtle graphics", ""],
    ["tri", "Delaunay triangulation", ""],
    ["trochoid", "Trochoid", ""],
    #["xold", "", ""],
    ["grid", "Grid", ""],
    ["terrain", "Terrain", ""],
    ["planets", "Planets", ""],
    ["newworld", "Game skeleton", ""]
]


pics = []



for f in folders :
    list = os.listdir("img/" + f[0])
    list.sort()
    for i in range(len(list)) :
        list[i] = f[0] + "/" + list[i]
    pics.append(list)

index_str = open("s_base.html", "r").read()
repl_str = ""

repl_str += "<div class='container'><br /><br /><span class='h2'>ToC</span><br /><br /><div class='links'>\n"
for f in folders :
    repl_str += "<a href='#" + f[0] + "'>" + f[1] + "</a><br/>\n"
repl_str += "</div><br /><br /><br /></div>\n"

for i in range(len(pics)) :
    repl_str += "<div class='container' id ='" + folders[i][0] + "'><br /><br /><br />"
    repl_str += "<span class='h2'>" + folders[i][1] + "</span>"
    repl_str += " <a href='#top'>Up</a><br /><br /><br />\n"
    repl_str += "<div class='desc'>" + folders[i][2] + "</div>";
    for p in pics[i] :
        repl_str += "<div class='pic'><div class='picc'><a href='img/" + p + "'><img src='img/" + p + "' width='300' class='hm' /></a></div></div>\n"
    repl_str += "</div>\n"

index_f = open("s.html", "w")
index_f.write(index_str.replace("$$$$", repl_str))
index_f.close()
