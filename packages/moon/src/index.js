import { use } from "moon/src/use";
import run from "moon/src/run";
import data from "moon/src/data/index";
import view from "moon/src/view/index";
import time from "moon/src/time/index";
import http from "moon/src/http/index";
import route from "moon/src/route/index";

export default {
	data,
	http,
	route,
	run,
	time,
	use,
	version: process.env.MOON_VERSION,
	view
};
