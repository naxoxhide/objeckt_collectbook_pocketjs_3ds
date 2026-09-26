#!/usr/bin/env python3
import math
import random
from PIL import Image

W, H = 128, 256

def hsv_to_rgb(h, s, v):
    i = int(h * 6.0)
    f = (h * 6.0) - i
    p = v * (1.0 - s)
    q = v * (1.0 - s * f)
    t = v * (1.0 - s * (1.0 - f))
    i %= 6
    if i == 0: return int(v * 255), int(t * 255), int(p * 255)
    if i == 1: return int(q * 255), int(v * 255), int(p * 255)
    if i == 2: return int(p * 255), int(v * 255), int(t * 255)
    if i == 3: return int(p * 255), int(q * 255), int(v * 255)
    if i == 4: return int(t * 255), int(p * 255), int(v * 255)
    if i == 5: return int(v * 255), int(p * 255), int(q * 255)
    return 0, 0, 0

def create_foil_texture(beam_center_x, phase_offset, seed=42):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pixels = img.load()
    rng = random.Random(seed)
    
    # Generate list of micro-sparkles (stars/stardust)
    sparkles = []
    for _ in range(70):
        sx = rng.randint(4, W - 5)
        sy = rng.randint(4, H - 5)
        s_size = rng.choice([1, 1, 1, 2])
        s_int = rng.uniform(0.6, 1.0)
        sparkles.append((sx, sy, s_size, s_int))

    # Angle of diffraction bands (-35 degrees)
    angle_rad = math.radians(-35)
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)

    for y in range(H):
        for x in range(W):
            # 1. Prismatic rainbow wave
            # Distance along diagonal wave normal
            proj = (x * cos_a + y * sin_a)
            # Hue cycle every ~70 pixels
            hue = (proj / 75.0 + phase_offset) % 1.0
            r, g, b = hsv_to_rgb(hue, 0.85, 1.0)

            # 2. Specular light beam centered around beam_center_x
            # The beam runs diagonally across the card
            # Distance from the beam center axis
            beam_dist = abs((x - beam_center_x) * cos_a + (y - H * 0.5) * sin_a)
            # Gaussian falloff
            beam = math.exp(-((beam_dist / 38.0) ** 2))

            # Blend towards bright white specular glare inside the beam
            spec = beam * 0.70
            r = int(r * (1.0 - spec) + 255 * spec)
            g = int(g * (1.0 - spec) + 255 * spec)
            b = int(b * (1.0 - spec) + 255 * spec)

            # 3. Base foil alpha: 30 base + up to 100 for beam
            alpha = int(32 + beam * 110)

            pixels[x, y] = (r, g, b, min(255, alpha))

    # Add sparkles on top
    for sx, sy, size, s_int in sparkles:
        for dy in range(-size, size + 1):
            for dx in range(-size, size + 1):
                px = sx + dx
                py = sy + dy
                if 0 <= px < W and 0 <= py < H:
                    dist = math.sqrt(dx * dx + dy * dy)
                    if dist <= size + 0.2:
                        cur_r, cur_g, cur_b, cur_a = pixels[px, py]
                        bright = (1.0 - dist / (size + 0.5)) * s_int
                        # Sparkle adds golden/white glint
                        nr = min(255, int(cur_r + 180 * bright))
                        ng = min(255, int(cur_g + 180 * bright))
                        nb = min(255, int(cur_b + 220 * bright))
                        na = min(255, int(cur_a + 120 * bright))
                        pixels[px, py] = (nr, ng, nb, na)

    return img

if __name__ == "__main__":
    # Texture A: Gleam concentrated on the left side of the card
    foil_a = create_foil_texture(beam_center_x=32, phase_offset=0.0, seed=101)
    foil_a.save("/Users/ignaciorojas/Documents/repos/pocketjs_3ds/shells/3ds/src/cards/foil_holo_a.png", "PNG")
    print("Generated foil_holo_a.png")

    # Texture B: Gleam concentrated on the right side of the card
    foil_b = create_foil_texture(beam_center_x=96, phase_offset=0.5, seed=202)
    foil_b.save("/Users/ignaciorojas/Documents/repos/pocketjs_3ds/shells/3ds/src/cards/foil_holo_b.png", "PNG")
    print("Generated foil_holo_b.png")
