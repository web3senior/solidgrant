import { Title } from './helper/DocumentTitle'
import {Link} from 'react-router-dom'
import styles from './About.module.scss'
import Heading from './helper/Heading'
import TantodefiAvatar from './../assets/tantodefi.jpeg'
import AmirAvatar from './../assets/amir.png'
import GitHubIcon from './../assets/github.svg'
import { PopupButton } from '@typeform/embed-react'

const data = [
  {
    q: 'What is DeezStealth?',
    a: '🆙 UPcard is a dApp that helps users create colorful QRCode and NFT2.0 based on a users info on Lukso',
  },
  {
    q: 'How does it work?',
    a: 'Users need to connect their UP to the dapp the mint their NFT by cutomizing token name, symbol, and count',
  },
  {
    q: 'What Networks does it support?',
    a: 'Currently, Lukso network. Will add Lukso LSPs on all chians',
  },
]

const team = [
  {
    avatar: TantodefiAvatar,
    fullname: 'Tantodefi',
    username: 'tantodefi',
  },
  {
    avatar: AmirAvatar,
    fullname: 'Amir Rahimi',
    username: 'web3senior',
  },
]

export default function About({ title }) {
  Title(title)

  return (
    <section className={styles.section}>
      <div className={`__container ms-motion-slideUpIn ${styles.container}`} data-width={`large`}>
        <div className={`card ms-depth-4 text-justify`}>
          <div className="card__header">
            <h4>About Us</h4>
          </div>
          <div className="card__body">
         <p>
         Generate a colorful QRCode and NFT2.0 based on a users info on <a href='https://lukso.network/'>Lukso</a> network using data stored on the brand new Universal Profiles <a href='https://universalprofile.cloud/'>(UP)</a> powered by <a href='https://erc725alliance.org/'>ERC725</a>
         </p>
          </div>
        </div>

        <div className={`card ms-depth-4 text-justify mt-20`}>
          <div className="card__header">
            <h4>FAQ</h4>
          </div>
          <div className="card__body">
            <ul>
              {data.map((item, i) => {
                return (
                  <li key={i}>
                    <details open={i === 0 ? true : false} className="ms-depth-4">
                      <summary>{item.q}</summary>
                      <div>{item.a}</div>
                    </details>
                  </li>
                )
              })}
            </ul>
            <br />
            <p>Got a feature request or found a bug?</p>
            <Link to={`/feedback`} className='btn'>
              Provide Feedback
            </Link>
          </div>
        </div>

        <div className={`${styles.team} card ms-depth-4 text-justify mt-20`}>
          <div className="card__header">
            <h4>Our team</h4>
          </div>
          <div className="card__body">
            <ul className={`grid grid--fit`} style={{ '--data-width': '150px' }}>
              {team.map((item, i) => {
                return (
                  <li className="grid__item" key={i}>
                    <figure>
                      <img alt={item.fullname} src={item.avatar} />
                    </figure>

                    <b>{item.fullname}</b>

                    <a href={`https://github.com/${item.username}`} target="_blank" rel="noreferrer">
                      <img alt="GitHub Icon" src={GitHubIcon} />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
