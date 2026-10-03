import { useEffect } from 'react'

export function useGSAP(callback, { dependencies = [] } = {}) {
  useEffect(() => callback?.(), dependencies)
}
