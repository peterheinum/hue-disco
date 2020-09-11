const {eventHub} = require("../../utils/eventHub")

const beat = () => {
  console.log('     ^^     ')
  console.log('     @@     ')
  console.log('    @@@@    ')
  console.log('   @@@@@@   ')
  console.log('  @@@@@@@@  ')
  console.log(' @@@@@@@@@@ ')
  console.log('@@@@@@@@@@@@')
  console.log(' @@@@@@@@@@ ')
  console.log('  @@@@@@@@  ')
  console.log('   @@@@@@   ')
  console.log('    @@@@    ')
  console.log('     @@     ')
  console.log('     vv     ')
  console.log('\n')
}

eventHub.on('beat', beat)
console.log(beat)