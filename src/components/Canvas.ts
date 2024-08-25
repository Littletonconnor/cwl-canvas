
class Canvas {
  canvas: HtmlCanvas

  constructor (element: HtmlCanvas, options: CanvasOptions = {}) {
    this.canvas = element
    this.print();
  }

  /**
   * Destroy the canvas element
   */
  dispose () {
    // TODO: Destroy the canvas element here
  }

  print () {
    console.log("CANVAS", this.canvas)
  }
}

// #==== Types

type HtmlCanvas = HTMLCanvasElement | null

interface CanvasOptions {

}

export {Canvas}
