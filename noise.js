/** Independent binary noise. No pointer, gesture, subtype or progress inputs. */
export function noiseFrame(width, height, seed, frame, contrast) {
  const data = new Uint8ClampedArray(width * height * 4);
  let random = (seed ^ Math.imul(frame + 1, 0x9e3779b9)) >>> 0 || 1;
  const low = Math.round(127.5 * (1 - contrast / 100));
  const high = 255 - low;
  for (let i = 0; i < data.length; i += 4) {
    random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
    const gray = (random >>> 0) < 0x80000000 ? low : high;
    data[i] = data[i + 1] = data[i + 2] = gray;
    data[i + 3] = 255;
  }
  return data;
}
