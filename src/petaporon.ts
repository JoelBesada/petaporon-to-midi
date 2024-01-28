import chunk from 'lodash/chunk'
import { Midi } from '@tonejs/midi'

const ENCODING_CHARS =
  "#$%&'()*+,-~/0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}. !"

const encodingMap = ENCODING_CHARS.split('').reduce<Record<string, number>>(
  (acc, char, index) => {
    acc[char] = index
    return acc
  },
  {},
)

type PetaporonJson = {
  _type: 'Petaporon song'
  // Version
  v: number
  // Loop start
  l: number
  // Time signature (3/4 or 4/4)
  c: number
  // Tempo
  t: number
  // Swing
  s: number
  // Sound bank
  i: string
  // Notes
  n: string
}

type Note = {
  pitch: number
  instrument: number
  length: number
  start: number
}

export function convertToMidi(json: PetaporonJson) {
  const decodedNotes = decodeNotes(json.n)
  const tracks = splitIntoTracks(decodedNotes)

  const midi = new Midi()
  const tempo = json.t
  const timeSignature = json.c
  const secondsPerLengthUnit = 60 / tempo / 4
  midi.header.timeSignatures = [{ ticks: 0, timeSignature: [timeSignature, 4] }]
  midi.header.setTempo(json.t)

  tracks.forEach((notes, index) => {
    const track = midi.addTrack()
    track.name = `Track ${index + 1}`
    notes.forEach((note) => {
      track.addNote({
        midi: note.pitch + 48,
        time: note.start * secondsPerLengthUnit,
        duration: note.length * secondsPerLengthUnit,
      })
    })
  })

  return midi
}

function decodeNotes(noteString: string): Note[] {
  const encodedNotes = chunk(noteString.split(''), 5)

  return encodedNotes.map((note) => {
    return {
      pitch: decodeUint6(note[0]),
      instrument: decodeUint6(note[1]),
      length: decodeUint6(note[2]),
      start: decodeUint13(note.slice(3, 5) as [string, string]),
    }
  })
}

function splitIntoTracks(notes: Note[]) {
  const tracks: Note[][] = []
  const instrumentTracks: Record<number, number> = {}
  notes.forEach((note) => {
    const trackNumber = instrumentTracks[note.instrument]
    if (trackNumber === undefined) {
      tracks.push([note])
      instrumentTracks[note.instrument] = tracks.length - 1
    } else {
      tracks[trackNumber].push(note)
    }
  })
  return tracks.sort((a, b) => a[0].instrument - b[0].instrument)
}

function decodeUint13(chars: [string, string]) {
  return encodingMap[chars[0]] * ENCODING_CHARS.length + encodingMap[chars[1]]
}

function decodeUint6(char: string) {
  return encodingMap[char]
}
