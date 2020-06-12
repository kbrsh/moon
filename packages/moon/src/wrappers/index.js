import { View, viewRoot, viewPatch } from "moon/src/wrappers/view";
import { timeNow, timeWait } from "moon/src/wrappers/time";
import { storageState } from "moon/src/wrappers/storage";
import { httpEventsLoad, httpEventsError, httpRequest } from "moon/src/wrappers/http";

export default {
	view: { View, viewRoot, viewPatch },
	time: { timeNow, timeWait },
	storage: { storageState },
	http: { httpEventsLoad, httpEventsError, httpRequest }
};
