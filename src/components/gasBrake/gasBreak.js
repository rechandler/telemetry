
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
        initTelemetryPath(throttleTelemetryPath, "#66CDAA")
        throttleScope.view.draw()
        
        const brakeCanvas = brakeCanvasRef.current
        const brakeScope = new Paper.PaperScope()
        brakeScope.setup(brakeCanvas)
        brakeScope.activate()
        const brakeTelemetryPath = new brakeScope.Path(); 
        initTelemetryPath(brakeTelemetryPath, "	#FF6347")
        brakeScope.view.draw()

        ipcRenderer.on('telemetry', (_evt, args) => { 
            editTelemetrySegments(throttleTelemetryPath, args.ThrottleRaw)
            editTelemetrySegments(brakeTelemetryPath, args.BrakeRaw)
        })
    }, [])

    const initTelemetryPath = (telemetryPath, color) => {

        telemetryPath.strokeColor = color;
        telemetryPath.strokeWidth = 3
       
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
        
        // This will fill it in by completing the line
        telemetryPath.add(telemetryPath.view.bounds.bottomRight)
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
