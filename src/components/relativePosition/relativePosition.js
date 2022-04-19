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
    const [initialized, setInitialized] = useState(false)
    const [isMultiClass, setIsMutliClass] = useState(null)

    useEffect(() => {
        ipcRenderer.on('sessionInfo', (_evt, { data: { DriverInfo, SessionInfo, WeekendInfo } }) => {
            setSessionInfo(SessionInfo)
            setDriverInfo(DriverInfo)
            setDrivers(DriverInfo.Drivers)
            setPaceCarIdx(DriverInfo.PaceCarIdx)
            setIsMutliClass(WeekendInfo.NumCarClasses > 1)
        })
        ipcRenderer.send('initSessionInfo')
    }, [])

    useEffect(() => {
        if (drivers && driverInfo && paceCarIdx !== null && !initialized && isMultiClass !== null && sessionInfo) {
            setInitialized(true)
            ipcRenderer.on('telemetry', (_evt, data) => {
                if (drivers && driverInfo) {
                    const { SessionTime, SessionNum, SessionFlags, CarIdxLapCompleted, CarIdxLapDistPct, CarIdxClassPosition, CarIdxPosition, CarIdxEstTime, PlayerCarIdx, CarIdxOnPitRoad, LapLastLapTime, SessionTimeRemain, SpeedByCarIdx, LengthOfTrack} = data
                    const paceCarOut = SessionFlags.includes('CautionWaving') || SessionFlags.includes('Caution')
                    updatePositions(sessionInfo, SessionTime, CarIdxLapDistPct, PlayerCarIdx, CarIdxEstTime ,CarIdxClassPosition, CarIdxPosition, CarIdxOnPitRoad, CarIdxLapCompleted, paceCarOut, SessionNum, isMultiClass, SpeedByCarIdx, LengthOfTrack)
                    if (SessionNum != currentSessionNumber) setSessionNum(SessionNum);
                    if (LapLastLapTime != lastLap) setLastLap(LapLastLapTime)
                }
            })
        }
        
    }, [drivers, driverInfo, paceCarIdx, currentSessionNumber, isMultiClass, sessionInfo])

    const updatePositions = (sessionInfo, sessionTime, carIdxLapDistPct, playerCarIdx, carIdxEstTime, carIdxClassPosition, carIdxPosition, carIdxOnPitRoad, carIdxLapCompleted, paceCarOut, sessionNum, sessionIsMultiClass, speedByCarIdx, lengthOfTrack) => {
        try {
            let sorted = carIdxLapDistPct
            .map((pct, idx) => ({ idx, pct }))
            .sort((a, b) => a.pct < b.pct ? 1 : -1)
            .filter((driver) => {
                if(driver.idx === paceCarIdx && !paceCarOut) return false
                return driver.pct > -1
            })

            const driverIndex = sorted.findIndex((driver) => driver.idx === playerCarIdx)
            const sessionDriver = sorted[driverIndex]
            if (!sessionDriver) return;

            sessionDriver.position = carIdxClassPosition[playerCarIdx] || carIdxPosition[playerCarIdx]
            sessionDriver.onPitRoad = carIdxOnPitRoad[playerCarIdx]
            sessionDriver.lapsCompleted = carIdxLapCompleted[playerCarIdx]
            sessionDriver.lapDelta = 0
            sessionDriver.speed = speedByCarIdx[playerCarIdx]
            
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
                    driverAhead.speed = speedByCarIdx[driverAhead.idx]
                    driverAhead.delta = getDeltaAhead(driverAhead, sessionDriver, lengthOfTrack)
                    driverAhead.position = sessionIsMultiClass ? carIdxClassPosition[driverAhead.idx] : carIdxPosition[driverAhead.idx]
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
                    driverBehind.speed = speedByCarIdx[driverBehind.idx]
                    driverBehind.delta = getDeltaBehind(driverBehind, sessionDriver, lengthOfTrack)
                    driverBehind.position = sessionIsMultiClass ? carIdxClassPosition[driverBehind.idx] : carIdxPosition[driverBehind.idx]
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
                if (!driver || !drivers || !drivers[driver.idx]) {
                    return (
                        <tr key={mapIdx} style={{ color: 'rgba(255 ,255, 255, 0.8)' }}>
                            <td>&nbsp;</td>
                        </tr>
                    )
                }
                
                const isRace = sessionInfo.Sessions[sessionNum].SessionType === 'Race'
                let distBetween = parseFloat(driver.delta && driver.delta !== '--' ? driver.delta - 1 : 0.0).toFixed(1)
                if (distBetween === NaN) distBetween = '--'
                const style = { color: 'rgba(255 ,255, 255, 0.8)' }
                if (mapIdx === 0) style.borderTop = 'none'
                return (
                    <div className="flex">
                        <tr key={mapIdx} style={style} className={`${getRowClasses(driver, isRace, mapIdx, sessionDriver)} ${mapIdx === 3 ? 'bg-emerald-800': ''} `}>
                            <td style={isMultiClass && !driverIsPaceCar(driver) ? {backgroundColor: `#${getClassColor(driver)}`, witdh: '2px'} : {}} className={'text-zinc-200'}></td>
                            <td >
                                {driverIsPaceCar(driver) ? '--' : driver.position || '-'}
                            </td>
                            <td>
                                {driverIsPaceCar(driver) || !drivers[driver.idx] ? '--' : `#${drivers[driver.idx].CarNumber}`}
                            </td>
                            <td className="grow">
                                {drivers[driver.idx].UserName}
                            </td>
                            {!driverIsPaceCar(driver) && <td>
                                {mapIdx === 3 ? '--' : distBetween}
                            </td>}
                            {driverIsPaceCar(driver) && <td>
                                {paceCarWrap ? '--' : parseFloat(driver.delta ? driver.delta - 1 : 0.0).toFixed(1)}
                            </td>}
                        </tr>
                    </div>
                )
            })

            if(result && wrapperRef.current) wrapperRef.current.innerHTML = renderToString(result)
        } catch(error) {
            console.log(error)
        }
    }


    const getClassColor = driver => {
        const color = getDriver(driver).CarClassColor
        const modifiedColor = color 
        return modifiedColor.toString(16)
    }
    
    const getDriver = driver => drivers.find(d => d.CarIdx === driver.idx)

    const driverIsPaceCar = (driver) => {
        if (driver.idx === paceCarIdx) return true
    }

    const getLapDelta = (oppLapsCompleted, driverLapsCompleted) => {
        if (oppLapsCompleted === driverLapsCompleted) return 0
        return oppLapsCompleted > driverLapsCompleted ? 1 : 0
    }

    const getDeltaAhead = (driver, sessionDriver, lengthOfTrack) => {
        if (driver.speed < 7 && sessionDriver.speed < 7) return '--'
        let percentDiff
       if(driver.pct < sessionDriver.pct) {
           percentDiff = (1 - sessionDriver.pct) + driver.pct
       } else {
           percentDiff = driver.pct - sessionDriver.pct
       }

       const distBetweenInKm = percentDiff * lengthOfTrack
       const speed = (sessionDriver.speed > 0 ? sessionDriver.speed : driver.speed) / 3600
       return (distBetweenInKm / speed) + 1

    }

    const getDeltaBehind = (driver, sessionDriver, lengthOfTrack) => {
        if (driver.speed < 7 && sessionDriver.speed < 7) return '--'
        let percentDiff
        if (driver.pct > sessionDriver.pct) {
            const driverPctLeft = 1 - driver.pct
            percentDiff = driverPctLeft + sessionDriver.pct
        } else {
            percentDiff = sessionDriver.pct - driver.pct
        }

        const distBetweenInKm = percentDiff * lengthOfTrack 
        const speed = (driver.speed > 0 ? driver.speed : sessionDriver.speed) / 3600
        return ((distBetweenInKm / speed) - 1) * -1
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

    const formatLapTime = lapInSeconds => {
        const date = new Date(null)
        date.setSeconds(lapInSeconds)
        const result = date.toISOString().slice(14, -5)
        const decimal = lapInSeconds.toString().split('.')[1]
        return `${result}:${decimal}`
    }

    const isRace = sessionInfo.Sessions[currentSessionNumber].SessionType === 'Race'
    const sessionLaps = sessionInfo.Sessions[currentSessionNumber].SessionLaps
    const isTimedRace = sessionLaps === 'unlimited'
    return (
        <>
            <div className="widget-body h-auto w-full flex flex-col bg-e3 shadow-md shadow-black">
                {/* <div style={{ color: 'rgba(255 ,255, 255, 0.8)' }} className="pl-12 flex w-full" >
                    test
                </div> */}
                <table className="w-full divide-y divide-slate-300">
                    <tbody className="divide-y divide-gray-700" ref={wrapperRef}>

                    </tbody>
                </table>
                <div style={{ color: 'rgba(255 ,255, 255, 0.8)' }} className="pl-12 flex w-full" >
                    {isRace && !isTimedRace && <span className='flex-shrink'>Laps: {driverLaps !== null ? (driverLaps + 1) : '--'}/{sessionInfo.Sessions[currentSessionNumber].SessionLaps}</span>}
                    {isRace && isTimedRace && <span className='flex-shrink'>Laps: {driverLaps !== null ? (driverLaps + 1) : '--'}</span>}
                    {!isRace && <span className='flex-shrink'>Laps: {driverLaps !== null ? (driverLaps + 1) : '--'}</span>}
                    <span className="flex-grow ">Last Lap: {lastLap && lastLap > 0 ? formatLapTime(lastLap.toFixed(3)) : '--'}</span>
                </div>
            </div>
        </>
    )
}

export default WidgetWrapper(RelativePosition, 'Relative Position')
