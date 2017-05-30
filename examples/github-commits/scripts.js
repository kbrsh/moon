const apiUrl = 'https://api.github.com/repos/kingpixil/moon/commits?per_page=3&sha=';

const app = new Moon({
    el : "#app",
    data : {
        branches : ['master', 'gh-pages'],
        currentBranch : ''
    }
});