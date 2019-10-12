import Moon from "moon/src/index";

const open = jest.fn();
const send = jest.fn(function() {
	if (this.error) {
		this.onerror();
	} else {
		this.onload();
	}
});
const setRequestHeader = jest.fn();
let error;

window.XMLHttpRequest = function() {
	this.responseType = null;
	this.status = 200;
	this.response = "Moon Test";

	this.setRequestHeader = setRequestHeader;
	this.getAllResponseHeaders = () => `test: moon
content-length: 1084
date: Fri, 25 Jun 04 00:00:00 +0000`;
	this.open = open;
	this.send = send;

	this.error = error;
};

test("successful http request", () => {
	let run = false;
	error = false;

	Moon.use({
		http: Moon.http.driver
	});

	Moon.run(() => ({
		http: [{
			method: "GET",
			responseType: "text",
			url: "https://example.com",
			headers: {
				test: "moon request",
				foo: "bar",
				date: "Fri, 25 Jun 04 00:00:00 +0000"
			},
			body: "Moon Test Request",
			onLoad: ({ http }) => {
				run = true;
				expect(setRequestHeader).toBeCalledWith("test", "moon request");
				expect(setRequestHeader).toBeCalledWith("foo", "bar");
				expect(setRequestHeader).toBeCalledWith("date", "Fri, 25 Jun 04 00:00:00 +0000");
				expect(open).toBeCalledWith("GET", "https://example.com");
				expect(send).toBeCalledWith("Moon Test Request");
				expect(http).toEqual({
					status: 200,
					headers: {"content-length": "1084", "date": "Fri, 25 Jun 04 00:00:00 +0000", "test": "moon"},
					body: "Moon Test"
				});
				return {};
			}
		}]
	}));

	expect(run).toEqual(true);

	setRequestHeader.mockClear();
	open.mockClear();
	send.mockClear();
});

test("failing http request", () => {
	let run = false;
	error = true;

	Moon.use({
		http: Moon.http.driver
	});

	Moon.run(() => ({
		http: [{
			method: "GET",
			responseType: "text",
			url: "https://example.com",
			headers: {
				test: "moon request",
				foo: "bar",
				date: "Fri, 25 Jun 04 00:00:00 +0000"
			},
			body: "Moon Test Request",
			onError: ({ http }) => {
				run = true;
				expect(setRequestHeader).toBeCalledWith("test", "moon request");
				expect(setRequestHeader).toBeCalledWith("foo", "bar");
				expect(setRequestHeader).toBeCalledWith("date", "Fri, 25 Jun 04 00:00:00 +0000");
				expect(open).toBeCalledWith("GET", "https://example.com");
				expect(send).toBeCalledWith("Moon Test Request");
				expect(http).toEqual(null);
				return {};
			}
		}]
	}));

	expect(run).toEqual(true);

	setRequestHeader.mockClear();
	open.mockClear();
	send.mockClear();
});

test("default http request", () => {
	error = false;

	Moon.use({
		http: Moon.http.driver
	});

	Moon.run(() => ({
		http: [{
			url: "https://example.com"
		}]
	}));

	expect(setRequestHeader).not.toBeCalled();
	expect(open).toBeCalledWith("GET", "https://example.com");
	expect(send).toBeCalledWith(null);

	setRequestHeader.mockClear();
	open.mockClear();
	send.mockClear();
});

test("default http request with error", () => {
	error = true;

	Moon.use({
		http: Moon.http.driver
	});

	Moon.run(() => ({
		http: [{
			url: "https://example.com"
		}]
	}));

	expect(setRequestHeader).not.toBeCalled();
	expect(open).toBeCalledWith("GET", "https://example.com");
	expect(send).toBeCalledWith(null);

	setRequestHeader.mockClear();
	open.mockClear();
	send.mockClear();
});

test("multiple http requests", () => {
	let run = [false, false, false];
	error = false;

	Moon.use({
		http: Moon.http.driver
	});

	Moon.run(() => ({
		http: [{
			url: "https://example.com/1",
			onLoad: ({ http }) => {
				run[0] = true;
				expect(setRequestHeader).not.toBeCalled();
				expect(open).toBeCalledWith("GET", "https://example.com/1");
				expect(send).toBeCalledWith(null);
				expect(http).toEqual({
					status: 200,
					headers: {"content-length": "1084", "date": "Fri, 25 Jun 04 00:00:00 +0000", "test": "moon"},
					body: "Moon Test"
				});
				setRequestHeader.mockClear();
				open.mockClear();
				send.mockClear();
				return {};
			}
		}, {
			url: "https://example.com/2",
			onLoad: ({ http }) => {
				run[1] = true;
				expect(setRequestHeader).not.toBeCalled();
				expect(open).toBeCalledWith("GET", "https://example.com/2");
				expect(send).toBeCalledWith(null);
				expect(http).toEqual({
					status: 200,
					headers: {"content-length": "1084", "date": "Fri, 25 Jun 04 00:00:00 +0000", "test": "moon"},
					body: "Moon Test"
				});
				setRequestHeader.mockClear();
				open.mockClear();
				send.mockClear();
				return {};
			}
		}, {
			url: "https://example.com/3",
			onLoad: ({ http }) => {
				run[2] = true;
				expect(setRequestHeader).not.toBeCalled();
				expect(open).toBeCalledWith("GET", "https://example.com/3");
				expect(send).toBeCalledWith(null);
				expect(http).toEqual({
					status: 200,
					headers: {"content-length": "1084", "date": "Fri, 25 Jun 04 00:00:00 +0000", "test": "moon"},
					body: "Moon Test"
				});
				setRequestHeader.mockClear();
				open.mockClear();
				send.mockClear();
				return {};
			}
		}]
	}));

	expect(run).toEqual([true, true, true]);

	setRequestHeader.mockClear();
	open.mockClear();
	send.mockClear();
});
