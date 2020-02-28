import React, { useState, useEffect } from 'react'
import Setup from './Setup'
import LightMixer from './lightMixer'

export default () => {
  const [count, setCount] = useState(0)
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    if(count == 0) {
      document.querySelector('*').style = 'padding:0px;margin:0px;'
      document.querySelector('body').style = 'padding:0px;margin:0px;'
      setCount(1)
    }
  }, [count])
  return ( 
    <div>
      {setupComplete 
      // ? ( <LightMixer /> )
      ? ( <p> YEET </p> )
      : ( <Setup setSetupComplete={setSetupComplete} />) }
    </div>
  )
}