import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import { lerp, NCallbacks, vevet } from 'vevet';
import { addEventListener, IAddEventListener } from 'vevet-dom';
import { TProps } from './types';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import simplexNoise from '../webgl/shaders/simplexNoise.glsl';

export class PlaneElement {
  private get props() {
    return this._props;
  }

  private _startSize: { width: number; height: number };

  private _mesh: Mesh;

  private _geometry: PlaneGeometry;

  private _material: ShaderMaterial;

  private _callbacks: NCallbacks.IAddedCallback[] = [];

  private _listeners: IAddEventListener[] = [];

  private _mouse = {
    target: new Vector2(0.5, 0.5),
    current: new Vector2(0.5, 0.5),
  };

  private _mouseIntensity = { target: 0, current: 0 };

  constructor(private _props: TProps) {
    const { manager } = _props;
    const { width: startWidth, height: startHeight } = manager;

    // save initial sizes
    this._startSize = { width: startWidth, height: startHeight };

    // create geometry
    this._geometry = new PlaneGeometry(startWidth, startHeight, 20, 20);

    // create shader material
    this._material = new ShaderMaterial({
      vertexShader,
      fragmentShader: simplexNoise + fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_aspect: { value: startWidth / startHeight },
        u_mouse: { value: this._mouse.current },
        u_mouseIntensity: { value: this._mouseIntensity.current },
      },
      defines: {
        DISTORTION_OCTAVES: 3,
      },
    });

    // create mesh
    this._mesh = new Mesh(this._geometry, this._material);
    manager.scene.add(this._mesh);

    // resize
    this._callbacks.push(manager.callbacks.add('resize', () => this._resize()));

    // render
    this._callbacks.push(manager.callbacks.add('render', () => this._render()));

    // mouse move
    this._listeners.push(
      addEventListener(window, 'mousemove', (evt) => this._onMouseMove(evt)),
    );
  }

  /** Resize the scene */
  private _resize() {
    const { _startSize: startSize, props } = this;
    const { width, height } = props.manager;

    // calculate mesh scale
    const widthScale = width / startSize.width;
    const heightScale = height / startSize.height;

    // set mesh scale
    this._mesh.scale.set(widthScale, heightScale, 1);

    // uniforms
    this._material.uniforms.u_aspect.value = width / height;
  }

  /** Render the scene */
  private _render() {
    const { fpsMultiplier } = this.props.manager;
    const { uniforms } = this._material;

    this._mouse.current.lerp(this._mouse.target, 0.1 * fpsMultiplier);

    this._mouseIntensity.current = lerp(
      this._mouseIntensity.current,
      this._mouseIntensity.target,
      0.1 * fpsMultiplier,
    );

    this._mouseIntensity.target = lerp(
      this._mouseIntensity.target,
      0,
      0.2 * fpsMultiplier,
    );

    uniforms.u_time.value += 0.0075 * fpsMultiplier;
    uniforms.u_mouseIntensity.value = this._mouseIntensity.current;
  }

  private _onMouseMove(evt: MouseEvent) {
    this._mouse.target = new Vector2(
      evt.clientX / vevet.viewport.width,
      1 - evt.clientY / vevet.viewport.height,
    );

    this._mouseIntensity.target = Math.min(
      this._mouseIntensity.target + 0.1,
      1,
    );
  }

  /** Destroy the scene */
  public destroy() {
    this.props.manager.scene.remove(this._mesh);
    this._material.dispose();
    this._geometry.dispose();

    this._callbacks.forEach((event) => event.remove());
  }
}
