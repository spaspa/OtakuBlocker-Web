<template lang="pug">
  .box(@click.prevent="onclick"
          :class="selected ? 'active' : 'inactive'")
    h1 {{ list.name }}
    p {{ list.member_count }} 人のメンバー
</template>

<script>
export default {
  props: {
    list: Object,
    selected: Boolean
  },
  methods: {
    onclick () {
      if (this.selected) {
        this.$emit('listItemUnselect', this.list.id)
      }
      else {
        this.$emit('listItemSelect', this.list.id)
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
  min-width: 10rem
  *
    overflow: hidden;
    overflow-wrap: break-word
    word-break: break-all
    text-overflow: ellipsis;
    white-space: nowrap

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
