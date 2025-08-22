import "./LoadingSpinner.css"

function LoadingSpinner({ size = "medium", text = "Loading..." }) {
  return (
    <>
      <div className={`loading-spinner ${size}`}>
        
      </div>
      {text && <div className="loading-text">{text}</div>}
    </>
  )
}

export default LoadingSpinner
