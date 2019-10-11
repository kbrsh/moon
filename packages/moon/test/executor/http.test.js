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
	error = false;

	Moon.use({
		http: Moon.http.driver
	});

	Moon.run(() => ({
		http: [{
			method: "GET",
			url: "https://example.com",
			headers: {
				test: "moon request",
				foo: "bar",
				date: "Fri, 25 Jun 04 00:00:00 +0000"
			},
			body: "Moon Test Request",
			onLoad: ({ http }) => {
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
});

test("failing http request", () => {
	error = true;

	Moon.use({
		http: Moon.http.driver
	});

	Moon.run(() => ({
		http: [{
			method: "GET",
			url: "https://example.com",
			headers: {
				test: "moon request",
				foo: "bar",
				date: "Fri, 25 Jun 04 00:00:00 +0000"
			},
			body: "Moon Test Request",
			onError: ({ http }) => {
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
});
