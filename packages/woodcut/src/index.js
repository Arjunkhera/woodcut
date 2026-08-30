import { WoodcutFigure } from './frame.js';
import { WoodcutBlockDiagram } from './block-diagram.js';
import { WoodcutStateMachine } from './state-machine.js';
import { WoodcutSequence } from './sequence.js';
import { WoodcutFlowchart } from './flowchart.js';
import { WoodcutSwimlane } from './swimlane.js';

customElements.define('wc-block-diagram', WoodcutBlockDiagram);
customElements.define('wc-state-machine', WoodcutStateMachine);
customElements.define('wc-sequence', WoodcutSequence);
customElements.define('wc-flowchart', WoodcutFlowchart);
customElements.define('wc-swimlane', WoodcutSwimlane);

export {
  WoodcutFigure,
  WoodcutBlockDiagram,
  WoodcutStateMachine,
  WoodcutSequence,
  WoodcutFlowchart,
  WoodcutSwimlane
};
