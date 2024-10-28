import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Form, useActionData, Link } from 'react-router-dom'
import { getProfile, getPool } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth, web3 } from './../contexts/AuthContext'
import { RegistryABI } from './../abi/Registry'
import MaterialIcon from './helper/MaterialIcon'
import Heading from './helper/Heading'
import styles from './Profile.module.scss'
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

  const handleCreateProfile = async () => {
    let loadingToast = toast.loading(`Creating...`)
    const createProfileArgs = {
      nonce: Math.floor(Math.random() * 10000),
      name: document.querySelector('[name="registry_name"]').value,
      metadata: {
        protocol: BigInt(1),
        pointer: document.querySelector('[name="pointer"]').value,
      },
      owner: auth.wallet,
      members: [auth.wallet],
    }

    const myContract = new web3.eth.Contract(RegistryABI,'0x4AAcca72145e1dF2aeC137E1f3C5E3D75DB8b5f3')

    myContract.methods
      .createProfile(createProfileArgs.nonce, createProfileArgs.name, createProfileArgs.metadata, createProfileArgs.owner, createProfileArgs.members)
      .send({ from: auth.wallet })
      .once('sending', function (payload) {
        console.log(payload)
      })
      .then(async function (receipt) {
        console.log(receipt)
        let profileId = await receipt.events.ProfileCreated.returnValues[0]
        console.log(`Profile ID: ${profileId}`)
        toast.success(`Your profile created successfully.`)
        toast(`ID: ${profileId}`)
        toast.dismiss(loadingToast)
        // setAnchor(await receipt.events.ProfileCreated.returnValues.anchor)
        // setProfileId(profileId)
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
        let decodedData = await decodeProfileLog(item.data)

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
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <div className={`__container`} data-width={`large`}>
        <Heading title={`Create a new profile`} />
        <div className="card">
          <div className="card__body">
            <div className="alert alert--info">After creating a profile, you'll be able to add/ manage members</div>

            <ul>
              <li>
                <label htmlFor="">Registry Name</label>
                <input type="text" name="registry_name" />
              </li>
              <li>
                <label htmlFor="">Members</label>
                <input name="members" defaultValue={auth.wallet} />
                <small>Split addresses with ,</small>
              </li>
              <li>
                <label htmlFor="">Pointer</label>
                <input type="text" name="pointer" defaultValue={`QmS9XiFsCq2Ng6buJmBLvNWNpcsHs4uYBhVmBfSK2DFpsm`} />
              </li>
            </ul>

            <button onClick={() => handleCreateProfile()} className="mt-10">
              Create profile
            </button>
          </div>
        </div>

        <Heading title={`My profiles`} />

        <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '300px' }}>
          {profile &&
            profile.length > 0 &&
            profile.map((item, i) => {
              return (
                <Link to={`${item.profileId}`} key={i}>
                  <div className="card grid__item">
                    <div className="card__body d-flex justify-content-between" title={item.profileId}>
                      <div>
                        <h6>{item.profileId && `${item.profileId.slice(0, 4)}...${item.profileId.slice(item.profileId.length - 4, item.profileId.length)}`}</h6>
                        <p>Name: {item._name}</p>
                        <p>
                          Member:
                          <span className="badge badge-info badge-pill ml-10">{Array.isArray(item._members) ? JSON.parse(item._members).length : 1}</span>
                        </p>
                      </div>

                      <ul className="d-flex flex-column align-items-ceneter justify-content-between">
                        <li
                          onClick={() => {
                            navigator.clipboard.writeText(item.profileId)
                            toast.success(`Profile Id Copied`)
                          }}
                          style={{ cursor: 'pointer', color: 'var(--area1)'}}
                        >
                          <MaterialIcon name={`content_copy`} />
                        </li>
                        <li style={{ cursor: 'help' }} title={item.timeStamp}>
                          <MaterialIcon name={`today`} />
                        </li>
                      </ul>
                    </div>
                  </div>
                </Link>
              )
            })}
        </div>
      </div>
    </section>
  )
}
