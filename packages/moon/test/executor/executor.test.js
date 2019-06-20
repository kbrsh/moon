import Moon from "../../src/index";

let root = document.createElement("span");
let eventResult;
window.requestAnimationFrame = (fn) => fn();
document.body.appendChild(root);

function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	return arr;
}

function handler(event, data, children) {
	eventResult = { event, data, children };
}

Moon({
	name: "ExecutorTest",
	view: `
		<div>
			<for={item, index} of={list}>
				<if={item % 2 === 0}>
					<p lang="en" class={item} ariaset={{hidden: false, removeme: true}} dataset={{foo: "bar", removeme: true}} style={{color: "red", background: "blue"}} @click={handler}>{item} {index}</p>
				</if>
				<else-if={item % 3 === 0}>
					<p lang="en" class={item} id={item} ariaset={{hidden: false, different: true}} dataset={{foo: "bar", different: true}} style={{color: "red", fontSize: "20px"}} @click={handler}>{item} {index}</p>
				</else-if>
				<else>
					<p lang="en">{item} {index}</p>
				</else>
			</for>
			<h1>Moon</h1>
			<p @click={handler} @dblclick={handler}>Partially static.</p>
		</div>
	`,
	data: {
		handler
	}
});

Moon({
	root,
	view: "<ExecutorTest list={list}/>",
	data: {
		list: []
	}
});

root = document.body.firstChild;

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
			expect(element.tagName).toEqual("P");
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

// Fuzz
for (let i of Array.from({ length: 100 })) {
	const before = shuffle(Array.from({ length: Math.floor(Math.random() * 100) }).map(x => Math.floor(Math.random() * 25)));
	const after = shuffle(Array.from({ length: Math.floor(Math.random() * 100) }).map(x => Math.floor(Math.random() * 25)));

	test(`fuzz [${before.toString()}] -> [${after.toString()}]`, () => {
		assertExecute(before, after);
	});
}

// Batching
test(`batch [0, 1, 2, 3, 4, 5, 6, 7] -> [7, 6, 5, 4, 3, 2, 1, 0]`, done => {
	const DateNow = window.Date.now;
	let time = 0;

	window.requestAnimationFrame = (fn) => {
		setTimeout(fn, 0);
	};

	Moon.set({
		list: [0, 1, 2, 3, 4, 5, 6, 7]
	});

	Moon.set({
		list: [7, 6, 5, 4, 3, 2, 1, 0]
	});

	setTimeout(() => {
		Moon.set({
			list: [0, 1, 2, 3, 4, 5, 6, 7]
		});

		Moon.set({
			list: [7, 6, 5, 4, 3, 2, 1, 0]
		});

		setTimeout(() => {
			window.requestAnimationFrame = (fn) => fn();
			assertExecute([7, 6, 5, 4, 3, 2, 1, 0], [7, 6, 5, 4, 3, 2, 1, 0]);
			done();
		}, 0);
	}, 0);
});
