module.exports = {
  rdmRgbColor() {
    let color = ''
    const arr = ['d', 'e']
    for (let i = 0; i < 5; i++) {
      color += arr[Math.floor(Math.random() * arr.length)]
    }
    return Math.random() > 0.5 ? '#' + color + 'f' : '#' + 'f' + color
  }
}