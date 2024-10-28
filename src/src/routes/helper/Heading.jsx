import { Link } from 'react-router-dom'

const style = {
  fontSize: '1.7em',
  fontWeight: 'bold',
  padding: '1rem 0 0 0',
}

const Heading = (props) => (
  <div className="d-flex align-items-center justify-content-between w-100 mb-30">
    <div>
      <h1 style={style}>{props.title}</h1>
    </div>
  </div>
)

export default Heading

Heading.defaultProps = {
  title: 'No Title',
  lead: '',
}
