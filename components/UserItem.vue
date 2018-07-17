<template lang="pug">
  div.box(@click.prevent="onclick"
          :class="selected ? 'active' : 'inactive'")
    img(:src="user.profile_image_url_https")
    div.inner
      h1 {{ user.name }}
      p @{{ user.screen_name }}
</template>

<script>
export default {
  props: {
    user: Object,
    selected: Boolean
  },
  methods: {
    onclick () {
      if (this.selected) {
        this.$emit('userItemUnselect', this.user.id)
      }
      else {
        this.$emit('userItemSelect', this.user.id)
      }
    }
  }
}
</script>

<style lang="sass" scoped>
@import "~/assets/css/main.sass"

.box
  margin: 0.2rem !important
  transition: all 0.2s ease
  height: 5rem
  width: 45%
  min-width: 10rem
  display: flex
  flex-direction: row
  text-align: left
  *
    overflow: hidden;
    overflow-wrap: break-word
    word-break: break-all
    text-overflow: ellipsis;
    white-space: nowrap
  img
    width: 2.3rem
    height: 2.3rem
    border-radius: 50%
    margin-top: 2px
    margin-right: 1rem

.active
  background-color: $primary
  color: white

.inactive
  background-color: white
  color: $black

h1
  font-size: 1rem
p
  font-size: 0.7rem
</style>

