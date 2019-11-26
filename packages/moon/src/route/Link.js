import run from "moon/src/run";
import m from "moon/src/view/m";

/**
 * Link component that returns an <a> element with the given data. The element
 * will have a click event handler that will handle changing routes.
 */
export default function Link(data) {
	return <m.a {data}/>;
}
