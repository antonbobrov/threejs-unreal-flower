import { vevet } from 'vevet';
import { WebglManager } from './webgl/Manager';
import { PlaneElement } from './PlaneElement';

const managerContainer = document.getElementById('scene') as HTMLElement;

const manager = new WebglManager(managerContainer, {
  rendererProps: {
    dpr: vevet.viewport.lowerDpr,
    antialias: false,
  },
});

manager.play();

// eslint-disable-next-line no-new
new PlaneElement({
  manager,
});
