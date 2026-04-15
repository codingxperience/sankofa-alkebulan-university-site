from PIL import Image
import numpy as np

def ascii_art(path, width=80):
    img = Image.open(path).convert('L')
    w, h = img.size
    ratio = h / w
    new_h = int(width * ratio * 0.45)
    img2 = img.resize((width, max(3, new_h)))
    chars = "@%#*+=-:. "
    arr = np.array(img2)
    lines = []
    for row in arr:
        line = ''.join(chars[int(pixel/255*(len(chars)-1))] for pixel in row)
        lines.append(line)
    return '\n'.join(lines)

for name in ['program details (2).png', 'program details (3).png']:
    print('\n====', name, '====')
    print(ascii_art(name, width=80))
