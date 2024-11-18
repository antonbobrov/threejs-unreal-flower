import { Scene, Camera } from 'three';
import { AnimationFrame, Callbacks, IOnResize, onResize, vevet } from 'vevet';
import { DeepRequired } from 'ts-essentials';
import { WebglRenderer } from '../Renderer';
import { IWebglManagerCallbacksTypes, IWebglManagerProps } from './types';
import { WebglCamera } from '../Camera';

export class WebglManager<TCamera extends Camera | undefined = undefined> {
  private _props: DeepRequired<IWebglManagerProps>;

  get props() {
    return this._props;
  }

  // dom

  private _container: HTMLElement;

  get container() {
    return this._container;
  }

  private _canvas: HTMLCanvasElement;

  get canvas() {
    return this._canvas;
  }

  // renderer

  private _rendererInstance: WebglRenderer;

  get renderer() {
    return this._rendererInstance.renderer;
  }

  // camera

  private _cameraInstance?: WebglCamera;

  get cameraInstance() {
    return this._cameraInstance;
  }

  private _camera: TCamera extends Camera ? TCamera : WebglCamera['camera'];

  get camera() {
    return this._camera;
  }

  // scene

  private _scene: Scene;

  get scene() {
    return this._scene;
  }

  set scene(scene: Scene) {
    this._scene = scene;
  }

  // callbacks

  private _resizeCallback?: IOnResize;

  private _callbacks: Callbacks<IWebglManagerCallbacksTypes>;

  get callbacks() {
    return this._callbacks;
  }

  // animation frame

  private _animationFrame: AnimationFrame;

  get animationFrame() {
    return this._animationFrame;
  }

  get fpsMultiplier() {
    return this.animationFrame.fpsMultiplier;
  }

  // module

  constructor(
    containerSelector: HTMLElement | string,
    initialProps: IWebglManagerProps,
    camera?: TCamera,
  ) {
    const container =
      typeof containerSelector === 'string'
        ? (document.querySelector(containerSelector) as HTMLElement)
        : containerSelector;

    if (container) {
      this._container = container;
    } else {
      throw new Error('No Container Element');
    }

    // create canvas
    this._canvas = document.createElement('canvas');
    container.appendChild(this._canvas);

    // set props
    const defaultProps: DeepRequired<IWebglManagerProps> = {
      cameraProps: {
        fov: undefined as any,
        perspective: 800,
        near: 1,
        far: 10000,
      },
      rendererProps: {} as any,
      fps: 'auto',
    };

    this._props = {
      ...defaultProps,
      ...initialProps,
      cameraProps: { ...defaultProps.cameraProps, ...initialProps.cameraProps },
      rendererProps: {
        ...defaultProps.rendererProps,
        ...initialProps.rendererProps,
      },
    };

    const { rendererProps, cameraProps } = this.props;

    // create base elements
    this._rendererInstance = new WebglRenderer(
      container,
      this._canvas,
      rendererProps,
    );

    // create camera
    if (camera) {
      this._camera = camera as any;
    } else {
      this._cameraInstance = new WebglCamera(
        container,
        cameraProps.fov,
        cameraProps.perspective,
        cameraProps.near,
        cameraProps.far,
      );
      this._camera = this._cameraInstance.camera as any;
    }

    // create scene
    this._scene = new Scene();

    // create viewport callbacks
    this._resizeCallback = onResize({
      element: container,
      hasBothEvents: true,
      onResize: () => this.resize(),
      viewportTarget: vevet.isMobile ? 'width' : 'any',
    });

    // create callbacks
    this._callbacks = new Callbacks();

    // resize for the first time
    this.resize();

    // create an animation frame
    this._animationFrame = new AnimationFrame({ fps: this.props.fps });
    this._animationFrame.addCallback('frame', () => this.render());
  }

  public resize() {
    this.callbacks.tbt('beforeResize', undefined);

    this._rendererInstance.resize();
    this._cameraInstance?.resize();

    this.callbacks.tbt('resize', undefined);

    this.render();
  }

  public play() {
    this.animationFrame.play();
  }

  public pause() {
    this.animationFrame.pause();
  }

  get width() {
    return this._rendererInstance.width;
  }

  get height() {
    return this._rendererInstance.height;
  }

  get dpr() {
    return this._rendererInstance.dpr;
  }

  public setDpr(value: number) {
    this._rendererInstance.setDpr(value, false);
    this.resize();
  }

  public render() {
    this.callbacks.tbt('render', undefined);

    if (this.width > 0 && this.height > 0 && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    this.callbacks.tbt('afterRender', undefined);
  }

  destroy() {
    this._canvas.remove();

    this._rendererInstance.destroy();

    this._animationFrame.destroy();
    this._resizeCallback?.remove();
    this._callbacks.destroy();
  }
}
