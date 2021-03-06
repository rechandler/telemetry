
import './telemetry.css'
import { useState, useEffect, useRef } from 'react'
import { ReactComponent as GearShift} from '../../img/gearshift.svg'
import Paper, {Point} from 'paper'
import widgetWrapper from '../widgetWrapper/widgetWrapper'

const Store = window.require('electron-store');
const { ipcRenderer } = window.require('electron')

const store = new Store()

const SEGMENT_LENGTH = 400
const KPH_CONVERSION = 3.6
const MPH_CONVERSION = 2.237
const TITLE = 'Telemetry'
const Telemetry = ({ isOnTrack }) => {

    const [usingMetric, setUsingMetric] = useState(store.get('telemetryWidget.useMetric'))

    const throttleCanvasRef = useRef(null)
    const brakeCanvasRef = useRef(null)
    const speedRef = useRef(null)
    const gearRef = useRef(null)
    const pitLimiterRef = useRef(null)
    
    // useEffect so the ref will be set
    useEffect(() => {
        const throttleTelemetryPath = initializePath(throttleCanvasRef.current, "rgba(40, 173, 72)", "rgba(40, 173, 72, 0.2)")
        const brakeTelemetryPath = initializePath(brakeCanvasRef.current, "rgba(225, 99, 71)", "rgba(225, 99, 71, 0.2)")

        ipcRenderer.on('telemetry', (_evt, args) => {
            editTelemetrySegments(throttleTelemetryPath, args.ThrottleRaw)
            editTelemetrySegments(brakeTelemetryPath, args.BrakeRaw)
            updateSpeed(args.Speed)
            updateGear(args.Gear)
            updatePitLimiter(args.EngineWarnings)
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

    const updatePitLimiter = warnings => {
        if (!pitLimiterRef.current) return
        const limiterOn = warnings.includes('PitSpeedLimiter')

        // Very hacky, but this prevents the slide animation on first render
        if (!limiterOn && pitLimiterRef.current.classList.contains('not-initialized')) return
        pitLimiterRef.current.classList.remove('not-initialized')

        if (limiterOn) {
            pitLimiterRef.current.classList.add('show')
            pitLimiterRef.current.classList.remove('hide') 
        } else {
            pitLimiterRef.current.classList.add('hide')
            pitLimiterRef.current.classList.remove('show') 
        }
    }

    const updateGear = (gear) => {
        if (!gearRef.current) return
        if (gear === -1) return gearRef.current.innerHTML = 'R'
        if (gear === 0) return gearRef.current.innerHTML = 'N'
        gearRef.current.innerHTML = gear
    }

    // Speed will come through in meters/second
    const updateSpeed = (speed) => {
        if (!speedRef.current) return
        const converter = getConversion()
        const converted_speed = speed * converter
        const remainder = converted_speed - Math.floor(converted_speed)
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
            <div className="Telemetry">
                <div className="Telemetry-body" style={{flexDirection: 'row'}}>
                    <div style={{ borderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', backgroundColor: 'rgba(40, 44, 60, 0.9)', boxShadow: '4px 0px 4px -3px rgba(0, 0, 0, .5)', width: 80, height: 115, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <p style={{fontSize: '3rem', color: 'rgba(255 ,255, 255, 0.8)'}}><span ref={gearRef}>N</span><span style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><span className="h-10 w-5" ><GearShift /></span></span></p>
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
                        <p style={{fontSize: '3rem', color: 'rgba(255 ,255, 255, 0.8)', display: 'flex', flexDirection: 'column'}}><span ref={speedRef}>0</span><span style={{fontSize: '1rem'}} className="h-10">{usingMetric ? 'KPH' : 'MPH'}</span></p>
                    </div>
                </div>
            </div>
            <div className="flex justify-center align-center">
                <div className='pit-limiter flex justify-center w-40 text-white bg-slate-900 relative not-initialized' ref={pitLimiterRef}>Pit Limiter<span className="animate-ping absolute inline-flex h-0.5 w-full rounded-full bg-yellow-300 opacity-100 bottom-6"></span></div>
            </div>
        </>
    )
}

export default widgetWrapper(Telemetry, TITLE)
