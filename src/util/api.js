import { useAuth, web3, registry, allo, strategy } from '../contexts/AuthContext'

export const getProfile = async (address, topic0) => {
  let parameters = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    fromBlock: 0,
    toBlock: 'latest',
    address: address || '0x4AAcca72145e1dF2aeC137E1f3C5E3D75DB8b5f3',
    topic0: topic0 || '0x1e28352ff00d67474b59b87e6817d6ba65daa0130446266db8640214d8b80609',
    apikey: import.meta.env.VITE_BLOCKSCAN_API_KEY,
  })

  var requestOptions = {
    method: 'GET',
    redirect: 'follow',
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_BLOCKSCAN_API_ADDR + parameters.toString()}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  } catch (error) {
    console.log('error', error)
  }
}

export const getPool = async (address, topic0) => {
  let parameters = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    fromBlock: 0,
    toBlock: 'latest',
    address: address || allo.address(),
    topic0: topic0 || '0x69bcb5a6cf6a3c95185cbb451e77787240c866dd2e8332597e3013ff18a1aba1',
    apikey: import.meta.env.VITE_BLOCKSCAN_API_KEY,
  })

  var requestOptions = {
    method: 'GET',
    redirect: 'follow',
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_BLOCKSCAN_API_ADDR + parameters.toString()}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  } catch (error) {
    console.log('error', error)
  }
}

export const getFund = async (address, topic0) => {
  let parameters = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    fromBlock: 0,
    toBlock: 'latest',
    address: address || allo.address(),
    topic0: topic0 || '0xbf59838198f4ea92f663f5c1fc697f151a1b746b7dff86d564f250a55cbb4851',
    apikey: import.meta.env.VITE_BLOCKSCAN_API_KEY,
  })

  var requestOptions = {
    method: 'GET',
    redirect: 'follow',
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_BLOCKSCAN_API_ADDR + parameters.toString()}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  } catch (error) {
    console.log('error', error)
  }
}

export const getRecipient = async (address, topic0) => {
  if (address === undefined) throw new Error(`Strategy address is required`)

  let parameters = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    fromBlock: 0,
    toBlock: 'latest',
    address: address, // Strategy Address
    topic0: topic0 || '0xa197306e3dd5494a61a695381aa809a53b8e377a685e84e404a85d5a8da6cc62',
    apikey: import.meta.env.VITE_BLOCKSCAN_API_KEY,
  })

  var requestOptions = {
    method: 'GET',
    redirect: 'follow',
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_BLOCKSCAN_API_ADDR + parameters.toString()}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  } catch (error) {
    console.log('error', error)
  }
}

//================================PHP
/**
 * Get Tour
 * @returns
 */
// export async function getTour() {
//   let requestOptions = {
//     method: 'GET',
//     redirect: 'follow',
//   }

//   const response = await fetch(`${import.meta.env.VITE_API_URL}tour`, requestOptions)
//   if (!response.ok) throw new Response('Failed to get data', { status: 500 })
//   return response.json()
// }

// /**
//  * Login
//  * @param {json} post
//  * @returns
//  */
// export async function login(post) {
//   var requestOptions = {
//     method: 'POST',
//     body: JSON.stringify(post),
//     redirect: 'follow',
//   }

//   const response = await fetch(`${import.meta.env.VITE_API_URL}login`, requestOptions)
//   if (!response.ok) throw new Response('Failed to get data', { status: 500 })
//   return response.json()
// }