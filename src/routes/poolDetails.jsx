import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Form, useActionData, Link, useLocation, useParams } from 'react-router-dom'
import { getProfile, getPool, getFund, getRecipient } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth, web3, registry, allo, strategy } from '../contexts/AuthContext'
import { MicroGrantsABI } from './../abi/Microgrants'
import { AlloABI } from './../abi/Allo'
import Heading from './helper/Heading'
import Shimmer from './helper/Shimmer'
import MaterialIcon from './helper/MaterialIcon'
import toast from 'react-hot-toast'
import styles from './PoolDetails.module.scss'

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
  const [pool, setPool] = useState()
  const [strategyAddr, setStrategyAddr] = useState()
  const [registryAddr, setRegistryAddr] = useState()
  const [percentFee, setPercentFee] = useState()
  const [fund, setFund] = useState()
  const [totalFund, setTotalFund] = useState(BigInt(0))
  const [anchor, setAnchor] = useState()
  const [recipient, setRecipient] = useState()
  const auth = useAuth()
  let errors = useActionData()
  const location = useLocation()
  const params = useParams()

  const handleNewReciepeint = async () => {
    // let addr = document.querySelector('[name="manager_addr_add"]').value

    // if (addr === '') {
    //   toast.error(`Address can't be empty`)
    //   return
    // }
    await strategy.setPoolId(params.poolId).then(console.log)

    const registerRecipientData = strategy.getRegisterRecipientData({
      registryAnchor: anchor,
      recipientAddress: auth.wallet, //The wallet to which the funds would be sent to.
      requestedAmount: BigInt(web3.utils.toWei('0.000001', 'ether')),
      metadata: {
        protocol: BigInt(1),
        pointer: 'QmRoRQ9E6qqP8GKSuMZzFuimYqrk6d6S8uLVB3EtTGg4t7',
      },
    })

    console.log(registerRecipientData)

    const t = toast.loading(`Registering`)
    // const transactionData = allo.registerRecipient({
    //   poolId: BigInt(params.poolId),
    //   strategyData: registerRecipientData
    // })
    // console.log(transactionData)

    // return

    try {
      web3.eth
        .sendTransaction({
          from: auth.wallet,
          to: registerRecipientData.to,
          data: registerRecipientData.data,
          value: BigInt(registerRecipientData.value),
        })
        .then(function (receipt) {
          console.log(receipt)
          toast.dismiss(t)
          toast.success(`Added`)
        })
    } catch (error) {
      console.log('Registering Application', e)
    }
  }

  const getAlloPool = (poolId) => {
    const t = toast.loading(`Reading pool`)
    allo.getPool(poolId).then((data) => {
      console.log(data)
      getRegistryProfile(data.profileId)
      setPool(data)
      toast.dismiss(t)
    })
  }

  const handleAddManager = async () => {
    let addr = document.querySelector('[name="manager_addr_add"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    const t = toast.loading(`Sending request`)
    const transactionData = allo.addPoolManager({
      poolId: params.poolId.toString('hex'),
      manager: addr,
    })
    console.log(transactionData)

    web3.eth
      .sendTransaction({
        from: auth.wallet,
        to: transactionData.to,
        data: transactionData.data,
        value: BigInt(transactionData.value),
      })
      .then(function (receipt) {
        console.log(receipt)
        toast.dismiss(t)
        toast.success(`Added`)
      })
  }

  const handleRemoveManager = async () => {
    let addr = document.querySelector('[name="manager_addr_remove"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    const t = toast.loading(`Sending request`)
    const transactionData = allo.removePoolManager({
      poolId: params.poolId.toString('hex'),
      manager: addr,
    })
    console.log(transactionData)

    web3.eth
      .sendTransaction({
        from: auth.wallet,
        to: transactionData.to,
        data: transactionData.data,
        value: BigInt(transactionData.value),
      })
      .then(function (receipt) {
        console.log(receipt)
        toast.dismiss(t)
        toast.success(`Removed`)
      })
  }

  const handleFundPool = async () => {
    let amount = document.querySelector('[name="fund_amount"]').value

    const t = toast.loading(`Funding`)
    if (amount === '') {
      toast.error(`Name can't be empty`)
      return
    }

    const transactionData = allo.fundPool(params.poolId, web3.utils.toWei(amount, 'ether'))
    console.log(transactionData)

    web3.eth
      .sendTransaction({
        from: auth.wallet,
        to: transactionData.to,
        data: transactionData.data,
        value: BigInt(web3.utils.toWei(amount, 'ether')),
      })
      .then(function (receipt) {
        console.log(receipt)
        toast.dismiss(t)
        toast.success(`Funded`)
      })
  }

  const handlePoolMetadataUpdate = async () => {
    let pointer = document.querySelector('[name="pool_metadata"]').value

    if (pointer === '') {
      toast.error(`Pointer can't be empty`)
      return
    }

    const t = toast.loading(`Sending request`)
    const transactionData = allo.updatePoolMetadata({
      poolId: params.poolId.toString('hex'),
      metadata: {
        protocol: BigInt(1),
        pointer: pointer,
      },
    })
    console.log(transactionData)

    web3.eth
      .sendTransaction({
        from: auth.wallet,
        to: transactionData.to,
        data: transactionData.data,
        value: BigInt(transactionData.value),
      })
      .then(function (receipt) {
        console.log(receipt)
        toast.dismiss(t)
        toast.success(`Updated`)
      })
  }

  const callRegistry = () => {
    allo.getRegistry().then((res) => setRegistryAddr(res))
  }

  const callPoolAmount = async (strategyAddressRes) => {
    strategy.setContract(strategyAddressRes)
    strategy.getPoolAmount(params.poolId).then((res) => {
      setTotalFund(res)
    })
  }

  const callPercentFee = () => {
    allo.getPercentFee().then((number) => setPercentFee(web3.utils.numberToHex(number)))
  }

  const handleIsPoolManager = async () => {
    let addr = document.querySelector('[name="manager_addr"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    await allo.isPoolManager(params.poolId, addr).then((result) => {
      if (result) toast.success(`Yes`)
      else toast.error(`No`)
    })
  }

  const handleIsPoolAdmin = async () => {
    let addr = document.querySelector('[name="admin_addr"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    await allo.isPoolAdmin(params.poolId, addr).then((result) => {
      if (result) toast.success(`Yes`)
      else toast.error(`No`)
    })
  }

  const handleHasRole = async () => {
    // let role = document.querySelector('[name="role"]').value
    //   let account_addr = document.querySelector('[name="account_addr"]').value
    //   if (role === '' || account_addr === '') {
    //     toast.error(`Role or Account Address can't be empty`)
    //     return
    //   }
    //   await allo
    //     .(params.poolId,addr)
    //     .then((result) => {
    //       if (result) toast.success(`Yes`)
    //       else toast.error(`No`)
    //     })
  }

  const handleGetStrategy = async (poolId) => {
    if (poolId === undefined) {
      let poolId = document.querySelector('[name="pool_id"]').value

      if (poolId === '') {
        toast.error(`Address can't be empty`)
        return
      }
    }

    const result = allo.getStrategy(poolId)
    setStrategyAddr(result)
    return result
  }

  const decodeFundPoolLog = (data) => {
    let decodeResult = web3.eth.abi.decodeLog(
      [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
      ],
      data
    )
    // console.log(decodeResult)
    return decodeResult
  }

  const decodeRecipientLog = (data) => {
    let decodeResult = web3.eth.abi.decodeLog(
      [
        {
          internalType: 'bytes',
          name: '_data',
          type: 'bytes',
        },
        {
          internalType: 'address',
          name: '_sender',
          type: 'address',
        },
      ],
      data
    )
    // console.log(decodeResult)
    return decodeResult
  }

  const getRegistryProfile = async (profileId) => {
    const t = toast.loading(`Reading anchor`)
    await registry.getProfileById(profileId).then((data) => {
      console.log(data)
      setAnchor(data.anchor)
      toast.dismiss(t)
    })
  }

  useEffect(() => {
    getAlloPool(params.poolId)
    callRegistry()
    callPercentFee()

    getFund().then((res) => {
      let decodeFunds = []

      res.result.map(async (item, i) => {
        let decodedData = decodeFundPoolLog(item.data)
        decodedData['poolId'] = web3.utils.hexToNumber(item.topics[1])
        decodedData['timeStamp'] = new Date(Number(item.timeStamp) * 1000)

        decodedData['transactionHash'] = item.transactionHash
        let transactionData = await web3.eth.getTransaction(item.transactionHash)
        decodedData['from'] = transactionData.from

        if (decodedData.poolId.toString() === params.poolId.toString()) {
          decodeFunds.push(decodedData)
          // console.log(decodedData.amount)
        }

        if (++i === res.result.length) setFund(decodeFunds)
      })
    })

    handleGetStrategy(params.poolId).then((strategyAddressRes) => {
      callPoolAmount(strategyAddressRes)

      getRecipient(strategyAddressRes).then((res) => { // Get applications
        let decodeRecipint = []

        res.result.map(async (item, i) => {
          let decodedData = decodeRecipientLog(item.data)
          // decodedData['recipientId'] = item.topics[1]
          // decodedData['timeStamp'] = new Date(Number(item.timeStamp) * 1000)
          // decodedData['transactionHash'] = item.transactionHash

          // let transactionData = await web3.eth.getTransaction(item.transactionHash)
          // decodedData['from'] = transactionData.from

          console.log(decodedData)
          decodeRecipint.push(decodedData)

          if (++i === res.result.length) {
            setRecipient(decodeRecipint)
          }
        })
      })
    })
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <button onClick={() => handleNewReciepeint()}>Register Recipient</button>
      <Heading title={title} />

      {pool && (
        <>
          <div className="card">
            <div className="card__body">
              <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                <li>
                  <label htmlFor="">Token of pool: </label>
                  <span className="text-danger">{pool.token.toLowerCase()}</span>
                </li>
                <li>
                  <label htmlFor="">Percent Fee : </label>
                  <span>{percentFee}</span>
                </li>
                <li>
                  <label htmlFor="">Admin Role: </label>
                  <span>{pool.adminRole}</span>
                </li>
                <li>
                  <label htmlFor="">Manager Role: </label>
                  <span>{pool.managerRole}</span>
                </li>
                <li>
                  <label htmlFor="">Profile/ Registry Id: </label>
                  <Link to={`/profile/${pool.profileId}`}>{pool.profileId}</Link>
                </li>
                <li>
                  <label htmlFor="">Anchor Address: </label>
                  <span>{anchor || `0x0`}</span>
                </li>
                <li>
                  <label htmlFor="">Registry Address: </label>
                  <span>{registryAddr}</span>
                </li>
                <li>
                  <label htmlFor="">Strategy: </label>
                  <span>{pool.strategy}</span>
                </li>
                <li>
                  <label htmlFor="">Metadata: </label>
                  <a href={`https://ipfs.io/ipfs/${pool.metadata.pointer}`} className="ml-10 text-primary" target="_blank">
                    <span>{pool.metadata.pointer}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Heading title={`Manage`} />
          <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '300px' }}>
            <div className="card">
              <div className="card__header">Fund Pool</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="fund_amount" defaultValue={`0.00001`} placeholder="" />
                    </li>
                    <li>
                      <button onClick={() => handleFundPool()}>Fund</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Update Pool Metadata</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="pool_metadata" placeholder="IPFS pointer" />
                    </li>
                    <li>
                      <button onClick={() => handlePoolMetadataUpdate()}>Update</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Add Manager</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="manager_addr_add" placeholder="Address" />
                    </li>
                    <li>
                      <button onClick={() => handleAddManager()}>Add</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Remove Manager</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="manager_addr_remove" placeholder="Address" />
                    </li>
                    <li>
                      <button onClick={() => handleRemoveManager()}>Remove</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Is Pool Admin</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="admin_addr" placeholder="Adress" />
                    </li>
                    <li>
                      <button onClick={() => handleIsPoolAdmin()}>Check</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Is Pool Manager</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="manager_addr" placeholder="Address" />
                    </li>
                    <li>
                      <button onClick={() => handleIsPoolManager()}>Check</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Get Strategy</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    {strategyAddr && (
                      <li>
                        <input type="text" defaultValue={strategyAddr} />
                      </li>
                    )}
                    <li>
                      <input type="text" name="pool_id" defaultValue={params.poolId} />
                    </li>
                    <li>
                      <button onClick={() => handleGetStrategy()}>Check</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card" style={{ opacity: '0.4' }}>
              <div className="card__header">Has Role</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="role" placeholder="" />
                    </li>
                    <li>
                      <input type="text" name="account_addr" placeholder="Adress" />
                    </li>
                    <li>
                      <button onClick={() => handleHasRole()}>Check</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Heading title={`Pool Funds`} />
          {fund && (
            <div className="card mb-10">
              <div className="card__body d-flex">
                <MaterialIcon name={`functions`} />
                Pool Amount: {totalFund && <span className="text-danger ml-10">{web3.utils.fromWei(BigInt(totalFund), 'ether')} ETH</span>}
                {!totalFund && <>Reading...</>}
              </div>
            </div>
          )}

          <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '400px' }}>
            {fund &&
              fund.map((item, i) => {
                return (
                  <div className="card" key={i}>
                    <div className="card__body">
                      <div className="form">
                        <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                          <li>
                            <span className="badge badge-success">{web3.utils.fromWei(Number(item.amount), 'ether')} ETH</span>
                          </li>
                          <li>
                            From: <b>{`${item.from.slice(0, 4)}...${item.from.slice(item.from.length - 4, item.from.length)}`}</b>
                            {item.from.toLowerCase() === auth.wallet.toLowerCase() && <span className="badge badge-pill badge-light ml-10">You</span>}
                          </li>
                          <li>
                            <a href={`https://goerli.etherscan.io/tx/${item.transactionHash}`} target="_blank">
                              View
                            </a>
                          </li>
                          <li>
                            <span className="text-muted">{item.timeStamp.toLocaleString()}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}

            {!fund && (
              <>
                {[0, 0].map((item, i) => (
                  <Shimmer key={i}>
                    <div className={styles.fundShimmer}></div>
                  </Shimmer>
                ))}
              </>
            )}
          </div>

          <Heading title={`Applications`} />
          <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '800px' }}>
            {recipient &&
              recipient.map((item, i) => {
                return (
                  <div className="card" key={i}>
                    <div className="card__body">
                      <div className="form">
                        <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                          {/* <li>
                            Sender: <span>{item._sender}</span>
                          </li>
                          <li>
                            <span className="badge badge-success">{web3.utils.fromWei(Number(item.amount), 'ether')} ETH</span>
                          </li>
                          <li>
                            <a href={`https://goerli.etherscan.io/tx/${item.transactionHash}`} target="_blank">
                              View
                            </a>
                          </li>
                          <li>
                            <span className="text-muted">{item.timeStamp.toLocaleString()}</span>
                          </li> */}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}

            {!recipient && (
              <>
                {[0, 0].map((item, i) => (
                  <Shimmer key={i}>
                    <div className={styles.fundShimmer}></div>
                  </Shimmer>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}