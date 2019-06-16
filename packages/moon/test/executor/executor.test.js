import Moon from "../../src/index";

const root = document.createElement("div");
let eventResult;
window.requestAnimationFrame = (fn) => fn();

Moon({
	name: "ExecutorTest",
	view: `
		<div>
			<for={$item, $index} of={list} name="ul">
				<if={$item % 2 === 0}>
					<li lang="en" class={$item} ariaset={{hidden: false, removeme: true}} dataset={{foo: "bar", removeme: true}} style={{color: "red", background: "blue"}} @click={handler}>{$item} {$index}</li>
				</if>
				<else-if={$item % 3 === 0}>
					<li lang="en" class={$item} id={$item} ariaset={{hidden: false, different: true}} dataset={{foo: "bar", different: true}} style={{color: "red", fontSize: "20px"}} @click={handler}>{$item} {$index}</li>
				</else-if>
				<else>
					<li lang="en">{$item} {$index}</li>
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
		handler(event, data, children) {
			eventResult = { event, data, children };
		}
	}
});

function verify(list) {
	const ul = root.firstChild;

	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		const li = ul.childNodes[i];

		if (i % 2 === 0) {
			expect(li.lang).toEqual("en");
			expect(li.className).toEqual(item.toString());
			expect(li.getAttribute("aria-hidden")).toEqual("false");
			expect(li.getAttribute("aria-removeme")).toEqual("true");
			expect(li.dataset.foo).toEqual("bar");
			expect(li.dataset.removeme).toEqual("true");
			expect(li.style.color).toEqual("red");
			expect(li.style.background).toEqual("blue");
			expect(li.MoonEvent["@click"]).toBeDefined();
			expect(li.textContent).toEqual(`${item}${i}`);

			li.click();

			expect(eventResult.event.constructor).toEqual(MouseEvent);
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

test("[]", () => {
	assertExecute([0], [0]);
});
