import { useEffect, useState } from 'react'
import { Outlet, useLocation, Link, NavLink, useNavigate, useNavigation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth, chainID } from './../contexts/AuthContext'
import MaterialIcon from './helper/MaterialIcon'
import { MenuIcon } from './components/icons'
import styles from './Layout.module.scss'
import Logo from './../../src/assets/logo.svg'

let link = [
  {
    name: 'Dashboard',
    icon: 'dashboard',
    path: 'dashboard',
  },
  {
    name: 'ALLO',
    icon: 'hub',
    path: 'allo',
  },
  {
    name: 'Profile',
    icon: 'app_registration',
    path: 'profile',
  },
  {
    name: 'Strategy',
    icon: 'strategy',
    path: 'strategy',
  },
  {
    name: 'Pool',
    icon: 'finance_chip',
    path: 'pool',
  },
  {
    name: 'IPFS',
    icon: 'dns',
    path: 'ipfs',
  },
]

export default function Root() {
  const [network, setNetwork] = useState()
  const [isLoading, setIsLoading] = useState()
  const noHeader = ['/', '/splashscreen', '/tour']
  const auth = useAuth()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const location = useLocation()

  const handleNavLink = (route) => {
    if (route) navigate(route)
    handleOpenNav()
  }

  const handleOpenNav = () => {
    document.querySelector('#modal').classList.toggle('open')
    document.querySelector('#modal').classList.toggle('blur')
    document.querySelector('.cover').classList.toggle('showCover')
  }
  useEffect(() => {
    chainID().then((res) => {
      let networkType
      switch (res) {
        case 5:
          networkType = `TESTNET`
          break
        case 1:
          networkType = `MAINNET`
          break
        default:
          break
      }
      setNetwork(networkType)
    })
  }, [])

  return (
    <>
      <Toaster />
      {!noHeader.includes(location.pathname) && (
        <>
          {network && (
            <div className={`d-flex align-items-center justify-content-center ${styles.network}`} data-type={network}>
              {network === 'MAINNET' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM11.3584 5.64645C11.1849 5.47288 10.9154 5.4536 10.7206 5.58859L10.6513 5.64645L7 9.298L5.35355 7.65131L5.28431 7.59346C5.08944 7.45846 4.82001 7.47775 4.64645 7.65131C4.47288 7.82488 4.4536 8.09431 4.58859 8.28917L4.64645 8.35842L6.64645 10.3584L6.71569 10.4163C6.8862 10.5344 7.1138 10.5344 7.28431 10.4163L7.35355 10.3584L11.3584 6.35355L11.4163 6.28431C11.5513 6.08944 11.532 5.82001 11.3584 5.64645Z"
                      fill="#0E700E"
                    />
                  </svg>
                </>
              ) : (
                <>
                  <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6.68149 0.785435C7.24892 -0.261875 8.75196 -0.261795 9.31928 0.785573L15.8198 12.7865C16.3612 13.786 15.6375 15.0009 14.5009 15.0009H1.4982C0.361474 15.0009 -0.362172 13.7858 0.179337 12.7864L6.68149 0.785435ZM8.5 5.5C8.5 5.22386 8.27614 5 8 5C7.72386 5 7.5 5.22386 7.5 5.5V9.5C7.5 9.77614 7.72386 10 8 10C8.27614 10 8.5 9.77614 8.5 9.5V5.5ZM8.75 11.75C8.75 11.3358 8.41421 11 8 11C7.58579 11 7.25 11.3358 7.25 11.75C7.25 12.1642 7.58579 12.5 8 12.5C8.41421 12.5 8.75 12.1642 8.75 11.75Z"
                      fill="#DA3B01"
                    />
                  </svg>
                </>
              )}
              {network}
            </div>
          )}

          <div className={styles.rootLayout}>
            {location.pathname !== '/home' && (
              <nav>
                <Link to={`/`}>
                  <figure>
                    <img alt="Logo" src={Logo} draggable={false} className="animate fade" />
                  </figure>
                </Link>

                <ul>
                  {link &&
                    link.map((item, i) => (
                      <li key={i} className="animate blur">
                        <NavLink to={`usr/${item.path}`} className={({ isActive, isPending }) => (isPending ? styles.pending : isActive ? styles.active : null)}>
                          <MaterialIcon name={item.icon} />
                          <i class="ms-Icon ms-Icon--Mail" aria-hidden="true"></i>
                          <span>{item.name}</span>
                        </NavLink>
                      </li>
                    ))}
                </ul>

                <NavLink to={`/`} className={({ isActive, isPending }) => (isPending ? styles.pending : isActive ? styles.active : null)} onClick={() => localStorage.clear()}>
                  <MaterialIcon name="logout" />
                  <span>Disconnect</span>
                </NavLink>
              </nav>
            )}

            <main>
              <Toaster />

              {location.pathname !== '/home' && (
                <header className={`${styles.header} d-flex align-items-center justify-content-between`}>
                  <div className={`${styles.header__logo} d-flex align-items-center`}>
                    <input type="text" placeholder="search" />
                  </div>

                  <div className={`d-flex align-items-center`} style={{ columnGap: '1rem' }}>
                    <ul className={`d-flex flex-column align-items-center`}>
                      <li>{auth.wallet && `${auth.wallet.slice(0, 4)}...${auth.wallet.slice(38)}`}</li>
                    </ul>

                    <button className={styles.navButton} onClick={() => handleNavLink()}>
                      <MenuIcon />
                    </button>
                  </div>
                </header>
              )}

              <main>
                <Outlet />
              </main>
            </main>
          </div>
        </>
      )}

      {/* <div className="cover" onClick={() => handleOpenNav()} />
      <nav className={`${styles.nav} animate`} id="modal">
        <figure>
          <img src={Logo} alt={`logo`} />
        </figure>
        <ul>
          <li className="">
            <button onClick={() => handleNavLink(`/`)}>
              <MaterialIcon name="home" />
              <span>Home</span>
            </button>
          </li>
          <li className="">
            <button onClick={() => handleNavLink(`/about`)}>
              <MaterialIcon name="info" />
              <span>About us</span>
            </button>
          </li>
          <li className="">
            <button onClick={() => handleNavLink(`/feedback`)}>
              <MaterialIcon name="feedback" />
              <span>Feedback</span>
            </button>
          </li>
          <li>
            X:{' '}
            <a href="https://twitter.com/" style={{ color: 'var(--area1)' }}>
              @upcardlink
            </a>
          </li>
        </ul>

        <small>{`Version ${import.meta.env.VITE_VERSION}`}</small>
      </nav> */}
    </>
  )
}
