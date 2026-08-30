import { WoodcutFigure } from './frame.js';
import { WoodcutBlockDiagram } from './block-diagram.js';
import { WoodcutStateMachine } from './state-machine.js';

customElements.define('wc-block-diagram', WoodcutBlockDiagram);
customElements.define('wc-state-machine', WoodcutStateMachine);

export { WoodcutFigure, WoodcutBlockDiagram, WoodcutStateMachine };
