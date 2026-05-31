uniform float pixelSize;
uniform int pattern;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 normalizedPixelSize = pixelSize / resolution;
  float rowIndex = floor(uv.x / normalizedPixelSize.x);
  vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
  vec4 color = texture2D(inputBuffer, uvPixel);

  float luma = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);

  vec2 cellUV = fract(uv / normalizedPixelSize);
  color = vec4(1.0);

  if(pattern == 0) {
    const float stripesMatrix[64] = float[64](
      0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2,
      0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0,
      1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0,
      1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2,
      0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2,
      0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0,
      1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0,
      1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2
    );

    const float crossStripeMatrix[64] = float[64](
      1.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 1.0,
      0.2, 1.0, 0.2, 0.2, 0.2, 0.2, 1.0, 0.2,
      0.2, 0.2, 1.0, 0.2, 0.2, 1.0, 0.2, 0.2,
      0.2, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 0.2,
      0.2, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 0.2,
      0.2, 0.2, 1.0, 0.2, 0.2, 1.0, 0.2, 0.2,
      0.2, 1.0, 0.2, 0.2, 0.2, 0.2, 1.0, 0.2,
      1.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 1.0
    );

    int x = int(cellUV.x * 8.0);
    int y = int(cellUV.y * 8.0);
    int index = y * 8 + x;

    if(luma < 0.6) {
        color = (stripesMatrix[index] > luma) ? vec4(1.0) : vec4(0.0, 0.31, 0.933, 1.0);
    } else {
        color = (crossStripeMatrix[index] > luma) ? vec4(1.0) : vec4(0.0, 0.31, 0.933, 1.0);
    }
  }

  if(pattern == 1) {
    const float sineMatrix[64] = float[64](
        0.99, 0.75,  0.2,  0.2,  0.2,  0.2, 0.99, 0.99,
        0.99, 0.99, 0.75,  0.2,  0.2, 0.99, 0.99, 0.75,
        0.2, 0.99, 0.99, 0.75, 0.99, 0.99,  0.2,  0.2,
        0.2,  0.2, 0.99, 0.99, 0.99,  0.2,  0.2,  0.2,
        0.2,  0.2,  0.2, 0.99, 0.99, 0.99,  0.2,  0.2,
        0.2,  0.2, 0.99, 0.99, 0.75, 0.99, 0.99,  0.2,
        0.75, 0.99, 0.99,  0.2,  0.2, 0.75, 0.99, 0.99,
        0.99, 0.99,  0.2,  0.2,  0.2,  0.2, 0.75, 0.99
    );

    int x = int(cellUV.x * 8.0);
    int y = int(cellUV.y * 8.0);
    int index = y * 8 + x;
    color = (sineMatrix[index] > luma) ? vec4(1.0) : vec4(0.0, 0.31, 0.933, 1.0);
  }

  outputColor = color;
}
