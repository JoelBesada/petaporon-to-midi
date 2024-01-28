import fs from 'fs'
import { convertToMidi } from './petaporon'

function run() {
  const inputPath = process.argv.pop() as string
  let json = null
  try {
    json = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
  } catch (e) {
    console.log(`Unable to read JSON file at path "${inputPath}"`)
    process.exit(1)
  }
  const midi = convertToMidi(json)

  const midiPath = inputPath.replace('.json', '.mid')
  fs.writeFileSync(midiPath, midi.toArray(), 'binary')
  console.log(`Wrote MIDI file to ${midiPath}`)
}

run()
