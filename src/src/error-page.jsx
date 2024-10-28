import { useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <div className="error-page">
      <h1>Error!</h1>
      <p>We can’t seem to find the page you’re looking for!</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  )
}
