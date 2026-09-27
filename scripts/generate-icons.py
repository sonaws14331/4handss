"""Generate dependency-free antialiased AMBER PWA icons from the brand geometry."""
import struct
import zlib
from pathlib import Path

def inside(x, y, polygon):
    result = False
    j = len(polygon) - 1
    for i, (xi, yi) in enumerate(polygon):
        xj, yj = polygon[j]
        if (yi > y) != (yj > y) and x < (xj-xi)*(y-yi)/(yj-yi)+xi:
            result = not result
        j = i
    return result

outer = [(43,146),(84,43),(113,43),(152,146),(122,146),(115,125),(80,125),(72,146)]
hole = [(89,101),(109,101),(99,70)]
cut = [(107,119),(156,91),(164,106),(115,133)]
for size in (192, 512):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            colors = []
            for dx,dy in ((.25,.25),(.75,.25),(.25,.75),(.75,.75)):
                px,py = (x+dx)*192/size,(y+dy)*192/size
                # Keep a full opaque background for safe maskable icons.
                dark = inside(px,py,outer) and not inside(px,py,hole) and not inside(px,py,cut)
                colors.append((40,42,41) if dark else (243,182,62))
            raw.extend(round(sum(c[k] for c in colors)/4) for k in range(3))
    def chunk(kind,data):
        return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    png = b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
    Path(f'public/icon-{size}.png').write_bytes(png)
