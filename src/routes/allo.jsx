import { Title } from './helper/DocumentTitle'
import Heading from './helper/Heading'
import styles from './Allo.module.scss'

export default function Allo({ title }) {
  Title(title)

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={title} />
      <div className={`__container ms-motion-slideUpIn`} data-width={`medium`}>
        <div className={`card ms-depth-4 text-justify`}>
          <div className="card__header">A general purpose protocol for the efficient allocation of capital.</div>
          <div className="card__body">
            <svg style={{ margin: '0 auto' }}
             width="145" height="137" viewBox="0 0 145 137" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M107.846 99.2525L79.4703 50.8461C73.7351 40.3601 68.4536 15.5106 93.209 0L123.254 51.7449C127.834 61.9312 131.164 85.6936 107.846 99.2525Z" fill="#004323" />
              <path
                d="M79.3718 50.7286L51.6387 99.5064C45.4252 109.716 26.5456 126.715 0.735352 113.031L30.525 61.1388C37.0569 52.0796 55.9708 37.3147 79.3718 50.7286Z"
                fill="#004323"
              />
              <path
                d="M51.7098 99.7323L107.819 99.361C119.768 99.6372 143.929 107.488 144.984 136.682L85.1487 136.83C74.0373 135.703 51.7936 126.705 51.7098 99.7323Z"
                fill="#004323"
              />
            </svg>
            <p>
              Allo Protocol is a set of smart contracts that enable the democratic allocation and distribution of capital. The protocol was developed by Gitcoin (opens in a new
              tab)to power the Grants Stack, but is useful beyond grants and quadratic funding.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
