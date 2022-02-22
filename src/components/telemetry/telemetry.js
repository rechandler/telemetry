
import { useState, useEffect, useRef } from 'react'
import { CogIcon } from '@heroicons/react/outline'
import Paper, {Point} from 'paper'

const Store = window.require('electron-store');
const { ipcRenderer } = window.require('electron')

const store = new Store()

const SEGMENT_LENGTH = 400
const KPH_CONVERSION = 3.6
const MPH_CONVERSION = 2.237
const GasBreak = () => {

    let timer
    const [isOnTrack, setIsOnTrack] = useState(false)
    const [usingMetric, setUsingMetric] = useState(store.get('telemetryWidget.useMetric'))
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

        ipcRenderer.on('telemetryConversionUpdate', (_evt, usingMetric) => {
            setUsingMetric(usingMetric)
        })
    }, [])

    const getConversion = () => {
        return usingMetric ? KPH_CONVERSION : MPH_CONVERSION
    }

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
        const converter = getConversion()
        const converted_speed = speed * converter
        const remainder = converted_speed - Math.floor(converted_speed)

        console.log(converted_speed)
        // Attempt to round appropriately for speed
        speedRef.current.innerHTML = remainder > 0.5 ? Math.ceil(converted_speed) : Math.floor(converted_speed) 
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
            <div className="draggable widget-title flex justify-center w-40 text-white bg-slate-900">Telemetry</div>
            <div className="Telemetry">
                <div className="Telemetry-body">
                    <div style={{display: `${isOnTrack ? 'flex' : 'none'}`}}>
                        <div style={{ borderBottomLeftRadius: '25px', backgroundColor: 'rgba(40, 44, 60, 0.9)', boxShadow: '4px 0px 4px -3px rgba(0, 0, 0, .5)', width: 80, height: 115, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <p style={{fontSize: '3rem', color: 'rgba(255 ,255, 255, 0.8)'}}><span ref={gearRef}>N</span><span style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><div className="h-7 w-7" ><img src="/gearshift.svg" /></div></span></p>
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
                            <p style={{fontSize: '3rem', color: 'rgba(255 ,255, 255, 0.8)', display: 'flex', flexDirection: 'column'}}><span ref={speedRef}>0</span><span style={{fontSize: '1rem'}}>{usingMetric ? 'KPH' : 'MPH'}</span></p>
                        </div>
                    </div>
                    <div style={{width: '60%', justifyContent: 'center', alignItems: 'center', display: `${isOnTrack ? 'none' : 'flex'}`}}>
                        <div style={{}}>
                            <div className="lds-ripple"><div></div><div></div></div>
                        </div>
                        <p style={{fontSize: '1.3rem', flexGrow:1,}}>Waiting to get on the track</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default GasBreak
