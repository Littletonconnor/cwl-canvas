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
   * Stores the state required to remember the initial clicks.
   */
  prevCursor: PrevCursor

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
    this.prevCursor = { x: 0, y: 0, isLeft: false, isRight: false }
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

  // #==== Event handlers
  #setupEvents = (canvas: HTMLCanvasElement) => {
    window.addEventListener('resize', this.#handleWindowResize)
    // #==== Mouse Event Handlers
    canvas.addEventListener('mousedown', this.#handleMouseDown)
    canvas.addEventListener('mouseup', this.#handleMouseUp)
    canvas.addEventListener('mouseout', this.#handleMouseOut)
    canvas.addEventListener('mousemove', this.#handleMouseMove)
    canvas.addEventListener('wheel', this.#handleMouseWheel)

    // #==== Touch Event Handlers

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      //
    })

    canvas.addEventListener('touchend', (e: TouchEvent) => {
      //
    })

    canvas.addEventListener('touchcancel', (e: TouchEvent) => {
      //
    })

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      //
    })
  }

  #handleWindowResize = () => {
    this.#redrawCanvas()
  }

  #handleMouseDown = (e: MouseEvent) => {
    this.prevCursor = {
      x: e.pageX,
      y: e.pageY,
      isLeft: e.button === 0,
      isRight: e.button === 2,
    }
  }

  #handleMouseUp = (e: MouseEvent) => {
    this.prevCursor = {
      x: e.pageX,
      y: e.pageY,
      isLeft: false,
      isRight: false,
    }
  }

  #handleMouseOut = (e: MouseEvent) => {
    //
  }

  #handleMouseWheel = (e: MouseEvent) => {
    //
  }

  #handleMouseMove = (e: MouseEvent) => {
    const cursorX = e.pageX
    const cursorY = e.pageY
    const scaledX = this.#toScreenX(cursorX)
    const scaledY = this.#toScreenY(cursorY)
    const prevScaledX = this.#toScreenX(this.prevCursor.x)
    const prevScaledY = this.#toScreenY(this.prevCursor.y)

    const isLeftMouseDown = this.prevCursor.isLeft
    const isRightMouseDown = this.prevCursor.isRight

    if (isLeftMouseDown) {
      this.drawings.push({
        x0: prevScaledX,
        y0: prevScaledY,
        x1: scaledX,
        y1: scaledY,
      })

      this.#drawLine(this.prevCursor.x, this.prevCursor.y, cursorX, cursorY)
    }
    if (isRightMouseDown) {
      // move the screen.
    }

    this.prevCursor = {
      x: cursorX,
      y: cursorY,
      isLeft: isLeftMouseDown,
      isRight: isRightMouseDown,
    }
  }

  #onTouchMove = (event) => {
    console.log('EVENT', event)
  }

  // #==== Utilities

  #toScreenX = (x: number, offset = 0, scale = 1) => {
    return (x + offset) * scale
  }

  #toScreenY(y: number, offset = 0, scale = 1) {
    return (y + offset) * scale
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

interface PrevCursor {
  x: number
  y: number
  isLeft: boolean
  isRight: boolean
}

interface Drawing {
  x0: number
  y0: number
  x1: number
  y1: number
}

interface CanvasOptions {}
