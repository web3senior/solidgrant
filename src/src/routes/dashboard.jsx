import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Form, useActionData } from 'react-router-dom'
import { getProfile, getPool } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth, web3 } from './../contexts/AuthContext'
import Heading from './helper/Heading'
import styles from './Dashbaord.module.scss'
import { AlloABI } from './../abi/Allo'
export const loader = async ({ request }) => {
  return defer({
    profile: getProfile(),
  })
}

export default function Setting({ title }) {
  Title(title)
  const [loaderData, setLoaderData] = useState(useLoaderData())
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState([])
  const [profile, setProfile] = useState([])
  const [totalProfile, setTotalProfile] = useState()
  const [pool, setPool] = useState([])
  const [totalPool, setTotalPool] = useState()
  const auth = useAuth()
  let errors = useActionData()

  const decodeProfileLog = async (data) => {
    let decodeResult = web3.eth.abi.decodeLog(
      [
        {
          internalType: 'uint256',
          name: '_nonce',
          type: 'uint256',
        },
        {
          internalType: 'string',
          name: '_name',
          type: 'string',
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'protocol',
              type: 'uint256',
            },
            {
              internalType: 'string',
              name: 'pointer',
              type: 'string',
            },
          ],
          internalType: 'struct Metadata',
          name: '_metadata',
          type: 'tuple',
        },
        {
          internalType: 'address',
          name: '_owner',
          type: 'address',
        },
        {
          internalType: 'address[]',
          name: '_members',
          type: 'address',
        },
      ],
      data
    )
    // console.log(decodeResult)
    return decodeResult
  }

  const decodePoolLog = async (data) => {
    let decodeResult = web3.eth.abi.decodeLog(
      [
        // {
        //   internalType: 'bytes32',
        //   name: '_profileId',
        //   type: 'bytes32',
        // },
        {
          internalType: 'address',
          name: '_strategy',
          type: 'address',
        },
        // {
        //   internalType: 'bytes',
        //   name: '_initStrategyData',
        //   type: 'bytes',
        // },
        {
          internalType: 'address',
          name: '_token',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: '_amount',
          type: 'uint256',
        },
        {
          components: [
            {
              internalType: 'uint256',
              name: 'protocol',
              type: 'uint256',
            },
            {
              internalType: 'string',
              name: 'pointer',
              type: 'string',
            },
          ],
          internalType: 'struct Metadata',
          name: '_metadata',
          type: 'tuple',
        },
        // {
        //   internalType: 'address[]',
        //   name: '_managers',
        //   type: 'address[]',
        // },
      ],
      data
    )
    // console.log(decodeResult)
    return decodeResult
  }

  const getTransactionInfo = async (txn) => web3.eth.getTransaction(txn)

  useEffect(() => {
    getProfile().then((res) => {
      let decodedProfiles = []
      setTotalProfile(res.result.length)
      res.result.map(async (item, i) => {
        let decodedData = await decodeProfileLog(item.data)
        // console.log(decodedData)
        if (decodedData._owner.toString() === auth.wallet.toString()) decodedProfiles.push(decodedData)
        if (++i === res.result.length) setProfile(decodedProfiles)
      })
    })

    getPool().then((res) => {
      let decodedPools = []
      setTotalPool(res.result.length)
      res.result.map(async (item, i) => {
        let decodedData = await decodePoolLog(item.data)
        let transactionData = await getTransactionInfo(item.transactionHash)
        // console.log(decodedData, transactionData)
        if (transactionData.from.trim().toLowerCase() === auth.wallet.trim().toLowerCase()) decodedPools.push(decodedData)
        if (++i === res.result.length) setPool(decodedPools)
      })
    })
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={title} />
      
      <div className={`__container`} data-width={`large`}>
        <div className={`${styles.grid} grid grid--fit grid--gap-1`} style={{ '--data-width': '260px' }}>
          <div className={`grid__item ${styles.item}`}>
            <label htmlFor="">Profile</label>
            <div className="card">
              <div className="card__body">
                <p>{profile && profile.length}</p>
                {totalProfile && (
                  <small>
                    Out of <b>{totalProfile}</b> active profiles
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className={`grid__item ${styles.item}`}>
            <label htmlFor="">Pool</label>
            <div className="card">
              <div className="card__body">
                <p>{pool && pool.length}</p>
                {totalPool && (
                  <small>
                    Out of <b>{totalPool}</b> pools
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <Suspense fallback={<LoadingSpinner />}>
        <Await resolve={loaderData.profile} errorElement={<div>Could not load data 😬</div>}>
          {(data) => (
            <>

            </>
          )}
        </Await>
      </Suspense> */}
    </section>
  )
}
