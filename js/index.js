import NoSleep from 'nosleep.js'
var noSleep = new NoSleep()

import { WebAudioSession } from './web-audio-session.js'

MicroEvent.mixin(WebAudioSession)

WebAudioSession.bind('started', () => {
  // fires when audio session has started
})

WebAudioSession.bind('loaded', () => {
  // fires when all files are finished loading
  document.getElementById("loading_indicator").classList.add('hidden')
})

WebAudioSession.bind('playing', () => {
  // fires when audio start playing
  document.getElementById("resume_button").classList.add('hidden') // hide the Resume button - NB it may already be hidden in which case this line should do nothing
  document.getElementById("stop_button").classList.remove('hidden') // show the Stop button
})

WebAudioSession.bind('stopped', () => {
  // fires when audio stops playing
  document.getElementById("stop_button").classList.add('hidden') // hide the Stop button
  document.getElementById("resume_button").classList.remove('hidden') // show the Resume button
})

// to avoid weird uses of the word 'cue', let's say we have four episodes. each has the same ambient sound cue and each has a different, second sound cue

// check the URL to see which episode we should be playing
const queryParams = new URLSearchParams(document.location.search) // in the URL, this is everything after a question mark, i.e. "https://google.com/stuff?user=Bob" should return the object { user: "Bob" }

let activeEpisode
if(!queryParams || !queryParams.get('episode')){ 
  activeEpisode = 1 // in case of trouble, default to episode 1
} else {
  activeEpisode = parseInt(queryParams.get('episode'))
}

console.log("Episode: " + activeEpisode)

// set up prev/next episode UI
let prevEpisode = document.getElementById('previous_episode')
let nextEpisode = document.getElementById('next_episode')
if(activeEpisode !== 1) { 
  prevEpisode.classList.remove('hidden')
  prevEpisode.setAttribute('href', '/?episode=' + (activeEpisode - 1))
  // nextEpisode.classList.remove('hidden')
} 

if(activeEpisode !== 4) {  
  nextEpisode.classList.remove('hidden')
  nextEpisode.setAttribute('href', '/?episode=' + (activeEpisode + 1))
}


// define episodes and their audio files
let episodes = [
  {
    episodeNumber: 1,
    episodeLabel: "Part 1: Winter",
    audioAssets:[
      "./sounds/HolidayCorner-Scene1-Amb.mp3",
      "./sounds/HolidayCorner-Scene1-Mus.mp3"
    ]
  },{
    episodeNumber: 2,
    episodeLabel: "Part 2: The Voyage",
    audioAssets:[
      "./sounds/HolidayCorner-Scene2-Amb.mp3",
      "./sounds/HolidayCorner-Scene2-Mus.mp3"
    ]
  },{
    episodeNumber: 3,
    episodeLabel: "Part 3: The Meeting Place",
    audioAssets:[
      "./sounds/HolidayCorner-Scene3-Amb.mp3",
      "./sounds/HolidayCorner-Scene3-Mus.mp3"
    ]
  },{
    episodeNumber: 4,
    episodeLabel: "Part 4: Spring",
    audioAssets:[
      "./sounds/HolidayCorner-Scene4-Amb.mp3",
      "./sounds/HolidayCorner-Scene4-Mus.mp3"
    ]
  }
]

let activeEpisodeDetails = episodes.find( episode => episode.episodeNumber == activeEpisode)

// update episode title on page
document.getElementsByClassName('episode-title')[0].innerText = activeEpisodeDetails.episodeLabel

// set up what happens when user interacts with slider
document.getElementById("crossfade_slider").addEventListener('input', (event) => {
  // console.log(event)
  const value = event.target.value
  WebAudioSession.updateFaderValue(value)
})

// set up what happens when user interacts with Begin button
document.getElementById("enable_audio_button").addEventListener('click', (event) => {
  noSleep.enable()
  setTimeout(() => {
    noSleep.disable()
  }, 60*10) // 60 seconds per minute times ten minutes 

  document.getElementById("enable_audio_button").setAttribute('disabled', " ") // button will not accept further presses

  document.getElementById("loading_indicator").classList.remove('hidden')

  // get the audio assets for the active episode
  let activeAssets = activeEpisodeDetails.audioAssets 

  WebAudioSession
    .enable(activeAssets) // pass the audio assets for this episode
    .then( () => {
      document.getElementById("crossfade_slider").removeAttribute('disabled') // enable the slider
      document.getElementById("enable_audio_button").remove() // delete the Begin button
    })
    .catch(error => {
      // something went wrong, restore the button to a pressable state
      document.getElementById("enable_audio_button").removeAttribute('disabled')
      console.log(error)
    })
}, false)

// set up the Stop button
document.getElementById("stop_button").addEventListener( 'click', event => {
  WebAudioSession.stopAll()
  noSleep.disable()
})

// set up the Resume button
document.getElementById("resume_button").addEventListener( 'click', event => {
  WebAudioSession.startAll()
  noSleep.enable()
})
