import { useEffect, useRef } from 'react'
import { Inter } from 'next/font/google'

import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

// TODO: Changing tools works, but the redrawing is a little messed up so need to figure out why.

export default function Home() {
  // TODO: fix the type here
  const canvasRef = useRef<any>(null)
  const canvasEl = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const options = {}
    const canvas = new Canvas(canvasEl.current, options)
    canvasRef.current = canvas

    return () => {
      canvas.dispose()
    }
  }, [])

  return (
    <main className={cn('relative size-full', inter.className)}>
      <canvas ref={canvasEl} className="absolute inset-0 size-full" id="cwl-canvas">
        Your browser does not support HTML5 canvas
      </canvas>
      {/* TODO: Pull this out into a toolbar component */}
      <div className="pointer-events-none relative grid size-full max-h-full grid-cols-1 grid-rows-[minmax(0px,_1fr)_auto]">
        <div className="row-[2] flex justify-center rounded-xl pb-4">
          <div className="pointer-events-auto z-50 flex h-12 items-center rounded-xl shadow-[0_0_2px_hsl(0,0%,0%,0.16),0_2px_3px_hsl(0,0%,0%,0.24),0_2px_6px_hsl(0,0%,0%,0.1),inset_0_0_0_1px_rgb(255,255,255)]">
            <button className="px-2" onClick={() => {}}>
              Grab
            </button>
            <button
              className="px-2"
              onClick={() => {
                canvasRef.current.drawingTool = 'line'
              }}
            >
              Line
            </button>
            <button
              className="px-2"
              onClick={() => {
                canvasRef.current.drawingTool = 'rectangle'
              }}
            >
              Rectangle
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

// #==== Base Class
class BaseCanvas {
  /**
   * Handles internal state of the canvas like cursor position
   */
  state: State

  /**
   * Options for customizing the canvas.
   */
  options: Record<string, any>

  /**
   * The canvas dom node.
   */
  canvas: HTMLCanvasElement | null

  /**
   * Stores the canvas rendering context for drawing.
   */
  context: CanvasRenderingContext2D | null

  /**
   * Represents the current drawing.
   */
  currentDrawing: CurrentDrawing

  /**
   * A history of all the drawings you've made, which is used for things like `undo`.
   */
  drawings: Drawing[]

  constructor(element: HTMLCanvasElement | null, options: CanvasOptions = {}) {
    this.state = {
      tool: options.tool ?? 'line',
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      isLeft: false,
      isRight: false,
    }
    this.options = options
    this.currentDrawing = {
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 0,
    }
    this.drawings = []
    this.canvas = element
    this.context = this.canvas?.getContext('2d') ?? null

    if (!this.canvas) {
      throw new Error('<canvas> element with id cwl-canvas was not found')
    }
    if (!this.context) {
      throw new Error('<canvas> element is missing context 2d')
    }
  }
}

class Canvas extends BaseCanvas {
  constructor(element: HTMLCanvasElement | null, options: CanvasOptions = {}) {
    super(element, options)

    this.#redrawCanvas()
    this.#setupEvents()
    this.print()
  }

  // #==== Drawing utilities
  #determineDrawingTool(drawing: Drawing) {
    switch (this.state.tool) {
      case 'line':
        return this.#drawLine(drawing)
      case 'rectangle':
        return this.#drawRectangle(drawing)
      case 'text':
        return this.#drawLine(drawing)
      default:
        throw new Error('Unsupported drawing tool provided.')
    }
  }

  #drawLine(drawing: Drawing) {
    const x0 = this.#toScreenX(drawing.x0)
    const y0 = this.#toScreenY(drawing.y0)
    const x1 = this.#toScreenX(drawing.x1)
    const y1 = this.#toScreenY(drawing.y1)

    this.context!.beginPath()
    this.context!.moveTo(x0, y0)
    this.context!.lineTo(x1, y1)
    this.context!.strokeStyle = '#000'
    this.context!.lineWidth = 2
    this.context!.stroke()
  }

  #drawRectangle(drawing: Drawing) {
    const x0 = this.#toScreenX(drawing.x0)
    const y0 = this.#toScreenY(drawing.y0)
    const x1 = this.#toScreenX(drawing.x1)
    const y1 = this.#toScreenY(drawing.y1)

    const width = x1 - x0
    const height = y1 - y0

    this.context!.beginPath()
    this.context!.rect(x0, y0, width, height)
    this.context!.strokeStyle = '#000'
    this.context!.lineWidth = 2
    this.context!.stroke()
  }

  #redrawCanvas = () => {
    const canvas = this.canvas
    canvas!.width = document.body.clientWidth
    canvas!.height = document.body.clientHeight

    for (const drawing of this.drawings) {
      this.#determineDrawingTool(drawing)
    }

    if (this.currentDrawing) {
      this.#determineDrawingTool(this.currentDrawing)
    }
  }

  #setupEvents = () => {
    // Disable right clicking
    document.oncontextmenu = function () {
      return false
    }

    // #==== Global Event Handlers
    window.addEventListener('resize', this.#handleWindowResize)

    // #==== Mouse Event Handlers
    this.canvas!.addEventListener('mousedown', this.#handleMouseDown)
    this.canvas!.addEventListener('mouseup', this.#handleMouseUp)
    this.canvas!.addEventListener('mouseout', this.#handleMouseOut)
    this.canvas!.addEventListener('mousemove', this.#handleMouseMove)
    this.canvas!.addEventListener('wheel', this.#handleMouseWheel)

    // #==== Touch Event Handlers
    this.canvas!.addEventListener('touchstart', this.#handleTouchStart)
    this.canvas!.addEventListener('touchend', this.#handleTouchEnd)
    this.canvas!.addEventListener('touchcancel', this.#handleTouchCancel)
    this.canvas!.addEventListener('touchmove', this.#handleTouchMove)
  }

  #handleWindowResize = () => {
    this.#redrawCanvas()
  }

  // #==== Mouse Events

  #handleMouseOut = (e: MouseEvent) => {
    console.log('handleMouseOut', e)
  }

  #handleMouseWheel = (e: MouseEvent) => {
    console.log('handleMouseOut', e)
  }

  #handleMouseDown = (e: MouseEvent) => {
    this.state = {
      ...this.state,
      x: e.pageX,
      y: e.pageY,
      isLeft: e.button === 0,
      isRight: e.button === 2,
    }

    if (this.state.isLeft) {
      const startX = this.#toTrueX(e.pageX)
      const startY = this.#toTrueY(e.pageY)

      this.#setCurrentDrawing({
        x0: startX,
        y0: startY,
        x1: startX,
        y1: startY,
      })

      this.#redrawCanvas()
    }
  }

  #handleMouseUp = () => {
    if (this.currentDrawing) {
      this.drawings.push(this.currentDrawing)
      this.#setCurrentDrawing({
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 0,
      })
    }
    this.#setState({
      isLeft: false,
      isRight: false,
    })

    this.#redrawCanvas()
  }

  #handleMouseMove = (e: MouseEvent) => {
    console.log('MOVE')
    const cursorX = e.pageX
    const cursorY = e.pageY
    const prevScaledX = this.#toTrueX(this.state.x)
    const prevScaledY = this.#toTrueY(this.state.y)
    const scaledX = this.#toTrueX(cursorX)
    const scaledY = this.#toTrueY(cursorY)

    const tool = this.state.tool
    const isLeftMouseDown = this.state.isLeft
    const isRightMouseDown = this.state.isRight

    if (isLeftMouseDown) {
      // ==== Attempt to not always update drawings array.
      // create a current drawing state so that I can optionally update this
      // for shapes like rectangles.

      if (tool === 'line') {
        this.#setCurrentDrawing({
          x0: prevScaledX,
          y0: prevScaledY,
          x1: scaledX,
          y1: scaledY,
        })
        this.#updateDrawings({
          x0: prevScaledX,
          y0: prevScaledY,
          x1: scaledX,
          y1: scaledY,
        })
      } else if (tool === 'rectangle') {
        // For rectangle's we only update the x1,y1 positions and then add the drawing to our drawings array once the mouseUp event is triggered.
        // This is different then lines where we constantly add each point to the drawings array.
        this.#setCurrentDrawing({
          x1: scaledX,
          y1: scaledY,
        })
      }
    }
    if (isRightMouseDown) {
      // move the screen.
      const offsetX = (cursorX - this.state.x) / this.state.scale
      const offsetY = (cursorY - this.state.y) / this.state.scale
      this.#setState({
        offsetX: this.state.offsetX + offsetX,
        offsetY: this.state.offsetY + offsetY,
      })
    }

    this.#redrawCanvas()

    this.#setState({
      x: cursorX,
      y: cursorY,
      isLeft: isLeftMouseDown,
      isRight: isRightMouseDown,
    })
  }

  // #==== Touch events

  #handleTouchStart = (e: TouchEvent) => {
    console.log('touchstart', e)
  }

  #handleTouchEnd = (e: TouchEvent) => {
    console.log('touchend', e)
  }

  #handleTouchCancel = (e: TouchEvent) => {
    console.log('touchcancel', e)
  }

  #handleTouchMove = (e: TouchEvent) => {
    console.log('touchmove', e)
  }

  // #==== Utilities

  #toTrueX = (x: number) => {
    return x / this.state.scale - this.state.offsetX
  }

  #toTrueY = (y: number) => {
    return y / this.state.scale - this.state.offsetY
  }

  #toTrueHeight = () => {
    return this.canvas!.clientHeight / this.state.scale
  }

  #toTrueWidth = () => {
    return this.canvas!.clientWidth / this.state.scale
  }

  #toScreenX = (x: number) => {
    return (x + this.state.offsetX) * this.state.scale
  }

  #toScreenY = (y: number) => {
    return (y + this.state.offsetY) * this.state.scale
  }

  set drawingTool(drawingTool: Tool) {
    this.state.tool = drawingTool
  }

  #setCurrentDrawing(currentDrawing: Partial<CurrentDrawing>) {
    this.currentDrawing = {
      ...this.currentDrawing,
      ...currentDrawing,
    }
  }

  #setState(state: Partial<State>) {
    this.state = {
      ...this.state,
      ...state,
    }
  }

  #updateDrawings(drawing: Drawing) {
    this.drawings.push(drawing)
  }

  /**
   * Destroy the canvas element.
   */
  dispose() {
    // TODO: Destroy the canvas element here
  }

  /**
   * Prints internal state for debugging.
   */
  print() {
    console.log('STATE', this.state)
    console.log('Drawings', this.drawings)
    console.log('Current Drawing', this.currentDrawing)
  }
}

// #==== Types

interface State {
  tool: Tool
  /**
   * The current x position.
   */
  x: number

  /**
   * The current y position.
   */
  y: number

  /**
   * The distance from the origin on the x axis.
   */
  offsetX: number

  /**
   * The distance from the origin on the y axis.
   */
  offsetY: number

  /**
   * Determines whether there was a left mouse click.
   */
  isLeft: boolean

  /**
   * Determines whether there was a right mouse click.
   */
  isRight: boolean

  /**
   * The current zoom scale of the document
   */
  scale: number
}

type Tool = 'line' | 'rectangle' | 'text'

interface Drawing {
  x0: number
  y0: number
  x1: number
  y1: number
}

interface CurrentDrawing {
  x0: number
  y0: number
  x1: number
  y1: number
}

interface CanvasOptions {
  tool?: Tool
}
