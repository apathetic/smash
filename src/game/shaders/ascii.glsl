uniform float pixelSize;
uniform sampler2D asciiTexture;
uniform vec2 charCount;
uniform bool showBackground;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 normalizedPixelSize = pixelSize / resolution;
    vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
    vec4 color = texture2D(inputBuffer, uvPixel);

    vec2 pix = uv * resolution.xy;

    float luma = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);
    vec2 cellUV = fract(uv / normalizedPixelSize);

    float charIndex = clamp(
        floor(luma * (charCount.x - 1.0)),
        0.0,
        charCount.x - 1.0
    );

    vec2 asciiUV = vec2(
        (charIndex + cellUV.x) / charCount.x,
        cellUV.y
    );

    float character = texture2D(asciiTexture, asciiUV).r;

    vec3 backgroundColor = vec3(0.0, 0.0, 0.0);
    if (showBackground) {
        backgroundColor = color.rgb;
    }
    outputColor = vec4(character * vec3(1.0) * (luma + 0.01) + backgroundColor, 1.0);

}
