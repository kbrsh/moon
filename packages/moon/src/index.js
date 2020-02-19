import configure from "moon/src/configure";
import use from "moon/src/use";
import data from "moon/src/data/index";
import view from "moon/src/view/index";
import time from "moon/src/time/index";
import storage from "moon/src/storage/index";
import http from "moon/src/http/index";
import route from "moon/src/route/index";

export default {
	configure,
	data,
	http,
	route,
	storage,
	time,
	use,
	version: process.env.MOON_VERSION,
	view
};
