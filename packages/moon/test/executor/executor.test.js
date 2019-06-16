import Moon from "../../src/index";

const root = document.createElement("div");
let eventResult;
window.requestAnimationFrame = (fn) => fn();

function handler(event, data, children) {
	eventResult = { event, data, children };
}

Moon({
	name: "ExecutorTest",
	view: `
		<div>
			<for={$item, $index} of={list}>
				<if={$item % 2 === 0}>
					<p lang="en" class={$item} ariaset={{hidden: false, removeme: true}} dataset={{foo: "bar", removeme: true}} style={{color: "red", background: "blue"}} @click={handler}>{$item} {$index}</p>
				</if>
				<else-if={$item % 3 === 0}>
					<p lang="en" class={$item} id={$item} ariaset={{hidden: false, different: true}} dataset={{foo: "bar", different: true}} style={{color: "red", fontSize: "20px"}} @click={handler}>{$item} {$index}</p>
				</else-if>
				<else>
					<h6 lang="en">{$item} {$index}</h6>
				</else>
			</for>
		</div>
	`
});

Moon({
	root,
	view: "<ExecutorTest list={list} handler={handler}/>",
	data: {
		list: [],
		handler
	}
});

function verify(list) {
	const span = root.firstChild;

	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		const element = span.childNodes[i];

		if (item % 2 === 0) {
			expect(element.tagName).toEqual("P");
			expect(element.lang).toEqual("en");
			expect(element.className).toEqual(item.toString());
			expect(element.id).toEqual("");
			expect(element.getAttribute("aria-hidden")).toEqual("false");
			expect(element.getAttribute("aria-removeme")).toEqual("true");
			expect(element.getAttribute("aria-different")).toBeNull();
			expect(element.dataset.foo).toEqual("bar");
			expect(element.dataset.removeme).toEqual("true");
			expect(element.dataset.different).toBeUndefined();
			expect(element.style.color).toEqual("red");
			expect(element.style.background).toEqual("blue");
			expect(element.style.fontSize).toEqual("");
			expect(element.MoonEvent["@click"]).toBeDefined();
			expect(element.textContent).toEqual(`${item}${i}`);

			element.click();

			expect(eventResult.event.constructor).toEqual(MouseEvent);
			expect(eventResult.data).toEqual({ list, handler });
			expect(eventResult.children).toEqual([]);

			eventResult = undefined;
		} else if (item % 3 === 0) {
			expect(element.tagName).toEqual("P");
			expect(element.lang).toEqual("en");
			expect(element.className).toEqual(item.toString());
			expect(element.id).toEqual(item.toString());
			expect(element.getAttribute("aria-hidden")).toEqual("false");
			expect(element.getAttribute("aria-removeme")).toBeNull();
			expect(element.getAttribute("aria-different")).toEqual("true");
			expect(element.dataset.foo).toEqual("bar");
			expect(element.dataset.removeme).toBeUndefined();
			expect(element.dataset.different).toEqual("true");
			expect(element.style.color).toEqual("red");
			expect(element.style.background).toEqual("");
			expect(element.style.fontSize).toEqual("20px");
			expect(element.MoonEvent["@click"]).toBeDefined();
			expect(element.textContent).toEqual(`${item}${i}`);

			element.click();

			expect(eventResult.event.constructor).toEqual(MouseEvent);
			expect(eventResult.data).toEqual({ list, handler });
			expect(eventResult.children).toEqual([]);

			eventResult = undefined;
		} else {
			expect(element.tagName).toEqual("H6");
			expect(element.lang).toEqual("en");
			expect(element.className).toEqual("");
			expect(element.id).toEqual("");
			expect(element.getAttribute("aria-hidden")).toBeNull();
			expect(element.getAttribute("aria-removeme")).toBeNull();
			expect(element.getAttribute("aria-different")).toBeNull();
			expect(element.dataset.foo).toBeUndefined();
			expect(element.dataset.removeme).toBeUndefined();
			expect(element.dataset.different).toBeUndefined();
			expect(element.style.color).toEqual("");
			expect(element.style.background).toEqual("");
			expect(element.style.fontSize).toEqual("");
			expect(element.textContent).toEqual(`${item}${i}`);

			if (element.MoonEvent) {
				expect(element.MoonEvent["@click"]).toBeUndefined();
			} else {
				expect(element.MoonEvent).toBeNull();
			}

			element.click();

			expect(eventResult).toBeUndefined();
		}
	}
}

function assertExecute(before, after) {
	Moon.set({
		list: before
	});
	verify(before);
	Moon.set({
		list: after
	});
	verify(after);
}

// Replace
for (let i of [2, 3, 5]) {
	for (let j of [2, 3, 5]) {
		test(`[${i}] -> [${j}]`, () => {
			assertExecute([i], [j]);
		});
	}
}

// Append
for (let i of [2, 3, 5]) {
	for (let j of [2, 3, 5]) {
		const before = [i];
		const after = [j, j + 1, j + 2, j + 3, j * 2];

		test(`[${before.toString()}] -> [${after.toString()}]`, () => {
			assertExecute(before, after);
		});
	}
}

// Remove
for (let i of [2, 3, 5]) {
	for (let j of [2, 3, 5]) {
		const before = [i, i + 1, i + 2, i + 3, i * 2];
		const after = [j];

		test(`[${before.toString()}] -> [${after.toString()}]`, () => {
			assertExecute(before, after);
		});
	}
}
