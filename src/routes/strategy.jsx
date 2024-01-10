import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Form, useActionData, Link } from 'react-router-dom'
import { getProfile, getPool } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth, web3, strategy } from './../contexts/AuthContext'
import { StrategyType } from '@allo-team/allo-v2-sdk/dist/strategies/MicroGrantsStrategy/types'
import { RegistryABI } from './../abi/Registry'
import Heading from './helper/Heading'
import styles from './Strategy.module.scss'
import toast from 'react-hot-toast'

export const loader = async ({ request }) => {
  return defer({
    profile: getProfile(),
  })
}

export default function Profile({ title }) {
  Title(title)
  const [loaderData, setLoaderData] = useState(useLoaderData())
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState([])
  const [profile, setProfile] = useState([])
  const [pool, setPool] = useState([])
  const auth = useAuth()
  let errors = useActionData()

  const handleDeployStrategy = async () => {
    const strategyType = StrategyType.MicroGrants
    const deployParams = strategy.getDeployParams(strategyType)

    // console.log(deployParams)

    try {
      const myContract = new web3.eth.Contract(deployParams.abi, {
        gasPrice: 209598,
      })
      const deployTx = await myContract
        .deploy({
          data: deployParams.bytecode,
          arguments: [
            '0x1133eA7Af70876e64665ecD07C0A0476d09465a1', // Or get from allo.address()
            'MyStrategy',
          ],
        })
        .send({
          from: auth.wallet,
        })
        .then((result) => {
          //setStrategyAddr(result._address)
          console.log(`Contract deployed at ${result._address}`)
        })
    } catch (e) {
      console.error('Deploying Strategy', e)
    }
  }


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

  useEffect(() => {
    // getProfile().then((res) => {
    //   let decodedProfiles = []
    //   res.result.map(async (item, i) => {
    //     let decodedData = await decodeProfileLog(item.data)

    //     decodedData['profileId'] = item.topics[1]
    //     decodedData['timeStamp'] = item.timeStamp
    //     console.log(decodedData)

    //     if (decodedData._owner.toString() === auth.wallet.toString()) decodedProfiles.push(decodedData)
    //     if (++i === res.result.length)
    //       setProfile(
    //         decodedProfiles.sort((a, b) => {
    //           return b.timeStamp - a.timeStamp
    //         })
    //       )
    //   })
    // })
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={`Create a new strategy`} />

      <div className={`__container`} data-width={`large`}>
        <div className="card mb-40">
          <div className="card__body">
            <div className="alert alert--warning">Each strategy can be assigned once to a pool</div>

            <ul className='d-flex flex-column form' style={{rowGap:'1rem'}}>
              <li>
                <label htmlFor="">Strategy Name</label>
                <input type="text" name="name" />
              </li>
              <li>
                <label htmlFor="">Strategy Type</label>
                <select name="strategyType" id="">
                  <option value="">MicroGrants</option>
                </select>
              </li>
            </ul>

            <button onClick={() => handleDeployStrategy()} className="mt-10">
              Deploy Strategy
            </button>
          </div>
        </div>

        <Heading title={`My profiles`} />

        <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '300px' }}>
          {profile &&
            profile.length > 0 &&
            profile.map((item, i) => {
              return (
                <div className="card grid__item" key={i}>
                  <div className="card__body">
                    <h6>{item._name}</h6>
                    {/* <p>{item._owner}</p>
                      <p>Member count: {Array.isArray(item._members) ? JSON.parse(item._members).length : 1}</p> */}
                    <label htmlFor="">Profile ID</label>
                    <input type="text" defaultValue={item.profileId} />
                    <br />
                    <p><Link to={`${item.profileId}`}>Manage Profile</Link></p>
                  </div>
                </div>
              )
            })}
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
