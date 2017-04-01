/**
 * Browser Mode
 */
const browserMode = typeof window !== 'undefined';


/**
 * Transition End Event Name
 */
let transitionEndEvent = "transitionend";

if(browserMode && !window.ontransitionend && window.onwebkittransitionend) {
  transitionEndEvent = "webkitTransitionEnd";
}
