import { useEffect, useState } from 'react'
import './widgetWrapper.css'
const { ipcRenderer } = window.require('electron')

export default (WrappedComponent, title) => () => {
    const [isOnTrack, setIsOnTrack] = useState(false)
    let timer
    
    useEffect(() => {
        ipcRenderer.on('telemetry', (_evt, args) => {
            debounceStatus(args.IsOnTrack)
        })
    }, [])

    const debounceStatus = status => {
        clearTimeout(timer)
        setTimeout(() => setIsOnTrack(status), 500)
    }

    return (
        <div className="draggable">
            <div className="flex">
                <div className="widget-title flex justify-center w-40 text-white bg-slate-900 relative">{title}</div>
            </div>
            { isOnTrack && <WrappedComponent isOnTrack={isOnTrack} /> }
            { !isOnTrack && 
                <div className="waiting-body shim-blue relative">
                    <div className="w-screen h-[calc(100%_-_5px)] absolute top-0 flex" style={{zIndex: 1, backgroundColor: '#282c34', justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
                        <p style={{fontSize: '1.3rem', justifyContent: 'center', alignItems: 'center'}}>Waiting to get on the track</p>
                    </div>
                </div>
            }
        </div>
    )
}