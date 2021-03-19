function scientToNum(num, decimal = 16) {
  //处理非数字
  if (!num) return 0
  if (isNaN(num)) { return num.toString()};

  //处理不需要转换的数字
  let str = '' + num;
  if (!/e/i.test(str)) { return num.toString()};

  return (num).toFixed(decimal).replace(/\.?0+$/, "");
}
module.exports = {scientToNum}
