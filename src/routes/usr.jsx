import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Link, useParams } from 'react-router-dom'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ERC725 } from '@erc725/erc725.js'
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json'
import Swal from 'sweetalert2'
import { useAuth } from './../contexts/AuthContext'
import Shimmer from './helper/Shimmer'
import Icon from './helper/MaterialIcon'
import { LSPFactory } from '@lukso/lsp-factory.js'
import { web3, PROVIDER, chainID, connectWallet } from './../contexts/AuthContext'
import erc725schema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json'
import LSP4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json'
import LSP7Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json'
import LSP8Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP8Mintable.json'
import Web3 from 'web3'
import styles from './Usr.module.scss'
import Loading from './components/LoadingSpinner'

export const loader = async ({ request, params }) => {
  return defer({
    someDataHere: [],
  })
}

export default function Profile({ title }) {
  Title(title)
  const [loaderData, setLoaderData] = useState(useLoaderData())
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [profile, setProfile] = useState([])
  const [QRcode, setQRcode] = useState()
  const [coinBalance, setCoinBalance] = useState(0)
  const [receivedAssets, setReceivedAssets] = useState()
  const [assetAddressMetaData, setAssetAddressMetaData] = useState([])
  const [tokenName, setTokenName] = useState('UPcard')
  const [tokenSymbol, setTokenSymbol] = useState('UPc')
  const [tokenCount, setTokenCount] = useState(100)
  const [tokenReceiverAddress, setTokenReceiverAddress] = useState()
  const [tokenAmount, setToeknAmount] = useState(1)
  const [tokenTransferAddress, setTokenTransferAddress] = useState(1)
  const auth = useAuth()
  const params = useParams()

  const getCoin = async (addr) => {
    chainID().then(async (id) => {
      console.log(id)
      return await fetch(`https://api.explorer.execution.${id === 4201 ? 'testnet' : 'mainnet'}.lukso.network/api/v2/addresses/${addr}`, {
        method: 'GET',
        redirect: 'follow',
      })
        .then((response) => response.json())
        .then((result) => {
          console.log(result)
          if (result.message === 'Not found') toast.error(`${result.message}. Change your network and try again`, { icon: '⚠️', duration: 8000 })
          setCoinBalance(result.coin_balance > 0 ? web3.utils.fromWei(result.coin_balance) : 0)
        })
        .catch((error) => console.log('error', error))
    })
  }

  const awesomeQRcode = (data, bg) => {
    toDataURL(bg, function (dataURL) {
      //  console.log(dataURL);
      return new AwesomeQR.AwesomeQR({
        text: data,
        size: 500,
        backgroundImage: dataURL, //'./logo11w.png'
        dotScale: 0.6,
        correctLevel: 2,
        colorDark: '#000',
        colorLight: '#fff',
        autoColor: true,
      })
        .draw()
        .then((dataURL) => {
          // console.log(dataURL)
          setQRcode(dataURL)
        })
    })
  }

  function toDataURL(src, callback) {
    let image = new Image()
    image.crossOrigin = 'Anonymous'
    image.onload = function () {
      let canvas = document.createElement('canvas')
      let context = canvas.getContext('2d')
      canvas.height = this.naturalHeight
      canvas.width = this.naturalWidth
      context.drawImage(this, 0, 0)
      let dataURL = canvas.toDataURL('image/jpeg')
      callback(dataURL)
    }
    image.src = src

    setIsLoading(false)
  }

  const createTokenAndMint = async () => {
    let mintingToast = toast.loading('Minting...')
    const metadataOBJ = {
      LSP4Metadata: {
        description: 'My UPcard Address',
        links: [
          { title: 'My UPcard', url: `https://upcard.link/usr/${auth.wallet}` },
          { title: 'Create a new UPcard', url: 'https://upcard.link' },
        ],
        icon: [
          {
            width: 256,
            height: 256,
            url: QRcode,
            verification: {
              method: 'keccak256(bytes)',
              data: '0x01299df007997de92a820c6c2ec1cb2d3f5aa5fc1adf294157de563eba39bb6f',
            },
          },
        ],
        images: [
          // COULD be used for LSP8 NFT art
          [
            {
              width: 1024,
              height: 1024,
              url: QRcode, //'ifps://QmW4wM4r9yWeY1gUCtt7c6v3ve7Fzdg8CKvTS96NU9Uiwr',
              verification: {
                method: 'keccak256(bytes)',
                data: '0xa9399df007997de92a820c6c2ec1cb2d3f5aa5fc1adf294157de563eba39bb6e',
              },
            },
          ],
        ],
        assets: [
          // {
          //   verification: {
          //     method: 'keccak256(bytes)',
          //     data: '0x98fe032f81c43426fbcfb21c780c879667a08e2a65e8ae38027d4d61cdfe6f55',
          //   },
          //   url: QRcode,
          //   fileType: 'fbx',
          // },
        ],
        attributes: [
          {
            key: 'Version',
            value: '2',
            type: 'string',
          },
          {
            key: 'Author',
            value: 'Deez Lab',
            type: 'number',
          },
          {
            key: '🆙',
            value: true,
            type: 'boolean',
          },
        ],
      },
    }

    let accounts = await PROVIDER.request({ method: 'eth_requestAccounts', params: [] })
    console.log(accounts)

    const lspFactory = new LSPFactory(PROVIDER, { chainId: chainID })

    return await lspFactory.LSP7DigitalAsset.deploy(
      {
        isNFT: true,
        controllerAddress: accounts[0],
        name: tokenName,
        symbol: tokenSymbol,
        digitalAssetMetadata: metadataOBJ,
      },
      {
        onDeployEvents: {
          next: (deploymentEvent) => {
            console.log(deploymentEvent)
          },
          error: (error) => {
            console.error(error)
          },
          complete: (contracts) => {
            toast.success('Digital Asset deployment completed')
            console.log(`Digital Asset deployment completed => `, contracts.LSP7DigitalAsset)
            toast.dismiss(mintingToast)
            return contracts.LSP7DigitalAsset.address
          },
        },
      }
    )
  }

  const mintToekn = async (walletAddr, contractAddr) => {
    const myToken = new web3.eth.Contract(LSP7Mintable.abi, contractAddr)
    return await myToken.methods.mint(walletAddr, tokenCount, false, '0x').send({
      from: walletAddr,
      gas: 100_000,
    })
  }

  const handleMint = async () => {
    createTokenAndMint().then((res) => {
      console.log(res)
      connectWallet().then((wallet) => {
        mintToekn(wallet, res.LSP7DigitalAsset.address).then((res) => {
          console.log(res)
          toast.success(`Minted , Refresh to see!`, { icon: '🎉', duration: 6000 })
        })
      })
    })
  }

  const handleMint2 = async () => {
    const myToken = new web3.eth.Contract(LSP7Mintable.abi, {
      gas: 1_000_000,
      gasPrice: '1000000000',
    })

    // deploy the token contract
    return await myToken
      .deploy({
        data: LSP7Mintable.bytecode,
        arguments: [
          'UPcard', // token name
          'UPC', // token symbol
          '0xc1A411B2F0332C86c90Af22f5367A0265bCB1Df9', // new owner, who will mint later
          false, // isNonDivisible = TRUE, means NOT divisible, decimals = 0)
        ],
      })
      .send({ from: '0xc1A411B2F0332C86c90Af22f5367A0265bCB1Df9' })
  }

  const readAssets = async (assetAddr) => {
    try {
      const profile = new ERC725(erc725schema, assetAddr, PROVIDER, { ipfsGateway: `https://api.universalprofile.cloud/ipfs` })
      const result = await profile.fetchData('LSP5ReceivedAssets[]')
      return result.value
    } catch (error) {
      console.log('This is not an ERC725 Contract: ', error)
    }
  }

  async function fetchAssetData(address) {
    console.log(address)
    try {
      const digitalAsset = new ERC725(LSP4Schema, address, PROVIDER, { ipfsGateway: `https://api.universalprofile.cloud/ipfs` })
      return await digitalAsset.fetchData() //'LSP4Metadata'
    } catch (error) {
      console.log('Could not fetch asset data: ', error)
    }
  }

  async function uploadAssetToIPFS() {
    const lspFactory = new LSPFactory(PROVIDER, {
      ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
      chainId: chainID,
    })
    return await lspFactory.LSP4DigitalAssetMetadata.uploadMetadata({
      LSP4Metadata: {
        description: 'The first digial golden pig.',
        links: [
          { title: 'Twitter', url: 'https://twitter.com/goldenpig123' },
          { title: 'goldenpig.org', url: 'https://goldenpig.org' },
        ],
        icon: [
          {
            width: 256,
            height: 256,
            url: 'ifps://QmW5cF4r9yWeY1gUCtt7c6v3ve7Fzdg8CKvTS96NU9Uiwr',
            verification: {
              method: 'keccak256(bytes)',
              data: '0x01299df007997de92a820c6c2ec1cb2d3f5aa5fc1adf294157de563eba39bb6f',
            },
          },
        ],
        images: [
          // COULD be used for LSP8 NFT art
          [
            {
              width: 1024,
              height: 974,
              url: 'ifps://QmW4wM4r9yWeY1gUCtt7c6v3ve7Fzdg8CKvTS96NU9Uiwr',
              verification: {
                method: 'keccak256(bytes)',
                data: '0xa9399df007997de92a820c6c2ec1cb2d3f5aa5fc1adf294157de563eba39bb6e',
              },
            },
          ],
        ],
        assets: [
          {
            verification: {
              method: 'keccak256(bytes)',
              data: '0x98fe032f81c43426fbcfb21c780c879667a08e2a65e8ae38027d4d61cdfe6f55',
            },
            url: 'ifps://QmPJESHbVkPtSaHntNVY5F6JDLW8v69M2d6khXEYGUMn7N',
            fileType: 'fbx',
          },
        ],
        attributes: [
          {
            key: 'Standard type',
            value: 'LSP',
            type: 'string',
          },
          {
            key: 'Standard number',
            value: 4,
            type: 'number',
          },
          {
            key: '🆙',
            value: true,
            type: 'boolean',
          },
        ],
      },
    })
  }

  const transferTokenToAnAddress = async (addr) => {
    const myToken = new web3.eth.Contract(LSP7Mintable.abi, tokenTransferAddress)

    return await myToken.methods
      .transfer(
        addr, // sender address
        tokenReceiverAddress, // receiving address
        tokenAmount, // token amount
        false, // force parameter
        '0x' // additional data
      )
      .send({ from: addr })
  }

  const handleTransferToken = async () => {
    connectWallet().then(async (addr) => {
      transferTokenToAnAddress(addr).then((res) => {
        console.log(res)
        if (res.blockHash) toast.success(`Token sent! Block number: ${res.blockNumber}`)
      })
    })
  }

  const handleShowSendModal = async (contractAddr) => {
    setShowSendModal(true)
    toast(`Add receiver address & amount`, { icon: '🆙' })
    setTokenTransferAddress(contractAddr)
  }

  useEffect(() => {
    connectWallet().then((addr) => {
      readAssets(addr).then((assets) => {
        // console.log(assets)
        // return false
        setReceivedAssets(assets)

        assets.map((assetAddr) => {
          fetchAssetData(assetAddr).then((result) => {
            // console.log(result)
            // return false;
            setAssetAddressMetaData((OldassetAddressMetaData) => [...OldassetAddressMetaData, result])
          })
        })
      })
    })

    getCoin(params.addr)

    auth.fetchProfile(params.addr).then((data) => {
      setProfile(data)
      console.log(data)
      awesomeQRcode(`ethereum:${params.addr}`, `https://ipfs.io/ipfs/${data.value.LSP3Profile.profileImage[0].url.slice(7)}`)
    })

    /**
     *
     */
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      {showModal && (
        <>
          <div className={styles.overlay}>
            <div className={`${styles.overlayContainer} card`}>
              <div className="card__header">
                <b>Add your UPcard name, symbol, and count 🦄</b>
              </div>
              <div className="card__body">
                <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                  <li>
                    <label htmlFor="">Name:</label>
                    <input type="text" placeholder="Name" defaultValue={tokenName} onChange={(e) => setTokenName(e.target.value)} />
                  </li>
                  <li>
                    <label htmlFor="">Symbol:</label>
                    <input type="text" placeholder="Symbol" defaultValue={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} />
                  </li>
                  <li>
                    <label htmlFor="">Count:</label>
                    <input type="number" min={1} placeholder="Count" defaultValue={tokenCount} onChange={(e) => setTokenCount(e.target.value)} />
                    <small>Default mint count is 100</small>
                  </li>
                  <li className="d-flex justify-content-between">
                    <button className={`${styles.card__download}`} style={{ color: '#333' }} onClick={() => handleMint()}>
                      Start to mint
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false)
                      }}
                      style={{ background: '#fff', border: '1px solid #333', color: '#333', padding: '.1rem 1.5rem' }}
                    >
                      Dismiss
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {showSendModal && (
        <>
          <div className={styles.overlay}>
            <div className={`${styles.overlayContainer} card`}>
              <div className="card__header">
                <b>Add receiver address and amount 🦄</b>
              </div>
              <div className="card__body">
                <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                  <li>
                    <label htmlFor="">receiving address:</label>
                    <input type="text" placeholder="0x..." defaultValue={tokenReceiverAddress} onChange={(e) => setTokenReceiverAddress(e.target.value)} />
                  </li>
                  <li>
                    <label htmlFor="">Amount:</label>
                    <input type="text" placeholder="1000" defaultValue={tokenAmount} onChange={(e) => setToeknAmount(e.target.value)} />
                  </li>
                  <li className="d-flex justify-content-between">
                    <button className={`${styles.card__download}`} style={{ color: '#333' }} onClick={() => handleTransferToken()}>
                      Transfer
                    </button>
                    <button
                      onClick={() => {
                        setShowSendModal(false)
                      }}
                      style={{ background: '#fff', border: '1px solid #333', color: '#333', padding: '.1rem 1.5rem' }}
                    >
                      Dismiss
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="__container" data-width="medium">
        {isLoading && (
          <Shimmer theme="light">
            <div>
              <div style={{ width: '100%', borderRadius: '24px', height: '200px', background: '#e1e1e1' }}></div>
              <div style={{ width: '80%', borderRadius: '24px', height: '20px', background: '#e1e1e1', marginTop: '1rem' }}></div>
              <div style={{ width: '50%', borderRadius: '24px', height: '20px', background: '#e1e1e1', marginTop: '1rem' }}></div>
              <div style={{ width: '90%', borderRadius: '24px', height: '20px', background: '#e1e1e1', marginTop: '1rem' }}></div>
              <div style={{ width: '30%', borderRadius: '24px', height: '20px', background: '#e1e1e1', marginTop: '1rem' }}></div>
              <ul className="d-flex" style={{ columnGap: '1rem' }}>
                <li className="flex-1">
                  <div style={{ width: '100%', borderRadius: '24px', height: '80px', background: '#e1e1e1', marginTop: '1rem' }}></div>
                </li>
                <li className="flex-1">
                  <div style={{ width: '100%', borderRadius: '24px', height: '80px', background: '#e1e1e1', marginTop: '1rem' }}></div>
                </li>
                <li className="flex-1">
                  <div style={{ width: '100%', borderRadius: '24px', height: '80px', background: '#e1e1e1', marginTop: '1rem' }}></div>
                </li>
              </ul>
            </div>
          </Shimmer>
        )}

        {profile && Object.keys(profile).length > 0 && (
          <>
            <h6 className="mb-20">UP data</h6>
            <div className="card">
              <div className="card__body">
                <ul>
                  <li className="text-center">
                    <img
                      alt={profile.value.LSP3Profile.name}
                      className={styles.profileImage}
                      style={{ margin: '0 auto', width: '120px' }}
                      src={`https://ipfs.io/ipfs/${profile.value.LSP3Profile.profileImage && profile.value.LSP3Profile.profileImage[0].url.slice(7)}`}
                    />
                  </li>
                  <li className="d-flex flex-column align-items-center">
                    <p>
                      <b>{profile.value.LSP3Profile.name}</b>
                    </p>
                    <p>{profile.value.LSP3Profile.description}</p>
                    <p>
                      <span className="badge badge-dark">{coinBalance} LYX</span>
                    </p>
                  </li>
                  <li className="d-flex flex-row align-items-center justify-content-center" style={{ columnGap: '1rem' }}>
                    {profile.value.LSP3Profile.links.length > 0 &&
                      profile.value.LSP3Profile.links.map((item, i) => (
                        <a href={item.url} className={styles.linkBadge} target="_blank" key={i}>
                          {item.title}
                        </a>
                      ))}
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {profile && Object.keys(profile).length > 0 && (
          <div className={`${styles.assetContainer} mt-40`}>
            <h6 className="mb-20">User Assets</h6>

            <div className={`${styles.assetItem} grid grid--fill`} style={{ '--data-width': '160px' }}>
              {assetAddressMetaData &&
                assetAddressMetaData.length > 0 &&
                assetAddressMetaData.map((item, i) => {
                  if (item && item[3].value && item[3].value.LSP4Metadata && typeof item[3].value.LSP4Metadata !== 'undefined')
                    return (
                      <ul className="grid__item" key={i}>
                        <li>
                          <figure>
                            <img src={`${item[3].value.LSP4Metadata.icon && item[3].value.LSP4Metadata.icon[0].url}`} />
                            {/* https://ipfs.io/ipfs/    .slice(7)*/}
                          </figure>
                        </li>
                        <li>
                          {/* Asset Address */}
                          <b className={styles.assetContractAddress}>
                            {receivedAssets && receivedAssets.length > 0 && receivedAssets[i].slice(0, 4) + '...' + receivedAssets[i].slice(38)}
                          </b>
                        </li>
                        <li>
                          {/* Token name */}
                          {item[1].value} <small>({item[2].value})</small>
                        </li>
                        <li style={{ textOverflow: 'balnce', height: '60px', overflow: 'hidden' }}>
                          {/* Token Metadata:  */}
                          {item[3].value.LSP4Metadata.description}
                        </li>
                        <li>
                          <button onClick={() => handleShowSendModal(receivedAssets[i])}>Send</button>
                        </li>
                      </ul>
                    )
                })}
            </div>
          </div>
        )}

        {profile && Object.keys(profile).length > 0 && (
          <>
            <h6 className="mb-20 mt-40">Mint your UPcard</h6>
            <div className={styles.card} id="my-node">
              <div className={`${styles.card__body}`}>
                <div className={` d-flex flex-row align-items-center justify-content-between`} style={{ columnGap: '1rem' }}>
                  <div>
                    <h6>{profile.value.LSP3Profile.name}</h6>
                    <ul className={`${styles.card__tag} d-flex mt-20 mb-10`}>
                      {profile.value.LSP3Profile.tags.length > 0 &&
                        profile.value.LSP3Profile.tags.map((item, i) => (
                          <li key={i}>
                            <span className={styles.badge}>{item}</span>
                          </li>
                        ))}
                    </ul>
                    <p>{profile.value.LSP3Profile.description}</p>
                  </div>

                  <div className={`d-flex flex-column`}>{QRcode && <img alt="QRCode" src={QRcode} className={styles.card__qrcode} />}</div>
                </div>

                <div className={`${styles.card__address}`}>{`www.upcard.link/usr/${params.addr}`}</div>
              </div>
            </div>

            <div style={{ maegin: '0 auto', textAlign: 'center' }}>
              <a href={QRcode} download className={`${styles.card__download} btn`}>
                <Icon name={`Download`} /> Download
              </a>
              <div className={`${styles.card__download} btn ml-10`} onClick={() => setShowModal((oldValue) => !oldValue)}>
                <Icon name={`Bolt`} /> Mint your UPcard
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// export const action = async ({ request, params }) => {
//   switch (request.method) {
//     case 'POST': {
//       let formData = await request.formData()
//       let id = formData.get('id')
//       let fullname = formData.get('fullname')
//       let status = formData.get('status')
//       let result = await getRequest(1, {
//         id: id,
//         fullname: fullname,
//         status: status,
//       })
//       console.log(result)
//       //return redirect('/admin/')
//       return null
//     }
//     case 'DELETE': {
//       return fakeDeleteProject(params.id)
//     }
//     default: {
//       throw new Response('', { status: 405 })
//     }
//   }
// }
