import { initExerciseShow, initLabelsEdit, afterResize, onFrameMessage, onFrameScroll } from "exercise.js";

window.dodona.initExerciseShow = initExerciseShow;
window.dodona.initLabelsEdit = initLabelsEdit;
window.dodona.afterResize = afterResize;
window.dodona.onFrameMessage = onFrameMessage;
window.dodona.onFrameScroll = onFrameScroll;

// will automaticaly bind to window.iFrameResize()
require("iframe-resizer");
