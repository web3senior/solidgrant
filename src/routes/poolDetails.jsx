import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Form, useActionData, Link, useLocation, useParams } from 'react-router-dom'
import { getProfile, getPool, getFund } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth, web3, registry, allo } from '../contexts/AuthContext'
import { AlloABI } from './../abi/Allo'
import Heading from './helper/Heading'
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
  const [strategy, setStrategy] = useState()
  const [registryAddr, setRegistryAddr] = useState()
  const [percentFee, setPercentFee] = useState()
  const [fund, setFund] = useState()
  const [totalFund,setTotalFund] = useState(0)
  const auth = useAuth()
  let errors = useActionData()
  const location = useLocation()
  const params = useParams()

  const getAlloPool = (poolId) => {
    const t = toast.loading(`Reading profile`)
    allo.getPool(poolId).then((data) => {
      console.log(data)
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

  const callPercentFee = () => {
    allo.getPercentFee().then((number) => {
      console.log(web3.utils.numberToHex(number))
      setPercentFee(web3.utils.numberToHex(number))
    })
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

  const handleGetStrategy = async () => {
    let addr = document.querySelector('[name="pool_id"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    await allo.getStrategy(params.poolId).then((result) => {
      setStrategy(result)
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

  useEffect(() => {
    getAlloPool(params.poolId)
    callRegistry()
    callPercentFee()

    getFund().then((res) => {
      let decodeFunds = []
      let totalFund = 0
      res.result.map(async (item, i) => {
        let decodedData = decodeFundPoolLog(item.data)
        decodedData['poolId'] = web3.utils.hexToNumber(item.topics[1])
        decodedData['timeStamp'] = new Date(Number(item.timeStamp) * 1000)

        // console.log(decodedData)
        decodedData['transactionHash'] = item.transactionHash
        let transactionData = await web3.eth.getTransaction(item.transactionHash)
        decodedData['from'] = transactionData.from
     

        if (decodedData.poolId.toString() === params.poolId.toString()) {
          decodeFunds.push(decodedData)
          totalFund += Number(decodedData.amount)
        }
        if (++i === res.result.length) setFund(decodeFunds)
      })

console.log(totalFund)
      setTotalFund(totalFund)
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
                  <label htmlFor="">Token of pool: </label>
                  <span className="text-danger">{pool.token}</span>
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
                    {strategy && (
                      <li>
                        <input type="text" defaultValue={strategy} />
                      </li>
                    )}
                    <li>
                      <input type="text" name="pool_id" placeholder="" />
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

          <Heading title={`Applications`} />

          <Heading title={`Funds`} />
          <label htmlFor="">Total: {web3.utils.fromWei(Number(totalFund), 'ether')}</label>
          <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '800px' }}>
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
                            <span>{item.from}</span>
                          </li>
                          <li>
                            <a href={`https://goerli.etherscan.io/tx/${item.transactionHash}`} target='_blank'>View</a>
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
          </div>
        </>
      )}
    </section>
  )
}
