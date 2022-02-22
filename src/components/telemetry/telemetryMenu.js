import { useState } from 'react'
import { Switch } from '@headlessui/react'
const Store = window.require('electron-store');
const { ipcRenderer } = window.require('electron')

const store = new Store()

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default () => {
    
    const launchTelemetryWidget = () => ipcRenderer.send('telemetryLaunch')
    const [launchEnabled, setLaunchEnabled] = useState(store.get('telemetryWidget.launchEnabled') || false)
    const [positionEnabled, setPositionEnabled] = useState(store.get('telemetryWidget.positionEnabled') || false)
    const [useMetric, setUseMetric] = useState(store.get('telemetryWidget.useMetric') || false)

    const updateLaunchEnabled = value => {
        store.set('telemetryWidget.launchEnabled', value)
        setLaunchEnabled(value)
    }

    const updatePositionEnabled = value => {
        store.set('telemetryWidget.positionEnabled', value)
        setPositionEnabled(value)
    }

    const updateUseMetric = value => {
        store.set('telemetryWidget.useMetric',value)
        setUseMetric(value)
        ipcRenderer.send('telemetryConversionSwitched', value)
    }

    return (
        <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Telemetry Widget Options</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Replace with your content */}
            <div className="py-4">
                <Switch.Group as="div" className="flex items-center p-2">
                    <Switch
                        checked={launchEnabled}
                        onChange={updateLaunchEnabled}
                        className={classNames(
                        launchEnabled ? 'bg-sky-600' : 'bg-gray-200',
                        'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
                        )}
                    >
                        <span
                        aria-hidden="true"
                        className={classNames(
                            launchEnabled ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                        )}
                        />
                    </Switch>
                    <Switch.Label as="span" className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Launch on Startup</span>
                    </Switch.Label>
                </Switch.Group>
                <Switch.Group as="div" className="flex items-center p-2">
                    <Switch
                        checked={positionEnabled}
                        onChange={updatePositionEnabled}
                        className={classNames(
                        positionEnabled ? 'bg-sky-600' : 'bg-gray-200',
                        'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
                        )}
                    >
                        <span
                        aria-hidden="true"
                        className={classNames(
                            positionEnabled ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                        )}
                        />
                    </Switch>
                    <Switch.Label as="span" className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Save widget position on move</span>
                    </Switch.Label>
                </Switch.Group>
                <Switch.Group as="div" className="flex items-center p-2">
                    <Switch
                        checked={useMetric}
                        onChange={updateUseMetric}
                        className={classNames(
                        useMetric ? 'bg-sky-600' : 'bg-gray-200',
                        'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
                        )}
                    >
                        <span
                        aria-hidden="true"
                        className={classNames(
                            useMetric ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                        )}
                        />
                    </Switch>
                    <Switch.Label as="span" className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Use Metric (KPH) instead of Imperial (MPH)</span>
                    </Switch.Label>
                </Switch.Group>
                <button
                    type="button"
                    className="inline-flex items-center px-2.5 py-1.5 mt-5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
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