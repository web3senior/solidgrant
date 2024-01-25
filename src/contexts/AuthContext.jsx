import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { arbitrum, arbitrumGoerli, goerli } from 'viem/chains'
import { Registry, Allo, createProfile, MicroGrantsStrategy } from '@allo-team/allo-v2-sdk/'
// import { user } from '../util/api'
import toast, { Toaster } from 'react-hot-toast'
import Web3 from 'web3'

export const PROVIDER = window.ethereum
export const web3 = new Web3(PROVIDER)

export const registry = new Registry({ chain: goerli.id })
export const allo = new Allo({ chain: goerli.id })
export const strategy = new MicroGrantsStrategy({ chain: goerli.id })
export const myDevWallet = '0xbbeeed010f67978D410ceFdB416Ca5F0207fad9c'

export const AuthContext = React.createContext()
export function useAuth() {
  return useContext(AuthContext)
}

export const chainID = async () => await web3.eth.getChainId()
/**
 * Fetch Universal Profile
 * @param {address} addr
 * @returns
 */
export const fetchProfile = async (addr) => {
  const erc725js = new ERC725(lsp3ProfileSchema, addr, PROVIDER, {
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
  })
  return await erc725js.fetchData('LSP3Profile')
}

/**
 * Connect wallet
 */
export const connect = async () => {
  let loadingToast = toast.loading('Loading...')

  try {
    let accounts = await web3.eth.getAccounts()
    if (accounts.length === 0) await web3.eth.requestAccounts()
    accounts = await web3.eth.getAccounts()
    toast.dismiss(loadingToast)
    toast.success(`Wallet successfuly connected`)

    return accounts[0]
  } catch (error) {
    toast.error(error.message)
    toast.dismiss(loadingToast)
  }
}

/**
 * Connect wallet
 */
export const isWalletConnected = async () => {
  console.info('Check if wallet is connected...')

  try {
    let accounts = await web3.eth.getAccounts()
    console.log(accounts)
    if (accounts.length > 0) return accounts[0]
    else return false
  } catch (error) {
    toast.error(error.message)
  }
}

export function AuthProvider({ children }) {
  const [wallet, setWallet] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState()
  const navigate = useNavigate()
  const location = useLocation()

  function logout() {
    localStorage.removeItem('accessToken')
    navigate('/login')
    setUser(null)
  }
  function resetPassword() {}

  useEffect(() => {
    console.log(location.pathname )
    isWalletConnected().then((res) => {
      console.log(res)
      setIsConnected(res)
      setLoading(false)
      if (res) {
        console.log(res)
        setWallet(res)
        if (location.pathname ==='/')  navigate('/usr/dashboard')

      } else {
        navigate('/home')
      }
    })
  }, [])

  const value = {
    wallet,
    setWallet,
    profile,
    fetchProfile,
    setProfile,
    isWalletConnected,
    connect,
    logout,
    resetPassword,
  }

  if (!wallet  && location.pathname !=='/home') return <>Loading... !user</>

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
