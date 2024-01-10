import React from 'react'
import styles from './SingleProduct.module.scss'

function singleProduct({ data }) {
  const numberFormat = (val) => new Intl.NumberFormat('ar-EG', { maximumSignificantDigits: 3 }).format(val)

  return data.map((item, i) => {
    return (
      <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg6 ms-xl4 ms-depth-4" key={i}>
        <div className={styles.item}>
          <figure>
            <img src={`${import.meta.env.VITE_BASE_UPLOAD}images/${item.image}`} alt="" />
          </figure>
          <h3>{item.name}</h3>
          <span>{numberFormat(item.price)}</span>
        </div>
      </div>
    )
  })
}

export default singleProduct
