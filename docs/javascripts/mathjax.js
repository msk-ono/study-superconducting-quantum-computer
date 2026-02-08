window.MathJax = {
    tex: {
        inlineMath: [["\\(", "\\)"], ["$", "$"]],
        displayMath: [["\\[", "\\]"], ["$$", "$$"]],
        processEscapes: true,
        processEnvironments: true
    },
    options: {
        ignoreHtmlClass: ".*",
        processHtmlClass: "arithmatex"
    }
};

document$.subscribe(() => {
    if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
        // Use a small timeout to allow the DOM to settle and transitions to finish
        setTimeout(() => {
            MathJax.typesetPromise()
                .catch((err) => console.warn('MathJax typesetting failed:', err));
        }, 50);
    }
});
