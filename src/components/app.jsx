import React, { useState, useEffect } from 'react'
import Setup from './setup'
import styles from './app.css'

export default () => {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0)
  const [setupComplete, setSetupComplete] = useState(false)
  const baseUrl = '/api'
  const apiCall = () => fetch(`${baseUrl}/`)

  useEffect(() => {
    if(count == 0) {
      document.querySelector('*').style = 'padding:0px;margin:0px;'
      document.querySelector('body').style = 'padding:0px;margin:0px;'
      setCount(1)
    }
  }, [count])
  return ( 
    <div className={styles.test}>
      {setupComplete 
      ? ( <LightController /> )
      : ( <Setup setSetupComplete={setSetupComplete} />) }
    </div>
  )
}