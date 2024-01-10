const Shimmer = (props) => {
  if (props.theme === 'dark')
    return (
      <div className="shimmer" style={props.extraStyle} data-theme="dark">
        {props.children}
      </div>
    )
  else
    return (
      <div className="shimmer" style={props.extraStyle}>
        {props.children}
      </div>
    )
}

export default Shimmer
