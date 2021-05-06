
import os

folders = [["eq", "Equation plotter"],
           ["objector", "3d objects and perspectives"],
           ["fractals", "Fractals"],
           ["cur_sur", "Curves and surfaces"],
           ["planetr", "Planar transformations"],
           ["ca3", "3d cellular automata"],
           ["voronoi", "Voronoi cells"],
           ["terrain", "Terrain"],
           ["newworld", "Game skeleton"],
           ["glitches", "Glitches"]]
pics = []

for f in folders :
    list = os.listdir("img/" + f[0])
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
    repl_str += " <a href='#dark'>Up</a><br /><br /><br />\n"
    for p in pics[i] :
        repl_str += "<div class='pic'><div class='picc'><a href='img/" + p + "'><img src='img/" + p + "' width='300' class='hm' /></a></div></div>\n"
    repl_str += "</div>\n"

index_f = open("index.html", "w")
index_f.write(index_str.replace("$$$$", repl_str))
index_f.close()
