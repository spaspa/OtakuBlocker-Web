<template lang="pug">
  transition(name="modal")
    .modal-mask
      .container.box
        .modal-header
          slot(name="header")
            span.icon.is-large
              i.fas.fa-info
        .modal-body
          slot(name="body")
            | body
        .modal-footer
          slot(name="footer")
            .button.is-primary.is-outline(@click="$emit('modalConfirm')")
              | OK
</template>

<script>
export default {
}
</script>

<style lang="sass" scoped>
@import "~/assets/css/main.sass"

.container
  width: 80vw
  max-width: 510px
  padding: 20px 30px
  background-color: #fff
  border-radius: 10px
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33)
  transition: all .3s ease
  font-family: Helvetica, Arial, sans-serif
  display: flex
  flex-direction: column

.modal-header
  color: $primary
  font-size: 4rem
  margin-top: 1rem

.modal-body
  margin: 0.5rem

.modal-footer
  margin: 1rem 0px
  > *
    margin: 0rem 0.5rem
    font-width: 600

.modal-mask
  position: fixed
  z-index: 9998
  top: 0
  left: 0
  width: 100vw
  height: 100vh
  background-color: rgba(0, 0, 0, .5)
  display: flex
  align-items: center
  justify-content: center
  transition: opacity .3s ease
</style>
