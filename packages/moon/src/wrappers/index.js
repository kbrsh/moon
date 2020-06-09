import { View, viewNodeCreate, viewDataCreate, viewDataUpdate, viewDataRemove } from "moon/src/wrappers/view";
import { httpEventsLoad, httpEventsError, httpRequest } from "moon/src/wrappers/http";

export default {
	view: { View, viewNodeCreate, viewDataCreate, viewDataUpdate, viewDataRemove },
	http: { httpEventsLoad, httpEventsError, httpRequest }
};
