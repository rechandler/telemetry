import { useRef, useEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'
import WidgetWrapper from '../widgetWrapper/widgetWrapper'
const { ipcRenderer } = window.require('electron')

const RelativePosition = () => {
    const wrapperRef = useRef()
    const [drivers, setDrivers] = useState(null)
    const [driverInfo, setDriverInfo] = useState(null)
    const [sessionInfo, setSessionInfo] = useState(null)
    const [paceCarIdx, setPaceCarIdx] = useState(null)
    const [currentSessionNumber, setSessionNum] = useState(0)
    const [driverLaps, setDriverLaps] = useState(0)
    const [lastLap, setLastLap] = useState(null)
    const [initialized, setInitialized] = useState(null)

    useEffect(() => {
        ipcRenderer.on('sessionInfo', (_evt, { data: { DriverInfo, SessionInfo } }) => {
            setSessionInfo(SessionInfo)
            setDriverInfo(DriverInfo)
            setDrivers(DriverInfo.Drivers)
            setPaceCarIdx(DriverInfo.PaceCarIdx)
        })
    }, [])

    useEffect(() => {
        const throttleFunction = (func, delay) => {
            // Previously called time of the function
            let prev = 0;
            return (...args) => {
                // Current called time of the function
                let now = new Date().getTime();

                // If difference is greater than delay call
                // the function again.
                if (now - prev > delay) {
                    prev = now;

                    // "..." is the spread operator here
                    // returning the function with the
                    // array of arguments
                    return func(...args);
                }
            }
        }
        if (drivers && driverInfo && paceCarIdx && !initialized) {
            setInitialized(true)
            ipcRenderer.on('telemetry', throttleFunction((_evt, { SessionNum, SessionFlags, CarIdxLapCompleted, CarIdxLapDistPct, CarIdxPosition, CarIdxEstTime, PlayerCarIdx, CarIdxOnPitRoad, LapLastLapTime }) => {
                if (drivers && driverInfo) {
                    const paceCarOut = SessionFlags.includes('CautionWaving') || SessionFlags.includes('Caution')
                    updatePositions(CarIdxLapDistPct, PlayerCarIdx, CarIdxEstTime, CarIdxPosition, CarIdxOnPitRoad, CarIdxLapCompleted, paceCarOut)
                    if (SessionNum != currentSessionNumber) setSessionNum(SessionNum);
                    if (LapLastLapTime != lastLap) setLastLap(LapLastLapTime)
                }
            }, 100))
        }
        
    }, [drivers, driverInfo, paceCarIdx])

    const updatePositions = (carIdxLapDistPct, playerCarIdx, carIdxEstTime, carIdxPosition, carIdxOnPitRoad, carIdxLapCompleted, paceCarOut) => {
        let sorted = carIdxLapDistPct
            .map((pct, idx) => ({ idx, pct }))
            .sort((a, b) => a.pct < b.pct ? 1 : -1)
            .filter((driver) => {
                if(driver.idx === paceCarIdx && !paceCarOut) return false
                return driver.pct > -1
            })

        const driverIndex = sorted.findIndex((driver) => driver.idx === playerCarIdx)
        const sessionDriver = sorted[driverIndex]

        sessionDriver.position = carIdxPosition[playerCarIdx]
        sessionDriver.onPitRoad = carIdxOnPitRoad[playerCarIdx]
        sessionDriver.lapsCompleted = carIdxLapCompleted[playerCarIdx]
        sessionDriver.lapDelta = 0
        const driverEstimateLap = carIdxEstTime[playerCarIdx]
        if (sessionDriver.lapsCompleted !== driverLaps) setDriverLaps(sessionDriver.lapsCompleted)

        const carsAhead = []
        for (let i = 1; i < 4; i++) {
            const oppIndex = ((driverIndex - i) % sorted.length + sorted.length) % sorted.length
            const driverAhead = sorted[oppIndex]
            if (!driverAhead || driverAhead.placed) break;
            if (
                (driverAhead.pct > sessionDriver.pct && driverAhead.pct - sessionDriver.pct < .5) ||
                (driverAhead.pct < sessionDriver.pct && sessionDriver.pct - driverAhead.pct > .5)
            ) {
                driverAhead.placed = true
                driverAhead.delta = getDeltaAhead(carIdxEstTime[driverAhead.idx], driverEstimateLap, oppIndex !== driverIndex - i)
                driverAhead.position = carIdxPosition[driverAhead.idx]
                driverAhead.onPitRoad = carIdxOnPitRoad[driverAhead.idx]
                driverAhead.lapsCompleted = carIdxLapCompleted[driverAhead.idx]
                driverAhead.lapDelta = getLapDelta(driverAhead.lapsCompleted, sessionDriver.lapsCompleted)
                carsAhead.unshift(driverAhead)
            }
        }

        if (carsAhead.length < 3) {
            do {
                carsAhead.unshift(null)
            } while (carsAhead.length < 3)
        }

        const carsBehind = []
        let paceCarWrap
        for (let i = 1; i < 4; i++) {
            const oppIndex = ((driverIndex + i) % sorted.length + sorted.length) % sorted.length
            const driverBehind = sorted[oppIndex]
            if (!driverBehind || driverBehind.placed) break;
            if (
                (driverBehind.pct < sessionDriver.pct && sessionDriver.pct - driverBehind.pct < .5) ||
                (driverBehind.pct > sessionDriver.pct && driverBehind.pct - sessionDriver.pct > .5)
            ) {
                driverBehind.placed = true
                driverBehind.delta = getDeltaBehind(carIdxEstTime[driverBehind.idx], driverEstimateLap, oppIndex !== driverIndex + i)
                driverBehind.position = carIdxPosition[driverBehind.idx]
                driverBehind.onPitRoad = carIdxOnPitRoad[driverBehind.idx]
                driverBehind.lapsCompleted = carIdxLapCompleted[driverBehind.idx]
                driverBehind.lapDelta = getLapDelta(driverBehind.lapsCompleted, sessionDriver.lapsCompleted)
                carsBehind.push(driverBehind)
            }
        }

        if (carsBehind.length < 3) {
            do {
                carsBehind.push(null)
            } while (carsBehind.length < 3)
        }

        const result = [...carsAhead, sessionDriver, ...carsBehind].map((driver, mapIdx) => {
            if (!driver) {
                return (
                    <tr key={mapIdx} style={{ color: 'rgba(255 ,255, 255, 0.8)' }}>
                        <td>&nbsp;</td>
                    </tr>
                )
            }
            const isRace = sessionInfo.Sessions[currentSessionNumber].SessionType === 'Race'
            return (
                <tr key={mapIdx} style={{ color: 'rgba(255 ,255, 255, 0.8)' }} className={getRowClasses(driver, isRace, mapIdx, sessionDriver)}>
                    <td>
                        {driverIsPaceCar(driver) ? '--' : driver.position || '-'}
                    </td>
                    <td>
                        {driverIsPaceCar(driver) ? '--' : `#${drivers[driver.idx].CarNumber}`}
                    </td>
                    <td>
                        {drivers[driver.idx].UserName}
                    </td>
                    {!driverIsPaceCar(driver) && <td>
                        {parseFloat(driver.delta ? driver.delta - 1 : 0.0).toFixed(1)}
                    </td>}
                    {driverIsPaceCar(driver) && <td>
                        {paceCarWrap ? '--' : parseFloat(driver.delta ? driver.delta - 1 : 0.0).toFixed(1)}
                    </td>}
                </tr>
            )
        })

        wrapperRef.current.innerHTML = renderToString(result)
    }

    const driverIsPaceCar = (driver) => {
        if (driver.idx === paceCarIdx) return true
    }

    const getLapDelta = (oppLapsCompleted, driverLapsCompleted) => {
        if (oppLapsCompleted === driverLapsCompleted) return 0
        return oppLapsCompleted > driverLapsCompleted ? 1 : 0
    }

    const getDeltaAhead = (oppEstTime, driverEstTime, wrappedAround) => {
        if (wrappedAround) {            
            return ((driverInfo.DriverCarEstLapTime - driverEstTime) + oppEstTime) + 1

        }
        return (oppEstTime - driverEstTime) + 1
    }

    const getDeltaBehind = (oppEstTime, driverEstTime, wrappedAround) => {
        if (wrappedAround) {
            return (((driverInfo.DriverCarEstLapTime - oppEstTime) + driverEstTime) + 1) * -1
        }
        return (oppEstTime - driverEstTime) + 1
    }

    if (!drivers) {
        return (
            <div className="widget-body h-auto w-full flex flex-col p-7 bg-e3  shadow-md shadow-black gap-2">
                No Drivers
            </div>
        )
    }

    const getRowClasses = (driver, isRace, index, sessionDriver) => {
        // Don't worry about lap deltas in anything other than a race
        if (!isRace) return driver.onPitRoad ? 'bg-gradient-to-r from-pit to-transparent' : '';

        if (driver.idx === paceCarIdx) return 'bg-gradient-to-r from-pit to-transparent';

        const lapDelta = sessionDriver.lapsCompleted - driver.lapsCompleted
        if (index === 3 && driver.onPitRoad) return 'bg-gradient-to-r from-pit to-transparent'

        if (index < 3) {
            // driver is in front of session driver

            if (lapDelta > 0) {
                // session driver has done more laps
                if (driver.onPitRoad) return 'bg-gradient-to-l from-pit via-transparent to-cyan-600'
                return 'bg-gradient-to-r from-cyan-600 to-transparent'
            }

            if (lapDelta < 0) {
                if (lapDelta === -1 && driver.pct < sessionDriver.pct) {
                    // driver has crossed s/f line increasing their delta by 1
                    if (driver.onPitRoad) return 'bg-gradient-to-r from-pit to-transparent'
                    return ''
                }

                // driver has done more laps
                if (driver.onPitRoad) return 'bg-gradient-to-l from-pit via-transparent to-red-700'
                return 'bg-gradient-to-r from-red-700 to-transparent'
            }

            if (lapDelta === 0) {
                if (driver.pct < sessionDriver.pct) {
                    // session driver about to lap over s/f line
                    if (driver.onPitRoad) return 'bg-gradient-to-l from-pit via-transparent to-cyan-600'
                    return 'bg-gradient-to-r from-cyan-600 to-transparent'
                }
            }
        }

        if (index > 3) {
            // driver is behind session driver

            if (lapDelta > 0) {
                // session driver has done more laps
                if (lapDelta === 1 && sessionDriver.pct < driver.pct) {
                    if (driver.onPitRoad) return 'bg-gradient-to-l from-pit to-transparent'
                    //session driver has crossed start finish line
                    return ''
                }

                if (driver.onPitRoad) return 'bg-gradient-to-l from-pit via-transparent to-cyan-600'
                return 'bg-gradient-to-r from-cyan-600 to-transparent'
            }

            if (lapDelta < 0) {
                // driver behind has done more laps
                if (driver.onPitRoad) return 'bg-gradient-to-l from-pit via-transparent to-red-700'
                return 'bg-gradient-to-r from-red-700 to-transparent'
            }

            if (lapDelta === 0) {
                if (sessionDriver.pct < driver.pct) {
                    // session driver is about to get lapped and has just crossed s/f line
                    if (driver.onPitRoad) return 'bg-gradient-to-l from-pit via-transparent to-red-700'
                    return 'bg-gradient-to-r from-red-700 to-transparent'    
                }
            }
        }
    }

    const isRace = sessionInfo.Sessions[currentSessionNumber].SessionType === 'Race'
    return (
        <>
            <div className="widget-body h-auto w-full flex flex-col pt-2 bg-e3 shadow-md shadow-black">
                <table className="w-full divide-y divide-slate-300">
                    <tbody className="divide-y divide-gray-700" ref={wrapperRef}>

                    </tbody>
                </table>
                <div style={{ color: 'rgba(255 ,255, 255, 0.8)' }} className="pl-12 flex w-full" >
                    {isRace && <span className='flex-shrink'>Laps: {driverLaps ? driverLaps : '--'}/{sessionInfo.Sessions[currentSessionNumber].SessionLaps}</span>}
                    {!isRace && <span className='flex-shrink'>Laps: {driverLaps ? driverLaps : '--'}</span>}
                    <span className="flex-grow ">Last Lap: {lastLap && lastLap > 0 ? lastLap.toFixed(3) : '--'}</span>
                </div>
            </div>
        </>
    )
}

export default WidgetWrapper(RelativePosition, 'Relative Position')
