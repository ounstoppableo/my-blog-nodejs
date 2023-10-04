module.exports = function mdImgtagToHtmlImgtag(string) {
    return string.replace(/src=[\'\"]?([^\'\"]*)[\'\"]?/gi, replacer).replace(/\!\[\]\(.*?\)/g, replacer2).replace(/\!\[\]\(.*?\)/g, replacer3)
}
function replacer(match) {
    return "src=\"/images/" + match.split('\\').pop()
}
function replacer2(match) {
    return "![](\\images\\" + match.split('\\').pop()
}
function replacer3(match) {
    return "![](\\images\\" + match.split('/').pop()
}