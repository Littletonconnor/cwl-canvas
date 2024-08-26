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

class Canvas {
  /**
   * The canvas dom node.
   */
  canvas: HTMLCanvasElement | null

  /**
   * Stores the canvas rendering context for drawing.
   */
  context: CanvasRenderingContext2D | null

  /**
   * Handles internal state of the canvas like cursor position
   */
  state: State

  /**
   * A history of all the drawings you've made, which is used for things like `undo`.
   */
  drawings: Drawing[]

  /**
   * Options for customizing the canvas.
   */
  options: Record<string, any>

  constructor(element: HTMLCanvasElement | null, options: CanvasOptions = {}) {
    this.canvas = element
    this.context = this.canvas?.getContext('2d') ?? null
    this.options = options
    this.state = { x: 0, y: 0, offsetX: 0, offsetY: 0, scale: 1, isLeft: false, isRight: false }
    this.drawings = []

    // TODO: move to a base class since.
    if (!this.canvas) {
      throw new Error('<canvas> element with id cwl-canvas was not found')
    }
    if (!this.context) {
      throw new Error('<canvas> element is missing context 2d')
    }

    this.#redrawCanvas()
    this.#setupEvents(this.canvas)
    this.print()
  }

  #drawLine(x0: number, y0: number, x1: number, y1: number) {
    if (!this.context) {
      // TODO: figure out how to type this so we don't need to do null checks
      throw new Error('This should not happen.')
    }

    this.context.beginPath()
    this.context.moveTo(x0, y0)
    this.context.lineTo(x1, y1)
    this.context.strokeStyle = '#000'
    this.context.lineWidth = 2
    this.context.stroke()
  }

  #redrawCanvas = () => {
    const canvas = this.canvas
    const context = this.context
    const drawings = this.drawings

    if (!canvas) {
      return
    } else if (!context) {
      return
    }

    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight

    for (let i = 0; i < drawings.length; i++) {
      const line = drawings[i]
      this.#drawLine(
        this.#toScreenX(line.x0),
        this.#toScreenY(line.y0),
        this.#toScreenX(line.x1),
        this.#toScreenY(line.y1),
      )
    }
  }

  #setupEvents = (canvas: HTMLCanvasElement) => {
    // Disable right clicking
    document.oncontextmenu = function () {
      return false
    }

    // #==== Global Event Handlers
    window.addEventListener('resize', this.#handleWindowResize)

    // #==== Mouse Event Handlers
    canvas.addEventListener('mousedown', this.#handleMouseDown)
    canvas.addEventListener('mouseup', this.#handleMouseUp)
    canvas.addEventListener('mouseout', this.#handleMouseOut)
    canvas.addEventListener('mousemove', this.#handleMouseMove)
    canvas.addEventListener('wheel', this.#handleMouseWheel)

    // #==== Touch Event Handlers
    canvas.addEventListener('touchstart', this.#handleTouchStart)
    canvas.addEventListener('touchend', this.#handleTouchEnd)
    canvas.addEventListener('touchcancel', this.#handleTouchCancel)
    canvas.addEventListener('touchmove', this.#handleTouchMove)
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
    const scaledX = this.#toScreenX(cursorX)
    const scaledY = this.#toScreenY(cursorY)
    const prevScaledX = this.#toScreenX(this.state.x)
    const prevScaledY = this.#toScreenY(this.state.y)

    const isLeftMouseDown = this.state.isLeft
    const isRightMouseDown = this.state.isRight

    if (isLeftMouseDown) {
      this.drawings.push({
        x0: prevScaledX,
        y0: prevScaledY,
        x1: scaledX,
        y1: scaledY,
      })

      this.#drawLine(this.state.x, this.state.y, cursorX, cursorY)
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
  print() {
    console.log('CANVAS', this.canvas)
  }
}

// #==== Types

interface State {
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

interface Drawing {
  x0: number
  y0: number
  x1: number
  y1: number
}

interface CanvasOptions {}
