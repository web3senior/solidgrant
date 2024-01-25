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
  const [profileId, setProfileId] = useState()
  const [pool, setPool] = useState()
  const [strategyAddr, setStrategyAddr] = useState()
  const [registryAddr, setRegistryAddr] = useState()
  const [percentFee, setPercentFee] = useState()
  const [fund, setFund] = useState()
  const [totalFund, setTotalFund] = useState(BigInt(0))
  const [anchor, setAnchor] = useState()
  const [recipient, setRecipient] = useState()
  const [poolStatus, setPoolStatus] = useState(null)
  const [allocationStartTime, setAllocationStartTime] = useState()
  const [allocationEndTime, setAllocationEndTime] = useState()
  const [approvalThreshould, setApprovalThreshould] = useState()
  const auth = useAuth()
  let errors = useActionData()
  const location = useLocation()
  const params = useParams()

  const handleDistribute = async (e) => {
    const txData = allo.distribute(params.poolId, [auth.wallet], '')
    console.log(txData)

    try {
      web3.eth
        .sendTransaction({
          from: auth.wallet,
          to: txData.to,
          data: txData.data,
          value: BigInt(txData.value),
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

  const handleAllocate = async (recipientId) => {
    strategy.setPoolId(params.poolId)
    const txData = strategy.getAllocationData(recipientId, 2)
    console.log(txData)

    try {
      web3.eth
        .sendTransaction({
          from: auth.wallet,
          to: txData.to,
          data: txData.data,
          value: BigInt(txData.value),
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

  const handleNewReciepeint = async () => {
    let requested_amount_recipient = document.querySelector('[name="requested_amount_recipient"]').value

    await strategy.setPoolId(params.poolId).then(console.log)

    const registerRecipientData = strategy.getRegisterRecipientData({
      registryAnchor: anchor,
      recipientAddress: auth.wallet, //auth.wallet, //The wallet to which the funds would be sent to.
      requestedAmount: BigInt(web3.utils.toWei(requested_amount_recipient, 'ether')),
      metadata: {
        protocol: BigInt(1),
        pointer: 'QmRoRQ9E6qqP8GKSuMZzFuimYqrk6d6S8uLVB3EtTGg4t7',
      },
    })

    const t = toast.loading(`Registering`)

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
      toast.dismiss(t)
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
    const transactionData = allo.addPoolManager(params.poolId, addr)
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
    const transactionData = allo.removePoolManager(params.poolId, addr)
    console.log(transactionData)

    try {
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
    } catch (error) {
      toast.error(error.message)
      toast.dismiss(t)
    }
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

  const callIsPoolActive = (strategyAddressRes) => {
    strategy.setContract(strategyAddressRes)
    strategy.isPoolActive(params.poolId).then((res) => {
      console.log(res)
      setPoolStatus(res)
    })
  }

  const callIsAllocationDates = (strategyAddressRes) => {
    strategy.setContract(strategyAddressRes)

    strategy.allocationStartTime(params.poolId).then((res) => {
      let date = new Date(Number(res) * 1000).toLocaleString()
      setAllocationStartTime(date)
    })

    strategy.allocationEndTime(params.poolId).then((res) => {
      let date = new Date(Number(res) * 1000).toLocaleString()
      setAllocationEndTime(date)
    })
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

      const result = await allo.getStrategy(poolId)
      setStrategyAddr(result)
      return result
    }

    return await allo.getStrategy(poolId)
  }

  const handleSetAllocator = async () => {
    // strategy.setContract('0xBab7309F6e871b3cD015f43f1774C1F95679CF8E')
    let allocator_address = document.querySelector('[name="allocator_address"]').value

    const transactionData = strategy.getBatchSetAllocatorData([
      {
        allocatorAddress: allocator_address,
        flag: true,
      },
    ])

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

  const getRegistryProfile = async (profileId) => {
    const t = toast.loading(`Reading anchor`)
    await registry.getProfileById(profileId).then((data) => {
      console.log(data)
      setAnchor(data.anchor)
      toast.dismiss(t)
    })
  }

  const decodeRecipientLog = (data) => {
    let decodeResult = web3.eth.abi.decodeLog(
      [
        { internalType: 'bytes', name: '_data', type: 'bytes' },
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

  const decodeRecipientStatus = async (recipientId) => {
    let result = await strategy.getRecipientStatus(recipientId)
    switch (result.toString()) {
      case '0':
        return 'None'
      case '1':
        return 'Pending'
      case '2':
        return 'Accepted'
      case '3':
        return 'Rejected'
      case '4':
        return 'Appealed'
      case '5':
        return 'InReview'
      case '6':
        return 'Canceled'
      default:
        break
    }
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
      callPoolAmount(strategyAddressRes) // total pool amount
      callIsPoolActive(strategyAddressRes)
      callIsAllocationDates(strategyAddressRes)

      strategy.setContract(strategyAddressRes)
      strategy.approvalThreshold(params.poolId).then((res) => {
        setApprovalThreshould(web3.utils.toNumber(res))
      })

      getRecipient(strategyAddressRes).then((res) => {
        // Get applications
        let decodeRecipint = []

        res.result.map(async (item, i) => {
          let decodedData = decodeRecipientLog(item.data)
          let recipientId = web3.eth.abi.decodeParameter('address', item.topics[1])

          decodedData['recipientId'] = recipientId
          decodedData['timeStamp'] = new Date(Number(item.timeStamp) * 1000)
          decodedData['transactionHash'] = item.transactionHash

          let transactionData = await web3.eth.getTransaction(item.transactionHash)
          decodedData['from'] = transactionData.from

          let get_data = await strategy.getRecipient(recipientId)
          decodedData['get_data'] = get_data
          decodedData['status'] = await decodeRecipientStatus(recipientId)

          console.log(decodedData)

          decodeRecipint.push(decodedData)

          if (++i === res.result.length) {
            console.log(decodeRecipint)
            setRecipient(decodeRecipint)
          }
        })
      })
    })
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={title} />

      {pool && (
        <>
          <div className="card">
            <div className="card__body">
              <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                <li>
                  <label htmlFor="">Token of the pool: </label>
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
                  <Link to={`/usr/profile/${pool.profileId}`} className='text-info'>{pool.profileId}</Link>
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
                  <label htmlFor="">StartTime: </label>
                  <span>{allocationStartTime}</span>
                </li>
                <li>
                  <label htmlFor="">EndTime: </label>
                  <span>{allocationEndTime}</span>
                </li>
                <li>
                  <label htmlFor="">Approval Threshould: </label>
                  <span>{approvalThreshould}</span>
                </li>
                <li>
                  <label htmlFor="">Status: </label>
                  <span>{poolStatus ? 'Yes' : 'No'}</span>
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

          <Heading title={`Manage Pool`} />
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

            <div className="card">
              <div className="card__header">Set Allocator</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="allocator_address" placeholder="Address" />
                    </li>
                    <li>
                      <button onClick={() => handleSetAllocator()}>Check</button>
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
                      <input type="text" name="account_addr" placeholder="Address" />
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
          <p className="alert alert--warning border">It does take a while to show funds transactions</p>
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
                        <ul className="d-flex flex-column" style={{ rowGap: '.1rem' }}>
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
                          <li>
                            recipientId: <span>{item.recipientId}</span>
                          </li>
                          <li>
                            Requested Amount:
                            <span className="badge badge-success ml-10">{web3.utils.fromWei(item.get_data.requestedAmount, 'ether')} ETH</span>
                          </li>
                          <li>
                            Status:
                            <span className="badge badge-dark ml-10">{item.status}</span>
                          </li>
                          <li>
                            <a href={`https://goerli.etherscan.io/tx/${item.transactionHash}`} target="_blank">
                              View
                            </a>
                          </li>
                          <li>
                            <span className="text-muted">{item.timeStamp.toLocaleString()}</span>
                          </li>
                          <li>
                            <button onClick={() => handleAllocate(item.recipientId)}>Allocate: Accepted</button>

                            <button onClick={() => handleDistribute()} className='ml-10'>Distribute</button>
                          </li>
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

          <div className="card mt-40">
            <div className="card__header">New Recipient</div>
            <div className="card__body">
              <div>
                <input type="text" name="requested_amount_recipient" defaultValue={`0.00001`} />
              </div>
              <button onClick={() => handleNewReciepeint()} className="btn mt-20">
                Register Recipient
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
