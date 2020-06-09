import { View, viewNodeCreate, viewDataCreate, viewDataUpdate, viewDataRemove, viewPatch } from "moon/src/wrappers/view";
import { httpEventsLoad, httpEventsError, httpRequest } from "moon/src/wrappers/http";

export default {
	view: { View, viewNodeCreate, viewDataCreate, viewDataUpdate, viewDataRemove, viewPatch },
	http: { httpEventsLoad, httpEventsError, httpRequest }
};
