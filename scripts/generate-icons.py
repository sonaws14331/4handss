"""Generate antialiased BIMZI PWA icons matching public/icon.svg, without dependencies."""
import struct
import zlib
from pathlib import Path


def color_at(x, y):
    background = (119, 80, 220)
    mint = (189, 255, 207)
    ink = (52, 36, 91)
    if (x - 96) ** 2 + (y - 96) ** 2 > 61 ** 2:
        return background
    eyes = any(((x - cx) / 7) ** 2 + ((y - 82) / 11) ** 2 <= 1 for cx in (77, 115))
    radius_squared = (x - 96) ** 2 + (y - 108) ** 2
    smile = y >= 108 and 17 ** 2 <= radius_squared <= 25 ** 2
    return ink if eyes or smile else mint


def chunk(kind, data):
    return (struct.pack('!I', len(data)) + kind + data +
            struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff))


for size in (192, 512):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            colors = [color_at((x + dx) * 192 / size, (y + dy) * 192 / size)
                      for dx, dy in ((.25, .25), (.75, .25), (.25, .75), (.75, .75))]
            raw.extend(round(sum(c[k] for c in colors) / 4) for k in range(3))
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', size, size, 8, 2, 0, 0, 0)) +
           chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))
    Path(f'public/icon-{size}.png').write_bytes(png)
