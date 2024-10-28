import Heading from './helper/Heading'
import { Widget } from '@typeform/embed-react'

import styles from './Contact.module.scss'

export default function Contact() {
  return (
    <section className={styles.section}>
      <div className={`__container ms-motion-slideUpIn`} data-width={`medium`}>
        <Widget id="x8cqTeZ4" style={{ width: '100%', height: '400px' }} className="my-form" />
      </div>
    </section>
  )
}
