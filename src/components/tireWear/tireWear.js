import { useRef, useEffect } from 'react'
import WidgetWrapper from '../widgetWrapper/widgetWrapper'

const TireWear =  () => {
    const lf = useRef(null)

    useEffect(() => {
        
        // console.log(chroma.scale(['yellow', 'red', 'black'])(0.5))
        // lf.current.style.backgroundColor = chroma.scale(['yellow', 'red', 'black'])()
    }, [])

    return (
    <>
        <div className="widget-title flex justify-center w-28 text-white bg-slate-900 relative">Tire Wear</div>
        <div className="widget-body h-64 w-full flex flex-col tire-wear-body p-7 bg-e3  shadow-md shadow-black gap-2">
            <div className="flex w-full h-full gap-2">
                <div className="shadow shadow-black w-full grow-1 rounded-3xl"  ref={lf} >&nbsp;</div>
                <div className="shadow shadow-black w-full grow-1 bg-slate-900 rounded-3xl">&nbsp;</div>
            </div>
            <div className="flex w-full h-full gap-2">
                <div className="shadow shadow-black w-full bg-slate-900 rounded-3xl">&nbsp;</div>
                <div className="shadow   shadow-black w-full bg-slate-900 rounded-3xl">&nbsp;</div>
            </div>
        </div>   
    </>
    )
}

export default WidgetWrapper(TireWear)
