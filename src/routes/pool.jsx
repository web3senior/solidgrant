import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Link, useActionData } from 'react-router-dom'
import { getPool } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { StrategyType } from '@allo-team/allo-v2-sdk/dist/strategies/MicroGrantsStrategy/types'
import { useAuth, web3, allo, strategy } from './../contexts/AuthContext'
import { AlloABI } from './../abi/Allo'
import Heading from './helper/Heading'
import toast from 'react-hot-toast'
import styles from './Pool.module.scss'

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
  const [pool, setPool] = useState()
  const [strategyAddr, setStrategyAddr] = useState('0x030B9c43e18d3054717E4b0D195893Ca7A9A32F4')
  const auth = useAuth()
  let errors = useActionData()

  const handleDeployStrategy = async () => {
    const strategyType = StrategyType.MicroGrants
    const deployParams = strategy.getDeployParams(strategyType)

    // console.log(deployParams)

    try {
      const myContract = new web3.eth.Contract(deployParams.abi, {
        gasPrice: web3.eth.gas_pric,
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
          setStrategyAddr(result._address)
          console.log(`Contract deployed at ${result._address}`)
        })
    } catch (e) {
      console.error('Deploying Strategy', e)
    }
  }

  const handleCreatePool = async () => {
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

    const t = toast.loading(`Sending request`)
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
      strategy: strategyAddr,
      initStrategyData: initStrategyData,
      token: token || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', //'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase(), //'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase(),
      amount: BigInt(web3.utils.toWei(fund_amount, 'ether')), // web3.utils.toWei('1', 'ether'),
      metadata: {
        protocol: BigInt(1),
        pointer: 'bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi',
      },
      managers: [auth.wallet], //0x8ef170a969bd664cd09d21f9fab3f84329183bab
    }

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
        toast.dismiss(t)
        toast.success(`Pool created`)
      })

    // const createPoolArgs = {
    //   nonce: Math.floor(Math.random() * 10000),
    //   name: document.querySelector('[name="name"]').value,
    //   metadata: {
    //     protocol: BigInt(1),
    //     pointer: 'bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi',
    //   },
    //   owner: auth.wallet,
    //   members: [auth.wallet],
    // }

    // const myContract = new web3.eth.Contract(AlloABI, '0x1133eA7Af70876e64665ecD07C0A0476d09465a1')

    // myContract.methods
    //   .createProfile(createProfileArgs.nonce, createProfileArgs.name, createProfileArgs.metadata, createProfileArgs.owner, createProfileArgs.members)
    //   .send({ from: myAddress })
    //   .once('sending', function (payload) {
    //     console.log(payload)
    //   })
    //   .then(async function (receipt) {
    //     console.log(receipt)
    //     document.querySelector('textarea').value = receipt.toString()
    //     let getProfileId = await receipt.events.ProfileCreated.returnValues[0]
    //     setAnchor(await receipt.events.ProfileCreated.returnValues.anchor)
    //     setProfileId(getProfileId)
    //   })
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
    const t = toast.loading(`Fetching pools`)
    getPool().then((res) => {
      let decodedPools = []
      res.result.map(async (item, i) => {
        let decodedData = await decodePoolLog(item.data)
        let transactionData = await getTransactionInfo(item.transactionHash)

        decodedData['poolId'] = web3.utils.hexToNumber(item.topics[1])
        decodedData['createdAt'] = new Date(Number(item.timeStamp) * 1000)

        if (transactionData.from.trim().toLowerCase().toString() === auth.wallet.trim().toLowerCase().toString()) decodedPools.push(decodedData)
        if (++i === res.result.length) {
          setPool(decodedPools)
          toast.dismiss(t)
        }
      })
    })
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={title} />
      <div className={`__container`} data-width={`small`}>
        <div className="card mb-40">
          <div className="card__header">Create A New Pool</div>
          <div className="card__body d-flex flex-column form" style={{ rowGap: '1rem' }}>
            <div>
              <label htmlFor="">Profile Id</label>
              <input type="text" name="profile_id" defaultValue={`0xb278eceb9784ab032e9fce72edbc409faa60c94c5e2ab7eb78dcded4f8342cff`} />
            </div>
            <div>
              <label htmlFor="">Strategy</label>
              <input type="text" name="strategy_addr" defaultValue={strategyAddr} />
            </div>
            <div>
              <label htmlFor="">Name</label>
              <input type="text" name="name" />
            </div>
            <div>
              <label htmlFor="">Website</label>
              <input type="text" name="website" />
            </div>
            <div>
              <label htmlFor="">Description</label>
              <input type="text" name="description" />
            </div>
            <div>
              <label htmlFor="">Token Address</label>
              <input type="text" name="token" />
            </div>
            <div>
              <label htmlFor="">Approval Threshold</label>
              <input type="number" min={0} name="approval_threshold" defaultValue={1} />
            </div>
            <div>
              <label htmlFor="">Fund Pool Amount</label>
              <input type="text" name="fund_amount" defaultValue={`0.0001`} />
            </div>
            <div>
              <label htmlFor="">Max Grant Amount</label>
              <input type="text" name="max_amount" defaultValue={`0.00001`} />
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
              <input type="file" name="banner" />
            </div>
            <div className="mt-20">
              <button onClick={() => handleDeployStrategy()}>Deploy Strategy</button>
              <button onClick={() => handleCreatePool()}>Create Pool</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '300px' }}>
        {pool &&
          pool.length > 0 &&
          pool.map((item, i) => {
            return (
              <Link to={`${item.poolId}`} key={i}>
                <div className="card grid__item" key={i}>
                  <div className="card__body">
                    <p>
                      Id: <b>{item.poolId}</b>
                    </p>
                    <p>
                      Amount: <span className="badge badge-dark">{web3.utils.fromWei(Number(item._amount), 'ether')} ETH</span>
                    </p>
                    <p>{item._owner}</p>
                    <p>
                      Manager:
                      <span className="badge badge-warning badge-pill ml-10">{Array.isArray(item._members) ? JSON.parse(item._members).length : 1}</span>
                    </p>
                    <small>Created at {item.createdAt.toDateString()}</small>
                  </div>
                </div>
              </Link>
            )
          })}
      </div>
    </section>
  )
}
