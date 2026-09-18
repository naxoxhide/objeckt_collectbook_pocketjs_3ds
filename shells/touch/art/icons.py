# SPDX-License-Identifier: GPL-3.0-or-later
"""Author the sixteen Pocket Shell icons in Blender and bake orthographic PNGs.
Blender 5.1: blender -b --factory-startup --python shells/touch/art/icons.py -- --out .pocket-build/touch-art
The generated .blend retains one editable scene per app. Runtime uses PNGs only.
"""
import argparse, math, sys
from pathlib import Path
import bpy
from mathutils import Vector

args = argparse.ArgumentParser()
args.add_argument('--out', type=Path, required=True)
args.add_argument('--only', default='')
options = args.parse_args(sys.argv[sys.argv.index('--') + 1:])
options.out.mkdir(parents=True, exist_ok=True)
NAMES = ['today', 'music', 'places', 'weather', 'notes', 'photos', 'mail', 'calendar', 'clock', 'safari', 'files', 'settings', 'camera', 'health', 'books', 'calculator']
COLORS = ['2875ee', 'fa456b', '51b991', '298ceb', 'f5f3ed', 'faf9f5', '138bfa', 'fcfaf7', '172031', 'e9f3fc', '168eed', 'aab1c0', 'c6cdd7', 'fcf8f9', 'f58b24', '30394d']

def rgba(h):
    c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + .055) / 1.055) ** 2.4 if x > .04045 else x / 12.92 for x in c) + (1,)

def material(name, color, rough=.28, metal=0, coat=.25):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba(color)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = rgba(color)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = .22
    return m

M = {}
for name, color, rough, metal in [('white','ffffff',.3,0), ('ink','182336',.3,0), ('silver','b8c3d4',.24,.6), ('dark','30394b',.25,.3), ('blue','147bee',.25,.1), ('cyan','54c8fc',.25,0), ('red','ff4b63',.24,0), ('gold','ffcc48',.26,.05), ('paper','fff9e9',.4,0), ('line','c5ccd6',.4,0)]:
    M[name] = material(name,color,rough,metal)

def finish(o, mat, bevel=.025):
    o.data.materials.append(mat)
    if bevel:
        b = o.modifiers.new('Soft manufactured edge', 'BEVEL'); b.width = bevel; b.segments = 4
    for face in o.data.polygons: face.use_smooth = True
    n = o.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL'); n.keep_sharp = True; n.weight = 50
    return o

def extrude(name, points, z, depth, mat, bevel=.018):
    count = len(points)
    verts = [(x,y,z) for x,y in points] + [(x,y,z+depth) for x,y in points]
    faces = [tuple(reversed(range(count))), tuple(range(count,2*count))]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    obj = bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    return finish(obj,mat,bevel)

def rounded(name,x,y,w,h,z,mat,r=.09,depth=.055,angle=0):
    pts=[]
    for cx,cy,a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for k in range(13):
            t=math.radians(a+k*90/12); px=cx+r*math.cos(t); py=cy+r*math.sin(t)
            pts.append((x+px*math.cos(angle)-py*math.sin(angle),y+px*math.sin(angle)+py*math.cos(angle)))
    return extrude(name,pts,z,depth,mat,min(.018,depth*.25))

def disc(name,x,y,r,z,mat,depth=.055):
    return extrude(name,[(x+r*math.cos(i*math.tau/96),y+r*math.sin(i*math.tau/96)) for i in range(96)],z,depth,mat,min(.015,depth*.2))

def ring(name,x,y,r,t,z,mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=96,minor_segments=12,location=(x,y,z))
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def stroke(name,points,z,width,mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=16
    curve.bevel_depth=width/2;curve.bevel_resolution=4;curve.use_fill_caps=True
    poly=curve.splines.new('POLY');poly.points.add(len(points)-1)
    for p,(x,y) in zip(poly.points,points):p.co=(x,y,z,1)
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
    for x,y in [points[0],points[-1]]:disc(name+' end',x,y,width/2,z-width/2,mat,depth=width)
    return o

def text(body,x,y,size,z,mat):
    c=bpy.data.curves.new('Typography '+body,'FONT');c.body=body;c.align_x='CENTER';c.align_y='CENTER';c.size=size;c.extrude=.004;c.bevel_depth=.001
    o=bpy.data.objects.new('Typography '+body,c);bpy.context.collection.objects.link(o);o.location=(x,y,z);o.data.materials.append(mat)
    return o

def base(color):
    # Render color beyond the tile silhouette. The baker applies the circular
    # mask once, preserving this RGB even under alpha zero for GL filtering.
    m=material('Satin color '+color,color,.42,0,.12)
    bpy.ops.mesh.primitive_plane_add(size=3,location=(0,0,.15))
    o=bpy.context.object;o.name='Overscan tile color';o.data.materials.append(m)

def gear(mat,z):
    count=96;outer=[];inner=[]
    for j in range(count):
        a=j*math.tau/count;r=.60 if j%12 in (0,1,2,9,10,11) else .74
        outer.append((r*math.cos(a),r*math.sin(a)))
        inner.append((.285*math.cos(a),.285*math.sin(a)))
    verts=[(x,y,h) for h in (z,z+.075) for loop in (outer,inner) for x,y in loop]
    faces=[]
    for j in range(count):
        k=(j+1)%count
        faces.extend([(j,k,k+2*count,j+2*count),
                      (j+count,j+3*count,k+3*count,k+count),
                      (j+2*count,k+2*count,k+3*count,j+3*count),
                      (j,j+count,k+count,k)])
    mesh=bpy.data.meshes.new('Eight-tooth gear');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Single satin gear',mesh);bpy.context.collection.objects.link(o)
    finish(o,mat,.026)

def book_page(side,mat,z,under=False):
    # A curved sheet rises from the gutter and bends toward the outer edge.
    # Its top and bottom silhouette follow that bend instead of a trapezoid.
    cols=48;rows=8;verts=[];faces=[]
    for row in range(rows+1):
        v=row/rows
        for col in range(cols+1):
            u=col/cols
            x=side*(.025+(.68 if under else .66)*u)
            y=-.53+v*1.00+.10*u+.055*math.sin(math.pi*u)
            h=z+.145*math.sin(math.pi*u)+.045*u+.012*math.sin(math.pi*v)
            verts.append((x,y,h))
    for row in range(rows):
        for col in range(cols):
            a=row*(cols+1)+col;face=(a,a+1,a+cols+2,a+cols+1)
            faces.append(face if side>0 else tuple(reversed(face)))
    mesh=bpy.data.meshes.new('Curved paper');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(('Page block ' if under else 'Curved leaf ')+str(side),mesh)
    bpy.context.collection.objects.link(o);o.data.materials.append(mat)
    for p in mesh.polygons:p.use_smooth=True
    s=o.modifiers.new('Paper thickness','SOLIDIFY');s.thickness=.022 if under else .012
    b=o.modifiers.new('Paper edge','BEVEL');b.width=.006;b.segments=3

def symbol(i):
    z=.20;w=M['white'];ink=M['ink'];red=M['red'];blue=M['blue'];gold=M['gold']
    if i==0:
        for row,width in enumerate([.80,.60,.40]):
            rounded('Raised agenda line',.08-(.8-width)/2,.36-row*.34,width,.115,z,w,r=.055)
            disc('Agenda check',-.53,.36-row*.34,.06,z,w)
    elif i==1:
        before=set(bpy.context.scene.objects)
        extrude('Connected music stems',[(-.28,-.26),(-.18,-.26),(-.18,.28),(.38,.40),(.38,-.12),(.48,-.12),(.48,.61),(-.28,.44)],z,.065,w)
        for name,x,y in [('Lower note',-.39,-.32),('Upper note',.27,-.18)]:
            o=disc(name,0,0,.22,z,w);o.scale.y=.70;o.location=(x,y,0)
        for o in set(bpy.context.scene.objects)-before:
            o.location.x+=.065;o.location.y-=.11
    elif i==2:
        rounded('Map sheet',0,-.02,1.38,1.38,z,M['paper'],r=.10,depth=.025)
        rounded('Park west',-.39,.23,.46,.43,z+.03,material('Park green','7ccb8c'),r=.06,depth=.015)
        rounded('Park east',.35,-.34,.55,.43,z+.03,material('Park mint','a6dca3'),r=.06,depth=.015)
        stroke('River',[(-.12,-.69),(-.02,-.31),(.18,.1),(.10,.68)],z+.065,.16,M['cyan'])
        stroke('Road',[(-.67,-.1),(.65,.23)],z+.09,.095,w)
        extrude('Location pin',[(-.03,.01),(-.30,.33),(-.30,.52),(-.20,.66),(.08,.70),(.26,.53),(.25,.32)],z+.13,.07,red,.025)
        disc('Pin center',-.025,.46,.105,z+.215,w)
    elif i==3:
        disc('Sun',.24,.25,.37,z,gold)
        cloud=material('Cloud porcelain','f6fcff',.24)
        # One union silhouette prevents coplanar lobe faces from self-intersecting.
        pts=[]
        for j in range(192):
            a=j*math.tau/192;dx=math.cos(a);dy=math.sin(a);dist=0
            for x,y,r in [(-.32,-.13,.23),(-.06,-.01,.32),(.23,-.15,.22)]:
                ox=x+.05;oy=y+.14;dot=ox*dx+oy*dy;discriminant=dot*dot-(ox*ox+oy*oy-r*r)
                if discriminant>=0:dist=max(dist,dot+math.sqrt(discriminant))
            pts.append((-.05+dist*dx,-.14+dist*dy))
        extrude('Cloud porcelain silhouette',pts,z+.09,.055,cloud,.018)
    elif i==4:
        rounded('Amber notebook header',0,.46,1.58,.43,z,gold,r=.10,depth=.035)
        for y in [.04,-.22,-.48]:rounded('Ruled line',0,y,1.16,.047,z+.01,M['line'],r=.02,depth=.015)
        for x in [-.51,-.25,.01,.27,.53]:rounded('Binding',x,.60,.04,.21,z+.05,M['paper'],r=.018)
    elif i==5:
        colors=['ffad34','ffcc37','8ccc56','41c2ac','57a9ed','7875d5','d76fae','f17070']
        for j,c in enumerate(colors):
            angle=math.pi/2-j*math.tau/8
            o=disc('Petal '+str(j),0,0,.26,z+j*.002,material('Petal '+c,c,.23,0,.45))
            o.scale.y=1.70;o.rotation_euler.z=angle-math.pi/2;o.location=(.30*math.cos(angle),.30*math.sin(angle),0)
        disc('Flower center',0,0,.13,z+.08,material('Flower center','ffdf78'))
    elif i==6:
        rounded('Envelope body',0,0,1.30,.94,z,w,r=.10)
        crease=material('Envelope folds','b5d9fc')
        stroke('Lower fold',[(-.53,-.34),(0,.06),(.53,-.34)],z+.064,.024,crease)
        extrude('Envelope flap',[(-.61,.40),(.61,.40),(0,-.04)],z+.07,.025,w,.018)
    elif i==7:
        rounded('Calendar red accent',0,.55,1.24,.18,z,red,r=.08,depth=.025)
        text('17',0,-.12,1.18,z+.012,ink)
    elif i==8:
        ring('Clock rim',0,0,.66,.025,z,M['silver'])
        for j in range(12):
            a=j*math.tau/12
            stroke('Hour index',[(.53*math.sin(a),.53*math.cos(a)),(.60*math.sin(a),.60*math.cos(a))],z,.027,w)
        stroke('Hour hand',[(0,0),(-.31,.17)],z+.08,.066,w)
        stroke('Minute hand',[(0,0),(-.43,-.28)],z+.10,.048,w)
        stroke('Sweep seconds',[(.05,-.12),(-.19,.48)],z+.14,.025,red)
        disc('Clock pin',0,0,.057,z+.15,w)
    elif i==9:
        disc('Compass blue dial',0,0,.69,z,blue)
        ring('Compass porcelain rim',0,0,.69,.028,z+.045,w)
        for j in range(24):
            a=j*math.tau/24;r=.52 if j%2==0 else .57
            stroke('Compass tick',[(r*math.cos(a),r*math.sin(a)),(.62*math.cos(a),.62*math.sin(a))],z+.055,.017,w)
        extrude('North needle',[(-.16,-.08),(.38,.51),(.14,.04)],z+.10,.04,red)
        extrude('South needle',[(.14,.04),(-.38,-.51),(-.16,-.08)],z+.10,.04,w)
        disc('Compass axle',0,0,.045,z+.15,M['silver'])
    elif i==10:
        extrude('Folder back',[(-.63,-.43),(.62,-.43),(.62,.38),(-.06,.38),(-.19,.54),(-.63,.54)],z,.055,material('Folder back','bdeaff'))
        rounded('Paper divider',.02,.09,1.02,.71,z+.07,w,r=.04,depth=.025)
        extrude('Folder front',[(-.66,-.46),(.62,-.46),(.70,.25),(-.58,.25)],z+.12,.07,material('Folder face','65cfff'),.035)
    elif i==11:
        gear(material('Satin alloy','e5eaf2',.42,.12,.08),z+.02)
    elif i==12:
        rounded('Camera housing',0,0,1.42,.93,z,M['dark'],r=.14)
        rounded('Viewfinder ridge',-.15,.47,.56,.25,z,M['dark'],r=.07)
        rounded('Flash',.47,.28,.21,.10,z+.085,gold,r=.03)
        disc('Lens metal',-.07,-.04,.43,z+.06,M['silver'])
        disc('Lens barrel',-.07,-.04,.35,z+.12,ink)
        disc('Optical coating',-.07,-.04,.26,z+.16,material('Optical sapphire','154c92',.13,.45,.5))
        disc('Lens pupil',-.07,-.04,.14,z+.19,material('Deep glass','0a2046',.14,.25))
        disc('Lens glint',-.16,.08,.054,z+.23,M['cyan'],.018)
    elif i==13:
        pts=[]
        for j in range(128):
            t=j*math.tau/128
            pts.append((16*math.sin(t)**3*.042,(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t))*.041+.06))
        extrude('Enamel heart',list(reversed(pts)),z,.09,red,.035)
    elif i==14:
        for side in [-1,1]:
            book_page(side,M['paper'],z+.005,under=True)
            book_page(side,w,z+.047)
        stroke('Book gutter',[(0,-.52),(0,.47)],z+.035,.028,M['paper'])
    elif i==15:
        key=material('Calculator ceramic','69758a',.42,0,.08)
        for x,y,label in [(-.34,.34,'+'),(.34,.34,'-'),(-.34,-.34,'x'),(.34,-.34,'=')]:
            rounded('Large '+label+' key',x,y,.57,.57,z,gold if label=='=' else key,r=.12,depth=.05)
            m=ink if label=='=' else w;h=z+.078
            if label in ('+','-'):stroke('Horizontal',[(x-.12,y),(x+.12,y)],h,.047,m)
            if label=='+':stroke('Vertical',[(x,y-.12),(x,y+.12)],h,.047,m)
            if label=='x':
                stroke('Multiply ascending',[(x-.09,y-.09),(x+.09,y+.09)],h,.047,m)
                stroke('Multiply descending',[(x-.09,y+.09),(x+.09,y-.09)],h,.047,m)
            if label=='=':
                for dy in [-.055,.055]:stroke('Equals',[(x-.12,y+dy),(x+.12,y+dy)],h,.047,m)

def light(name, loc, energy, size):
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()

for i,name in enumerate(NAMES):
    if options.only and name not in options.only.split(','):continue
    scene=bpy.data.scenes.new('Icon '+name);bpy.context.window.scene=scene
    scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
    scene.cycles.seed=7;scene.cycles.max_bounces=5
    scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
    scene.world=bpy.data.worlds.new('Studio '+name);scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.78,.9,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
    scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
    base(COLORS[i]);symbol(i)
    light('Large softbox upper left',(-3,4,7),450,5)
    light('Cool fill',(4,1,5),100,4)
    camera=bpy.data.cameras.new('Orthographic bake');camera.type='ORTHO';camera.ortho_scale=2.06
    o=bpy.data.objects.new('Orthographic bake',camera);scene.collection.objects.link(o);o.location=(0,0,8);scene.camera=o
    scene.render.filepath=str((options.out/(name+'.png')).resolve())
    bpy.ops.render.render(write_still=True)
    print('BAKED',name,flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str((options.out/'pocket-shell-icons.blend').resolve()))
