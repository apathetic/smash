uniform float pixelSize;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec3 rgbToHsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Function to convert HSV back to RGB
vec3 hsvToRgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}


void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 normalizedPixelSize = pixelSize / resolution;
    vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
    vec4 color = texture(inputBuffer, uvPixel);

    vec2 cellPosition = floor(uv / normalizedPixelSize);
    vec2 cellUV = fract(uv / normalizedPixelSize);

    float rowOffset = sin((random(vec2(0.0, uvPixel.y)) - 0.5) * 0.25);
    cellUV.x += rowOffset;
    vec2 centered = cellUV - 0.5;

    float noiseAmount = 0.18;
    vec2 noisyCenter = centered + (vec2(
        random(cellPosition + centered ),
        random(cellPosition + centered)
    ) - 0.5) * noiseAmount;

    float isAlternate = mod(cellPosition.x, 2.0);
    float angle = isAlternate == 0.0 ? radians(-65.0) : radians(65.0);

    vec2 rotated = vec2(
        noisyCenter.x * cos(angle) - noisyCenter.y * sin(angle),
        noisyCenter.x * sin(angle) + noisyCenter.y * cos(angle)
    );

    float aspectRatio = 1.55;
    float ellipse = length(vec2(rotated.x, rotated.y * aspectRatio - 0.075));
    color.rgb *= smoothstep(0.2, 1.0, 1.0 - ellipse);

    float stripeNoise = noise(vec2(centered.x, centered.y * 100.0));
    color.rgb *= stripeNoise + 0.4;


    float hueShift = (random(cellPosition) - 0.5) * 0.08;
    vec3 hsv = rgbToHsv(color.rgb);
    hsv.x += hueShift;
    color.rgb = hsvToRgb(hsv);

    color.rgb *= smoothstep(0.2, 1.0, 1.0 - ellipse);
    outputColor = color;
}
