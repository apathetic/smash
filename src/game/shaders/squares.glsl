uniform float pixelSize;

float crossSDF(vec2 p) {
    p = abs(p - 0.5);
    return min(p.x, p.y);
}

float circleSDF(vec2 p) {
    return length(p - 0.5);
}

float triangleSDF(vec2 p) {
    const float r = 1.0;
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    return -length(p)*sign(p.y);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 normalizedPixelSize = pixelSize / resolution;
    float rowIndex = floor(uv.x / normalizedPixelSize.x);
    vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
    vec4 color = texture2D(inputBuffer, uvPixel);

    float luma = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);

    vec2 cellUV = fract(uv / normalizedPixelSize);
    color = vec4(1.0);

    float d = circleSDF(cellUV);

    if (luma > 0.2) {
      if (d < 0.3) {
        color = vec4(0.0,0.31,0.933,1.0);
      } else {
        color = vec4(1.0,1.0,1.0,1.0);
      }
    }

    if(luma > 0.75) {
      if(d < 0.3) {
        color = vec4(1.0,1.0,1.0,1.0);
      } else {
        color = vec4(0.0,0.31,0.933,1.0);
      }
    }

    if(luma > 0.99) {
      color = vec4(0.0,0.31,0.933,1.0);
    }

    outputColor = color;
}
