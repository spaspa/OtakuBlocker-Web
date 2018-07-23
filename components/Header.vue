<template lang="pug">
  .header(role="header" :class="headerClass")
    #po
    svg#curve(version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px" y="0px" viewBox="0 0 602 137"
              style="enable-background:new 0 0 602 137;"
              xml:space="preserve")
      path.st0(d="M602.2,0v64c-81.9,0-213.3,0-250.3,47.5c-0.1,0.2-0.2,0.3-0.4,0.5c-11.6,15.2-29.9,25-50.5,25 s-38.9-9.8-50.5-25c-0.1-0.2-0.3-0.3-0.4-0.5C213.1,64,81.7,64-0.2,64V0H602.2z")
      path.st0(d="M1311.2,0v64c-82.2,0-214.2,0-250.7,48h-101C923,64,791,64,708.8,64V0H1311.2z")
      circle.st0(cx="1010" cy="73.5" r="63.5")
    a.button.is-primary.is-rounded.is-large#executeButton(@click="onButtonClick"
                                                          :class="disabled ? 'buttonDisabled is-disabled' : 'buttonEnabled'")
      span.icon.is-large
        i.fas.fa-spinner.fa-spin.fa-lg(v-if="status === 'Wait'")
        i.fas.fa-check.fa-lg(v-else-if="status === 'Done'")
        i.fas.fa-ban.fa-lg(v-else-if="authUser")
        i.fab.fa-twitter.fa-lg(v-else)
    .headerBaloon(v-if="!authUser"
                  :class="baloonClass")
      p
        | Log in to Twitter
    .headerBaloon(v-else-if="authUser && startable"
                  :class="baloonWithBuruburuClass")
      p(v-if="status === 'Wait'")
        | Please Wait...
      p(v-else-if="status === 'Done'")
        | Done! Share it?
      p(v-else)
        | Click to start!
    h1 Otaku Blocker
    .dropdown.is-right(v-if="authUser && !disabled"
                       @click="dropdown = !dropdown"
                       :class="dropdown ? 'is-active' : ''")
      .dropdown-trigger
        span.icon.is-small(aria-haspopup="true", aria-controls="dropdown-menu")
          i.fas.fa-angle-down(aria-hidden="true")
        #dropdown-menu.dropdown-menu(role="menu")
          .dropdown-content
            .dropdown-item#userInfo
              img.profileImage(:src="userProfileImageUrl")
              div
                p#userName {{ userName }}
                p#userScreenName @{{ userScreenName }}
            hr.dropdown-divider
            a.dropdown-item(@click="$emit('logoutClick')")
              span.icon.is-small
                i.fas.fa-sign-out
              | Logout

</template>

<script>
import { mapState, mapGetters } from 'vuex'
export default {
  data () {
    return {
      dropdown: false,
      buruburuEnabled: false
    }
  },
  props: {
    status: '',
    disabled: false,
    startable: false
  },
  computed: {
    ...mapState([
      'scrollY',
      'authUser'
    ]),
    baloonClass () {
      return this.scrollY < 50 ? 'baloonActive' : 'baloonInactive'
    },
    headerClass () {
      return this.scrollY < 50 ? '' : 'headerFloating'
    },
    baloonWithBuruburuClass () {
      return this.baloonClass + ' ' + (this.buruburuEnabled ? 'buruburuBaloon' : '')
    },
    ...mapGetters([
      'userName',
      'userScreenName',
      'userProfileImageUrl'
    ])
  },
  methods: {
    login () {
      location.href = '/api/auth'
    },
    onButtonClick () {
      if (!this.disabled) {
        this.$emit('executeButtonClick')
      }
      else {
        this.buruburuEnabled = !this.buruburuEnabled
      }
    }
  }
}
</script>

<style lang="sass" scoped>
@import "~/assets/css/main.sass"


.header
  position: fixed
  top: 0
  left: 0
  z-index: 100
  width: 100vw
  transition: all 0.5s ease

.headerFloating
  filter: drop-shadow(0 0 0.75rem rgba(0, 0, 0, 0.1))

#po
  background: $primary
  height: 43px
  width: 100vw
  position: fixed
  top: 0
  left: 0

#curve
  fill: $primary
  width: 400px
  position: fixed
  top: 0px
  left: 50vw
  transform: translate(-50%, 0px)

#executeButton
  max-width: 80px
  max-height: 80px
  width: 40vw
  height: 40vw
  position: fixed
  top: 10px
  left: 50vw
  transform: translate(-50%, 0px)
  display: flex
  align-items: center
  justify-content: center

.buttonEnabled
  box-shadow: 3px 3px 12px 0px rgba(0, 0, 0, 0.3)
.buttonDisabled
  box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.1)

.headerBaloon
  position: fixed
  left: 50vw
  transform: translate(-50%, 120px)
  z-index: 100
  display: flex
  align-items: center
  justify-content: center
  width: 12rem
  height: 4rem
  font-size: 1.1rem
  text-align: center
  text-decoration: none
  border-radius: 5px
  border: solid 1px $primary
  background: #ffffff
  color: $primary
  transition: all 0.5s ease

  &:before
    content: ""
    position: absolute
    z-index: 101
    width: 2rem
    height: 2rem
    transform: translateY(-100%) rotate(45deg)
    border-top: solid 1px $primary
    border-left: solid 1px $primary
    background: #ffffff

.baloonInactive
  transform: translate(-50%, 100px)
  opacity: 0

.baloonActive
  transform: translate(-50%, 120px)
  opacity: 1

.buruburuBaloon
  animation: buruburuBaloonAnimation .1s  infinite;
  &:before
    translate(-16px, calc(-100% + 16px)) rotate(45deg)

@keyframes buruburuBaloonAnimation
  0% {transform: translate(-50%, 120px) rotateZ(0deg)}
  25% {transform: translate(calc(-50% + 2px), 122px) rotateZ(1deg)}
  50% {transform: translate(-50%, 122px) rotateZ(0deg)}
  75% {transform: translate(calc(-50% + 2px), 120px) rotateZ(-1deg)}
  100% {transform: translate(-50%, 120px) rotateZ(0deg)}

h1
  color: white
  position: fixed
  font-weight: 600
  top: 10px
  left: 20px
  font-family: 'Quicksand', sans-serif

h1
  @media screen and (max-width: 374px)
    opacity: 0

.dropdown
  z-index: 9999
  left: calc(100vw - 3rem)
  top: 0.6rem
  user-select: none

.dropdown-trigger
  > span
    color: white

.dropdown-item
  text-align: left

.profileImage
  border-radius: 50%
  width: 3rem
  height: 3rem

#userInfo
  display: flex
  align-items: center
  > *
    margin: 0px 0.5rem

#userScreenName
  font-size: 0.8rem

.fade-enter-active
  transition: all .5s
.fade-leave-active
  transition: all .5s
.fade-enter
  transform: translateY(-10px)
  opacity: 0
.fade-leave-to
  transform: translateY(-10px)
  opacity: 0
</style>
