
import { useState, useEffect, useRef } from 'react'
import Paper, {Point} from 'paper'

const { ipcRenderer } = window.require('electron')

const SEGMENT_LENGTH = 400
const MPH_CONVERSION = 2.237
const GasBreak = () => {

    let timer
    const [isOnTrack, setIsOnTrack] = useState(false)
    const throttleCanvasRef = useRef(null)
    const brakeCanvasRef = useRef(null)
    const speedRef = useRef(null)
    const gearRef = useRef(null)
    
    // useEffect so the ref will be set
    useEffect(() => {
        
        const throttleTelemetryPath = initializePath(throttleCanvasRef.current, "rgba(40, 173, 72)", "rgba(40, 173, 72, 0.2)")
        const brakeTelemetryPath = initializePath(brakeCanvasRef.current, "rgba(225, 99, 71)", "rgba(225, 99, 71, 0.2)")

        ipcRenderer.on('telemetry', (_evt, args) => {
            debounceStatus(args.IsOnTrack)
            editTelemetrySegments(throttleTelemetryPath, args.ThrottleRaw)
            editTelemetrySegments(brakeTelemetryPath, args.BrakeRaw)
            updateSpeed(args.Speed)
            updateGear(args.Gear)
        })
    }, [])

    const initializePath = (canvasCurrent, strokeColor, fillColor) => {
        const newScope = new Paper.PaperScope()
        newScope.setup(canvasCurrent)
        newScope.activate()
        const newPath = new newScope.Path();
        initTelemetryPath(newPath, strokeColor, fillColor)
        newPath.view.draw()
        return newPath
    }

    // output at 60fps means a half second debounce time is fine to use state in
    const debounceStatus = status => {
        clearTimeout(timer)
        setTimeout(() => setIsOnTrack(status), 500)
    }

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
        <>
            <div style={{display: `${isOnTrack ? 'flex' : 'none'}`}}>
                <div style={{ borderBottomLeftRadius: '25px', backgroundColor: 'rgba(40, 44, 60, 0.9)', boxShadow: '4px 0px 4px -3px rgba(0, 0, 0, .5)', width: 80, height: 115, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <p style={{fontSize: '2rem', color: 'rgba(255 ,255, 255, 0.8)'}}><span ref={gearRef}>N</span><br /><span style={{fontSize: '1rem'}}>Gear</span></p>
                </div>
                <div style={{marginTop: '2px'}}>
                    <div className="canvas">
                        <canvas ref={throttleCanvasRef} height="55" width="400" />
                    </div>
                    <div className="canvas" style={{transform: 'rotateX(180deg)'}}>
                        <canvas ref={brakeCanvasRef} height="55" width="400" />
                    </div>
                </div>
                <div style={{ borderTopRightRadius: '25px', borderBottomRightRadius: '25px', backgroundColor: 'rgba(40, 44, 60, 0.9)', boxShadow: '-4px 0px 4px -3px rgba(0, 0, 0, .5)', width: 80, height: 115, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <p style={{fontSize: '2rem', color: 'rgba(255 ,255, 255, 0.8)'}}><span ref={speedRef}>0</span> <br /><span style={{fontSize: '1rem'}}>MPH</span></p>
                </div>
            </div>
            <div style={{width: '60%', justifyContent: 'center', alignItems: 'center', display: `${isOnTrack ? 'none' : 'flex'}`}}>
                <div style={{}}>
                    <div className="lds-ripple"><div></div><div></div></div>
                </div>
                <p style={{fontSize: '1.3rem', flexGrow:1,}}>Waiting to get on the track</p>
            </div>
        </>
    )
}

export default GasBreak
