import Telemetry from './telemetry'

const { ipcRenderer } = window.require('electron')

export default () => {
    const launchTelemetryWidget = () => {
        console.log('testing')
       ipcRenderer.send('telemetryLaunch',' <Telemetry />')
    }
    return (
        <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Telemetry Widget Options</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Replace with your content */}
            <div className="py-4">
                <button
                    type="button"
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    onClick={launchTelemetryWidget}
                >
                    Launch Telemetry Widget
                </button>
            </div>
            {/* /End replace */}
        </div>
    </div>
    )
}