const Sold = require("sold");
const marked = require("marked");
const Prism = require("prismjs");

const renderer = new marked.Renderer();

const commentRE = /#(\\[^]|[^#])*#/;
Prism.languages.markup.tag.inside["attr-value"].pattern = /=([@$\w.]+|"[^"]*"|'[^']*'|`[^`]*`|\([^)]+\)|\[[^]]+\]|\{[^}]+\})/;
Prism.languages.markup.tag.inside["attr-value"].inside = Prism.languages.javascript;
Prism.languages.javascript.comment.push(commentRE);
Prism.languages.insertBefore("inside", "attr-name", { comment: commentRE }, Prism.languages.markup.tag);
Prism.languages.javascript = Prism.languages.extend("markup", Prism.util.clone(Prism.languages.javascript));

const highlight = (code, lang) => {
	if (lang === "js") {
		lang = "javascript";
	}

	if (lang in Prism.languages) {
		return Prism.highlight(code, Prism.languages[lang], lang);
	} else {
		return code;
	}
};

const play = code => `<pre class="s-x-i s-b-2 p-x-4 p-y-4"><a href="/play/#${encodeURIComponent(code)}" target="_blank" class="td-normal"><img src="/img/play.png" alt="Try in playground" class="s-x-5 s-y-5"/></a><code>${highlight(code, "javascript")}</code></pre>`;

renderer.heading = (text, level, raw, slugger) => {
	return `<h${level} id="${slugger.slug(text)}">${text}</h${level}>`;
};

renderer.paragraph = text => {
	return `<p>${text}</p>`;
};

renderer.listitem = text => {
	return `<li><p>${text}</p></li>`;
};

renderer.code = (code, lang, escaped) => {
	if (lang === "play") {
		return play(code);
	} else {
		return `<pre class="s-x-i s-b-2 p-x-4 p-y-4"><code>${highlight(code, lang)}</code></pre>`;
	}
};

renderer.codespan = code => {
	return `<code class="s-b-2 p-x-2 p-y-2">${code}</code>`;
};

Sold({
	root: __dirname,
	template: "template",
	source: "src",
	destination: "",
	marked: {
		renderer
	},
	highlight,
	play
});
