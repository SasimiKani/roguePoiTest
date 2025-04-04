// ヘルパーメソッド群

/**
 * 指定された最小値・最大値の間のランダムな整数を返す
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
