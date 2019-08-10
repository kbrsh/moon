import Moon from "moon/src/index";

test("time as input", () => {
	window.Date.now = jest.fn(() => 7);

	Moon.use({
		time: Moon.time.driver
	});

	Moon.run(({ time }) => {
		expect(Date.now).toBeCalled();
		expect(time).toEqual(7);

		return {};
	});
});

test("timeouts as output", () => {
	jest.useFakeTimers();

	window.Date.now = jest.fn(() => 7);
	const timer100 = jest.fn(() => ({}));
	const timer200 = jest.fn(() => ({}));
	const timer300 = jest.fn(() => ({}));
	const timer1000 = jest.fn(() => ({}));
	const timer2000 = jest.fn(() => ({}));
	const timer3000 = jest.fn(() => ({}));

	Moon.use({
		time: Moon.time.driver
	});

	Moon.run(({ time }) => {
		expect(Date.now).toBeCalled();
		expect(time).toEqual(7);

		return {
			time: {
				100: timer100,
				200: timer200,
				300: timer300,
				1000: timer1000,
				2000: timer2000,
				3000: timer3000
			}
		};
	});

	expect(setTimeout).toHaveBeenCalledTimes(6);

	expect(timer100).toHaveBeenCalledTimes(0);
	expect(timer200).toHaveBeenCalledTimes(0);
	expect(timer300).toHaveBeenCalledTimes(0);
	expect(timer1000).toHaveBeenCalledTimes(0);
	expect(timer2000).toHaveBeenCalledTimes(0);
	expect(timer3000).toHaveBeenCalledTimes(0);

	jest.runAllTimers();

	expect(timer100).toHaveBeenCalledTimes(1);
	expect(timer200).toHaveBeenCalledTimes(1);
	expect(timer300).toHaveBeenCalledTimes(1);
	expect(timer1000).toHaveBeenCalledTimes(1);
	expect(timer2000).toHaveBeenCalledTimes(1);
	expect(timer3000).toHaveBeenCalledTimes(1);
});
