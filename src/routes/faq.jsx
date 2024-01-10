import { Title } from './helper/DocumentTitle'
import styles from './Faq.module.scss'
import Heading from './helper/Heading'
const data = [
  {
    q: 's',
     a: '',
  },    {
    q: 's',
     a: '',
  },    {
    q: 's',
     a: '',
  },
    {
    q: 's',
     a: '',
  },
]

export default function FAQ({ title }) {
  Title(title)

  return (
    <section className={styles.section}>
      <Heading title={`سوالات متداول`} />
      <div className={`__container ms-motion-slideUpIn`} data-width={`medium`}>
        <ul>
          {data.map((item, i) => {
            return (
              <li key={i}>
                <details open={i === 0 ? true : false} className="ms-depth-4 text-justify">
                  <summary>{item.q}</summary>
                  <div>{item.a}</div>
                </details>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
