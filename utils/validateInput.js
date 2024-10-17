const filterXSS = require('xss');

module.exports = function validateInput(input) {
  // 对用户输入进行 HTML 转义
  const filterInput = filterXSS(input);
  return filterInput;
};
