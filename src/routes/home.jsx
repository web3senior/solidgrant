import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Title } from './helper/DocumentTitle'
import Loading from './components/LoadingSpinner'
import { CheckIcon, ChromeIcon, BraveIcon } from './components/icons'
import toast, { Toaster } from 'react-hot-toast'
import Logo from './../../src/assets/logo.svg'
import styles from './Home.module.scss'
import { useAuth } from './../contexts/AuthContext'

function Home({ title }) {
  Title(title)
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()

  return (
    <>
      {isLoading && <Loading />}

      <section className={styles.section}>
        <div className={`__container text-center d-flex flex-column align-items-center justify-content-center`} data-width="medium">
          <figure>
            <img src={Logo} />
          </figure>
          <h4>{import.meta.env.VITE_NAME}</h4>
          <p className='text-justify'>
            Like tending a fledgling seed to a flourishing garden, granting great ideas fosters their potential, transforming sparks of ingenuity into impactful realities. Through
            careful discovery, rigorous evaluation, and nurturing support, promising concepts blossom under the sun of resources and collaboration.
          </p>
          <button onClick={()=>auth.connect()}>Connect</button>
        </div>
      </section>
    </>
  )
}

export default Home
