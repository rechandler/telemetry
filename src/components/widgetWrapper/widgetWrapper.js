import './widgetWrapper.css'
export default WrappedComponent => () => {
    return (
        <div className="draggable">
            <WrappedComponent />
        </div>
    )
}