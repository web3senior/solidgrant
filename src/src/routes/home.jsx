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
          <p className="text-justify">
            This DAO dapp is built on top of Allo Protocol, a decentralized governance platform on the Arbitrum network. The dapp allows members to propose and vote on proposals,
            manage treasury funds, and track community activity.
          </p>
          <button className='btn mt-40' onClick={() => auth.connect().then(()=>    window.location.href=('/usr/dashboard'))}>Connect</button>
        </div>
      </section>
    </>
  )
}

export default Home
