<template lang="pug">
  section
    .titleBox
      .titleBg
      .titleMain
        h1 {{ error.statusCode }}
        small {{ error.message }}
</template>
<script>
export default {
  props: ['error']
}
</script>

<style lang="sass" scoped>
@import "~/assets/css/main.sass"
.titleBox
  width: 100vw
  height: 15rem
  position: relative
  display: flex
  justify-content: center

.shiftedForBaloon
  transform: translateY(100px)
  &.marginForFooter
    margin-bottom: 100px

.titleBg
  width: 300%
  height: 200%
  background: $primary
  position: absolute
  transform: rotate(-10deg) translate(0, -50%)

.titleMain
  position: absolute
  top: 100px
  color: #ffffff
  text-align: center
  h1
    font-family: 'Quicksand', sans-serif
    font-size: 2.5rem
    font-weight: 600
</style>
