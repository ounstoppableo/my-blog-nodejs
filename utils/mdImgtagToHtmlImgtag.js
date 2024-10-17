module.exports = function mdImgtagToHtmlImgtag(string) {
  return string
    .replace(/src=[\'\"]?([^\'\"]*)[\'\"]?/gi, replacer)
    .replace(/\!\[\]\(.*?\)/g, replacer2);
};
function replacer(match) {
  return 'src="/images/' + match.split('\\').pop();
}
function replacer2(match) {
  if (match.includes('/'))
    return '<img src="/images/' + match.split('/').pop().split(')')[0] + '" />';
  if (match.includes('\\'))
    return (
      '<img src="/images/' + match.split('\\').pop().split(')')[0] + '" />'
    );
}
