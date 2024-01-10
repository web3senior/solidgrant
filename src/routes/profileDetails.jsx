import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Form, useActionData, Link, useLocation, useParams } from 'react-router-dom'
import { getProfile, getPool } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth, web3, registry } from '../contexts/AuthContext'
import Heading from './helper/Heading'
import MaterialIcon from './helper/MaterialIcon'
import styles from './ProfileDetails.module.scss'
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
  const [profile, setProfile] = useState()
  const [native, setNative] = useState()
  const [alloOwner, setAlloOwner] = useState()
  const auth = useAuth()
  let errors = useActionData()
  const location = useLocation()
  const params = useParams()

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

  const getRegistryProfile = async (profileId) => {
    const t = toast.loading(`Reading profile`)
    await registry.getProfileById(profileId).then(data =>{
      setProfile(data)
      toast.dismiss(t)
    })
  }

  const handleAddMember = async () => {
    let addr = document.querySelector('[name="member_addr_add"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    const t = toast.loading(`Sending request`)
    const transactionData = registry.addMembers({
      profileId: params.profileId.toString('hex'),
      members: addr.split(','),
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

  const handleRemoveMember = async () => {
    let addr = document.querySelector('[name="member_addr_remove"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    const t = toast.loading(`Sending request`)
    const transactionData = registry.removeMembers({
      profileId: params.profileId.toString('hex'),
      members: addr.split(','),
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

  const handleProfileNameUpdate = async () => {
    let name = document.querySelector('[name="profile_name"]').value

    const t = toast.loading(`Sending request`)
    if (name === '') {
      toast.error(`Name can't be empty`)
      return
    }

    const transactionData = registry.updateProfileName({
      profileId: params.profileId.toString('hex'),
      name: name,
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

  const handleProfileMetadataUpdate = async () => {
    let pointer = document.querySelector('[name="profile_metadata"]').value

    if (pointer === '') {
      toast.error(`Pointer can't be empty`)
      return
    }

    const t = toast.loading(`Sending request`)
    const transactionData = registry.updateProfileMetadata({
      profileId: params.profileId.toString('hex'),
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

  const handleIsMember = async () => {
    let addr = document.querySelector('[name="member_addr_is"]').value

    if (addr === '') {
      toast.error(`Address can't be empty`)
      return
    }

    await registry
      .isMemberOfProfile({
        profileId: params.profileId.toString('hex'),
        account: addr,
      })
      .then((result) => {
        if (result) toast.success(`Yes`)
        else toast.error(`No`)
      })
  }

  const callNative = (e) => {
    registry.getNative().then((res) => setNative(res))
  }

  const callAlloOwner = (e) => {
    registry.getAlloOwner().then((res) => setAlloOwner(res))
  }

  useEffect(() => {
    getRegistryProfile(params.profileId)
    callNative()
    callAlloOwner()
    // getProfile().then((res) => {
    //   let decodedProfiles = []
    //   res.result.map(async (item, i) => {
    //     let decodedData = await decodeProfileLog(item.data)
    //     decodedData['profileId'] = item.topics[1]
    //      console.log(decodedData)
    //     if (decodedData._owner.toString() === auth.wallet.toString()) decodedProfiles.push(decodedData)
    //     if (++i === res.result.length) setProfile(decodedProfiles)
    //   })
    // })
  }, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={title} />

      {profile && (
        <>
          <div className="card">
            <div className="card__body">
              <p className="alert alert--warning border">Open the metadata link directly or use IPFS page to fetch metadata content</p>
              <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                <li>
                  <label htmlFor="">Allo Owner: </label>
                  <span>{alloOwner}</span>
                </li>
                <li>
                  <label htmlFor="">Native: </label>
                  <span>{native}</span>
                </li>
                <li>
                  <label htmlFor="">Id: </label>
                  <span>{profile.id}</span>
                </li>
                <li>
                  <label htmlFor="">Name: </label>
                  <span className="badge bage-light">{profile.name}</span>
                </li>
                <li>
                  <label htmlFor="">Owner: </label>
                  <span>{profile.owner}</span>
                </li>
                <li>
                  <label htmlFor="">Metadata: </label>
                  <a href={`https://ipfs.io/ipfs/${profile.metadata.pointer}`} className="ml-10 text-primary" target="_blank">
                    <span>{profile.metadata.pointer}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Heading title={`Manage`} />

          <div className={`${styles.assetItem} grid grid--fit grid--gap-1`} style={{ '--data-width': '300px' }}>
            <div className="card">
              <div className="card__header">Update Profile Name</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="profile_name" placeholder="" />
                    </li>
                    <li>
                      <button onClick={() => handleProfileNameUpdate()}>Update</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Update Profile Metadata</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="profile_metadata" placeholder="IPFS pointer" />
                      <small className="text-muted">Use IPFS page to upload your data</small>
                    </li>
                    <li>
                      <button onClick={() => handleProfileMetadataUpdate()}>Update</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Add Member</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="member_addr_add" placeholder="addr1, addr2" />
                    </li>
                    <li>
                      <button onClick={() => handleAddMember()}>Add</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Remove Member</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="member_addr_remove" placeholder="addr1, addr2" />
                    </li>
                    <li>
                      <button onClick={() => handleRemoveMember()}>Remove</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">Is member</div>
              <div className="card__body">
                <div className="form">
                  <ul className="d-flex flex-column" style={{ rowGap: '1rem' }}>
                    <li>
                      <input type="text" name="member_addr_is" placeholder="wallet addr" />
                    </li>
                    <li>
                      <button onClick={() => handleIsMember()}>Check</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
