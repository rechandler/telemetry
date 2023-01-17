import './App.css'

import TelemetryMenu from '../telemetry/telemetryMenu'
import TireWearMenu from '../tireWear/tireWearMenu'
import RelativePositionMenu from '../relativePosition/relativePositionMenu'
import Dashboard from '../dashboard/dashboard.js'
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import {
  FlagIcon,
  ChartBarIcon,
  FolderIcon,
  LightBulbIcon,
  InboxIcon,
  MenuIcon,
  ViewGridIcon,
  XIcon,
} from '@heroicons/react/outline'
const { ipcRenderer } = window.require('electron')

const navigation = [
  { name: 'Dashboard', href: '/', icon: LightBulbIcon, current: true },
  { name: 'Telemetry', href: '/telemetry', icon: FlagIcon, current: false },
  { name: 'RelativePosition', href: '/relativePosition', icon: ViewGridIcon, current: false}
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const logout= () => {
  ipcRenderer.send('auth:log-out');
}

function App({props: {picture, given_name, family_name}}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <HashRouter>
      <nav class="p-3 border-gray-200 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <div class="container flex flex-wrap w-full max-w-full">
          <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">E3 Studios</span>
          <div class="flex items-center justify-between space-x-5 ml-auto">
            <span id="name" class="text-bg-gray-800 font-semibold">{`Welcome ${given_name}!`}</span>
            <img id="picture" src={picture} referrerpolicy="no-referrer"/>
            <button onClick={logout} class="bg-transparent hover:bg-gray-800 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
              Log Out
            </button>
          </div>
        </div>
      </nav>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4">
                    {/* <img
                      className="h-8 w-auto"
                      src="https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg"
                      alt="Workflow"
                    /> */}
                    <p>E3-Studios</p>
                  </div>
                  <nav className="mt-5 px-2 space-y-1">
                    {navigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        isActive={(match, location) => {
                          if (!match) {
                            return false;
                          }
                      
                          // only consider an event active if its event id is an odd number
                          const eventID = parseInt(match.params.eventID);
                          console.log(match, eventID)
                          return !isNaN(eventID) && eventID % 2 === 1;
                        }}
                        className={classNames(
                          item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              </div>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed h-full">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `${ isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={classNames(
                        'text-gray-400 group-hover:text-gray-300',
                        'mr-3 flex-shrink-0 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

          </div>
        </div>
        <div className="md:pl-64 flex flex-col flex-1">
          <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <main className="flex-1">
            <Routes>
              <Route exact path="/" element={<Dashboard />} />
              <Route exact path="/telemetry" element={<TelemetryMenu />} />
              <Route exact path="/relativePosition" element={<RelativePositionMenu />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  )
}

export default App;
