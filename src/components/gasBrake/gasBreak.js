
import { useEffect, useRef } from 'react'
import Paper, {Point} from 'paper'
import { Segment } from 'paper/dist/paper-core'

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
        initTelemetryPath(throttleTelemetryPath, "rgba(40, 173, 72)", "rgba(40, 173, 72, 0.2)")
        throttleScope.view.draw()
        
        const brakeCanvas = brakeCanvasRef.current
        const brakeScope = new Paper.PaperScope()
        brakeScope.setup(brakeCanvas)
        brakeScope.activate()
        const brakeTelemetryPath = new brakeScope.Path(); 
        initTelemetryPath(brakeTelemetryPath, "rgba(225, 99, 71)", "rgba(225, 99, 71, 0.2)")
        brakeScope.view.draw()

        ipcRenderer.on('telemetry', (_evt, args) => { 
            editTelemetrySegments(throttleTelemetryPath, args.ThrottleRaw)
            editTelemetrySegments(brakeTelemetryPath, args.BrakeRaw)
        })
    }, [])

    const initTelemetryPath = (telemetryPath, strokeColor, fillColor) => {
        telemetryPath.strokeColor = strokeColor;
        telemetryPath.fillColor = fillColor
        // telemetryPath.strokeWidth = 2

        for (let i = 0; i < SEGMENT_LENGTH; i++) {
            telemetryPath.add(new Point(i, 100))
        }
        
        telemetryPath.smooth()
    }

    const editTelemetrySegments = (telemetryPath, throttle) => {
        
        telemetryPath.segments = telemetryPath.segments.map(segment => {
            segment.point.x--
            return segment
        })
        telemetryPath.removeSegment(1)        
        telemetryPath.removeSegment(299)        

        telemetryPath.insert(298, new Point(301, 100 - (throttle*100)))

        // Always make sure our end point is the bottom so we will close along the bottom of the path 
        telemetryPath.insert(299, new Point(301, 100))
        telemetryPath.closed = true;
        
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
