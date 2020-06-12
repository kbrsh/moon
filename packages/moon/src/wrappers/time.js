import event from "moon/src/event";

export const timeNow = Date.now;

export function timeWait(delay, handler) {
	setTimeout(event(handler), delay);
}
