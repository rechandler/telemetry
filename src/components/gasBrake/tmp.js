import { useEffect, useRef } from 'react'
import Paper, {Point, CompoundPath} from 'paper'

const { ipcRenderer } = window.require('electron')

const SEGMENT_LENGTH = 300
const GasBreak = () => {

    const throttleCanvasRef = useRef(null)
    const brakeCanvasRef = useRef(null)
    
    // useEffect so the ref will be set
    useEffect(() => {
        const throttleCanvas = throttleCanvasRef.current
        const throttleScope = new Paper.PaperScope()
        throttleScope.setup(throttleCanvas)
        throttleScope.activate()

        const compoundThrottlePath = initTelemetryPath(throttleScope, "green")
        compoundThrottlePath.view.draw()
        
        // const brakeCanvas = brakeCanvasRef.current
        // const brakeScope = new Paper.PaperScope()
        // brakeScope.setup(brakeCanvas)
        // brakeScope.activate()
        // const brakeTelemetryPath = new brakeScope.Path(); 
        // initTelemetryPath(brakeTelemetryPath, "red")
        // brakeScope.view.draw()

        ipcRenderer.on('telemetry', (_evt, args) => { 
            editTelemetrySegments(compoundThrottlePath, args.ThrottleRaw)
            // editTelemetrySegments(brakeTelemetryPath, args.BrakeRaw)
        })
    }, [])

    const initTelemetryPath = (scope, color) => {
        
        const limitPath = new scope.Path()
        const basePath = new scope.Path()
        const leftPath = new scope.Path()
        const rightPath = new scope.Path()

        limitPath.strokeColor = color;
        limitPath.strokeWidth = 3;
        for (let i = 0; i < SEGMENT_LENGTH; i++) {
            limitPath.add(new Point(i, 100))
            basePath.add(new Point(i, 100))
        }

        leftPath.add(new Point(0, 100))
        leftPath.add(new Point(0, 100))
        rightPath.add(new Point(300, 100))
        rightPath.add(new Point(300, 100))

        limitPath.smooth()

        return new CompoundPath({
            children: [
                limitPath,
                leftPath,
                rightPath,
                basePath
            ],
            fillColor: 'green'
        })
    }

    const editTelemetrySegments = (compoundPath, throttle) => {
        const [telemetryPath, leftPath, rightPath, _basePath] = compoundPath.children
        
        telemetryPath.removeSegment(0)
        telemetryPath.segments = telemetryPath.segments.map(segment => {
            segment.point.x--
            return segment
        })

        const newY = 100 - (throttle * 100)
        telemetryPath.add(new Point(SEGMENT_LENGTH, newY))

        leftPath.removeSegments()
        leftPath.add(new Point(0, 100))
        leftPath.add(new Point(0, telemetryPath.segments[0].point.y))

        rightPath.removeSegments()
        rightPath.add(new Point(300, 100))
        rightPath.add(new Point(300, newY))
    }

    return (
        <>
            <div className="canvas">
                <canvas ref={throttleCanvasRef} height="100" width="300" />
            </div>
            <div className="canvas" style={{transform: 'rotateX(180deg)'}}>
                <canvas ref={brakeCanvasRef} height="100" width="300" />
            </div>
        </>
    )
}

export default GasBreak



import { useEffect, useRef } from 'react'
import Paper, {Point} from 'paper'

const { ipcRenderer } = window.require('electron')

const SEGMENT_LENGTH = 300
const GasBreak = () => {

    const throttleCanvasRef = useRef(null)
    const brakeCanvasRef = useRef(null)
    
    // useEffect so the ref will be set
    useEffect(() => {
        const throttleCanvas = throttleCanvasRef.current
        const throttleScope = new Paper.PaperScope()
        throttleScope.setup(throttleCanvas)
        throttleScope.activate()
        const throttleTelemetryPath = new throttleScope.Path();
        initTelemetryPath(throttleTelemetryPath, "green")
        throttleScope.view.draw()
        
        const brakeCanvas = brakeCanvasRef.current
        const brakeScope = new Paper.PaperScope()
        brakeScope.setup(brakeCanvas)
        brakeScope.activate()
        const brakeTelemetryPath = new brakeScope.Path(); 
        initTelemetryPath(brakeTelemetryPath, "red")
        brakeScope.view.draw()

        ipcRenderer.on('telemetry', (_evt, args) => { 
            editTelemetrySegments(throttleTelemetryPath, args.ThrottleRaw)
            editTelemetrySegments(brakeTelemetryPath, args.BrakeRaw)
        })
    }, [])

    const initTelemetryPath = (telemetryPath, color) => {

        telemetryPath.strokeColor = color;
        telemetryPath.strokeWidth = 3;
       
        for (let i = 0; i < SEGMENT_LENGTH; i++) {
            telemetryPath.add(new Point(i, 100))
        }
        telemetryPath.smooth()
    }

    const editTelemetrySegments = (telemetryPath, throttle) => {
        telemetryPath.removeSegment(0)        
        telemetryPath.segments = telemetryPath.segments.map(segment => {
            segment.point.x--
            return segment
        })
        telemetryPath.add(new Point(SEGMENT_LENGTH, 100 - (throttle*100)))
    }

    return (
        <>
            <div className="canvas">
                <canvas ref={throttleCanvasRef} height="100" width="300" />
            </div>
            <div className="canvas" style={{transform: 'rotateX(180deg)'}}>
                <canvas ref={brakeCanvasRef} height="100" width="300" />
            </div>
        </>
    )
}

export default GasBreak
