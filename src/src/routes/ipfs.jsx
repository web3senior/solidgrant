import { Suspense, useState, useEffect } from 'react'
import { useLoaderData, defer, Await, Form, useActionData, json } from 'react-router-dom'
import { getPool } from '../util/api'
import { Title } from './helper/DocumentTitle'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth, web3 } from './../contexts/AuthContext'
import Heading from './helper/Heading'
import toast from 'react-hot-toast'
import pinataSDK from '@pinata/sdk'
import styles from './Ipfs.module.scss'

const pinata = new pinataSDK({ pinataJWTKey: import.meta.env.VITE_PINATA_API_KEY })

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
  const [uploadResult, setUploadResult] = useState()
  const [downloadResult, setDownloadResult] = useState()

  const auth = useAuth()
  let errors = useActionData()

  const handleUpload = async () => {
    let loadingToast = toast.loading(`Uploading....`)
    try {
      let jsonObj = JSON.parse(document.querySelector('[name="jsonToUpload"]').value)
      await pinata.pinJSONToIPFS(jsonObj).then((result) => {
        console.log(result)
        setUploadResult(result.IpfsHash)
        toast.dismiss(loadingToast)
      })
    } catch (error) {
      console.log(error)
      toast.error(error.message)
      toast.dismiss(loadingToast)
    }
  }

  const handleDownload = async (CID) => {
    let loadingToast = toast.loading(`Downloading....`)
    try {
      let requestOptions = {
        method: 'GET',
        redirect: 'follow',
      }

      const response = await fetch(`  https://rose-eldest-koala-728.mypinata.cloud/ipfs/${CID}`, requestOptions)
      if (!response.ok) throw new Response('Failed to get data', { status: 500, statusText: 'Not found' })
      await response.json().then((obj) => {
        console.log(obj)
        setDownloadResult(obj)
      })
      toast.dismiss(loadingToast)
    } catch (error) {
      console.log(error)
      toast.error(error.statusText)
      toast.dismiss(loadingToast)
    }
  }

  useEffect(() => {}, [])

  return (
    <section className={`${styles.section} animate fade`}>
      <Heading title={title} />

      <div className={`__container`} data-width={`large`}>
        <div className="alert alert--warning border">Add Pinata API key on setting page</div>

        <div className={`card`}>
          <div className={`card__header`}>Upload</div>
          <div className={`card__body`}>
            {uploadResult && (
              <>
                <label htmlFor="">CID</label>
                <input type="text" defaultValue={uploadResult} />
                <p>
                  <a href={`https://ipfs.io/ipfs/${uploadResult}`}>View</a>
                </p>
              </>
            )}
            <label htmlFor="">JSON</label>
            <textarea name="jsonToUpload" id="" cols="30" rows="10"></textarea>
            <button onClick={() => handleUpload()}>Upload JSON</button>
          </div>
        </div>

        <div className={`card mt-40`}>
          <div className={`card__header`}>Download</div>
          <div className={`card__body`}>
            {downloadResult && (
              <>
                <label htmlFor="">CID Data</label>
                <textarea name="downloadResult" id="" cols="30" rows="10" defaultValue={JSON.stringify(downloadResult)}></textarea>
                <p>
                  <a href={`https://ipfs.io/ipfs/${downloadResult}`}>View</a>
                </p>
              </>
            )}
            <label htmlFor="">CID</label>
            <input name="cid" type="text" />
            <button onClick={() => handleDownload(document.querySelector('[name="cid"]').value)} className="mt-10">
              Download JSON
            </button>
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
