import { WebGLRenderer } from 'three';
import { vevet } from 'vevet';
import { IWebglRendererProps } from './types';

export class WebglRenderer {
  private _renderer: WebGLRenderer;

  get renderer() {
    return this._renderer;
  }

  private _width = 1;

  private _height = 1;

  get canvas() {
    return this._canvas;
  }

  private _dpr: number;

  get dpr() {
    return this._dpr;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  constructor(
    private _container: HTMLElement,
    private _canvas: HTMLCanvasElement,
    private _props: IWebglRendererProps,
  ) {
    this._dpr = this._props.dpr ?? vevet.viewport.dpr;

    this._renderer = new WebGLRenderer({
      ..._props,
      canvas: _canvas,
    });

    this.resize();
  }

  public resize() {
    this._width = this._container.offsetWidth;
    this._height = this._container.offsetHeight;

    this._renderer.setSize(this.width, this.height);
    this._renderer.setPixelRatio(this.dpr);
  }

  public setDpr(value: number, hasResize = true) {
    this._dpr = value;

    if (hasResize) {
      this.resize();
    }
  }

  public destroy() {
    this._renderer.dispose();
  }
}
