
import { useEffect, useRef } from 'react'
import Paper, {Point} from 'paper'

const { ipcRenderer } = window.require('electron')

const SEGMENT_LENGTH = 400
const MPH_CONVERSION = 2.237
const GasBreak = () => {

    const throttleCanvasRef = useRef(null)
    const brakeCanvasRef = useRef(null)
    const speedRef = useRef(null)
    const gearRef = useRef(null)
    
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
            updateSpeed(args.Speed)
            updateGear(args.Gear)
        })
    }, [])

    const updateGear = (gear) => {
        if (gear === -1) return gearRef.current.innerHTML = 'R'
        if (gear === 0) return gearRef.current.innerHTML = 'N'
        gearRef.current.innerHTML = gear
    }

    // Speed will come through in meters/second
    const updateSpeed = (speed) => {
        const mph = speed * MPH_CONVERSION
        const remainder = mph - Math.floor(mph)

        // Attempt to round appropriately for speed
        speedRef.current.innerHTML = remainder > 0.5 ? Math.ceil(mph) : Math.floor(mph) 
    }

    const initTelemetryPath = (telemetryPath, strokeColor, fillColor) => {
        telemetryPath.strokeColor = strokeColor;
        telemetryPath.fillColor = fillColor

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
        telemetryPath.removeSegment(399)

        telemetryPath.insert(398, new Point(401, 55 - (throttle * 55)))

        // Always make sure our end point is the bottom so we will close along the bottom of the path 
        telemetryPath.insert(399, new Point(402, 100))
        telemetryPath.closed = true;
    }

    return (
        <div style={{display: 'flex'}}>
            <div style={{ WebkitBorderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', backgroundColor: 'rgba(40, 173, 72, 0.1)', boxShadow: '4px 0px 8px -3px black', width: 105, height: 115, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <p style={{fontSize: '2rem', color: 'rgba(255 ,255, 255, 0.8)'}}><span ref={gearRef}>N</span></p>
            </div>
            <div style={{marginTop: '2px'}}>
                <div className="canvas">
                    <canvas ref={throttleCanvasRef} height="55" width="400" />
                </div>
                <div className="canvas" style={{transform: 'rotateX(180deg)'}}>
                    <canvas ref={brakeCanvasRef} height="55" width="400" />
                </div>
            </div>
            <div style={{ borderTopRightRadius: '25px', borderBottomRightRadius: '25px', backgroundColor: 'rgba(40, 173, 72, 0.1)', boxShadow: '-4px 0px 8px -3px black', width: 105, height: 115, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <p style={{fontSize: '1.5rem', color: 'rgba(255 ,255, 255, 0.8)'}}><span ref={speedRef}>0</span> <br />MPH</p>
            </div>
        </div>
    )
}

export default GasBreak
