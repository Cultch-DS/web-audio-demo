/*
CohortWebAudioSession
X takes a list of assets (sound files)
X loads them
X prepares for playback
X emits 'started' event
X emits 'loaded' event
X emits 'playing' and 'stopped' events

- verify slider matches fader
- 'enable' needs to be once only
- iOS is janky -- load time?
- check Tone.Players to see if it's more useful?
- take cuelist with cueContent field, loop / loop start / loop end fields
*/

import * as Tone from 'tone'

var WebAudioSession = {
  players: new Map(), // sample buffers to hold each track
  fader: null, // crossfader

  enable: async function(audioAssets){
    try {
      await Tone.start()
    } catch (error){
      return error
    } // most errors here are the result of mobile browsers trying to prevent 'autoplaying' audio which is usually annoying to users

    this.trigger('started')
    console.log('audio session started')

    audioAssets.forEach( (audioAsset, index) => {
      let player = new Tone.Player(audioAsset)
      if(index == 0){
        // it's the ambient file (first in asset list), loop that bad boy
        player.loop = true
      }
      this.players.set("" + index, player)
    })

    Tone.loaded().then(() => {
      this.trigger('loaded')
      console.log('loading complete')
      // setting up crossfade
      if(this.players.size == 2){ // make sure there's only two samples / tracks
        try {
          this.fader = new Tone.CrossFade().toDestination()
        } catch(error){
          console.log("derp, something went wrong making the fader")
          return
        }
        // connect the two inputs
        const ambient = this.players.get("0").connect(this.fader.a).start()
        const cue = this.players.get("1").connect(this.fader.b).start()
        this.fader.fade.value = 0.5
        this.trigger('playing')
      } else {
        console.log("Error -- this patch setup needs exactly two files passed in")
      }
    })
  },

  updateFaderValue: function(value /* between 0 and 1*/){
    this.fader.fade.value = value // set the value of the crossfader to the user-set value of the slider
  },

  stopAll: function(){
    this.players.forEach( player => {
      player.stop()
    })
    this.trigger('stopped')
  },

  startAll: function(){
    this.players.forEach( player => {
      player.start()
    })
    this.trigger('playing')
  }
}

export { WebAudioSession }