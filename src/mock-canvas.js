module.exports = {
  createCanvas: (width, height) => ({
    width,
    height,
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x, y, w, h) => ({ data: new Array(w*h*4) }),
      putImageData: () => {},
      createImageData: (w, h) => ({ data: new Array(w*h*4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: (text) => ({ width: text.length * 10 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    })
  })
}