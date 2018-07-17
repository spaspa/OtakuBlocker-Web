<template lang="pug">
  div.header(role="header")
    div#po
    svg#curve(version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px" y="0px" viewBox="0 0 602 137"
              style="enable-background:new 0 0 602 137;"
              xml:space="preserve")
      path.st0(d="M602.2,0v64c-81.9,0-213.3,0-250.3,47.5c-0.1,0.2-0.2,0.3-0.4,0.5c-11.6,15.2-29.9,25-50.5,25 s-38.9-9.8-50.5-25c-0.1-0.2-0.3-0.3-0.4-0.5C213.1,64,81.7,64-0.2,64V0H602.2z")
      path.st0(d="M1311.2,0v64c-82.2,0-214.2,0-250.7,48h-101C923,64,791,64,708.8,64V0H1311.2z")
      circle.st0(cx="1010" cy="73.5" r="63.5")
    a.button.is-primary.is-rounded.is-large#executeButton
      span.icon.is-large
        i.fas.fa-ban.fa-lg
    h1 Otaku Blocker
</template>

<script>
export default {
}
</script>

<style lang="sass" scoped>

.header
  position: fixed
  top: 0
  left: 0
  z-index: 100

#po
  background: #4185D5
  height: 43px
  width: 100vw
  position: fixed
  top: 0
  left: 0

#curve
  fill: #4185D5
  width: 400px
  position: fixed
  top: 0px
  left: 50%
  transform: translate(-50%, 0px)

#executeButton
  max-width: 80px
  max-height: 80px
  width: 40vw
  height: 40vw
  position: fixed
  top: 10px
  left: 50%
  transform: translate(-50%, 0px)
  box-shadow: 4px 5px 8px 0px rgba(0, 0, 0, 0.2)
  display: flex
  align-items: center
  justify-content: center

h1
  color: white
  position: fixed
  font-weight: 600
  top: 10px
  left: 20px

</style>
