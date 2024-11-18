varying vec2 vUv;

uniform float u_time;
uniform float u_aspect;

uniform vec2 u_mouse;
uniform float u_mouseIntensity;

vec2 getAspectCoords(vec2 coords) {
  coords.x *= u_aspect;

  return coords;
}

float distortionFBM(vec3 x) {
	float v = 0.0;
	float a = 0.5;
	vec3 shift = vec3(100);

	for (int i = 0; i < DISTORTION_OCTAVES; ++i) {
		v += a * snoise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

vec3 greyscale(vec3 color, float str) {
    float g = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(g), str);
}

void main() {
  float time = u_time;

  float quantity = 10.0 + 5.0 * u_mouseIntensity;
  float holeRadius = 0.3 + 0.15 * u_mouseIntensity;
  vec3 mainColor = vec3(0.098, 0.1059, 0.2275);
  
  float distortionArea = distance(getAspectCoords(vUv), getAspectCoords(u_mouse));
  distortionArea = 1.0 - smoothstep(0.2, 1.0, distortionArea);
  distortionArea = clamp(distortionArea, 0.0, 1.0);

  float distortionNoise = distortionFBM(vec3(vUv + u_mouse, 0.0)) * 0.2;
  float distortion = distortionNoise * distortionArea * u_mouseIntensity;

  vec2 uv = vUv + distortion;

  vec2 coords = getAspectCoords(uv);
  vec2 center = vec2(0.5, 0.5);

  float circleNoise = snoise(vec3(coords * 10.0, time)) * 0.01;
  float circle = distance(coords + circleNoise, getAspectCoords(center));

  float area = 1.0 - smoothstep(0.0, 0.75, circle);

  float rayAngle = atan(uv.y - center.y, uv.x - center.x) + u_mouse.x;
  float ray = cos(rayAngle * quantity) * 0.5;
  float rayNoise = snoise(vec3(uv * ray - time, rayAngle));
  float rays = 0.5 - (ray + rayNoise);

  float hole = smoothstep(holeRadius * 0.4 - u_mouseIntensity * holeRadius * 0.6, holeRadius * 0.8, circle);

  float crown = 1.0 - smoothstep(0.0, holeRadius, circle);
  crown = max(crown * 35.0, 1.0);

  vec3 color = vec3(rays * mainColor) * area * hole * crown;
  vec3 grey = greyscale(color, u_mouseIntensity) * (1.5 - u_mouseIntensity);
  vec3 outputColor = mix(grey, color * distortionArea * 5.0, distortionArea * u_mouseIntensity);

  gl_FragColor = vec4(outputColor, 1.0);
}
