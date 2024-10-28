import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Link, useActionData } from 'react-router-dom'
import { getProfile } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { StrategyType } from '@allo-team/allo-v2-sdk/dist/strategies/MicroGrantsStrategy/types'
import { useAuth, web3, allo, strategy } from './../contexts/AuthContext'
import { AlloABI } from './../abi/Allo'
import Shimmer from './helper/Shimmer'
import Heading from './helper/Heading'
import toast from 'react-hot-toast'
import styles from './PoolNew.module.scss'

export const loader = async ({ request }) => {
  return defer({
    profile: [],
  })
}

export default function Pool({ title }) {
  Title(title)
  const [loaderData, setLoaderData] = useState(useLoaderData())
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState()
  const [profile, setProfile] = useState([])
  const [strategyAddr, setStrategyAddr] = useState('')
  const auth = useAuth()
  let errors = useActionData()

  const handleCreatePool = () => {

    let profile_id = document.querySelector('[name="profile_id"]').value
    let name = document.querySelector('[name="name"]').value
    let website = document.querySelector('[name="website"]').value
    let description = document.querySelector('[name="description"]').value
    let token = document.querySelector('[name="token"]').value
    let approval_threshold = document.querySelector('[name="approval_threshold"]').value
    let fund_amount = document.querySelector('[name="fund_amount"]').value
    let max_amount = document.querySelector('[name="max_amount"]').value
    let start_date = document.querySelector('[name="start_date"]').value
    let end_date = document.querySelector('[name="end_date"]').value
    let banner = document.querySelector('[name="banner"]').value

    if (profile_id === '') {
      toast.error(`Profile Id can't be empty`)
      return
    }

    if (start_date === '' || end_date === '') {
      toast.error(`Dates can't be empty`)
      return
    }










    const tStrategy = toast.loading(`Deploying strategy`)
    const strategyType = StrategyType.MicroGrants
    const deployParams = strategy.getDeployParams(strategyType)

    const myContract = new web3.eth.Contract(deployParams.abi, {
      gasPrice: web3.eth.gas_pric,
    })
    myContract
      .deploy({
        data: deployParams.bytecode,
        arguments: [allo.address(), 'MyStrategy'],
      })
      .send({
        from: auth.wallet,
      })
      .then(async (result) => {

        setStrategyAddr(result._address)
        console.log(`Contract deployed at ${result._address}`)
        toast.dismiss(tStrategy)
        let deployedStrategyAddress = result._address



        const tPool = toast.loading(`Creating pool`)

        // NOTE: Timestamps should be in seconds and start should be a few minutes in the future to account for transaction times.7
        const startDateInSeconds = Math.floor(new Date(start_date).getTime() / 1000) + 300
        const endDateInSeconds = Math.floor(new Date(end_date).getTime() / 1000) + 900
        const initParams = {
          useRegistryAnchor: true,
          allocationStartTime: BigInt(startDateInSeconds),
          allocationEndTime: BigInt(endDateInSeconds),
          approvalThreshold: BigInt(approval_threshold),
          maxRequestedAmount: BigInt(web3.utils.toWei(max_amount, 'ether')),
        }
        // get the init data
        const initStrategyData = await strategy.getInitializeData(initParams)

        console.log(initStrategyData)

        const poolCreationData = {
          profileId: profile_id, // sender must be a profile member
          strategy: deployedStrategyAddress,
          initStrategyData: initStrategyData,
          token: token.toLowerCase() || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase(), //'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase(), //'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase(),
          amount: BigInt(web3.utils.toWei(fund_amount, 'ether')), // web3.utils.toWei('1', 'ether'),
          metadata: {
            protocol: BigInt(1),
            pointer: 'bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi',
          },
          managers: [auth.wallet],
        }

        // console.log(poolCreationData)
        // return

        const createPoolData = allo.createPoolWithCustomStrategy(poolCreationData)
        console.log(createPoolData)

        web3.eth
          .sendTransaction({
            from: auth.wallet,
            to: createPoolData.to,
            data: createPoolData.data,
            value: BigInt(createPoolData.value),
          })
          .then(function (receipt) {
            console.log(receipt)
            toast.dismiss(tPool)
            toast.success(`Pool created`)
          })
      })
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
    const t = toast.loading(`Reading profiles`)
    getProfile().then((res) => {
      toast.dismiss(t)
      let decodedProfiles = []
      res.result.map(async (item, i) => {
        decodeProfileLog(item.data).then((decodedData) => {
          decodedData['profileId'] = item.topics[1]
          decodedData['timeStamp'] = new Date(Number(item.timeStamp) * 1000)
          // console.log(decodedData)
          if (decodedData._owner.toString() === auth.wallet.toString()) decodedProfiles.push(decodedData)
          if (++i === res.result.length)
            setProfile(
              decodedProfiles.sort((a, b) => {
                return b.timeStamp - a.timeStamp
              })
            )
        })
      })
    })
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={title} />

      <div className={`__container`} data-width={`medium`}>
        <div className="card mb-40">
          <div className="card__header">Create A New Pool</div>
          <div className="card__body d-flex flex-column form" style={{ rowGap: '1rem' }}>
            <div>
              <label htmlFor="">Profile Id</label>

              {profile && (
                <>
                  <select name="profile_id" id="">
                    {profile.map((item, i) => (
                      <option key={i} value={item.profileId}>{`${item.profileId.slice(0, 14)}...${item.profileId.slice(item.profileId.length - 14, item.profileId.length)}`}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <div>
              <label htmlFor="">Strategy</label>
              <select name="strategy_addr" id="">
                <option value={strategyAddr}>MicroGrants</option>
                <option value={strategyAddr}>Hats</option>
                <option value={strategyAddr}>Gov</option>
              </select>
            </div>
            <div>
              <label htmlFor="">Name</label>
              <input type="text" name="name" disabled />
            </div>
            <div>
              <label htmlFor="">Website</label>
              <input type="text" name="website" disabled />
            </div>
            <div>
              <label htmlFor="">Description</label>
              <input type="text" name="description" disabled />
            </div>
            <div>
              <label htmlFor="">Token Address</label>
              <input type="text" name="token" defaultValue={`0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`} />
            </div>
            <div>
              <label htmlFor="">Approval Threshold</label>
              <input type="number" min={0} name="approval_threshold" defaultValue={1} />
            </div>
            <div>
              <label htmlFor="">Fund Pool Amount</label>
              <input type="text" name="fund_amount" defaultValue={`0.0001`} />
              <small className="text-warning">Primary fund</small>
            </div>
            <div>
              <label htmlFor="">Max Grant Amount</label>
              <input type="text" name="max_amount" defaultValue={`0.7`} />
            </div>
            <div>
              <label htmlFor="">Start Date</label>
              <input type="datetime-local" name="start_date" />
            </div>
            <div>
              <label htmlFor="">End Date</label>
              <input type="datetime-local" name="end_date" />
            </div>
            <div>
              <label htmlFor="">Banner</label>
              <input type="file" name="banner" disabled />
            </div>
            <div className="mt-20">
              <button onClick={() => handleCreatePool()} className="btn">
                Create Pool
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
