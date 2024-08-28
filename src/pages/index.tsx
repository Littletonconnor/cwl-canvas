import { useEffect, useRef } from 'react'
import { Inter } from 'next/font/google'

import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const canvasEl = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const options = {}
    const canvas = new Canvas(canvasEl.current, options)

    return () => {
      canvas.dispose()
    }
  }, [])

  return (
    <main className={cn('relative flex min-h-screen flex-col items-center', inter.className)}>
      <div className="flex">
        <h1>Canvas App</h1>
      </div>
      <canvas ref={canvasEl} className="absolute inset-0 size-full" id="cwl-canvas">
        Your browser does not support HTML5 canvas
      </canvas>
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
   * A history of all the drawings you've made, which is used for things like `undo`.
   */
  drawings: Drawing[]

  constructor(element: HTMLCanvasElement | null, options: CanvasOptions = {}) {
    this.state = {
      tool: 'line',
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      isLeft: false,
      isRight: false,
    }
    this.options = options
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
    switch (drawing.tool) {
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

    this.context!.beginPath()
    this.context!.moveTo(x0, y0)
    this.context!.lineTo(x1, y1)
    this.context!.strokeStyle = '#000'
    this.context!.lineWidth = 2
    this.context!.stroke()
  }

  #redrawCanvas = () => {
    console.log('CALLING REDRAW')
    const canvas = this.canvas
    const drawings = this.drawings

    canvas!.width = document.body.clientWidth
    canvas!.height = document.body.clientHeight

    for (let i = 0; i < drawings.length; i++) {
      const drawing = drawings[i]
      this.#determineDrawingTool(drawing)
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

  #handleMouseDown = (e: MouseEvent) => {
    this.state = {
      ...this.state,
      x: e.pageX,
      y: e.pageY,
      isLeft: e.button === 0,
      isRight: e.button === 2,
    }
  }

  #handleMouseUp = (e: MouseEvent) => {
    this.state = {
      ...this.state,
      x: e.pageX,
      y: e.pageY,
      isLeft: false,
      isRight: false,
    }
  }

  #handleMouseOut = (e: MouseEvent) => {
    console.log('handleMouseOut', e)
  }

  #handleMouseWheel = (e: MouseEvent) => {
    console.log('handleMouseOut', e)
  }

  #handleMouseMove = (e: MouseEvent) => {
    const cursorX = e.pageX
    const cursorY = e.pageY
    const scaledX = this.#toTrueX(cursorX)
    const scaledY = this.#toTrueY(cursorY)
    const prevScaledX = this.#toTrueX(this.state.x)
    const prevScaledY = this.#toTrueY(this.state.y)

    const isLeftMouseDown = this.state.isLeft
    const isRightMouseDown = this.state.isRight

    if (isLeftMouseDown) {
      this.drawings.push({
        tool: this.state.tool,
        x0: prevScaledX,
        y0: prevScaledY,
        x1: scaledX,
        y1: scaledY,
      })

      this.#drawLine({
        x0: this.state.x,
        y0: this.state.y,
        x1: cursorX,
        y1: cursorY,
        tool: this.state.tool,
      })
    }
    if (isRightMouseDown) {
      // move the screen.
      const offsetX = (cursorX - this.state.x) / this.state.scale
      const offsetY = (cursorY - this.state.y) / this.state.scale
      this.#updateState({
        offsetX: this.state.offsetX + offsetX,
        offsetY: this.state.offsetY + offsetY,
      })
      this.#redrawCanvas()
    }

    this.#updateState({
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

  #toTrueY(y: number) {
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

  #toScreenY(y: number) {
    return (y + this.state.offsetY) * this.state.scale
  }

  #updateState(state: Partial<State>) {
    this.state = {
      ...this.state,
      ...state,
    }
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
  print() {}
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
  tool: Tool
  x0: number
  y0: number
  x1: number
  y1: number
}

interface CanvasOptions {}
