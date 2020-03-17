import view from "moon/src/m/view";
import time from "moon/src/m/time";
import storage from "moon/src/m/storage";
import http from "moon/src/m/http";
import route from "moon/src/m/route";

const m = {};

Object.defineProperty(m, "view", view);
Object.defineProperty(m, "time", time);
Object.defineProperty(m, "storage", storage);
Object.defineProperty(m, "http", http);
Object.defineProperty(m, "route", route);

export default m;
