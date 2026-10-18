import numpy as np, tifffile, zlib, struct, json
"""Crop the Copernicus DEM GLO-30 tile N25 E032 to the Theban west bank and export a 16-bit heightmap.
Download: https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N25_00_E032_00_DEM/Copernicus_DSM_COG_10_N25_00_E032_00_DEM.tif to dl/dem.tif
Needs: pip install numpy tifffile imagecodecs"""
a=tifffile.imread('dl/dem.tif').astype('float32')
N=3600
lat0,lat1,lon0,lon1=25.712,25.762,32.570,32.625   # south,north,west,east
r0=int((26-lat1)*N); r1=int((26-lat0)*N); c0=int((lon0-32)*N); c1=int((lon1-32)*N)
sub=a[r0:r1,c0:c1]
print(sub.shape, sub.min(), sub.max())
mn,mx=float(sub.min()),float(sub.max())
q=np.round((sub-mn)/(mx-mn)*65535).astype('>u2')
h,w=q.shape
raw=b''.join(b'\x00'+q[i].tobytes() for i in range(h))
def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,16,0,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
open('vok-heightmap.png','wb').write(png)
meta={"file":"vok-heightmap.png","format":"16-bit grayscale PNG, row 0 = north","width":w,"height":h,
 "bounds":{"south":26-r1/N,"north":26-r0/N,"west":32+c0/N,"east":32+c1/N},
 "elevation_m":{"min":round(mn,1),"max":round(mx,1)},"decode":"elevation = min + value/65535*(max-min)",
 "pixel_size":"1 arc-second (about 30 m)",
 "source":"Copernicus DEM GLO-30, tile N25 E032 (produced using Copernicus WorldDEM-30 (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved)",
 "note":"DSM: includes surface objects; elevations are approximate."}
json.dump(meta,open('vok-heightmap.json','w'),indent=1)
print(meta['bounds'],meta['elevation_m'])
